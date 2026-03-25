namespace HerdFlow.Api.Models;

using System.ComponentModel.DataAnnotations;

public class WorkdayNote
{
    public int Id { get; set; }

    public int WorkdayId { get; set; }
    public Workday Workday { get; set; } = null!;
    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; } // for future editing
}
