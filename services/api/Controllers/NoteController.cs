using HerdFlow.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using HerdFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;

namespace HerdFlow.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/cows/{cowId:guid}/notes")]
public class NoteController : ControllerBase
{
    private readonly NoteService _noteService;

    public NoteController(NoteService noteService)
    {
        _noteService = noteService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotes(Guid cowId)
    {
        var notes = await _noteService.GetNotesAsync(cowId);
        return Ok(notes);
    }

    [HttpPost]
    public async Task<IActionResult> CreateNote(Guid cowId, [FromBody] CreateNoteDto dto)
    {
        var note = await _noteService.CreateNoteAsync(cowId, dto);
        return Ok(note);
    }

    [HttpDelete("{noteId:guid}")]
    public async Task<IActionResult> DeleteNote(Guid cowId, Guid noteId)
    {
        await _noteService.DeleteNoteAsync(cowId, noteId);
        return NoContent();
    }

    [HttpPut("{noteId:guid}")]
    public async Task<IActionResult> UpdateNote(Guid cowId, Guid noteId, [FromBody] CreateNoteDto dto)
    {
        var note = await _noteService.UpdateNoteAsync(cowId, noteId, dto);
        return Ok(note);
    }
}
