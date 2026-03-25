using HerdFlow.Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using HerdFlow.Api.Services;

namespace HerdFlow.Api.Controllers;

[ApiController]
[Route("api/cows/{cowId:int}/notes")]
public class NoteController : ControllerBase
{
    private readonly NoteService _noteService;

    public NoteController(NoteService noteService)
    {
        _noteService = noteService;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotes(int cowId)
    {
        var notes = await _noteService.GetNotesAsync(cowId);
        return Ok(notes);
    }

    [HttpPost]
    public async Task<IActionResult> CreateNote(int cowId, [FromBody] CreateNoteDto dto)
    {
        var note = await _noteService.CreateNoteAsync(cowId, dto);
        return Ok(note);
    }

    [HttpDelete("{noteId:int}")]
    public async Task<IActionResult> DeleteNote(int cowId, int noteId)
    {
        await _noteService.DeleteNoteAsync(cowId, noteId);
        return NoContent();
    }

    [HttpPut("{noteId:int}")]
    public async Task<IActionResult> UpdateNote(int cowId, int noteId, [FromBody] CreateNoteDto dto)
    {
        var note = await _noteService.UpdateNoteAsync(cowId, noteId, dto);
        return Ok(note);
    }
}
