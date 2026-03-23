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
    public List<Cow> GetCows()
    {
        return _context.Cows.ToList();
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

        cow.TagNumber = dto.TagNumber;
        cow.OwnerName = dto.OwnerName;
        cow.LivestockGroup = dto.LivestockGroup;
        cow.Breed = dto.Breed;
        cow.HealthStatus = dto.HealthStatus;
        cow.BreedingStatus = dto.BreedingStatus;
        cow.Sex = dto.Sex;
        cow.DateOfBirth = dto.DateOfBirth;
        cow.Notes = dto.Notes;

        cow.PurchasePrice = dto.PurchasePrice;
        cow.SalePrice = dto.SalePrice;
        cow.PurchaseDate = dto.PurchaseDate;
        cow.SaleDate = dto.SaleDate;

        _context.SaveChanges();

        return cow;
    }
    public Cow CreateCow(CreateCowDto dto)
    {
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
            HarvestDate = dto.HarvestDate
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

        _context.Cows.Remove(cow);
        _context.SaveChanges();

        return true;
    }
}
