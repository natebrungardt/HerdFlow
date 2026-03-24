using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using HerdFlow.Api.Models.Enums;

namespace HerdFlow.Api.Models;

[Index(nameof(TagNumber), IsUnique = true)]
public class Cow
{
    public int Id { get; set; }
    [Required]
    public string TagNumber { get; set; } = null!;
    [Required]
    public string OwnerName { get; set; } = null!;
    [Required]
    public LivestockGroupType LivestockGroup { get; set; }
    public string? Sex { get; set; }
    public string? Breed { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    [Required]
    public HealthStatusType HealthStatus { get; set; } = HealthStatusType.Healthy;
    public string? HeatStatus { get; set; }
    public string? BreedingStatus { get; set; }

    public decimal? PurchasePrice { get; set; }
    public decimal? SalePrice { get; set; }
    public DateOnly? PurchaseDate { get; set; }
    public DateOnly? SaleDate { get; set; }

    public string? Notes { get; set; }
    public bool IsRemoved { get; set; } = false;
}
