using System.Net;
using FluentAssertions;
using HerdFlow.Api.Tests.TestInfrastructure;

namespace HerdFlow.Api.Tests.IntegrationTests;

public class AuthIntegrationTests
{
    [Fact]
    public async Task Protected_endpoints_return_401_when_test_auth_is_disabled()
    {
        await using var factory = new HerdFlowApiFactory(enableTestAuth: false);
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/cows");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
