using HerdFlow.Api.DTOs;
using HerdFlow.Api.Models;
using HerdFlow.Api.Data;

namespace HerdFlow.Api.Services;

public class CowService
{
    private readonly AppDbContext _context;

    public CowService(AppDbContext context)
    {
        _context = context;
    }

    private void ValidateCreateCow(CreateCowDto dto)
    {
        if (dto.LivestockGroup == LivestockGroupType.None)
            throw new ArgumentException("Livestock group is required");
    }

    public List<Cow> GetCows()
    {
        return _context.Cows
            .Where(c => !c.IsRemoved)
            .ToList();
    }
    public Cow? GetCowById(int id)
    {
        return _context.Cows.FirstOrDefault(c => c.Id == id);
    }
    public Cow? UpdateCow(int id, CreateCowDto dto)
    {
        var cow = _context.Cows.FirstOrDefault(c => c.Id == id);

        if (cow == null)
            return null;

        ValidateCreateCow(dto);

        cow.TagNumber = dto.TagNumber;
        cow.OwnerName = dto.OwnerName;
        cow.LivestockGroup = dto.LivestockGroup;
        cow.Sex = dto.Sex;
        cow.Breed = dto.Breed;
        cow.DateOfBirth = dto.DateOfBirth;
        cow.HealthStatus = dto.HealthStatus;
        cow.HeatStatus = dto.HeatStatus;
        cow.BreedingStatus = dto.BreedingStatus;
        cow.PurchasePrice = dto.PurchasePrice;
        cow.SalePrice = dto.SalePrice;
        cow.PurchaseDate = dto.PurchaseDate;
        cow.SaleDate = dto.SaleDate;
        cow.Notes = dto.Notes;

        _context.SaveChanges();

        return cow;
    }
    public Cow CreateCow(CreateCowDto dto)
    {
        ValidateCreateCow(dto);

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
            BreedingStatus = dto.BreedingStatus,
            PurchasePrice = dto.PurchasePrice,
            SalePrice = dto.SalePrice,
            PurchaseDate = dto.PurchaseDate,
            SaleDate = dto.SaleDate,
            Notes = dto.Notes,
        };
        _context.Cows.Add(cow);
        _context.SaveChanges();
        return cow;
    }
    public bool DeleteCow(int id)
    {
        var cow = _context.Cows.FirstOrDefault(c => c.Id == id);

        if (cow == null)
            return false;

        cow.IsRemoved = true;
        _context.SaveChanges();

        return true;
    }
    public List<Cow> GetRemovedCows()
    {
        return _context.Cows
            .Where(c => c.IsRemoved)
            .ToList();
    }
    public void RestoreCow(int id)
    {
        var cow = _context.Cows.Find(id);
        if (cow == null) return;

        cow.IsRemoved = false;
        _context.SaveChanges();
    }
}
