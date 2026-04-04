using System.ComponentModel.DataAnnotations;

namespace HerdFlow.Api.Models;

public class Note
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = null!;
    [Required]
    public Guid CowId { get; set; }
    public Cow? Cow { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
