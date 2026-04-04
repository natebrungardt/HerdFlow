using HerdFlow.Api.Data;
using HerdFlow.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Security.Claims;

namespace HerdFlow.Api.Services;

public class ActivityLogService
{
    private readonly AppDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ActivityLogService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(Guid cowId, string description)
    {
        var entry = new ActivityLogEntry
        {
            CowId = cowId,
            Description = description,
            UserId = GetCurrentUserId(),
        };

        _context.ActivityLogEntries.Add(entry);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (WasDuplicatePrimaryKeyInsert(ex))
        {
            var existingEntry = await _context.ActivityLogEntries.FirstOrDefaultAsync(a => a.Id == entry.Id && a.UserId == entry.UserId);

            if (existingEntry is not null)
            {
                return;
            }

            throw;
        }
    }

    public async Task<List<ActivityLogEntry>> GetByCowIdAsync(Guid cowId)
    {
        var userId = GetCurrentUserId();
        return await _context.ActivityLogEntries
            .Where(a => a.CowId == cowId && a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    private string GetCurrentUserId()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var userId = user?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user?.FindFirstValue("sub");

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
            && postgresException.ConstraintName == "PK_ActivityLogEntries";
    }
}
