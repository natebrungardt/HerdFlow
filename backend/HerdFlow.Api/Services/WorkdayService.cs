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
            Date = NormalizeWorkdayDate(dto.Date),
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
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();
    }

    // READ - Archived Workdays
    public async Task<List<Workday>> GetArchivedWorkdays()
    {
        return await _context.Workdays
            .Where(w => w.IsArchived)
            .OrderByDescending(w => w.CreatedAt)
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

    public async Task AddCowsToWorkday(int id, List<int> cowIds)
    {
        var workday = await _context.Workdays
            .Include(w => w.WorkdayCows)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (workday == null)
        {
            throw new NotFoundException("Workday not found.");
        }

        var distinctCowIds = cowIds
            .Distinct()
            .ToList();

        if (distinctCowIds.Count == 0)
        {
            return;
        }

        var existingCowIds = workday.WorkdayCows
            .Select(wc => wc.CowId)
            .ToHashSet();

        var newCowIds = distinctCowIds
            .Where(cowId => !existingCowIds.Contains(cowId))
            .ToList();

        if (newCowIds.Count == 0)
        {
            return;
        }

        var cows = await _context.Cows
            .Where(c => newCowIds.Contains(c.Id) && !c.IsRemoved)
            .ToListAsync();

        if (cows.Count != newCowIds.Count)
        {
            throw new ValidationException("One or more selected cows could not be added to the workday.");
        }

        foreach (var cowId in newCowIds)
        {
            workday.WorkdayCows.Add(new WorkdayCow
            {
                CowId = cowId
            });
        }

        await _context.SaveChangesAsync();
    }

    public async Task RemoveCowFromWorkday(int id, int cowId)
    {
        var workdayCow = await _context.WorkdayCows
            .FirstOrDefaultAsync(wc => wc.WorkdayId == id && wc.CowId == cowId);

        if (workdayCow == null)
        {
            throw new NotFoundException("Cow assignment not found for this workday.");
        }

        _context.WorkdayCows.Remove(workdayCow);
        await _context.SaveChangesAsync();
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
        workday.Date = NormalizeWorkdayDate(dto.Date);

        await _context.SaveChangesAsync();

        return workday;
    }

    private static DateTime NormalizeWorkdayDate(DateTime? value)
    {
        var workdayDate = (value ?? DateTime.UtcNow).Date;

        return workdayDate.Kind == DateTimeKind.Utc
            ? workdayDate
            : DateTime.SpecifyKind(workdayDate, DateTimeKind.Utc);
    }
}
