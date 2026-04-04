using HerdFlow.Api.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace HerdFlow.Api.DTOs;

public class CreateCowDto
{
    [Required]
    public string TagNumber { get; set; } = null!;

    [Required]
    public string OwnerName { get; set; } = null!;

    [Required]
    [EnumDataType(typeof(LivestockGroupType))]
    public LivestockGroupType LivestockGroup { get; set; }
    public string? Sex { get; set; }
    public string? Breed { get; set; }
    public DateOnly? DateOfBirth { get; set; }
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
