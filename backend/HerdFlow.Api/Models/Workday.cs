namespace HerdFlow.Api.Models;

public class Workday
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty; // "Workday 1"

    public DateTime Date { get; set; } = DateTime.UtcNow.Date;

    public string? Summary { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Relationships
    public List<WorkdayCow> WorkdayCows { get; set; } = new();
    public List<WorkdayNote> WorkdayNotes { get; set; } = new();
    public bool IsArchived { get; set; } = false;
}
