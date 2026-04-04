using System.ComponentModel.DataAnnotations;

namespace HerdFlow.Api.DTOs;

public class UpdateWorkdayDto
{
    [Required]
    [MaxLength(120)]
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public DateOnly Date { get; set; }
}
