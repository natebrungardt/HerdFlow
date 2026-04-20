namespace HerdFlow.Api.DTOs;

public class CowParentSummaryDto
{
    public Guid Id { get; set; }
    public string TagNumber { get; set; } = null!;
    public string? Name { get; set; }
}
