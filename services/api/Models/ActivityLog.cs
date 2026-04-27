using System.ComponentModel.DataAnnotations;

namespace HerdFlow.Api.Models;

public class ActivityLogEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = null!;

    public Guid? CowId { get; set; }
    public Cow? Cow { get; set; }

    public Guid? WorkdayId { get; set; }
    public Workday? Workday { get; set; }

    [Required]
    public string EventType { get; set; } = null!;

    public string Description { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
