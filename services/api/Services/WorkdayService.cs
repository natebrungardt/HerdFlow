using HerdFlow.Api.Data;
using HerdFlow.Api.Exceptions;
using HerdFlow.Api.Models;
using Microsoft.EntityFrameworkCore;
using HerdFlow.Api.DTOs;
using Microsoft.AspNetCore.Http;
using Npgsql;
using System.Security.Claims;
using HerdFlow.Api.Models.Enums;

namespace HerdFlow.Api.Services;

public class WorkdayService
{
    private readonly AppDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public WorkdayService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    // CREATE
    public async Task<Workday> CreateWorkday(CreateWorkdayDto dto)
    {
        var userId = GetCurrentUserId();
        var distinctCowIds = dto.CowIds
            .Distinct()
            .ToList();

        var cows = distinctCowIds.Count == 0
            ? new List<Cow>()
            : await _context.Cows
                .Where(c => c.UserId == userId && distinctCowIds.Contains(c.Id) && !c.IsRemoved)
                .ToListAsync();

        if (cows.Count != distinctCowIds.Count)
        {
            throw new ValidationException("One or more selected cows could not be added to the workday.");
        }

        var workday = new Workday
        {
            UserId = userId,
            Title = dto.Title.Trim(),
            Date = NormalizeWorkdayDate(dto.Date),
            Summary = dto.Summary,
            WorkdayCows = cows.Select(cow => new WorkdayCow
            {
                CowId = cow.Id
            }).ToList()
        };

        _context.Workdays.Add(workday);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (WasDuplicatePrimaryKeyInsert(ex))
        {
            var existingWorkday = await _context.Workdays
                .Include(w => w.WorkdayCows)
                    .ThenInclude(wc => wc.Cow)
                .Include(w => w.WorkdayNotes)
                .FirstOrDefaultAsync(w => w.Id == workday.Id && w.UserId == userId);

            if (existingWorkday is not null)
            {
                return existingWorkday;
            }

            throw;
        }

        return workday;
    }

    // READ - Active Workdays
    public async Task<List<Workday>> GetActiveWorkdays()
    {
        var userId = GetCurrentUserId();
        return await _context.Workdays
            .Where(w => w.UserId == userId && !w.IsRemoved)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();
    }

    // READ - Archived Workdays
    public async Task<List<Workday>> GetArchivedWorkdays()
    {
        var userId = GetCurrentUserId();
        return await _context.Workdays
            .Where(w => w.UserId == userId && w.IsRemoved)
            .OrderByDescending(w => w.RemovedAt.HasValue)
            .ThenByDescending(w => w.RemovedAt)
            .ToListAsync();
    }

    // READ - By Id (with cows + notes)
    public async Task<Workday> GetWorkdayById(Guid id)
    {
        var userId = GetCurrentUserId();
        var workday = await _context.Workdays
            .Include(w => w.WorkdayCows)
                .ThenInclude(wc => wc.Cow)
            .Include(w => w.WorkdayNotes)
            .Include(w => w.Actions)
            .Include(w => w.Entries)
            .FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);

