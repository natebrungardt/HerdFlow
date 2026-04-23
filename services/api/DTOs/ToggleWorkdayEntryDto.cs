namespace HerdFlow.Api.DTOs;

public class ToggleWorkdayEntryDto
{
    public Guid CowId { get; set; }
    public Guid ActionId { get; set; }
    public bool Completed { get; set; }
}
