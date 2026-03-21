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
}
