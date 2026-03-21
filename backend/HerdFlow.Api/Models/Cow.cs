using Microsoft.EntityFrameworkCore;

namespace HerdFlow.Api.Models;

[Index(nameof(TagNumber), IsUnique = true)]
public class Cow
{
    public int Id { get; set; }

    public string TagNumber { get; set; } = null!;
    public string Breed { get; set; } = null!;
    public string HealthStatus { get; set; } = null!;
    public string HeatStatus { get; set; } = null!;
    public string BreedingStatus { get; set; } = null!;

    public string? OwnerName { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal? SalePrice { get; set; }
}
