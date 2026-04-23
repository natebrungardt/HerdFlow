using Microsoft.AspNetCore.Mvc;
using HerdFlow.Api.Services;
using HerdFlow.Api.DTOs;
using HerdFlow.Api.Models;
using HerdFlow.Api.Exceptions;
using Microsoft.AspNetCore.Authorization;
using System.Diagnostics;

namespace HerdFlow.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/workdays")]
public class WorkdayController : ControllerBase
{
    private readonly WorkdayService _service;
    private readonly ILogger<WorkdayController> _logger;

    public WorkdayController(WorkdayService service, ILogger<WorkdayController> logger)
    {
        _service = service;
        _logger = logger;
    }

    // POST: api/workdays
    [HttpPost]
    public async Task<ActionResult<Workday>> CreateWorkday([FromBody] CreateWorkdayDto dto)
    {
        var workday = await _service.CreateWorkday(dto);
        return CreatedAtAction(nameof(GetWorkdayById), new { id = workday.Id }, workday);
    }

    // GET: api/workdays
    [HttpGet]
    public async Task<ActionResult<List<Workday>>> GetActiveWorkdays()
    {
        var workdays = await _service.GetActiveWorkdays();
        return Ok(workdays);
    }

    // GET: api/workdays/completed
    [HttpGet("completed")]
    public async Task<ActionResult<List<Workday>>> GetCompletedWorkdays()
    {
        var workdays = await _service.GetCompletedWorkdays();
        return Ok(workdays);
    }

    // GET: api/workdays/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Workday>> GetWorkdayById(Guid id)
    {
        var stopwatch = Stopwatch.StartNew();
        _logger.LogInformation("WorkdayController.GetWorkdayById started for workday {WorkdayId}", id);
        _logger.LogInformation("WorkdayController.GetWorkdayById calling service for workday {WorkdayId}", id);
        var workday = await _service.GetWorkdayById(id);
        _logger.LogInformation(
            "WorkdayController.GetWorkdayById service returned for workday {WorkdayId} in {ElapsedMilliseconds}ms",
            id,
            stopwatch.ElapsedMilliseconds);
        _logger.LogInformation("WorkdayController.GetWorkdayById returning response for workday {WorkdayId}", id);
        return Ok(workday);
    }

    // POST: api/workdays/{id}/cows
    [HttpPost("{id:guid}/cows")]
    public async Task<ActionResult> AddCowsToWorkday(Guid id, [FromBody] UpdateWorkdayCowsDto dto)
    {
        var stopwatch = Stopwatch.StartNew();
        _logger.LogInformation("WorkdayController.AddCowsToWorkday started for workday {WorkdayId}", id);
        if (dto == null || dto.CowIds == null)
        {
            throw new ValidationException("cowIds is required.");
        }

        _logger.LogInformation("WorkdayController.AddCowsToWorkday calling service for workday {WorkdayId}", id);
        await _service.AddCowsToWorkday(id, dto.CowIds);
        _logger.LogInformation(
            "WorkdayController.AddCowsToWorkday service returned for workday {WorkdayId} in {ElapsedMilliseconds}ms",
            id,
            stopwatch.ElapsedMilliseconds);
        _logger.LogInformation("WorkdayController.AddCowsToWorkday returning response for workday {WorkdayId}", id);
        return NoContent();
    }

    // POST: api/workdays/{id}/actions
    [HttpPost("{id:guid}/actions")]
    public async Task<ActionResult<WorkdayAction>> AddActionToWorkday(
        Guid id,
        [FromBody] CreateWorkdayActionDto dto)
    {
        var stopwatch = Stopwatch.StartNew();
        _logger.LogInformation("WorkdayController.AddActionToWorkday started for workday {WorkdayId}", id);
        if (dto == null || string.IsNullOrWhiteSpace(dto.Name))
        {
            throw new ValidationException("Action name is required.");
        }

        _logger.LogInformation("WorkdayController.AddActionToWorkday calling service for workday {WorkdayId}", id);
        var action = await _service.AddActionToWorkday(id, dto.Name);
        _logger.LogInformation(
            "WorkdayController.AddActionToWorkday service returned for workday {WorkdayId} in {ElapsedMilliseconds}ms",
            id,
            stopwatch.ElapsedMilliseconds);
        _logger.LogInformation("WorkdayController.AddActionToWorkday returning response for workday {WorkdayId}", id);
        return Ok(action);
    }

