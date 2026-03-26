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
    public HeatStatusType? HeatStatus { get; set; }
    public string? PregnancyStatus { get; set; }

    public decimal? PurchasePrice { get; set; }
    public decimal? SalePrice { get; set; }
    public DateOnly? PurchaseDate { get; set; }
    public DateOnly? SaleDate { get; set; }

    public List<Note> Notes { get; set; } = new();
    public bool IsRemoved { get; set; } = false;

    public List<WorkdayCow> WorkdayCows { get; set; } = new();
}
