using Microsoft.AspNetCore.Mvc;

namespace HerdFlow.Api.Controllers;

[ApiController]
[Route("api/cow")]
public class CowController : ControllerBase
{
    [HttpGet]
    public IActionResult GetCows()
    {
        var cows = new[]
        {
            new { Id = 1, Name = "Bessie" },
            new { Id = 2, Name = "Mooana" }
        };

        return Ok(cows);
    }
}
