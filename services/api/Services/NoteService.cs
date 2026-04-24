using HerdFlow.Api.Data;
using HerdFlow.Api.DTOs;
using HerdFlow.Api.Exceptions;
using HerdFlow.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Npgsql;
using System.Security.Claims;

namespace HerdFlow.Api.Services;

public class NoteService
{
    private readonly AppDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<NoteService> _logger;

    public NoteService(
        AppDbContext context,
        IHttpContextAccessor httpContextAccessor,
        ILogger<NoteService> logger)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task<List<Note>> GetNotesAsync(Guid cowId)
    {
        var userId = GetCurrentUserId();
        await EnsureCowExistsAsync(cowId);

        return await _context.Notes
            .Where(n => n.CowId == cowId && n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<Note> CreateNoteAsync(Guid cowId, CreateNoteDto dto)
    {
        await EnsureCowExistsAsync(cowId);
        ValidateNoteContent(dto.Content);
        var now = DateTime.UtcNow;

        var note = new Note
        {
            UserId = GetCurrentUserId(),
            CowId = cowId,
            Content = dto.Content.Trim(),
            Source = NormalizeSource(dto.Source),

            CreatedAt = now,
            UpdatedAt = now,
        };

        _context.Notes.Add(note);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (WasDuplicatePrimaryKeyInsert(ex))
        {
            var existingNote = await _context.Notes.FirstOrDefaultAsync(n => n.Id == note.Id && n.UserId == note.UserId);

            if (existingNote is not null)
            {
                return existingNote;
            }

            throw;
        }

        return note;
    }

    public async Task DeleteNoteAsync(Guid cowId, Guid noteId)
    {
        var note = await FindNoteAsync(cowId, noteId);

        _context.Notes.Remove(note);
        await _context.SaveChangesAsync();
    }

    public async Task<Note> UpdateNoteAsync(Guid cowId, Guid noteId, CreateNoteDto dto)
    {
        var note = await FindNoteAsync(cowId, noteId);
        ValidateNoteContent(dto.Content);

        note.Content = dto.Content.Trim();
        note.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return note;
    }

    private async Task EnsureCowExistsAsync(Guid cowId)
    {
        var userId = GetCurrentUserId();
        var cow = await _context.Cows
            .AsNoTracking()
            .Where(c => c.Id == cowId)
            .Select(c => new { c.Id, c.UserId })
            .FirstOrDefaultAsync();
        var exists = cow?.UserId == userId;

        _logger.LogWarning(
            "Temporary notes auth debug: cowId={CowId}, tokenUserId={TokenUserId}, cowUserId={CowUserId}, existsForUser={ExistsForUser}",
            cowId,
            userId,
            cow?.UserId ?? "<cow not found>",
            exists);

        if (!exists)
        {
            throw new NotFoundException("Cow not found.");
        }
    }

    private async Task<Note> FindNoteAsync(Guid cowId, Guid noteId)
    {
        var userId = GetCurrentUserId();
        var note = await _context.Notes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.CowId == cowId && n.UserId == userId);

        return note ?? throw new NotFoundException("Note not found.");
    }



    private static void ValidateNoteContent(string? content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ValidationException("Note content is required.");
        }
    }

    private static string? NormalizeSource(string? source)
    {
        return string.IsNullOrWhiteSpace(source) ? null : source.Trim();
    }

    private string GetCurrentUserId()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var userId = user?.FindFirstValue("sub")
            ?? user?.FindFirstValue(ClaimTypes.NameIdentifier);

        _logger.LogWarning(
            "Temporary notes auth debug: httpContextPresent={HttpContextPresent}, isAuthenticated={IsAuthenticated}, tokenUserId={TokenUserId}, claimTypes={ClaimTypes}",
            _httpContextAccessor.HttpContext is not null,
            user?.Identity?.IsAuthenticated ?? false,
            string.IsNullOrWhiteSpace(userId) ? "<missing>" : userId,
            user is null ? "<no user>" : string.Join(", ", user.Claims.Select(claim => claim.Type)));

        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new InvalidOperationException("Authenticated user ID is missing.");
        }

        return userId;
    }

    private static bool WasDuplicatePrimaryKeyInsert(DbUpdateException exception)
    {
        return exception.InnerException is PostgresException postgresException
            && postgresException.SqlState == PostgresErrorCodes.UniqueViolation
            && postgresException.ConstraintName == "PK_Notes";
    }
}
