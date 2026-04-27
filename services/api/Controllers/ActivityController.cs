using HerdFlow.Api.Data;
using HerdFlow.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HerdFlow.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ActivityController : ControllerBase
{
    private readonly AppDbContext _context;

    public ActivityController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetRecentActivity([FromQuery] int limit = 10)
    {
        if (limit <= 0) limit = 10;
        if (limit > 100) limit = 100;

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var entries = await _context.ActivityLogEntries
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .Select(a => new ActivityLogDto
            {
                Id = a.Id,
                Description = a.Description,
                EventType = a.EventType,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return Ok(entries);
    }
}
