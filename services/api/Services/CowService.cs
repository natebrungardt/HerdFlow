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
        if (dto.LivestockGroup == LivestockGroupType.None)
        {
            throw new ValidationException("Livestock group is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.TagNumber))
        {
            throw new ValidationException("Tag number is required.");
        }

        if (!TagNumberPattern.IsMatch(dto.TagNumber.Trim()))
        {
            throw new ValidationException("Tag number can only include letters, numbers, and dashes.");
        }
    }

    private static string NormalizePregnancyStatus(string? pregnancyStatus)
    {
        return string.IsNullOrWhiteSpace(pregnancyStatus) ? "N/A" : pregnancyStatus.Trim();
    }

    public async Task<List<Cow>> GetCowsAsync()
    {
        var userId = GetCurrentUserId();
        return await _context.Cows
            .Where(c => c.UserId == userId && !c.IsRemoved)
            .ToListAsync();
    }

    public async Task<Cow> GetCowByIdAsync(Guid id)
    {
        var userId = GetCurrentUserId();
        var cow = await _context.Cows.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        return cow ?? throw new NotFoundException("Cow not found.");
    }

    public async Task<Cow> UpdateCowAsync(Guid id, CreateCowDto dto)
    {
        var cow = await FindCowAsync(id);
        ValidateCreateCow(dto);
        var normalizedTagNumber = dto.TagNumber.Trim();
        await EnsureTagNumberIsUniqueAsync(normalizedTagNumber, id);
        var changes = _cowChangeLogService.BuildUpdateMessages(cow, dto);

        cow.TagNumber = normalizedTagNumber;
        cow.OwnerName = dto.OwnerName;
        cow.LivestockGroup = dto.LivestockGroup;
        cow.Sex = dto.Sex;
        cow.Breed = dto.Breed;
        cow.DateOfBirth = dto.DateOfBirth;
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

        return cow;
    }

    public async Task<Cow> CreateCowAsync(CreateCowDto dto)
    {
        ValidateCreateCow(dto);
        var normalizedTagNumber = dto.TagNumber.Trim();
        var userId = GetCurrentUserId();
        await EnsureTagNumberIsUniqueAsync(normalizedTagNumber, userId);

        var cow = new Cow
        {
            UserId = userId,
            TagNumber = normalizedTagNumber,
            OwnerName = dto.OwnerName,
            LivestockGroup = dto.LivestockGroup,
            Sex = dto.Sex,
            Breed = dto.Breed,
            DateOfBirth = dto.DateOfBirth,
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
                return existingCow;
            }

            throw;
        }

        await _activityLogService.LogAsync(cow.Id, "Cow record created");
        return cow;
    }

    public async Task ArchiveCowAsync(Guid id)
    {
        var cow = await FindCowAsync(id);

        cow.IsRemoved = true;
        await _context.SaveChangesAsync();
        await _activityLogService.LogAsync(cow.Id, "Cow archived from herd");
    }

    public async Task<List<Cow>> GetRemovedCowsAsync()
    {
        var userId = GetCurrentUserId();
        return await _context.Cows
            .Where(c => c.UserId == userId && c.IsRemoved)
            .ToListAsync();
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
            EscapeCsv("Date of Birth"),
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
                EscapeCsv(FormatDate(cow.DateOfBirth)),
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
        await _context.SaveChangesAsync();
        await _activityLogService.LogAsync(cow.Id, "Cow restored to herd");
    }

    private async Task<Cow> FindCowAsync(Guid id)
    {
        var userId = GetCurrentUserId();
        var cow = await _context.Cows.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        return cow ?? throw new NotFoundException("Cow not found.");
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

    private static string EscapeCsv(string? value)
    {
        var sanitizedValue = value ?? string.Empty;
        var escapedValue = sanitizedValue.Replace("\"", "\"\"");
        return $"\"{escapedValue}\"";
    }
}
