using System.ComponentModel.DataAnnotations;

namespace HerdFlow.Api.DTOs;

public class CreateNoteDto
{
    [Required]
    public string Content { get; set; } = null!;

    [MaxLength(50)]
    public string? Source { get; set; }

    public Guid? WorkdayId { get; set; }
}
