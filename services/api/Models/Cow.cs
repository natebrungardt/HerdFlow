using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using HerdFlow.Api.Models.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace HerdFlow.Api.Models;

[Index(nameof(UserId), nameof(TagNumber), IsUnique = true)]
public class Cow
{

    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = null!;

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
    public bool HasCalf { get; set; } = false;

    [Column(TypeName = "numeric")]
    public decimal? PurchasePrice { get; set; }

    [Column(TypeName = "numeric")]
    public decimal? SalePrice { get; set; }

    public DateOnly? PurchaseDate { get; set; }
    public DateOnly? SaleDate { get; set; }

    public bool IsRemoved { get; set; } = false;

    public List<Note> Notes { get; set; } = new();

    [JsonIgnore]
    public List<WorkdayCow> WorkdayCows { get; set; } = new();
}
