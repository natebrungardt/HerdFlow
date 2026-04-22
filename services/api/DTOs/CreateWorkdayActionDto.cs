using System.ComponentModel.DataAnnotations;

namespace HerdFlow.Api.DTOs;

public class CreateWorkdayActionDto
{
    [Required]
    public string Name { get; set; } = string.Empty;
}
