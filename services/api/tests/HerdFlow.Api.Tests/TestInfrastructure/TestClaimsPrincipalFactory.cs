using System.Security.Claims;

namespace HerdFlow.Api.Tests.TestInfrastructure;

internal static class TestClaimsPrincipalFactory
{
    public static ClaimsPrincipal Create(string userId, string? email = null)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim("sub", userId),
            new Claim(ClaimTypes.Email, email ?? $"{userId}@test.local"),
        };

        return new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));
    }
}
