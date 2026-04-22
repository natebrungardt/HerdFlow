using HerdFlow.Api.Data;
using HerdFlow.Api.Exceptions;
using HerdFlow.Api.Models;
using Microsoft.EntityFrameworkCore;
using HerdFlow.Api.DTOs;
using Microsoft.AspNetCore.Http;
using Npgsql;
using System.Security.Claims;
using HerdFlow.Api.Models.Enums;
using System.Diagnostics;

namespace HerdFlow.Api.Services;

public class WorkdayService
{
    private readonly AppDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<WorkdayService> _logger;

    public WorkdayService(
        AppDbContext context,
        IHttpContextAccessor httpContextAccessor,
        ILogger<WorkdayService> logger)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    // CREATE
    public async Task<Workday> CreateWorkday(CreateWorkdayDto dto)
    {
        var userId = GetCurrentUserId();
        var workday = new Workday
        {
            UserId = userId,
            Title = dto.Title.Trim(),
            Date = NormalizeWorkdayDate(dto.Date),
            Summary = dto.Summary
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
            .Where(w => w.UserId == userId && w.Status != WorkdayStatus.Completed)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();
    }

    // READ - Completed Workdays
    public async Task<List<Workday>> GetCompletedWorkdays()
    {
        var userId = GetCurrentUserId();
        return await _context.Workdays
            .Where(w => w.UserId == userId && w.Status == WorkdayStatus.Completed)
            .OrderByDescending(w => w.CompletedAt ?? w.CreatedAt)
            .ToListAsync();
    }

    // READ - By Id (with cows + notes)
    public async Task<Workday> GetWorkdayById(Guid id)
    {
        var stopwatch = Stopwatch.StartNew();
        var userId = GetCurrentUserId();
        _logger.LogInformation("WorkdayService.GetWorkdayById loading workday {WorkdayId}", id);
        var workday = await _context.Workdays
            .Include(w => w.WorkdayCows)
                .ThenInclude(wc => wc.Cow)
            .Include(w => w.WorkdayNotes)
            .Include(w => w.Actions)
            .FirstOrDefaultAsync(w => w.Id == id && w.UserId == userId);
        _logger.LogInformation(
            "WorkdayService.GetWorkdayById loaded workday {WorkdayId} in {ElapsedMilliseconds}ms",
            id,
            stopwatch.ElapsedMilliseconds);

        return workday ?? throw new NotFoundException("Workday not found.");
    }

    public async Task AddCowsToWorkday(Guid id, List<Guid> cowIds)
    {
        var stopwatch = Stopwatch.StartNew();
        if (cowIds == null)
        {
            throw new ValidationException("cowIds is required.");
        }

        var userId = GetCurrentUserId();
        _logger.LogInformation(
            "WorkdayService.AddCowsToWorkday starting for workday {WorkdayId} with {CowCount} cows",
            id,
            cowIds.Count);
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

        _logger.LogInformation("WorkdayService.AddCowsToWorkday loading existing cows for workday {WorkdayId}", id);
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
            throw new ValidationException("One or more cows could not be added to the workday.");
        }

        var assignments = newCowIds.Select(cowId => new WorkdayCow
        {
            WorkdayId = id,
            CowId = cowId
        }).ToList();

        _context.WorkdayCows.AddRange(assignments);

        _logger.LogInformation("WorkdayService.AddCowsToWorkday loading actions for workday {WorkdayId}", id);
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
            _logger.LogInformation("WorkdayService.AddCowsToWorkday before SaveChangesAsync for workday {WorkdayId}", id);
            await _context.SaveChangesAsync();
            _logger.LogInformation(
                "WorkdayService.AddCowsToWorkday after SaveChangesAsync for workday {WorkdayId} in {ElapsedMilliseconds}ms",
                id,
                stopwatch.ElapsedMilliseconds);
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

    public async Task RemoveCowFromWorkday(Guid id, Guid cowId)
    {
        var stopwatch = Stopwatch.StartNew();
        var userId = GetCurrentUserId();
        _logger.LogInformation(
            "WorkdayService.RemoveCowFromWorkday starting for workday {WorkdayId} and cow {CowId}",
            id,
            cowId);
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
        _logger.LogInformation(
            "WorkdayService.RemoveCowFromWorkday before SaveChangesAsync for workday {WorkdayId} and cow {CowId}",
            id,
            cowId);
        await _context.SaveChangesAsync();
        _logger.LogInformation(
            "WorkdayService.RemoveCowFromWorkday after SaveChangesAsync for workday {WorkdayId} and cow {CowId} in {ElapsedMilliseconds}ms",
            id,
            cowId,
            stopwatch.ElapsedMilliseconds);
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
        var stopwatch = Stopwatch.StartNew();
        if (string.IsNullOrWhiteSpace(actionName))
        {
            throw new ValidationException("Action name is required.");
        }

        _logger.LogInformation(
            "WorkdayService.AddActionToWorkday starting for workday {WorkdayId} with action {ActionName}",
            workdayId,
            actionName);
        var workday = await FindWorkdayAsync(workdayId);
        var normalizedName = actionName.Trim();

        _logger.LogInformation("WorkdayService.AddActionToWorkday checking duplicates for workday {WorkdayId}", workdayId);
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

        _logger.LogInformation("WorkdayService.AddActionToWorkday loading cows for workday {WorkdayId}", workdayId);
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

        _logger.LogInformation("WorkdayService.AddActionToWorkday before SaveChangesAsync for workday {WorkdayId}", workdayId);
        await _context.SaveChangesAsync();
        _logger.LogInformation(
            "WorkdayService.AddActionToWorkday after SaveChangesAsync for workday {WorkdayId} in {ElapsedMilliseconds}ms",
            workdayId,
            stopwatch.ElapsedMilliseconds);
        return action;
    }

    public async Task RemoveActionFromWorkday(Guid workdayId, Guid actionId)
    {
        var stopwatch = Stopwatch.StartNew();
        var userId = GetCurrentUserId();
        _logger.LogInformation(
            "WorkdayService.RemoveActionFromWorkday starting for workday {WorkdayId} and action {ActionId}",
            workdayId,
            actionId);
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
        _logger.LogInformation(
            "WorkdayService.RemoveActionFromWorkday before SaveChangesAsync for workday {WorkdayId} and action {ActionId}",
            workdayId,
            actionId);
        await _context.SaveChangesAsync();
        _logger.LogInformation(
            "WorkdayService.RemoveActionFromWorkday after SaveChangesAsync for workday {WorkdayId} and action {ActionId} in {ElapsedMilliseconds}ms",
            workdayId,
            actionId,
            stopwatch.ElapsedMilliseconds);
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
        workday.CompletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

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
