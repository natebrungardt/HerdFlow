namespace HerdFlow.Api.DTOs;

public class ActiveWorkdayDto
{
    public Guid Id { get; set; }
    public List<ActionDto> Actions { get; set; } = new();
    public List<WorkdayCowDto> WorkdayCows { get; set; } = new();
    public List<WorkdayEntryDto> Entries { get; set; } = new();
}

public class ActionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class WorkdayCowDto
{
    public Guid CowId { get; set; }
    public string TagNumber { get; set; } = string.Empty;
    public string? Status { get; set; }
}

public class WorkdayEntryDto
{
    public Guid CowId { get; set; }
    public Guid ActionId { get; set; }
    public bool IsCompleted { get; set; }
}
