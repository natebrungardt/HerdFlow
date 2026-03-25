namespace HerdFlow.Api.Models;

public class Note
{
    public int Id { get; set; }

    public int CowId { get; set; }

    public string Content { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
