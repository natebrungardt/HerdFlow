using System.Text.Json.Serialization;

namespace HerdFlow.Api.Models;

public class WorkdayCow
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid WorkdayId { get; set; }
    [JsonIgnore]
    public Workday Workday { get; set; } = null!;

    public Guid CowId { get; set; }
    public Cow Cow { get; set; } = null!;

    // Optional future-proofing (nice touch)
    public string? Status { get; set; }
    // Example: "Treated", "Tagged", etc.
}
