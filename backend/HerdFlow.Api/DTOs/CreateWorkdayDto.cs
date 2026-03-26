
using System.ComponentModel.DataAnnotations;

namespace HerdFlow.Api.DTOs;

public class CreateWorkdayDto
{
    [Required]
    [MaxLength(120)]
    public string Title { get; set; } = string.Empty;

    public DateTime? Date { get; set; }

    public string? Summary { get; set; }

    public List<int> CowIds { get; set; } = new();
}
