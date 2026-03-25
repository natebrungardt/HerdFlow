using System.ComponentModel.DataAnnotations;

namespace HerdFlow.Api.DTOs;

public class CreateNoteDto
{
    [Required]
    public string Content { get; set; } = null!;
}
