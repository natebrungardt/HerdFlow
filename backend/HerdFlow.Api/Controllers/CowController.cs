using Microsoft.AspNetCore.Mvc;
using HerdFlow.Api.DTOs;
using HerdFlow.Api.Services;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace HerdFlow.Api.Controllers;

[ApiController]
[Route("api/cow")]
public class CowController : ControllerBase
{
    private readonly CowService _cowService;

    public CowController(CowService cowService)
    {
        _cowService = cowService;
    }

    [HttpGet]
    public IActionResult GetCows()
    {
        var cows = _cowService.GetCows();

        return Ok(cows);
    }
    [HttpGet("{id}")]
    public IActionResult GetCow(int id)
    {
        var cow = _cowService.GetCowById(id);

        if (cow == null)
            return NotFound();

        return Ok(cow);
    }
    [HttpPut("{id}")]
    public IActionResult UpdateCow(int id, [FromBody] CreateCowDto dto)
    {
        var updatedCow = _cowService.UpdateCow(id, dto);

        if (updatedCow == null)
            return NotFound();

        return Ok(updatedCow);
    }

    [HttpPost]
    public IActionResult CreateCow([FromBody] CreateCowDto dto)
    {
        try
        {
            var cow = _cowService.CreateCow(dto);
            return Ok(cow);
        }
        catch (DbUpdateException ex)
        {
            if (ex.InnerException is PostgresException pgEx && pgEx.SqlState == "23505")
            {
                return Conflict(new
                {
                    status = 409,
                    message = "Tag number already exists."
                });
            }

            throw;
        }
    }
    [HttpDelete("{id}")]
    public IActionResult DeleteCow(int id)
    {
        var success = _cowService.DeleteCow(id);

        if (!success)
            return NotFound();

        return NoContent();
    }
}
