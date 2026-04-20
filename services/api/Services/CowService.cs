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

namespace HerdFlow.Api.Services;

public class CowService
{
    private static readonly Regex TagNumberPattern = new("^[A-Za-z0-9-]+$");
    private readonly AppDbContext _context;
    private readonly ActivityLogService _activityLogService;
    private readonly CowChangeLogService _cowChangeLogService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CowService(
        AppDbContext context,
        ActivityLogService activityLogService,
        CowChangeLogService cowChangeLogService,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _activityLogService = activityLogService;
        _cowChangeLogService = cowChangeLogService;
        _httpContextAccessor = httpContextAccessor;
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
        LivestockGroupType livestockGroup,
        Guid? sireId,
        string? sireName,
        Guid? damId,
        string? damName)
    {
        if (livestockGroup == LivestockGroupType.None)
        {
            throw new ValidationException("Livestock group is required.");
        }

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
            .Include(c => c.Sire)
            .Include(c => c.Dam)
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
        var normalizedTagNumber = dto.TagNumber.Trim();
        await EnsureTagNumberIsUniqueAsync(normalizedTagNumber, id);
        await ValidateParentReferencesAsync(dto.SireId, dto.DamId, id);
        var changes = _cowChangeLogService.BuildUpdateMessages(cow, dto);

        cow.TagNumber = normalizedTagNumber;
        cow.OwnerName = dto.OwnerName;
        cow.LivestockGroup = dto.LivestockGroup;
        cow.Sex = dto.Sex;
        cow.Breed = dto.Breed;
        cow.Name = NormalizeOptionalText(dto.Name);
        cow.Color = NormalizeOptionalText(dto.Color);
        cow.DateOfBirth = dto.DateOfBirth;
        cow.BirthWeight = dto.BirthWeight;
        cow.EaseOfBirth = NormalizeOptionalText(dto.EaseOfBirth);
        cow.SireId = dto.SireId;
        cow.SireName = dto.SireId is not null ? null : NormalizeOptionalText(dto.SireName);
        cow.DamId = dto.DamId;
        cow.DamName = dto.DamId is not null ? null : NormalizeOptionalText(dto.DamName);
        cow.HealthStatus = dto.HealthStatus;
        cow.HeatStatus = dto.HeatStatus;
        cow.PregnancyStatus = NormalizePregnancyStatus(dto.PregnancyStatus);
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

        var cow = new Cow
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
        _context.Cows.Add(cow);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (WasDuplicatePrimaryKeyInsert(ex))
        {
            var existingCow = await _context.Cows.FirstOrDefaultAsync(c => c.Id == cow.Id && c.UserId == userId);

            if (existingCow is not null)
            {
                var existingCowWithParents = await FindCowWithParentsAsync(existingCow.Id, asNoTracking: true);
                return MapCowResponse(existingCowWithParents);
            }

            throw;
        }

        await _activityLogService.LogAsync(cow.Id, "Cow record created");
        var createdCow = await FindCowWithParentsAsync(cow.Id, asNoTracking: true);
        return MapCowResponse(createdCow);
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
                .OrderBy(n => n.CreatedAt)
                .Select(n => $"{n.CreatedAt:yyyy-MM-dd}: {n.Content.Trim()}"));

            builder.AppendLine(string.Join(",",
                EscapeCsv(cow.TagNumber),
                EscapeCsv(cow.OwnerName),
                EscapeCsv(cow.LivestockGroup.ToString()),
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
        var userId = user?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user?.FindFirstValue("sub");

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

    private static string EscapeCsv(string? value)
    {
        var sanitizedValue = value ?? string.Empty;
        var escapedValue = sanitizedValue.Replace("\"", "\"\"");
        return $"\"{escapedValue}\"";
    }
}
