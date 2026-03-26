using Microsoft.AspNetCore.Mvc;
using HerdFlow.Api.Services;
using HerdFlow.Api.DTOs;
using HerdFlow.Api.Models;

namespace HerdFlow.Api.Controllers;

[ApiController]
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
    [HttpGet("{id}")]
    public async Task<ActionResult<Workday>> GetWorkdayById(int id)
    {
        var workday = await _service.GetWorkdayById(id);
        return Ok(workday);
    }

    // POST: api/workdays/{id}/cows
    [HttpPost("{id}/cows")]
    public async Task<ActionResult> AddCowsToWorkday(int id, [FromBody] UpdateWorkdayCowsDto dto)
    {
        await _service.AddCowsToWorkday(id, dto.CowIds);
        return NoContent();
    }

    // DELETE: api/workdays/{id}/cows/{cowId}
    [HttpDelete("{id}/cows/{cowId}")]
    public async Task<ActionResult> RemoveCowFromWorkday(int id, int cowId)
    {
        await _service.RemoveCowFromWorkday(id, cowId);
        return NoContent();
    }

    // PUT: api/workdays/{id}/archive
    [HttpPut("{id}/archive")]
    public async Task<ActionResult> ArchiveWorkday(int id)
    {
        await _service.ArchiveWorkday(id);
        return NoContent();
    }

    // PUT: api/workdays/{id}/restore
    [HttpPut("{id}/restore")]
    public async Task<ActionResult> RestoreWorkday(int id)
    {
        await _service.RestoreWorkday(id);
        return Ok();
    }

    // DELETE: api/workdays/{id}
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteWorkday(int id)
    {
        await _service.DeleteWorkday(id);
        return NoContent();
    }

    // PUT: api/workdays/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<Workday>> UpdateWorkday(int id, UpdateWorkdayDto dto)
    {
        var updated = await _service.UpdateWorkday(id, dto);
        return Ok(updated);
    }
}
