namespace HerdFlow.Api.DTOs;

public class UpdateWorkdayCowsDto
{
    public List<Guid> CowIds { get; set; } = new();
}
