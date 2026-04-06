using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using HerdFlow.Api.Models;
using HerdFlow.Api.Tests.TestInfrastructure;

namespace HerdFlow.Api.Tests.IntegrationTests;

public class WorkdayApiIntegrationTests
{
    [Fact]
    public async Task CreateWorkday_and_get_by_id_return_expected_relationship_shape()
    {
        await using var factory = new HerdFlowApiFactory();
        var cow = TestData.Cow("user-a", "A-100");
        await factory.SeedAsync(dbContext =>
        {
            dbContext.Cows.Add(cow);
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var createResponse = await client.PostAsJsonAsync("/api/workdays", new
        {
            title = "Morning Checks",
            summary = "Checked feed and water",
            cowIds = new[] { cow.Id }
        });

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdWorkday = await createResponse.Content.ReadFromJsonAsync<Workday>(ApiJson.Options);
        createdWorkday.Should().NotBeNull();

        var fetchedWorkday = await client.GetFromJsonAsync<Workday>(
            $"/api/workdays/{createdWorkday!.Id}",
            ApiJson.Options);

        fetchedWorkday.Should().NotBeNull();
        fetchedWorkday!.WorkdayCows.Should().ContainSingle();
        fetchedWorkday.WorkdayCows[0].Cow.Should().NotBeNull();
        fetchedWorkday.WorkdayCows[0].Cow!.TagNumber.Should().Be("A-100");
    }

    [Fact]
    public async Task AddCows_endpoint_rejects_removed_or_foreign_cows()
    {
        await using var factory = new HerdFlowApiFactory();
        var workday = new Workday
        {
            UserId = "user-a",
            Title = "Morning Checks"
        };
        var foreignCow = TestData.Cow("user-b", "B-200");
        await factory.SeedAsync(dbContext =>
        {
            dbContext.Workdays.Add(workday);
            dbContext.Cows.Add(foreignCow);
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var response = await client.PostAsJsonAsync($"/api/workdays/{workday.Id}/cows", new
        {
            cowIds = new[] { foreignCow.Id }
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("could not be added");
    }
}
