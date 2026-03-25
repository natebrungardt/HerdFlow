using HerdFlow.Api.Data;
using HerdFlow.Api.DTOs;
using HerdFlow.Api.Exceptions;
using HerdFlow.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HerdFlow.Api.Services;

public class NoteService
{
    private readonly AppDbContext _context;

    public NoteService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Note>> GetNotesAsync(int cowId)
    {
        return await _context.Notes
            .Where(n => n.CowId == cowId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<Note> CreateNoteAsync(int cowId, CreateNoteDto dto)
    {
        await EnsureCowExistsAsync(cowId);
        ValidateNoteContent(dto.Content);
        var now = DateTime.UtcNow;

        var note = new Note
        {
            CowId = cowId,
            Content = dto.Content.Trim(),
            CreatedAt = now,
            UpdatedAt = now,
        };

        _context.Notes.Add(note);
        await _context.SaveChangesAsync();

        return note;
    }

    public async Task DeleteNoteAsync(int cowId, int noteId)
    {
        var note = await FindNoteAsync(cowId, noteId);

        _context.Notes.Remove(note);
        await _context.SaveChangesAsync();
    }

    public async Task<Note> UpdateNoteAsync(int cowId, int noteId, CreateNoteDto dto)
    {
        var note = await FindNoteAsync(cowId, noteId);
        ValidateNoteContent(dto.Content);

        note.Content = dto.Content.Trim();
        note.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return note;
    }

    private async Task EnsureCowExistsAsync(int cowId)
    {
        var exists = await _context.Cows.AnyAsync(c => c.Id == cowId);

        if (!exists)
        {
            throw new NotFoundException("Cow not found.");
        }
    }

    private async Task<Note> FindNoteAsync(int cowId, int noteId)
    {
        var note = await _context.Notes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.CowId == cowId);

        return note ?? throw new NotFoundException("Note not found.");
    }

    private static void ValidateNoteContent(string? content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ValidationException("Note content is required.");
        }
    }
}
