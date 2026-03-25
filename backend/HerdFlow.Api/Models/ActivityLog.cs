namespace HerdFlow.Api.Models;

public class ActivityLogEntry
{
    public int Id { get; set; }

    public int CowId { get; set; }
    public Cow? Cow { get; set; }

    public string Description { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