        return workday ?? throw new NotFoundException("Workday not found.");
    }

    public async Task AddCowsToWorkday(Guid id, List<Guid> cowIds)
    {
        if (cowIds == null)
        {
            throw new ValidationException("cowIds is required.");
        }

        var userId = GetCurrentUserId();
        var workdayExists = await _context.Workdays
            .AnyAsync(w => w.Id == id && w.UserId == userId);

        if (!workdayExists)
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

        var existingCowIds = await _context.WorkdayCows
            .Where(wc => wc.WorkdayId == id)
            .Select(wc => wc.CowId)
            .ToHashSetAsync();

        var newCowIds = distinctCowIds
            .Where(cowId => !existingCowIds.Contains(cowId))
            .ToList();

        if (newCowIds.Count == 0)
        {
            return;
        }

        var cows = await _context.Cows
            .Where(c => c.UserId == userId && newCowIds.Contains(c.Id) && !c.IsRemoved)
            .ToListAsync();

        if (cows.Count != newCowIds.Count)
        {
            throw new ValidationException("One or more selected cows could not be added to the workday.");
        }

        var assignments = newCowIds.Select(cowId => new WorkdayCow
        {
            WorkdayId = id,
            CowId = cowId
        }).ToList();

        _context.WorkdayCows.AddRange(assignments);

        var actionIds = await _context.WorkdayActions
            .Where(action => action.WorkdayId == id)
            .Select(action => action.Id)
            .ToListAsync();

        if (actionIds.Count > 0)
        {
            var entries = newCowIds.SelectMany(cowId =>
                actionIds.Select(actionId => new WorkdayEntry
                {
                    WorkdayId = id,
                    CowId = cowId,
                    ActionId = actionId,
                    IsCompleted = false
                }));

            _context.WorkdayEntries.AddRange(entries);
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            if (WasDuplicateWorkdayCowInsert(ex))
            {
                var refreshedWorkday = await _context.Workdays
                    .Include(w => w.WorkdayCows)
                    .FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);

                if (refreshedWorkday is not null &&
                    distinctCowIds.All(cowId => refreshedWorkday.WorkdayCows.Any(wc => wc.CowId == cowId)))
                {
                    return;
                }
            }

            throw;
        }
    }

    public Task AddCowToWorkday(Guid workdayId, Guid cowId)
    {
        return AddCowsToWorkday(workdayId, new List<Guid> { cowId });
    }

    public async Task RemoveCowFromWorkday(Guid id, Guid cowId)
    {
        var userId = GetCurrentUserId();
        var workdayCow = await _context.WorkdayCows
            .Include(wc => wc.Workday)
            .FirstOrDefaultAsync(wc =>
                wc.WorkdayId == id &&
                wc.CowId == cowId &&
                wc.Workday.UserId == userId);

        if (workdayCow == null)
        {
            var workdayExists = await _context.Workdays.AnyAsync(w => w.Id == id && w.UserId == userId);

            if (!workdayExists)
            {
                throw new NotFoundException("Workday not found.");
            }

            return;
        }

        var entries = _context.WorkdayEntries
            .Where(e => e.WorkdayId == id && e.CowId == cowId);

        _context.WorkdayEntries.RemoveRange(entries);
        _context.WorkdayCows.Remove(workdayCow);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateCowWorkdayStatus(Guid id, Guid cowId, bool isWorked)
    {
        var userId = GetCurrentUserId();
        var workdayCow = await _context.WorkdayCows
            .Include(wc => wc.Workday)
            .FirstOrDefaultAsync(wc =>
                wc.WorkdayId == id &&
                wc.CowId == cowId &&
                wc.Workday.UserId == userId);

        if (workdayCow == null)
        {
            throw new NotFoundException("Workday cow assignment not found.");
        }

        workdayCow.Status = isWorked ? "Worked" : null;
        await _context.SaveChangesAsync();
    }

    public async Task<WorkdayAction> AddActionToWorkday(Guid workdayId, string actionName)
    {
        if (string.IsNullOrWhiteSpace(actionName))
        {
            throw new ValidationException("Action name is required.");
        }

        var workday = await FindWorkdayAsync(workdayId);
        var normalizedName = actionName.Trim();

        var exists = await _context.WorkdayActions
            .AnyAsync(a =>
                a.WorkdayId == workdayId &&
                a.Name.ToLower() == normalizedName.ToLower());

        if (exists)
        {
            throw new ValidationException("Action already exists.");
        }

        var action = new WorkdayAction
        {
            WorkdayId = workday.Id,
            Name = normalizedName
        };

        _context.WorkdayActions.Add(action);

        var cowIds = await _context.WorkdayCows
            .Where(wc => wc.WorkdayId == workdayId)
            .Select(wc => wc.CowId)
            .ToListAsync();

        if (cowIds.Count > 0)
        {
            var entries = cowIds.Select(cowId => new WorkdayEntry
            {
                WorkdayId = workdayId,
                CowId = cowId,
                ActionId = action.Id,
                IsCompleted = false
            });

            _context.WorkdayEntries.AddRange(entries);
        }

        await _context.SaveChangesAsync();
        return action;
    }

    public async Task RemoveActionFromWorkday(Guid workdayId, Guid actionId)
    {
        var userId = GetCurrentUserId();
        var action = await _context.WorkdayActions
            .Include(existingAction => existingAction.Workday)
            .FirstOrDefaultAsync(existingAction =>
                existingAction.Id == actionId &&
                existingAction.WorkdayId == workdayId &&
                existingAction.Workday.UserId == userId);

        if (action == null)
        {
            var workdayExists = await _context.Workdays
                .AnyAsync(workday => workday.Id == workdayId && workday.UserId == userId);

            if (!workdayExists)
            {
                throw new NotFoundException("Workday not found.");
            }

            return;
        }

        _context.WorkdayActions.Remove(action);
        await _context.SaveChangesAsync();
    }

    public async Task ToggleEntry(Guid workdayId, Guid cowId, Guid actionId)
    {
        var userId = GetCurrentUserId();
        var entry = await _context.WorkdayEntries
            .Include(e => e.Workday)
            .FirstOrDefaultAsync(e =>
                e.WorkdayId == workdayId &&
                e.CowId == cowId &&
                e.ActionId == actionId &&
                e.Workday.UserId == userId);

        if (entry == null)
        {
            throw new NotFoundException("Workday entry not found.");
        }

        entry.IsCompleted = !entry.IsCompleted;
        await _context.SaveChangesAsync();
    }

    public async Task StartWorkday(Guid workdayId)
    {
        var workday = await FindWorkdayAsync(workdayId);

        await _context.Entry(workday)
            .Collection(w => w.WorkdayCows)
            .LoadAsync();

        await _context.Entry(workday)
            .Collection(w => w.Actions)
            .LoadAsync();

        if (!workday.WorkdayCows.Any() || !workday.Actions.Any())
        {
            throw new ValidationException("Workday must have at least one cow and one action.");
        }

        workday.Status = WorkdayStatus.InProgress;
        await _context.SaveChangesAsync();
    }

    public async Task CompleteWorkday(Guid workdayId)
    {
        var workday = await FindWorkdayAsync(workdayId);
        workday.Status = WorkdayStatus.Completed;
        await _context.SaveChangesAsync();
    }

    // UPDATE - Archive Workday
    public async Task ArchiveWorkday(Guid id)
    {
        var workday = await FindWorkdayAsync(id);

        workday.IsRemoved = true;
        workday.RemovedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    // UPDATE - Restore Workday
    public async Task RestoreWorkday(Guid id)
    {
        var workday = await FindWorkdayAsync(id);

        workday.IsRemoved = false;
        workday.RemovedAt = null;
        await _context.SaveChangesAsync();
    }

    // DELETE (optional hard delete)
    public async Task DeleteWorkday(Guid id)
    {
        var workday = await FindWorkdayAsync(id);

        _context.Workdays.Remove(workday);
        await _context.SaveChangesAsync();
    }

    private async Task<Workday> FindWorkdayAsync(Guid id)
    {
        var userId = GetCurrentUserId();
        var workday = await _context.Workdays.FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
        return workday ?? throw new NotFoundException("Workday not found.");
    }

    public async Task<Workday> UpdateWorkday(Guid id, UpdateWorkdayDto dto)
    {
        var workday = await FindWorkdayAsync(id);

        workday.Title = dto.Title.Trim();
        workday.Summary = dto.Summary;
        workday.Date = NormalizeWorkdayDate(dto.Date);

        await _context.SaveChangesAsync();

        return workday;
    }

    private static DateOnly NormalizeWorkdayDate(DateOnly? value)
    {
        return value ?? DateOnly.FromDateTime(DateTime.UtcNow);
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
            && postgresException.ConstraintName == "PK_Workdays";
    }

    private static bool WasDuplicateWorkdayCowInsert(DbUpdateException exception)
    {
        return exception.InnerException is PostgresException postgresException
            && postgresException.SqlState == PostgresErrorCodes.UniqueViolation
            && postgresException.ConstraintName == "IX_WorkdayCows_WorkdayId_CowId";
    }
}
