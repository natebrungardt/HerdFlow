namespace HerdFlow.Api.DTOs;

public class ActivityLogDto
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
