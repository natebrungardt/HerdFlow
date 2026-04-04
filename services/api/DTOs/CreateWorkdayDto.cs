
using System.ComponentModel.DataAnnotations;

namespace HerdFlow.Api.DTOs;

public class CreateWorkdayDto
{
    [Required]
    [MaxLength(120)]
    public string Title { get; set; } = string.Empty;

    public DateOnly? Date { get; set; }

    public string? Summary { get; set; }

    public List<Guid> CowIds { get; set; } = new();
}
