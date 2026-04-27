using HerdFlow.Api.DTOs;
using HerdFlow.Api.Models;
using HerdFlow.Api.Data;
using HerdFlow.Api.Exceptions;
using HerdFlow.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Text.RegularExpressions;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using System.Globalization;
using System.Text;
using System.Linq;

namespace HerdFlow.Api.Services;

public class CowService
{
    private static readonly Regex TagNumberPattern = new("^[A-Za-z0-9-]+$");
    private const int MaxCreateCowAttempts = 5;
    private readonly AppDbContext _context;
    private readonly ActivityLogService _activityLogService;
    private readonly CowChangeLogService _cowChangeLogService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<CowService> _logger;

    public CowService(
        AppDbContext context,
        ActivityLogService activityLogService,
        CowChangeLogService cowChangeLogService,
        IHttpContextAccessor httpContextAccessor,
        ILogger<CowService> logger)
    {
        _context = context;
        _activityLogService = activityLogService;
        _cowChangeLogService = cowChangeLogService;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    private void ValidateCreateCow(CreateCowDto dto)
    {
        ValidateCowInput(
            dto.TagNumber,
            dto.LivestockGroup,
            dto.SireId,
            dto.SireName,
            dto.DamId,
            dto.DamName);
    }

    private void ValidateUpdateCow(UpdateCowDto dto)
    {
        ValidateCowInput(
            dto.TagNumber,
            dto.LivestockGroup,
            dto.SireId,
            dto.SireName,
            dto.DamId,
            dto.DamName);
    }

    private void ValidateCowInput(
        string tagNumber,
        LivestockGroupType? livestockGroup,
        Guid? sireId,
        string? sireName,
        Guid? damId,
        string? damName)
    {
        if (string.IsNullOrWhiteSpace(tagNumber))
        {
            throw new ValidationException("Tag number is required.");
        }

        if (!TagNumberPattern.IsMatch(tagNumber.Trim()))
        {
            throw new ValidationException("Tag number can only include letters, numbers, and dashes. Spaces cannot be used.");
        }

        if (sireId.HasValue && !string.IsNullOrWhiteSpace(sireName))
        {
            throw new ValidationException("Provide either SireId or SireName, but not both.");
        }

        if (damId.HasValue && !string.IsNullOrWhiteSpace(damName))
        {
            throw new ValidationException("Provide either DamId or DamName, but not both.");
        }

        if (sireId.HasValue && damId.HasValue && sireId.Value == damId.Value)
        {
            throw new ValidationException("Sire and Dam cannot be the same cow.");
        }
    }

    private static string NormalizePregnancyStatus(string? pregnancyStatus)
    {
        return string.IsNullOrWhiteSpace(pregnancyStatus) ? "N/A" : pregnancyStatus.Trim();
    }

    public async Task<List<CowResponseDto>> GetCowsAsync()
    {
        var userId = GetCurrentUserId();
        var cows = await _context.Cows
            .AsNoTracking()
            .Where(c => c.UserId == userId && !c.IsRemoved)
            .OrderBy(c => c.TagNumber)
            .ToListAsync();

        return cows.Select(MapCowResponse).ToList();
    }

    public async Task<CowResponseDto> GetCowByIdAsync(Guid id)
    {
        var cow = await FindCowWithParentsAsync(id, asNoTracking: true);
        return MapCowResponse(cow);
    }

    public async Task<CowResponseDto> UpdateCowAsync(Guid id, UpdateCowDto dto)
    {
        var cow = await FindCowWithParentsAsync(id);
        ValidateUpdateCow(dto);
        await EnsureTagNumberIsUniqueAsync(dto.TagNumber.Trim(), id);
        await ValidateParentReferencesAsync(dto.SireId, dto.DamId, id);

        // Normalize DTO to match what will actually be saved, so BuildUpdateMessages
        // compares identical representations on both sides.
        dto.TagNumber = dto.TagNumber.Trim();
        dto.Name = NormalizeOptionalText(dto.Name);
        dto.Color = NormalizeOptionalText(dto.Color);
        dto.EaseOfBirth = NormalizeOptionalText(dto.EaseOfBirth);
        dto.SireName = dto.SireId is not null ? null : NormalizeOptionalText(dto.SireName);
        dto.DamName = dto.DamId is not null ? null : NormalizeOptionalText(dto.DamName);
        dto.PregnancyStatus = NormalizePregnancyStatus(dto.PregnancyStatus);

        var changes = _cowChangeLogService.BuildUpdateMessages(cow, dto);

        cow.TagNumber = dto.TagNumber;
        cow.OwnerName = dto.OwnerName;
        cow.LivestockGroup = dto.LivestockGroup;
        cow.Sex = dto.Sex;
        cow.Breed = dto.Breed;
        cow.Name = dto.Name;
        cow.Color = dto.Color;
        cow.DateOfBirth = dto.DateOfBirth;
        cow.BirthWeight = dto.BirthWeight;
        cow.EaseOfBirth = dto.EaseOfBirth;
        cow.SireId = dto.SireId;
        cow.SireName = dto.SireName;
        cow.DamId = dto.DamId;
        cow.DamName = dto.DamName;
        cow.HealthStatus = dto.HealthStatus;
        cow.HeatStatus = dto.HeatStatus;
        cow.PregnancyStatus = dto.PregnancyStatus;
        cow.HasCalf = dto.HasCalf;
        cow.PurchasePrice = dto.PurchasePrice;
        cow.SalePrice = dto.SalePrice;
        cow.PurchaseDate = dto.PurchaseDate;
        cow.SaleDate = dto.SaleDate;

        await _context.SaveChangesAsync();
        foreach (var change in changes)
        {
            await _activityLogService.LogAsync(cow.Id, change);
        }

        var updatedCow = await FindCowWithParentsAsync(id, asNoTracking: true);
        return MapCowResponse(updatedCow);
    }

    public async Task<CowResponseDto> CreateCowAsync(CreateCowDto dto)
    {
        ValidateCreateCow(dto);
        var normalizedTagNumber = dto.TagNumber.Trim();
        var userId = GetCurrentUserId();
        await EnsureTagNumberIsUniqueAsync(normalizedTagNumber, userId);
        await ValidateParentReferencesAsync(dto.SireId, dto.DamId);
        return await CreateCowRecordAsync(BuildCow(userId, dto, normalizedTagNumber));
    }

    public async Task<CowResponseDto> CreateCalfForDamAsync(Guid damId)
    {
        var dam = await FindCowAsync(damId);
        var userId = dam.UserId;
        var currentYear = DateTime.UtcNow.Year;
        var baseTagNumber = $"{dam.TagNumber}-{currentYear}";
        var nextTagNumber = await GetNextCalfTagNumberAsync(userId, baseTagNumber);

        var calf = BuildCow(
            userId,
            new CreateCowDto
            {
                TagNumber = nextTagNumber,
                OwnerName = dam.OwnerName,
                LivestockGroup = LivestockGroupType.Calf,
                Sex = string.Empty,
                Breed = dam.Breed ?? string.Empty,
                Name = null,
                Color = null,
                DateOfBirth = DateOnly.FromDateTime(DateTime.UtcNow),
                BirthWeight = null,
                EaseOfBirth = null,
                SireId = null,
                SireName = null,
                DamId = dam.Id,
                DamName = null,
                HealthStatus = HealthStatusType.Healthy,
                HeatStatus = null,
                PregnancyStatus = "N/A",
                HasCalf = false,
                PurchaseDate = null,
                SaleDate = null,
                PurchasePrice = null,
                SalePrice = null,
            },
            nextTagNumber);

        return await CreateCowRecordWithGeneratedTagAsync(calf, baseTagNumber, userId);
    }

    public async Task ArchiveCowAsync(Guid id)
    {
        var cow = await FindCowAsync(id);

        cow.IsRemoved = true;
        cow.RemovedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _activityLogService.LogAsync(cow.Id, "Cow archived from herd");
    }

    public async Task<List<CowResponseDto>> GetRemovedCowsAsync()
    {
        var userId = GetCurrentUserId();
        var cows = await _context.Cows
            .AsNoTracking()
            .Include(c => c.Sire)
            .Include(c => c.Dam)
            .Where(c => c.UserId == userId && c.IsRemoved)
            .OrderByDescending(c => c.RemovedAt.HasValue)
            .ThenByDescending(c => c.RemovedAt)
            .ToListAsync();

        return cows.Select(MapCowResponse).ToList();
    }

    public async Task<string> ExportCowsCsvAsync()
    {
        var userId = GetCurrentUserId();
        var cows = await _context.Cows
            .AsNoTracking()
            .Include(c => c.Notes
                .Where(n => n.UserId == userId)
                .OrderBy(n => n.CreatedAt))
            .Where(c => c.UserId == userId && !c.IsRemoved)
            .OrderBy(c => c.TagNumber)
            .ToListAsync();

        var builder = new StringBuilder();
        builder.AppendLine(string.Join(",",
            EscapeCsv("Tag Number"),
            EscapeCsv("Owner Name"),
            EscapeCsv("Livestock Group"),
            EscapeCsv("Sex"),
            EscapeCsv("Breed"),
            EscapeCsv("Name"),
            EscapeCsv("Color"),
            EscapeCsv("Date of Birth"),
            EscapeCsv("Birth Weight"),
            EscapeCsv("Ease Of Birth"),
            EscapeCsv("Sire"),
            EscapeCsv("Dam"),
            EscapeCsv("Health Status"),
            EscapeCsv("Heat Status"),
            EscapeCsv("Pregnancy Status"),
            EscapeCsv("Has Calf"),
            EscapeCsv("Purchase Price"),
            EscapeCsv("Sale Price"),
            EscapeCsv("Purchase Date"),
            EscapeCsv("Sale Date"),
            EscapeCsv("Notes")));

        foreach (var cow in cows)
        {
            var notes = string.Join(" | ", cow.Notes
                .Select(n => $"{n.CreatedAt:yyyy-MM-dd}: {n.Content.Trim()}"));

            builder.AppendLine(string.Join(",",
                EscapeCsv(cow.TagNumber),
                EscapeCsv(cow.OwnerName),
                EscapeCsv(cow.LivestockGroup?.ToString()),
                EscapeCsv(cow.Sex),
                EscapeCsv(cow.Breed),
                EscapeCsv(cow.Name),
                EscapeCsv(cow.Color),
                EscapeCsv(FormatDate(cow.DateOfBirth)),
                EscapeCsv(FormatDecimal(cow.BirthWeight)),
                EscapeCsv(cow.EaseOfBirth),
                EscapeCsv(cow.Sire?.TagNumber ?? cow.SireName),
                EscapeCsv(cow.Dam?.TagNumber ?? cow.DamName),
                EscapeCsv(cow.HealthStatus.ToString()),
                EscapeCsv(cow.HeatStatus?.ToString()),
                EscapeCsv(cow.PregnancyStatus),
                EscapeCsv(cow.HasCalf ? "Yes" : "No"),
                EscapeCsv(FormatDecimal(cow.PurchasePrice)),
                EscapeCsv(FormatDecimal(cow.SalePrice)),
                EscapeCsv(FormatDate(cow.PurchaseDate)),
                EscapeCsv(FormatDate(cow.SaleDate)),
                EscapeCsv(notes)));
        }

        return builder.ToString();
    }

    public async Task RestoreCowAsync(Guid id)
    {
        var cow = await FindCowAsync(id);

        cow.IsRemoved = false;
        cow.RemovedAt = null;
        await _context.SaveChangesAsync();
        await _activityLogService.LogAsync(cow.Id, "Cow restored to herd");
    }

    private async Task<Cow> FindCowAsync(Guid id)
    {
        var userId = GetCurrentUserId();
        var cow = await _context.Cows.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        return cow ?? throw new NotFoundException("Cow not found.");
    }

    private async Task<Cow> FindCowWithParentsAsync(Guid id, bool asNoTracking = false)
    {
        var userId = GetCurrentUserId();
        IQueryable<Cow> query = _context.Cows
            .Include(c => c.Sire)
            .Include(c => c.Dam);

        if (asNoTracking)
        {
            query = query.AsNoTracking();
        }

        var cow = await query.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        return cow ?? throw new NotFoundException("Cow not found.");
    }

    private async Task ValidateParentReferencesAsync(Guid? sireId, Guid? damId, Guid? currentCowId = null)
    {
        var userId = GetCurrentUserId();

        if (sireId.HasValue)
        {
            if (currentCowId.HasValue && sireId.Value == currentCowId.Value)
            {
                throw new ValidationException("A cow cannot be its own parent.");
            }

            var sireExists = await _context.Cows.AnyAsync(c => c.Id == sireId.Value && c.UserId == userId);
            if (!sireExists)
            {
                throw new ValidationException("Sire not found.");
            }
        }

        if (damId.HasValue)
        {
            if (currentCowId.HasValue && damId.Value == currentCowId.Value)
            {
                throw new ValidationException("A cow cannot be its own parent.");
            }

            var damExists = await _context.Cows.AnyAsync(c => c.Id == damId.Value && c.UserId == userId);
            if (!damExists)
            {
                throw new ValidationException("Dam not found.");
            }
        }
    }

    private async Task EnsureTagNumberIsUniqueAsync(string tagNumber, Guid? excludeCowId = null)
    {
        var userId = GetCurrentUserId();
        var exists = await _context.Cows.AnyAsync(c =>
            c.UserId == userId &&
            c.TagNumber == tagNumber &&
            (!excludeCowId.HasValue || c.Id != excludeCowId.Value));

        if (exists)
        {
            throw new ConflictException("Tag number already exists.");
        }
    }

    private async Task EnsureTagNumberIsUniqueAsync(string tagNumber, string userId, Guid? excludeCowId = null)
    {
        var exists = await _context.Cows.AnyAsync(c =>
            c.UserId == userId &&
            c.TagNumber == tagNumber &&
            (!excludeCowId.HasValue || c.Id != excludeCowId.Value));

        if (exists)
        {
            throw new ConflictException("Tag number already exists.");
        }
    }

    private string GetCurrentUserId()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var userId = user?.FindFirstValue("sub")
            ?? user?.FindFirstValue(ClaimTypes.NameIdentifier);

        _logger.LogWarning(
            "CowService userId debug: isAuthenticated={IsAuthenticated}, userId={UserId}, claims={Claims}",
            user?.Identity?.IsAuthenticated ?? false,
            string.IsNullOrWhiteSpace(userId) ? "<missing>" : userId,
            user is null ? "<no user>" : string.Join(", ", user.Claims.Select(c => $"{c.Type}={c.Value}")));

        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new InvalidOperationException("Authenticated user ID is missing.");
        }

