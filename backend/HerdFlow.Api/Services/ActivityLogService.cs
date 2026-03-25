using HerdFlow.Api.Data;
using HerdFlow.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HerdFlow.Api.Services;

public class ActivityLogService
{
    private readonly AppDbContext _context;

    public ActivityLogService(AppDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(int cowId, string description)
    {
        var entry = new ActivityLogEntry
        {
            CowId = cowId,
            Description = description
        };

        _context.ActivityLogEntries.Add(entry);
        await _context.SaveChangesAsync();
    }

    public async Task<List<ActivityLogEntry>> GetByCowIdAsync(int cowId)
    {
        return await _context.ActivityLogEntries
            .Where(a => a.CowId == cowId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }
}
