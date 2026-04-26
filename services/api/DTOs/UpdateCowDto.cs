using HerdFlow.Api.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace HerdFlow.Api.DTOs;

public class UpdateCowDto
{
    [Required]
    public string TagNumber { get; set; } = null!;

    public string? OwnerName { get; set; }

    [Required]
    [EnumDataType(typeof(LivestockGroupType))]
    public LivestockGroupType LivestockGroup { get; set; }
    public string? Sex { get; set; }
    public string? Breed { get; set; }
    public string? Name { get; set; }
    public string? Color { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public decimal? BirthWeight { get; set; }
    public string? EaseOfBirth { get; set; }
    public Guid? SireId { get; set; }
    public string? SireName { get; set; }
    public Guid? DamId { get; set; }
    public string? DamName { get; set; }

    [EnumDataType(typeof(HealthStatusType))]
    public HealthStatusType HealthStatus { get; set; } = HealthStatusType.Healthy;

    public HeatStatusType? HeatStatus { get; set; }
    public string? PregnancyStatus { get; set; }
    public bool HasCalf { get; set; }

    public decimal? PurchasePrice { get; set; }
    public decimal? SalePrice { get; set; }
    public DateOnly? PurchaseDate { get; set; }
    public DateOnly? SaleDate { get; set; }
}