    // DELETE: api/workdays/{id}/actions/{actionId}
    [HttpDelete("{id:guid}/actions/{actionId:guid}")]
    public async Task<ActionResult> RemoveActionFromWorkday(Guid id, Guid actionId)
    {
        var stopwatch = Stopwatch.StartNew();
        _logger.LogInformation(
            "WorkdayController.RemoveActionFromWorkday started for workday {WorkdayId} and action {ActionId}",
            id,
            actionId);
        _logger.LogInformation(
            "WorkdayController.RemoveActionFromWorkday calling service for workday {WorkdayId} and action {ActionId}",
            id,
            actionId);
        await _service.RemoveActionFromWorkday(id, actionId);
        _logger.LogInformation(
            "WorkdayController.RemoveActionFromWorkday service returned for workday {WorkdayId} and action {ActionId} in {ElapsedMilliseconds}ms",
            id,
            actionId,
            stopwatch.ElapsedMilliseconds);
        _logger.LogInformation(
            "WorkdayController.RemoveActionFromWorkday returning response for workday {WorkdayId} and action {ActionId}",
            id,
            actionId);
        return NoContent();
    }

    // DELETE: api/workdays/{id}/cows/{cowId}
    [HttpDelete("{id:guid}/cows/{cowId:guid}")]
    public async Task<ActionResult> RemoveCowFromWorkday(Guid id, Guid cowId)
    {
        var stopwatch = Stopwatch.StartNew();
        _logger.LogInformation(
            "WorkdayController.RemoveCowFromWorkday started for workday {WorkdayId} and cow {CowId}",
            id,
            cowId);
        _logger.LogInformation(
            "WorkdayController.RemoveCowFromWorkday calling service for workday {WorkdayId} and cow {CowId}",
            id,
            cowId);
        await _service.RemoveCowFromWorkday(id, cowId);
        _logger.LogInformation(
            "WorkdayController.RemoveCowFromWorkday service returned for workday {WorkdayId} and cow {CowId} in {ElapsedMilliseconds}ms",
            id,
            cowId,
            stopwatch.ElapsedMilliseconds);
        _logger.LogInformation(
            "WorkdayController.RemoveCowFromWorkday returning response for workday {WorkdayId} and cow {CowId}",
            id,
            cowId);
        return NoContent();
    }

    // PUT: api/workdays/{id}/cows/{cowId}/status
    [HttpPut("{id:guid}/cows/{cowId:guid}/status")]
    public async Task<ActionResult> UpdateCowWorkdayStatus(
        Guid id,
        Guid cowId,
        [FromBody] UpdateWorkdayCowStatusDto dto)
    {
        if (dto == null)
        {
            throw new ValidationException("Workday cow status is required.");
        }

        await _service.UpdateCowWorkdayStatus(id, cowId, dto.IsWorked);
        return NoContent();
    }

    // POST: api/workdays/{id}/start
    [HttpPost("{id:guid}/start")]
    public async Task<ActionResult> StartWorkday(Guid id)
    {
        await _service.StartWorkday(id);
        return NoContent();
    }

    // POST: api/workdays/{id}/toggle
    [HttpPost("{id:guid}/toggle")]
    public async Task<ActionResult> ToggleEntry(
        Guid id,
        [FromBody] ToggleWorkdayEntryDto dto)
    {
        if (dto == null)
        {
            throw new ValidationException("Workday entry payload is required.");
        }

        _logger.LogInformation(
            "WorkdayController.ToggleEntry received toggle for workday {WorkdayId}, cow {CowId}, action {ActionId}, completed {Completed}",
            id,
            dto.CowId,
            dto.ActionId,
            dto.Completed);

        await _service.SetEntryCompletion(id, dto.CowId, dto.ActionId, dto.Completed);
        return NoContent();
    }

    // POST: api/workdays/{id}/complete
    [HttpPost("{id:guid}/complete")]
    public async Task<ActionResult> CompleteWorkday(Guid id)
    {
        await _service.CompleteWorkday(id);
        return NoContent();
    }

    // POST: api/workdays/{id}/reset
    [HttpPost("{id:guid}/reset")]
    public async Task<IActionResult> ResetWorkday(Guid id)
    {
        await _service.ResetWorkdayAsync(id);
        return NoContent();
    }

    // DELETE: api/workdays/{id}
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteWorkday(Guid id)
    {
        await _service.DeleteWorkday(id);
        return NoContent();
    }

    // PUT: api/workdays/{id}
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Workday>> UpdateWorkday(Guid id, UpdateWorkdayDto dto)
    {
        var updated = await _service.UpdateWorkday(id, dto);
        return Ok(updated);
    }
}
