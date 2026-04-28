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

    public string? OwnerName { get; set; }

    public LivestockGroupType? LivestockGroup { get; set; }

    public string? Sex { get; set; }
    public string? Breed { get; set; }
    public string? Name { get; set; }
    public string? Color { get; set; }
    public DateOnly? DateOfBirth { get; set; }

    [Column(TypeName = "numeric")]
    public decimal? BirthWeight { get; set; }

    public string? EaseOfBirth { get; set; }

    public Guid? SireId { get; set; }
    public string? SireName { get; set; }

    public Guid? DamId { get; set; }
    public string? DamName { get; set; }

    [Required]
    public HealthStatusType HealthStatus { get; set; } = HealthStatusType.Healthy;

    public HeatStatusType? HeatStatus { get; set; }
    public string? PregnancyStatus { get; set; }

    [Column(TypeName = "numeric")]
    public decimal? PurchasePrice { get; set; }

    [Column(TypeName = "numeric")]
    public decimal? SalePrice { get; set; }

    public DateOnly? PurchaseDate { get; set; }
    public DateOnly? SaleDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsRemoved { get; set; } = false;
    public DateTime? RemovedAt { get; set; }

    public List<Note> Notes { get; set; } = new();

    [JsonIgnore]
    public List<WorkdayCow> WorkdayCows { get; set; } = new();

    [JsonIgnore]
    public List<WorkdayEntry> WorkdayEntries { get; set; } = new();

    [JsonIgnore]
    public Cow? Sire { get; set; }

    [JsonIgnore]
    public Cow? Dam { get; set; }

    [JsonIgnore]
    public List<Cow> SiredOffspring { get; set; } = new();

    [JsonIgnore]
    public List<Cow> BirthedOffspring { get; set; } = new();
}
