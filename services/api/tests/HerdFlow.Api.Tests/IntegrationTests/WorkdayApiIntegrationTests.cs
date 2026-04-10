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

    [Fact]
    public async Task Archive_and_restore_endpoints_update_removed_visibility_and_timestamp()
    {
        await using var factory = new HerdFlowApiFactory();
        var workday = new Workday
        {
            UserId = "user-a",
            Title = "Morning Checks"
        };
        await factory.SeedAsync(dbContext =>
        {
            dbContext.Workdays.Add(workday);
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var archiveResponse = await client.PutAsync($"/api/workdays/{workday.Id}/archive", null);
        archiveResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var removedWorkdays = await client.GetFromJsonAsync<List<Workday>>(
            "/api/workdays/archived",
            ApiJson.Options);
        removedWorkdays.Should().ContainSingle(w => w.Id == workday.Id);
        removedWorkdays![0].RemovedAt.Should().NotBeNull();

        var restoreResponse = await client.PutAsync($"/api/workdays/{workday.Id}/restore", null);
        restoreResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var activeWorkdays = await client.GetFromJsonAsync<List<Workday>>(
            "/api/workdays",
            ApiJson.Options);
        activeWorkdays.Should().ContainSingle(w => w.Id == workday.Id);

        var restoredWorkday = await client.GetFromJsonAsync<Workday>(
            $"/api/workdays/{workday.Id}",
            ApiJson.Options);
        restoredWorkday.Should().NotBeNull();
        restoredWorkday!.RemovedAt.Should().BeNull();
        restoredWorkday.IsRemoved.Should().BeFalse();
    }

    [Fact]
    public async Task GetArchivedWorkdays_returns_most_recently_removed_first_with_removed_at()
    {
        await using var factory = new HerdFlowApiFactory();
        var olderRemovedWorkday = new Workday
        {
            UserId = "user-a",
            Title = "Older Removed Workday",
            IsRemoved = true,
            RemovedAt = new DateTime(2026, 4, 5, 13, 0, 0, DateTimeKind.Utc)
        };
        var newerRemovedWorkday = new Workday
        {
            UserId = "user-a",
            Title = "Newer Removed Workday",
            IsRemoved = true,
            RemovedAt = new DateTime(2026, 4, 6, 13, 0, 0, DateTimeKind.Utc)
        };
        var legacyRemovedWorkday = new Workday
        {
            UserId = "user-a",
            Title = "Legacy Removed Workday",
            IsRemoved = true
        };

        await factory.SeedAsync(dbContext =>
        {
            dbContext.Workdays.AddRange(
                olderRemovedWorkday,
                newerRemovedWorkday,
                legacyRemovedWorkday);
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var removedWorkdays = await client.GetFromJsonAsync<List<Workday>>(
            "/api/workdays/archived",
            ApiJson.Options);

        removedWorkdays.Should().NotBeNull();
        removedWorkdays!.Select(workday => workday.Id).Should().ContainInOrder(
            newerRemovedWorkday.Id,
            olderRemovedWorkday.Id,
            legacyRemovedWorkday.Id);
        removedWorkdays[0].RemovedAt.Should().NotBeNull();
    }
}
