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
using System.Data;
using NpgsqlTypes;

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
        await EnsureWorkdayEntryGridAsync(id, userId);
        _logger.LogInformation("WorkdayService.GetWorkdayById loading workday {WorkdayId}", id);
        var workday = await _context.Workdays
            .Include(w => w.WorkdayCows)
                .ThenInclude(wc => wc.Cow)
            .Include(w => w.WorkdayNotes)
            .Include(w => w.Actions.OrderBy(action => action.CreatedAt))
            .Include(w => w.Entries)
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
        var distinctCowIds = cowIds
            .Distinct()
            .ToList();

        if (distinctCowIds.Count == 0)
        {
            return;
        }

        if (!_context.Database.IsNpgsql())
        {
            await AddCowsToWorkdayFallback(id, userId, distinctCowIds, stopwatch);
            return;
        }

        var assignmentIds = distinctCowIds.Select(_ => Guid.NewGuid()).ToArray();
        var result = await ExecuteAddCowsMutationAsync(id, userId, distinctCowIds.ToArray(), assignmentIds);

        if (!result.WorkdayFound)
        {
            throw new NotFoundException("Workday not found.");
        }

        if (result.ValidCowCount != distinctCowIds.Count)
        {
            throw new ValidationException("One or more cows could not be added to the workday.");
        }

        _logger.LogInformation(
            "WorkdayService.AddCowsToWorkday completed for workday {WorkdayId} in {ElapsedMilliseconds}ms with {InsertedAssignments} assignments",
            id,
            stopwatch.ElapsedMilliseconds,
            result.InsertedAssignmentCount);

        await EnsureWorkdayEntryGridAsync(id, userId);
    }

    public async Task RemoveCowFromWorkday(Guid id, Guid cowId)
    {
        var stopwatch = Stopwatch.StartNew();
        var userId = GetCurrentUserId();
        _logger.LogInformation(
            "WorkdayService.RemoveCowFromWorkday starting for workday {WorkdayId} and cow {CowId}",
            id,
            cowId);
        var deletedEntries = await _context.WorkdayEntries
            .Where(e =>
                e.WorkdayId == id &&
                e.CowId == cowId &&
                _context.Workdays.Any(w => w.Id == e.WorkdayId && w.UserId == userId))
            .ExecuteDeleteAsync();

        var deletedAssignments = await _context.WorkdayCows
            .Where(wc =>
                wc.WorkdayId == id &&
                wc.CowId == cowId &&
                _context.Workdays.Any(w => w.Id == wc.WorkdayId && w.UserId == userId))
            .ExecuteDeleteAsync();

        if (deletedAssignments == 0)
        {
            var workdayExists = await _context.Workdays.AnyAsync(w => w.Id == id && w.UserId == userId);

            if (!workdayExists)
            {
                throw new NotFoundException("Workday not found.");
            }

            return;
        }

        _logger.LogInformation(
            "WorkdayService.RemoveCowFromWorkday removed {EntryCount} entries and {AssignmentCount} assignments for workday {WorkdayId} and cow {CowId} in {ElapsedMilliseconds}ms",
            deletedEntries,
            deletedAssignments,
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
        var normalizedName = actionName.Trim();
        var userId = GetCurrentUserId();

        if (!_context.Database.IsNpgsql())
        {
            return await AddActionToWorkdayFallback(workdayId, userId, normalizedName, stopwatch);
        }

        var action = new WorkdayAction
        {
            Id = Guid.NewGuid(),
            WorkdayId = workdayId,
            Name = normalizedName,
            CreatedAt = DateTime.UtcNow
        };

        var result = await ExecuteAddActionMutationAsync(action, userId);

        if (!result.WorkdayFound)
        {
            throw new NotFoundException("Workday not found.");
        }

        if (!result.ActionInserted)
        {
            throw new ValidationException("Action already exists.");
        }

        _logger.LogInformation(
            "WorkdayService.AddActionToWorkday completed for workday {WorkdayId} in {ElapsedMilliseconds}ms",
            workdayId,
            stopwatch.ElapsedMilliseconds);

        await EnsureWorkdayEntryGridAsync(workdayId, userId);

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
        var deletedActions = await _context.WorkdayActions
            .Where(existingAction =>
                existingAction.Id == actionId &&
                existingAction.WorkdayId == workdayId &&
                _context.Workdays.Any(workday =>
                    workday.Id == existingAction.WorkdayId &&
                    workday.UserId == userId))
            .ExecuteDeleteAsync();

        if (deletedActions == 0)
        {
            var workdayExists = await _context.Workdays
                .AnyAsync(workday => workday.Id == workdayId && workday.UserId == userId);

            if (!workdayExists)
            {
                throw new NotFoundException("Workday not found.");
            }

            return;
        }

        _logger.LogInformation(
            "WorkdayService.RemoveActionFromWorkday removed {ActionCount} actions for workday {WorkdayId} and action {ActionId} in {ElapsedMilliseconds}ms",
            deletedActions,
            workdayId,
            actionId,
            stopwatch.ElapsedMilliseconds);
    }

    public async Task SetEntryCompletion(Guid workdayId, Guid cowId, Guid actionId, bool completed)
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

        entry.IsCompleted = completed;
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

    public async Task ResetWorkdayAsync(Guid workdayId)
    {
        var workday = await FindWorkdayAsync(workdayId);
        await EnsureWorkdayEntryGridAsync(workdayId, workday.UserId);

        var entries = await _context.WorkdayEntries
            .Where(e => e.WorkdayId == workdayId)
            .ToListAsync();

        foreach (var entry in entries)
        {
            entry.IsCompleted = false;
        }

        var cows = await _context.WorkdayCows
            .Where(c => c.WorkdayId == workdayId)
            .ToListAsync();

        foreach (var cow in cows)
        {
            cow.Status = null;
        }

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

    private async Task EnsureWorkdayEntryGridAsync(Guid workdayId, string userId)
    {
        var workdaySnapshot = await _context.Workdays
            .AsNoTracking()
            .Where(w => w.Id == workdayId && w.UserId == userId)
            .Select(w => new
            {
                CowIds = w.WorkdayCows.Select(wc => wc.CowId).ToList(),
                ActionIds = w.Actions.Select(action => action.Id).ToList()
            })
            .FirstOrDefaultAsync();

        if (workdaySnapshot == null)
        {
            throw new NotFoundException("Workday not found.");
        }

        if (workdaySnapshot.CowIds.Count == 0 || workdaySnapshot.ActionIds.Count == 0)
        {
            return;
        }

        var existingPairs = (await _context.WorkdayEntries
            .AsNoTracking()
            .Where(entry => entry.WorkdayId == workdayId)
            .Select(entry => new { entry.CowId, entry.ActionId })
            .ToListAsync())
            .Select(entry => (entry.CowId, entry.ActionId))
            .ToHashSet();

        var missingEntries = workdaySnapshot.CowIds
            .SelectMany(cowId => workdaySnapshot.ActionIds.Select(actionId => (cowId, actionId)))
            .Where(pair => !existingPairs.Contains(pair))
            .Select(pair => new WorkdayEntry
            {
                WorkdayId = workdayId,
                CowId = pair.cowId,
                ActionId = pair.actionId,
                IsCompleted = false
            })
            .ToList();

        if (missingEntries.Count == 0)
        {
            return;
        }

        _context.WorkdayEntries.AddRange(missingEntries);
        await _context.SaveChangesAsync();
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

    private async Task AddCowsToWorkdayFallback(
        Guid id,
        string userId,
        List<Guid> distinctCowIds,
        Stopwatch stopwatch)
    {
        var workdaySnapshot = await _context.Workdays
            .AsNoTracking()
            .Where(w => w.Id == id && w.UserId == userId)
            .Select(w => new
            {
                ExistingCowIds = w.WorkdayCows.Select(wc => wc.CowId).ToList(),
                ActionIds = w.Actions.Select(action => action.Id).ToList()
            })
            .FirstOrDefaultAsync();

        if (workdaySnapshot == null)
        {
            throw new NotFoundException("Workday not found.");
        }

        var existingCowIds = workdaySnapshot.ExistingCowIds.ToHashSet();
        var newCowIds = distinctCowIds
            .Where(cowId => !existingCowIds.Contains(cowId))
            .ToList();

        if (newCowIds.Count == 0)
        {
            return;
        }

        var validCowIds = await _context.Cows
            .AsNoTracking()
            .Where(c => c.UserId == userId && newCowIds.Contains(c.Id) && !c.IsRemoved)
            .Select(c => c.Id)
            .ToListAsync();

        if (validCowIds.Count != newCowIds.Count)
        {
            throw new ValidationException("One or more cows could not be added to the workday.");
        }

        var assignments = newCowIds.Select(cowId => new WorkdayCow
        {
            WorkdayId = id,
            CowId = cowId
        }).ToList();

        _context.WorkdayCows.AddRange(assignments);

        if (workdaySnapshot.ActionIds.Count > 0)
        {
            var entries = newCowIds.SelectMany(cowId =>
                workdaySnapshot.ActionIds.Select(actionId => new WorkdayEntry
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
                var persistedCowIds = await _context.WorkdayCows
                    .AsNoTracking()
                    .Where(wc => wc.WorkdayId == id && distinctCowIds.Contains(wc.CowId))
                    .Select(wc => wc.CowId)
                    .ToListAsync();

                if (distinctCowIds.All(cowId => persistedCowIds.Contains(cowId)))
                {
                    return;
                }
            }

            throw;
        }
    }

    private async Task<WorkdayAction> AddActionToWorkdayFallback(
        Guid workdayId,
        string userId,
        string normalizedName,
        Stopwatch stopwatch)
    {
        var workdaySnapshot = await _context.Workdays
            .AsNoTracking()
            .Where(w => w.Id == workdayId && w.UserId == userId)
            .Select(w => new
            {
                WorkdayId = w.Id,
                ExistingActionNames = w.Actions.Select(action => action.Name).ToList(),
                CowIds = w.WorkdayCows.Select(wc => wc.CowId).ToList()
            })
            .FirstOrDefaultAsync();

        if (workdaySnapshot == null)
        {
            throw new NotFoundException("Workday not found.");
        }

        if (workdaySnapshot.ExistingActionNames.Any(name =>
                string.Equals(name, normalizedName, StringComparison.OrdinalIgnoreCase)))
        {
            throw new ValidationException("Action already exists.");
        }

        var action = new WorkdayAction
        {
            WorkdayId = workdaySnapshot.WorkdayId,
            Name = normalizedName
        };

        _context.WorkdayActions.Add(action);

        if (workdaySnapshot.CowIds.Count > 0)
        {
            var entries = workdaySnapshot.CowIds.Select(cowId => new WorkdayEntry
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

    private async Task<AddCowsMutationResult> ExecuteAddCowsMutationAsync(
        Guid workdayId,
        string userId,
        Guid[] cowIds,
        Guid[] assignmentIds)
    {
        const string sql = """
            WITH input_rows AS (
                SELECT *
                FROM unnest(@assignment_ids, @cow_ids) AS input_row(assignment_id, cow_id)
            ),
            distinct_rows AS (
                SELECT DISTINCT ON (cow_id) assignment_id, cow_id
                FROM input_rows
                ORDER BY cow_id, assignment_id
            ),
            target_workday AS (
                SELECT "Id"
                FROM "Workdays"
                WHERE "Id" = @workday_id AND "UserId" = @user_id
            ),
            valid_rows AS (
                SELECT dr.assignment_id, dr.cow_id
                FROM distinct_rows dr
                JOIN "Cows" c
                    ON c."Id" = dr.cow_id
                   AND c."UserId" = @user_id
                   AND NOT c."IsRemoved"
                JOIN target_workday tw
                    ON TRUE
            ),
            inserted_assignments AS (
                INSERT INTO "WorkdayCows" ("Id", "WorkdayId", "CowId", "Status")
                SELECT vr.assignment_id, @workday_id, vr.cow_id, NULL
                FROM valid_rows vr
                ON CONFLICT ("WorkdayId", "CowId") DO NOTHING
                RETURNING "WorkdayId", "CowId"
            ),
            inserted_entries AS (
                INSERT INTO "WorkdayEntries" ("WorkdayId", "CowId", "ActionId", "IsCompleted")
                SELECT ia."WorkdayId", ia."CowId", wa."Id", FALSE
                FROM inserted_assignments ia
                JOIN "WorkdayActions" wa
                    ON wa."WorkdayId" = ia."WorkdayId"
                ON CONFLICT DO NOTHING
                RETURNING 1
            )
            SELECT
                EXISTS(SELECT 1 FROM target_workday) AS workday_found,
                (SELECT COUNT(*) FROM valid_rows) AS valid_cow_count,
                (SELECT COUNT(*) FROM inserted_assignments) AS inserted_assignment_count;
            """;

        var connection = (NpgsqlConnection)_context.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;

        if (shouldClose)
        {
            await connection.OpenAsync();
        }

        try
        {
            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("assignment_ids", NpgsqlDbType.Array | NpgsqlDbType.Uuid, assignmentIds);
            command.Parameters.AddWithValue("cow_ids", NpgsqlDbType.Array | NpgsqlDbType.Uuid, cowIds);
            command.Parameters.AddWithValue("workday_id", workdayId);
            command.Parameters.AddWithValue("user_id", userId);

            await using var reader = await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                throw new InvalidOperationException("Add cows mutation returned no result.");
            }

            return new AddCowsMutationResult(
                reader.GetBoolean(0),
                reader.GetInt32(1),
                reader.GetInt32(2));
        }
        finally
        {
            if (shouldClose)
            {
                await connection.CloseAsync();
            }
        }
    }

    private async Task<AddActionMutationResult> ExecuteAddActionMutationAsync(
        WorkdayAction action,
        string userId)
    {
        const string sql = """
            WITH target_workday AS (
                SELECT "Id"
                FROM "Workdays"
                WHERE "Id" = @workday_id AND "UserId" = @user_id
            ),
            inserted_action AS (
                INSERT INTO "WorkdayActions" ("Id", "WorkdayId", "Name", "CreatedAt")
                SELECT @action_id, @workday_id, @action_name, @created_at
                FROM target_workday
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM "WorkdayActions" existing_action
                    WHERE existing_action."WorkdayId" = @workday_id
                      AND lower(existing_action."Name") = lower(@action_name)
                )
                RETURNING 1
            ),
            inserted_entries AS (
                INSERT INTO "WorkdayEntries" ("WorkdayId", "CowId", "ActionId", "IsCompleted")
                SELECT @workday_id, wc."CowId", @action_id, FALSE
                FROM inserted_action
                JOIN "WorkdayCows" wc
                    ON wc."WorkdayId" = @workday_id
                ON CONFLICT DO NOTHING
                RETURNING 1
            )
            SELECT
                EXISTS(SELECT 1 FROM target_workday) AS workday_found,
                EXISTS(SELECT 1 FROM inserted_action) AS action_inserted;
            """;

        var connection = (NpgsqlConnection)_context.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;

        if (shouldClose)
        {
            await connection.OpenAsync();
        }

        try
        {
            await using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("workday_id", action.WorkdayId);
            command.Parameters.AddWithValue("user_id", userId);
            command.Parameters.AddWithValue("action_id", action.Id);
            command.Parameters.AddWithValue("action_name", action.Name);
            command.Parameters.AddWithValue("created_at", action.CreatedAt);

            await using var reader = await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                throw new InvalidOperationException("Add action mutation returned no result.");
            }

            return new AddActionMutationResult(
                reader.GetBoolean(0),
                reader.GetBoolean(1));
        }
        finally
        {
            if (shouldClose)
            {
                await connection.CloseAsync();
            }
        }
    }

    private sealed record AddCowsMutationResult(
        bool WorkdayFound,
        int ValidCowCount,
        int InsertedAssignmentCount);

    private sealed record AddActionMutationResult(
        bool WorkdayFound,
        bool ActionInserted);
}
