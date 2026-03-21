using System.ComponentModel.DataAnnotations;

namespace HerdFlow.Api.DTOs;

public class CreateCowDto
{
    [Required]
    [MinLength(1)]
    public string TagNumber { get; set; } = null!;
    [Required]
    public string Breed { get; set; } = null!;
    [Required]
    public string HealthStatus { get; set; } = null!;
    [Required]
    public string HeatStatus { get; set; } = null!;
    [Required]
    public string BreedingStatus { get; set; } = null!;

    public string? OwnerName { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal? SalePrice { get; set; }
}
