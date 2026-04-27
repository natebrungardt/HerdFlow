using System.ComponentModel.DataAnnotations;

namespace HerdFlow.Api.DTOs;

public class CreateWorkdayDto
{

    [MaxLength(120)]
    public string? Title { get; set; } = string.Empty;

    public DateOnly? Date { get; set; }

    public string? Summary { get; set; }
}