        return userId;
    }

    private static bool WasDuplicatePrimaryKeyInsert(DbUpdateException exception)
    {
        return exception.InnerException is PostgresException postgresException
            && postgresException.SqlState == PostgresErrorCodes.UniqueViolation
            && postgresException.ConstraintName == "PK_Cows";
    }

    private static bool WasDuplicateTagNumberInsert(DbUpdateException exception)
    {
        return exception.InnerException is PostgresException postgresException
            && postgresException.SqlState == PostgresErrorCodes.UniqueViolation
            && postgresException.ConstraintName == "IX_Cows_UserId_TagNumber";
    }

    private Cow BuildCow(string userId, CreateCowDto dto, string normalizedTagNumber)
    {
        return new Cow
        {
            UserId = userId,
            TagNumber = normalizedTagNumber,
            OwnerName = dto.OwnerName,
            LivestockGroup = dto.LivestockGroup,
            Sex = dto.Sex,
            Breed = dto.Breed,
            Name = NormalizeOptionalText(dto.Name),
            Color = NormalizeOptionalText(dto.Color),
            DateOfBirth = dto.DateOfBirth,
            BirthWeight = dto.BirthWeight,
            EaseOfBirth = NormalizeOptionalText(dto.EaseOfBirth),
            SireId = dto.SireId,
            SireName = dto.SireId is not null ? null : NormalizeOptionalText(dto.SireName),
            DamId = dto.DamId,
            DamName = dto.DamId is not null ? null : NormalizeOptionalText(dto.DamName),
            HealthStatus = dto.HealthStatus,
            HeatStatus = dto.HeatStatus,
            PregnancyStatus = NormalizePregnancyStatus(dto.PregnancyStatus),
            HasCalf = dto.HasCalf,
            PurchasePrice = dto.PurchasePrice,
            SalePrice = dto.SalePrice,
            PurchaseDate = dto.PurchaseDate,
            SaleDate = dto.SaleDate,
        };
    }

    private async Task<CowResponseDto> CreateCowRecordAsync(Cow cow)
    {
        _context.Cows.Add(cow);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (WasDuplicatePrimaryKeyInsert(ex))
        {
            var existingCow = await _context.Cows.FirstOrDefaultAsync(c => c.Id == cow.Id && c.UserId == cow.UserId);

            if (existingCow is not null)
            {
                var existingCowWithParents = await FindCowWithParentsAsync(existingCow.Id, asNoTracking: true);
                return MapCowResponse(existingCowWithParents);
            }

            throw;
        }
        catch (DbUpdateException ex) when (WasDuplicateTagNumberInsert(ex))
        {
            throw new ConflictException("Tag number already exists.");
        }

        await _activityLogService.LogAsync(cow.Id, "Cow record created");
        var createdCow = await FindCowWithParentsAsync(cow.Id, asNoTracking: true);
        return MapCowResponse(createdCow);
    }

    private async Task<CowResponseDto> CreateCowRecordWithGeneratedTagAsync(Cow calf, string baseTagNumber, string userId)
    {
        for (var attempt = 0; attempt < MaxCreateCowAttempts; attempt += 1)
        {
            try
            {
                return await CreateCowRecordAsync(calf);
            }
            catch (ConflictException) when (attempt < MaxCreateCowAttempts - 1)
            {
                _context.Entry(calf).State = EntityState.Detached;
                calf.TagNumber = await GetNextCalfTagNumberAsync(userId, baseTagNumber);
            }
        }

        throw new ConflictException("Unable to generate a unique calf tag number.");
    }

    private async Task<string> GetNextCalfTagNumberAsync(string userId, string baseTagNumber)
    {
        var existingTagNumbers = await _context.Cows
            .AsNoTracking()
            .Where(c => c.UserId == userId &&
                (c.TagNumber == baseTagNumber || EF.Functions.Like(c.TagNumber, $"{baseTagNumber}-%")))
            .Select(c => c.TagNumber)
            .ToListAsync();

        if (!existingTagNumbers.Contains(baseTagNumber))
        {
            return baseTagNumber;
        }

        var suffixes = existingTagNumbers
            .Select(tagNumber => TryGetCalfTagSuffix(baseTagNumber, tagNumber))
            .Where(suffix => suffix.HasValue)
            .Select(suffix => suffix!.Value)
            .ToHashSet();

        var nextSuffix = 1;
        while (suffixes.Contains(nextSuffix))
        {
            nextSuffix += 1;
        }

        return $"{baseTagNumber}-{nextSuffix}";
    }

    private static int? TryGetCalfTagSuffix(string baseTagNumber, string tagNumber)
    {
        if (tagNumber == baseTagNumber)
        {
            return 0;
        }

        var prefix = $"{baseTagNumber}-";
        if (!tagNumber.StartsWith(prefix, StringComparison.Ordinal))
        {
            return null;
        }

        var suffix = tagNumber[prefix.Length..];
        return int.TryParse(suffix, NumberStyles.None, CultureInfo.InvariantCulture, out var value)
            ? value
            : null;
    }

    private static string FormatDate(DateOnly? date)
    {
        return date?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? string.Empty;
    }

    private static string FormatDecimal(decimal? value)
    {
        return value?.ToString("0.##", CultureInfo.InvariantCulture) ?? string.Empty;
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static CowResponseDto MapCowResponse(Cow cow)
    {
        return new CowResponseDto
        {
            Id = cow.Id,
            UserId = cow.UserId,
            TagNumber = cow.TagNumber,
            OwnerName = cow.OwnerName,
            LivestockGroup = cow.LivestockGroup,
            Sex = cow.Sex,
            Breed = cow.Breed,
            Name = cow.Name,
            Color = cow.Color,
            DateOfBirth = cow.DateOfBirth,
            BirthWeight = cow.BirthWeight,
            EaseOfBirth = cow.EaseOfBirth,
            SireId = cow.SireId,
            SireName = cow.SireName,
            DamId = cow.DamId,
            DamName = cow.DamName,
            HealthStatus = cow.HealthStatus,
            HeatStatus = cow.HeatStatus,
            PregnancyStatus = cow.PregnancyStatus,
            HasCalf = cow.HasCalf,
            PurchasePrice = cow.PurchasePrice,
            SalePrice = cow.SalePrice,
            PurchaseDate = cow.PurchaseDate,
            SaleDate = cow.SaleDate,
            CreatedAt = cow.CreatedAt,
            IsRemoved = cow.IsRemoved,
            RemovedAt = cow.RemovedAt,
            Sire = cow.Sire is null ? null : new CowParentSummaryDto
            {
                Id = cow.Sire.Id,
                TagNumber = cow.Sire.TagNumber,
                Name = cow.Sire.Name,
            },
            Dam = cow.Dam is null ? null : new CowParentSummaryDto
            {
                Id = cow.Dam.Id,
                TagNumber = cow.Dam.TagNumber,
                Name = cow.Dam.Name,
            }
        };
    }

    public static string GetImportTemplateCsv()
    {
        var builder = new StringBuilder();
        builder.AppendLine(string.Join(",",
            EscapeCsv("Tag Number"),
            EscapeCsv("Owner Name"),
            EscapeCsv("Livestock Group"),
            EscapeCsv("Sex"),
            EscapeCsv("Breed"),
            EscapeCsv("Name"),
            EscapeCsv("Color"),
            EscapeCsv("Date of Birth"),
            EscapeCsv("Birth Weight"),
            EscapeCsv("Ease of Birth"),
            EscapeCsv("Sire"),
            EscapeCsv("Dam"),
            EscapeCsv("Health Status"),
            EscapeCsv("Heat Status"),
            EscapeCsv("Pregnancy Status"),
            EscapeCsv("Has Calf"),
            EscapeCsv("Purchase Price"),
            EscapeCsv("Sale Price"),
            EscapeCsv("Purchase Date"),
            EscapeCsv("Sale Date"),
            EscapeCsv("Notes")));

        builder.AppendLine(string.Join(",",
            EscapeCsv("T-101"),
            EscapeCsv("Smith Ranch"),
            EscapeCsv("Breeding"),
            EscapeCsv("Female"),
            EscapeCsv("Angus"),
            EscapeCsv("Bessie"),
            EscapeCsv("Black"),
            EscapeCsv("2021-03-15"),
            EscapeCsv("85"),
            EscapeCsv("Easy"),
            EscapeCsv("T-055"),
            EscapeCsv("T-062"),
            EscapeCsv("Healthy"),
            EscapeCsv("None"),
            EscapeCsv("Pregnant"),
            EscapeCsv("No"),
            EscapeCsv("1500"),
            EscapeCsv(""),
            EscapeCsv("2022-01-10"),
            EscapeCsv(""),
            EscapeCsv("First calf expected in spring")));

        return builder.ToString();
    }

    public async Task<ImportResultDto> ImportCowsCsvAsync(IFormFile file)
    {
        var userId = GetCurrentUserId();
        var result = new ImportResultDto();

        string csvContent;
        using (var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8))
        {
            csvContent = await reader.ReadToEndAsync();
        }

        var lines = csvContent.ReplaceLineEndings("\n").Split('\n');
        if (lines.Length == 0)
            return result;

        var headerLine = lines[0];
        var headers = ParseCsvLine(headerLine);
        var columnMap = headers
            .Select((h, i) => (Header: h.Trim(), Index: i))
            .ToDictionary(x => x.Header, x => x.Index, StringComparer.OrdinalIgnoreCase);

        if (!columnMap.ContainsKey("Tag Number"))
        {
            result.SkippedRows.Add(new ImportSkippedRowDto
            {
                RowNumber = 1,
                Reason = "File does not appear to be a valid HerdFlow import template. \"Tag Number\" column not found.",
            });
            return result;
        }

        var existingTagNumbers = (await _context.Cows
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .Select(c => c.TagNumber)
            .ToListAsync())
            .ToHashSet(StringComparer.Ordinal);

        var cowsToInsert = new List<Cow>();
        var notesToInsert = new List<(Cow Cow, string NoteContent)>();

        for (var lineIndex = 1; lineIndex < lines.Length; lineIndex++)
        {
            var line = lines[lineIndex];
            if (string.IsNullOrWhiteSpace(line))
                continue;

            var rowNumber = lineIndex + 1;
            var fields = ParseCsvLine(line);
            var warnings = new List<ImportWarningRowDto>();

            string GetField(string columnName)
            {
                if (!columnMap.TryGetValue(columnName, out var idx) || idx >= fields.Count)
                    return string.Empty;
                return fields[idx].Trim();
            }

            var tagNumber = GetField("Tag Number");

            if (string.IsNullOrWhiteSpace(tagNumber))
            {
                result.SkippedRows.Add(new ImportSkippedRowDto
                {
                    RowNumber = rowNumber,
                    Reason = "Tag number is required.",
                });
                continue;
            }

            tagNumber = tagNumber.Trim();

            if (!TagNumberPattern.IsMatch(tagNumber))
            {
                result.SkippedRows.Add(new ImportSkippedRowDto
                {
                    RowNumber = rowNumber,
                    Reason = "Tag number contains invalid characters. Only letters, numbers, and dashes are allowed.",
                    TagNumber = tagNumber,
                });
                continue;
            }

            if (existingTagNumbers.Contains(tagNumber))
            {
                result.SkippedRows.Add(new ImportSkippedRowDto
                {
                    RowNumber = rowNumber,
                    Reason = "Tag number already exists.",
                    TagNumber = tagNumber,
                });
                continue;
            }

            var ownerName = NullIfEmpty(GetField("Owner Name"));
            var sex = NullIfEmpty(GetField("Sex"));
            var breed = NullIfEmpty(GetField("Breed"));
            var name = NullIfEmpty(GetField("Name"));
            var color = NullIfEmpty(GetField("Color"));
            var easeOfBirth = NullIfEmpty(GetField("Ease of Birth"));
            var sireName = NullIfEmpty(GetField("Sire"));
            var damName = NullIfEmpty(GetField("Dam"));
            var pregnancyStatus = NullIfEmpty(GetField("Pregnancy Status"));
            var notesValue = NullIfEmpty(GetField("Notes"));

            LivestockGroupType? livestockGroup = null;
            var livestockGroupStr = GetField("Livestock Group");
            if (!string.IsNullOrWhiteSpace(livestockGroupStr))
            {
                if (Enum.TryParse<LivestockGroupType>(livestockGroupStr, ignoreCase: true, out var parsedGroup))
                    livestockGroup = parsedGroup;
                else
                    warnings.Add(new ImportWarningRowDto
                    {
                        RowNumber = rowNumber,
                        Field = "Livestock Group",
                        Message = $"Unrecognized value \"{livestockGroupStr}\". Field was left blank.",
                    });
            }

            var healthStatus = HealthStatusType.Healthy;
            var healthStatusStr = GetField("Health Status");
            if (!string.IsNullOrWhiteSpace(healthStatusStr) &&
                !Enum.TryParse<HealthStatusType>(healthStatusStr, ignoreCase: true, out healthStatus))
            {
                healthStatus = HealthStatusType.Healthy;
                warnings.Add(new ImportWarningRowDto
                {
                    RowNumber = rowNumber,
                    Field = "Health Status",
                    Message = $"Unrecognized value \"{healthStatusStr}\". Defaulted to Healthy.",
                });
            }

            HeatStatusType? heatStatus = null;
            var heatStatusStr = GetField("Heat Status");
            if (!string.IsNullOrWhiteSpace(heatStatusStr))
            {
                if (Enum.TryParse<HeatStatusType>(heatStatusStr, ignoreCase: true, out var parsedHeat))
                    heatStatus = parsedHeat;
                else
                    warnings.Add(new ImportWarningRowDto
                    {
                        RowNumber = rowNumber,
                        Field = "Heat Status",
                        Message = $"Unrecognized value \"{heatStatusStr}\". Field was left blank.",
                    });
            }

            var hasCalf = false;
            var hasCalfStr = GetField("Has Calf");
            if (!string.IsNullOrWhiteSpace(hasCalfStr))
            {
                var lower = hasCalfStr.ToLowerInvariant();
                if (lower is "yes" or "true" or "1")
                    hasCalf = true;
                else if (lower is "no" or "false" or "0")
                    hasCalf = false;
                else
                    warnings.Add(new ImportWarningRowDto
                    {
                        RowNumber = rowNumber,
                        Field = "Has Calf",
                        Message = $"Unrecognized value \"{hasCalfStr}\". Defaulted to No.",
                    });
            }

            DateOnly? dateOfBirth = null;
            var dobStr = GetField("Date of Birth");
            if (!string.IsNullOrWhiteSpace(dobStr))
            {
                dateOfBirth = TryParseDate(dobStr);
                if (!dateOfBirth.HasValue)
                    warnings.Add(new ImportWarningRowDto
                    {
                        RowNumber = rowNumber,
                        Field = "Date of Birth",
                        Message = $"Could not parse \"{dobStr}\". Expected YYYY-MM-DD or MM/DD/YYYY.",
                    });
            }

            DateOnly? purchaseDate = null;
            var purchaseDateStr = GetField("Purchase Date");
            if (!string.IsNullOrWhiteSpace(purchaseDateStr))
            {
                purchaseDate = TryParseDate(purchaseDateStr);
                if (!purchaseDate.HasValue)
                    warnings.Add(new ImportWarningRowDto
                    {
                        RowNumber = rowNumber,
                        Field = "Purchase Date",
                        Message = $"Could not parse \"{purchaseDateStr}\". Expected YYYY-MM-DD or MM/DD/YYYY.",
                    });
            }

            DateOnly? saleDate = null;
            var saleDateStr = GetField("Sale Date");
            if (!string.IsNullOrWhiteSpace(saleDateStr))
            {
                saleDate = TryParseDate(saleDateStr);
                if (!saleDate.HasValue)
                    warnings.Add(new ImportWarningRowDto
                    {
                        RowNumber = rowNumber,
                        Field = "Sale Date",
                        Message = $"Could not parse \"{saleDateStr}\". Expected YYYY-MM-DD or MM/DD/YYYY.",
                    });
            }

            decimal? birthWeight = null;
            var birthWeightStr = GetField("Birth Weight");
            if (!string.IsNullOrWhiteSpace(birthWeightStr))
            {
                birthWeight = TryParseDecimal(birthWeightStr);
                if (!birthWeight.HasValue)
                    warnings.Add(new ImportWarningRowDto
                    {
                        RowNumber = rowNumber,
                        Field = "Birth Weight",
                        Message = $"Could not parse \"{birthWeightStr}\" as a number. Field was left blank.",
                    });
            }

            decimal? purchasePrice = null;
            var purchasePriceStr = GetField("Purchase Price");
            if (!string.IsNullOrWhiteSpace(purchasePriceStr))
            {
                purchasePrice = TryParseDecimal(purchasePriceStr);
                if (!purchasePrice.HasValue)
                    warnings.Add(new ImportWarningRowDto
                    {
                        RowNumber = rowNumber,
                        Field = "Purchase Price",
                        Message = $"Could not parse \"{purchasePriceStr}\" as a number. Field was left blank.",
                    });
            }

            decimal? salePrice = null;
            var salePriceStr = GetField("Sale Price");
            if (!string.IsNullOrWhiteSpace(salePriceStr))
            {
                salePrice = TryParseDecimal(salePriceStr);
                if (!salePrice.HasValue)
                    warnings.Add(new ImportWarningRowDto
                    {
                        RowNumber = rowNumber,
                        Field = "Sale Price",
                        Message = $"Could not parse \"{salePriceStr}\" as a number. Field was left blank.",
                    });
            }

            var cow = new Cow
            {
                UserId = userId,
                TagNumber = tagNumber,
                OwnerName = ownerName,
                LivestockGroup = livestockGroup,
                Sex = sex,
                Breed = breed,
                Name = name,
                Color = color,
                DateOfBirth = dateOfBirth,
                BirthWeight = birthWeight,
                EaseOfBirth = easeOfBirth,
                SireName = sireName,
                DamName = damName,
                HealthStatus = healthStatus,
                HeatStatus = heatStatus,
                PregnancyStatus = NormalizePregnancyStatus(pregnancyStatus),
                HasCalf = hasCalf,
                PurchasePrice = purchasePrice,
                SalePrice = salePrice,
                PurchaseDate = purchaseDate,
                SaleDate = saleDate,
            };

            cowsToInsert.Add(cow);
            existingTagNumbers.Add(tagNumber);
            result.WarningRows.AddRange(warnings);

            if (!string.IsNullOrWhiteSpace(notesValue))
                notesToInsert.Add((cow, notesValue));
        }

        if (cowsToInsert.Count > 0)
        {
            _context.Cows.AddRange(cowsToInsert);

            var now = DateTime.UtcNow;
            foreach (var (cow, noteContent) in notesToInsert)
            {
                _context.Notes.Add(new Note
                {
                    UserId = userId,
                    CowId = cow.Id,
                    Content = noteContent.Length > 1000 ? noteContent[..1000] : noteContent,
                    Source = "Import",
                    CreatedAt = now,
                    UpdatedAt = now,
                });
            }

            await _context.SaveChangesAsync();
        }

        result.ImportedCount = cowsToInsert.Count;
        return result;
    }

    private static List<string> ParseCsvLine(string line)
    {
        var fields = new List<string>();
        var field = new StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];
            if (inQuotes)
            {
                if (c == '"')
                {
                    if (i + 1 < line.Length && line[i + 1] == '"')
                    {
                        field.Append('"');
                        i++;
                    }
                    else
                    {
                        inQuotes = false;
                    }
                }
                else
                {
                    field.Append(c);
                }
            }
            else
            {
                if (c == '"')
                    inQuotes = true;
                else if (c == ',')
                {
                    fields.Add(field.ToString());
                    field.Clear();
                }
                else
                    field.Append(c);
            }
        }

        fields.Add(field.ToString());
        return fields;
    }

    private static DateOnly? TryParseDate(string value)
    {
        var trimmed = value.Trim();
        string[] formats = ["yyyy-MM-dd", "M/d/yyyy", "MM/dd/yyyy"];
        foreach (var format in formats)
        {
            if (DateOnly.TryParseExact(trimmed, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
                return date;
        }
        return null;
    }

    private static decimal? TryParseDecimal(string value)
    {
        var cleaned = value.Trim().TrimStart('$').TrimEnd('%').Trim();
        return decimal.TryParse(cleaned, NumberStyles.Number, CultureInfo.InvariantCulture, out var d)
            ? d
            : null;
    }

    private static string? NullIfEmpty(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string EscapeCsv(string? value)
    {
        var sanitizedValue = value ?? string.Empty;
        var escapedValue = sanitizedValue.Replace("\"", "\"\"");
        return $"\"{escapedValue}\"";
    }
}
