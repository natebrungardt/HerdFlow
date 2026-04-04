using Microsoft.AspNetCore.Mvc;
using HerdFlow.Api.DTOs;
using HerdFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using System.Text;

namespace HerdFlow.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/cows")]
public class CowController : ControllerBase
{
    private readonly CowService _cowService;
    private readonly ActivityLogService _activityLogService;

    public CowController(CowService cowService, ActivityLogService activityLogService)
    {
        _cowService = cowService;
        _activityLogService = activityLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCows()
    {
        var cows = await _cowService.GetCowsAsync();

        return Ok(cows);
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportCows()
    {
        var csv = await _cowService.ExportCowsCsvAsync();
        var fileName = $"herd-export-{DateOnly.FromDateTime(DateTime.UtcNow):yyyy-MM-dd}.csv";
        return File(Encoding.UTF8.GetBytes(csv), "text/csv; charset=utf-8", fileName);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCow(Guid id)
    {
        var cow = await _cowService.GetCowByIdAsync(id);
        return Ok(cow);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCow(Guid id, [FromBody] CreateCowDto dto)
    {
        var updatedCow = await _cowService.UpdateCowAsync(id, dto);
        return Ok(updatedCow);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCow([FromBody] CreateCowDto dto)
    {
        var cow = await _cowService.CreateCowAsync(dto);
        return Ok(cow);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCow(Guid id)
    {
        await _cowService.ArchiveCowAsync(id);
        return NoContent();
    }

    [HttpPut("{id:guid}/archive")]
    public async Task<IActionResult> ArchiveCow(Guid id)
    {
        await _cowService.ArchiveCowAsync(id);
        return NoContent();
    }

    [HttpGet("removed")]
    public async Task<IActionResult> GetRemovedCows()
    {
        var cows = await _cowService.GetRemovedCowsAsync();
        return Ok(cows);
    }

    [HttpPut("{id:guid}/restore")]
    public async Task<IActionResult> RestoreCow(Guid id)
    {
        await _cowService.RestoreCowAsync(id);
        return Ok();
    }

    [HttpGet("{id:guid}/activities")]
    public async Task<IActionResult> GetActivities(Guid id)
    {
        var activities = await _activityLogService.GetByCowIdAsync(id);
        return Ok(activities);
    }
}
