using HerdFlow.Api.Data;
using HerdFlow.Api.Exceptions;
using HerdFlow.Api.Models;
using Microsoft.EntityFrameworkCore;
using HerdFlow.Api.DTOs;

namespace HerdFlow.Api.Services;

public class WorkdayService
{
    private readonly AppDbContext _context;

    public WorkdayService(AppDbContext context)
    {
        _context = context;
    }

    // CREATE
    public async Task<Workday> CreateWorkday(CreateWorkdayDto dto)
    {
        var distinctCowIds = dto.CowIds
            .Distinct()
            .ToList();

        var cows = distinctCowIds.Count == 0
            ? new List<Cow>()
            : await _context.Cows
                .Where(c => distinctCowIds.Contains(c.Id) && !c.IsRemoved)
                .ToListAsync();

        if (cows.Count != distinctCowIds.Count)
        {
            throw new ValidationException("One or more selected cows could not be added to the workday.");
        }

        var workday = new Workday
        {
            Title = dto.Title.Trim(),
            Date = dto.Date ?? DateTime.UtcNow.Date,
            Summary = dto.Summary,
            WorkdayCows = cows.Select(cow => new WorkdayCow
            {
                CowId = cow.Id
            }).ToList()
        };

        _context.Workdays.Add(workday);
        await _context.SaveChangesAsync();

        return workday;
    }

    // READ - Active Workdays
    public async Task<List<Workday>> GetActiveWorkdays()
    {
        return await _context.Workdays
            .Where(w => !w.IsArchived)
            .OrderByDescending(w => w.Date)
            .ToListAsync();
    }

    // READ - Archived Workdays
    public async Task<List<Workday>> GetArchivedWorkdays()
    {
        return await _context.Workdays
            .Where(w => w.IsArchived)
            .OrderByDescending(w => w.Date)
            .ToListAsync();
    }

    // READ - By Id (with cows + notes)
    public async Task<Workday> GetWorkdayById(int id)
    {
        var workday = await _context.Workdays
            .Include(w => w.WorkdayCows)
                .ThenInclude(wc => wc.Cow)
            .Include(w => w.WorkdayNotes)
            .FirstOrDefaultAsync(w => w.Id == id);

        return workday ?? throw new NotFoundException("Workday not found.");
    }

    // UPDATE - Archive Workday
    public async Task ArchiveWorkday(int id)
    {
        var workday = await FindWorkdayAsync(id);

        workday.IsArchived = true;
        await _context.SaveChangesAsync();
    }

    // UPDATE - Restore Workday
    public async Task RestoreWorkday(int id)
    {
        var workday = await FindWorkdayAsync(id);

        workday.IsArchived = false;
        await _context.SaveChangesAsync();
    }

    // DELETE (optional hard delete)
    public async Task DeleteWorkday(int id)
    {
        var workday = await FindWorkdayAsync(id);

        _context.Workdays.Remove(workday);
        await _context.SaveChangesAsync();
    }

    private async Task<Workday> FindWorkdayAsync(int id)
    {
        var workday = await _context.Workdays.FindAsync(id);
        return workday ?? throw new NotFoundException("Workday not found.");
    }

    public async Task<Workday> UpdateWorkday(int id, UpdateWorkdayDto dto)
    {
        var workday = await FindWorkdayAsync(id);


        workday.Title = dto.Title.Trim();
        workday.Summary = dto.Summary;
        workday.Date = dto.Date;

        await _context.SaveChangesAsync();

        return workday;
    }
}
