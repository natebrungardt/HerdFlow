using HerdFlow.Api.DTOs;
using HerdFlow.Api.Models;
using HerdFlow.Api.Data;
using HerdFlow.Api.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace HerdFlow.Api.Services;

public class CowService
{
    private readonly AppDbContext _context;
    private readonly ActivityLogService _activityLogService;
    private readonly CowChangeLogService _cowChangeLogService;

    public CowService(
        AppDbContext context,
        ActivityLogService activityLogService,
        CowChangeLogService cowChangeLogService)
    {
        _context = context;
        _activityLogService = activityLogService;
        _cowChangeLogService = cowChangeLogService;
    }

    private void ValidateCreateCow(CreateCowDto dto)
    {
        if (dto.LivestockGroup == LivestockGroupType.None)
        {
            throw new ValidationException("Livestock group is required.");
        }
    }

    public async Task<List<Cow>> GetCowsAsync()
    {
        return await _context.Cows
            .Where(c => !c.IsRemoved)
            .ToListAsync();
    }

    public async Task<Cow> GetCowByIdAsync(int id)
    {
        var cow = await _context.Cows.FirstOrDefaultAsync(c => c.Id == id);
        return cow ?? throw new NotFoundException("Cow not found.");
    }

    public async Task<Cow> UpdateCowAsync(int id, CreateCowDto dto)
    {
        var cow = await FindCowAsync(id);
        ValidateCreateCow(dto);
        await EnsureTagNumberIsUniqueAsync(dto.TagNumber, id);
        var changes = _cowChangeLogService.BuildUpdateMessages(cow, dto);

        cow.TagNumber = dto.TagNumber;
        cow.OwnerName = dto.OwnerName;
        cow.LivestockGroup = dto.LivestockGroup;
        cow.Sex = dto.Sex;
        cow.Breed = dto.Breed;
        cow.DateOfBirth = dto.DateOfBirth;
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

        return cow;
    }

    public async Task<Cow> CreateCowAsync(CreateCowDto dto)
    {
        ValidateCreateCow(dto);
        await EnsureTagNumberIsUniqueAsync(dto.TagNumber);

        var cow = new Cow
        {
            TagNumber = dto.TagNumber,
            OwnerName = dto.OwnerName,
            LivestockGroup = dto.LivestockGroup,
            Sex = dto.Sex,
            Breed = dto.Breed,
            DateOfBirth = dto.DateOfBirth,
            HealthStatus = dto.HealthStatus,
            HeatStatus = dto.HeatStatus,
            PregnancyStatus = dto.PregnancyStatus,
            HasCalf = dto.HasCalf,
            PurchasePrice = dto.PurchasePrice,
            SalePrice = dto.SalePrice,
            PurchaseDate = dto.PurchaseDate,
            SaleDate = dto.SaleDate,
        };
        _context.Cows.Add(cow);
        await _context.SaveChangesAsync();
        await _activityLogService.LogAsync(cow.Id, "Cow record created");
        return cow;
    }

    public async Task ArchiveCowAsync(int id)
    {
        var cow = await FindCowAsync(id);

        cow.IsRemoved = true;
        await _context.SaveChangesAsync();
        await _activityLogService.LogAsync(cow.Id, "Cow removed from herd");
    }

    public async Task<List<Cow>> GetRemovedCowsAsync()
    {
        return await _context.Cows
            .Where(c => c.IsRemoved)
            .ToListAsync();
    }

    public async Task RestoreCowAsync(int id)
    {
        var cow = await FindCowAsync(id);

        cow.IsRemoved = false;
        await _context.SaveChangesAsync();
        await _activityLogService.LogAsync(cow.Id, "Cow restored to herd");
    }

    private async Task<Cow> FindCowAsync(int id)
    {
        var cow = await _context.Cows.FindAsync(id);
        return cow ?? throw new NotFoundException("Cow not found.");
    }

    private async Task EnsureTagNumberIsUniqueAsync(string tagNumber, int? excludeCowId = null)
    {
        var exists = await _context.Cows.AnyAsync(c =>
            c.TagNumber == tagNumber && (!excludeCowId.HasValue || c.Id != excludeCowId.Value));

        if (exists)
        {
            throw new ConflictException("Tag number already exists.");
        }
    }
}
