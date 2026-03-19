using Microsoft.AspNetCore.Mvc;
using HerdFlow.Api.DTOs;
using HerdFlow.Api.Models;

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
    [HttpPost]
    public IActionResult CreateCow([FromBody] CreateCowDto dto)
    {
        var cow = new Cow
        {
            Id = 1,
            TagNumber = dto.TagNumber,
            Breed = dto.Breed,
            HealthStatus = dto.HealthStatus,
            HeatStatus = dto.HeatStatus,
            BreedingStatus = dto.BreedingStatus,
            OwnerName = dto.OwnerName,
            DateOfBirth = dto.DateOfBirth,
            PurchasePrice = dto.PurchasePrice,
            SalePrice = dto.SalePrice
        };

        return Ok(cow);
    }
}
