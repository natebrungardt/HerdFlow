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
    public Cow CreateCow(CreateCowDto dto)
    {
        var cow = new Cow
        {
            TagNumber = dto.TagNumber.Trim(),
            Breed = dto.Breed,
            HealthStatus = dto.HealthStatus,
            HeatStatus = dto.HeatStatus,
            BreedingStatus = dto.BreedingStatus,
            OwnerName = dto.OwnerName,
            DateOfBirth = dto.DateOfBirth,
            PurchasePrice = dto.PurchasePrice,
            SalePrice = dto.SalePrice
        };

        _context.Cows.Add(cow);
        _context.SaveChanges();
        return cow;
    }

    public List<Cow> GetCows()
    {
        return _context.Cows.ToList();
    }
}
