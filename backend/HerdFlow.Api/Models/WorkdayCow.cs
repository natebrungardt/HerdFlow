namespace HerdFlow.Api.Models;

public class WorkdayCow
{
    public int Id { get; set; }

    public int WorkdayId { get; set; }
    public Workday Workday { get; set; } = null!;

    public int CowId { get; set; }
    public Cow Cow { get; set; } = null!;

    // Optional future-proofing (nice touch)
    public string? Status { get; set; }
    // Example: "Treated", "Tagged", etc.
}
