using System.Text.Json.Serialization;

namespace HerdFlow.Api.Models;

public class WorkdayEntry
{
    public Guid WorkdayId { get; set; }

    [JsonIgnore]
    public Workday Workday { get; set; } = null!;

    public Guid CowId { get; set; }

    [JsonIgnore]
    public Cow Cow { get; set; } = null!;

    public Guid ActionId { get; set; }

    [JsonIgnore]
    public WorkdayAction WorkdayAction { get; set; } = null!;

    public bool IsCompleted { get; set; } = false;
}
