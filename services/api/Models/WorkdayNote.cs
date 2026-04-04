namespace HerdFlow.Api.Models;

using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

public class WorkdayNote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [Required]
    public string UserId { get; set; } = null!;
    [Required]
    public Guid WorkdayId { get; set; }
    [JsonIgnore]
    public Workday Workday { get; set; } = null!;
    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; } // for future editing
}
