namespace HerdFlow.Api.DTOs;

public class CreateCowDto
{
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
