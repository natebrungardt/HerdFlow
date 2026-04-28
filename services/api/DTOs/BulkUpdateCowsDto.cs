using System.ComponentModel.DataAnnotations;

namespace HerdFlow.Api.DTOs;

public class BulkUpdateCowsDto
{
    [Required]
    public List<Guid> CowIds { get; set; } = new();

    [Required]
    public string Action { get; set; } = null!;
}
