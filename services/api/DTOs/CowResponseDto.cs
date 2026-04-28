using HerdFlow.Api.Models.Enums;

namespace HerdFlow.Api.DTOs;

public class CowResponseDto
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = null!;
    public string TagNumber { get; set; } = null!;
    public string? OwnerName { get; set; }
    public LivestockGroupType? LivestockGroup { get; set; }
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
    public HealthStatusType HealthStatus { get; set; }
    public HeatStatusType? HeatStatus { get; set; }
    public string? PregnancyStatus { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal? SalePrice { get; set; }
    public DateOnly? PurchaseDate { get; set; }
    public DateOnly? SaleDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsRemoved { get; set; }
    public DateTime? RemovedAt { get; set; }
    public CowParentSummaryDto? Sire { get; set; }
    public CowParentSummaryDto? Dam { get; set; }
}
