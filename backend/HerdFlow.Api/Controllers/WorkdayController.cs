using Microsoft.AspNetCore.Mvc;
using HerdFlow.Api.Services;
using HerdFlow.Api.DTOs;
using HerdFlow.Api.Models;
using HerdFlow.Api.Exceptions;
using Microsoft.AspNetCore.Authorization;

namespace HerdFlow.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/workdays")]
public class WorkdayController : ControllerBase
{
    private readonly WorkdayService _service;

    public WorkdayController(WorkdayService service)
    {
        _service = service;
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

    // GET: api/workdays/archived
    [HttpGet("archived")]
    public async Task<ActionResult<List<Workday>>> GetArchivedWorkdays()
    {
        var workdays = await _service.GetArchivedWorkdays();
        return Ok(workdays);
    }

    // GET: api/workdays/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Workday>> GetWorkdayById(Guid id)
    {
        var workday = await _service.GetWorkdayById(id);
        return Ok(workday);
    }

    // POST: api/workdays/{id}/cows
    [HttpPost("{id:guid}/cows")]
    public async Task<ActionResult> AddCowsToWorkday(Guid id, [FromBody] UpdateWorkdayCowsDto dto)
    {
        if (dto == null || dto.CowIds == null)
        {
            throw new ValidationException("cowIds is required.");
        }

        await _service.AddCowsToWorkday(id, dto.CowIds);
        return NoContent();
    }

    // DELETE: api/workdays/{id}/cows/{cowId}
    [HttpDelete("{id:guid}/cows/{cowId:guid}")]
    public async Task<ActionResult> RemoveCowFromWorkday(Guid id, Guid cowId)
    {
        await _service.RemoveCowFromWorkday(id, cowId);
        return NoContent();
    }

    // PUT: api/workdays/{id}/archive
    [HttpPut("{id:guid}/archive")]
    public async Task<ActionResult> ArchiveWorkday(Guid id)
    {
        await _service.ArchiveWorkday(id);
        return NoContent();
    }

    // PUT: api/workdays/{id}/restore
    [HttpPut("{id:guid}/restore")]
    public async Task<ActionResult> RestoreWorkday(Guid id)
    {
        await _service.RestoreWorkday(id);
        return Ok();
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
