using Microsoft.AspNetCore.Mvc;
using HerdFlow.Api.DTOs;
using HerdFlow.Api.Services;

namespace HerdFlow.Api.Controllers;

[ApiController]
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

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCow(int id)
    {
        var cow = await _cowService.GetCowByIdAsync(id);
        return Ok(cow);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateCow(int id, [FromBody] CreateCowDto dto)
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

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCow(int id)
    {
        await _cowService.DeleteCowAsync(id);
        return NoContent();
    }

    [HttpGet("removed")]
    public async Task<IActionResult> GetRemovedCows()
    {
        var cows = await _cowService.GetRemovedCowsAsync();
        return Ok(cows);
    }

    [HttpPut("restore/{id}")]
    public async Task<IActionResult> RestoreCow(int id)
    {
        await _cowService.RestoreCowAsync(id);
        return Ok();
    }

    [HttpGet("{id}/activities")]
    public async Task<IActionResult> GetActivities(int id)
    {
        var activities = await _activityLogService.GetByCowIdAsync(id);
        return Ok(activities);
    }
}
