using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace HerdFlow.Api.Models;

public class WorkdayAction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? WorkdayId { get; set; }

    [JsonIgnore]
    public Workday Workday { get; set; } = null!;

    [Required]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public List<WorkdayEntry> Entries { get; set; } = new();
}
