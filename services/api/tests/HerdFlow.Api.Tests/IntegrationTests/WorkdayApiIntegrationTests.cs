using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using HerdFlow.Api.Data;
using HerdFlow.Api.Models;
using HerdFlow.Api.Models.Enums;
using HerdFlow.Api.Tests.TestInfrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace HerdFlow.Api.Tests.IntegrationTests;

public class WorkdayApiIntegrationTests
{
    [Fact]
    public async Task CreateWorkday_then_add_cow_and_get_by_id_return_expected_relationship_shape()
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
            summary = "Checked feed and water"
        });

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdWorkday = await createResponse.Content.ReadFromJsonAsync<Workday>(ApiJson.Options);
        createdWorkday.Should().NotBeNull();

        var addCowResponse = await client.PostAsJsonAsync($"/api/workdays/{createdWorkday!.Id}/cows", new
        {
            cowIds = new[] { cow.Id }
        });

        addCowResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

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
    public async Task Delete_endpoint_hard_deletes_workday_and_related_records()
    {
        await using var factory = new HerdFlowApiFactory();
        var cow = TestData.Cow("user-a", "A-100");
        var action = new WorkdayAction
        {
            Name = "Vaccinate"
        };
        var workday = new Workday
        {
            UserId = "user-a",
            Title = "Morning Checks",
            WorkdayCows = new List<WorkdayCow>
            {
                new() { CowId = cow.Id }
            },
            Actions = new List<WorkdayAction>
            {
                action
            }
        };
        await factory.SeedAsync(dbContext =>
        {
            dbContext.Cows.Add(cow);
            dbContext.Workdays.Add(workday);
            dbContext.WorkdayEntries.Add(new WorkdayEntry
            {
                WorkdayId = workday.Id,
                CowId = cow.Id,
                ActionId = action.Id,
                IsCompleted = false
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var deleteResponse = await client.DeleteAsync($"/api/workdays/{workday.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var fetchResponse = await client.GetAsync($"/api/workdays/{workday.Id}");
        fetchResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await dbContext.Workdays.FindAsync(workday.Id)).Should().BeNull();
        dbContext.WorkdayCows.Should().BeEmpty();
        dbContext.WorkdayActions.Should().BeEmpty();
        dbContext.WorkdayEntries.Should().BeEmpty();
    }

    [Fact]
    public async Task GetCompletedWorkdays_returns_most_recent_first()
    {
        await using var factory = new HerdFlowApiFactory();
        var olderCompletedWorkday = new Workday
        {
            UserId = "user-a",
            Title = "Older Completed Workday",
            Status = WorkdayStatus.Completed,
            Date = new DateOnly(2026, 4, 6),
            CreatedAt = new DateTime(2026, 4, 5, 13, 0, 0, DateTimeKind.Utc)
        };
        var newerCompletedWorkday = new Workday
        {
            UserId = "user-a",
            Title = "Newer Completed Workday",
            Status = WorkdayStatus.Completed,
            Date = new DateOnly(2026, 4, 5),
            CreatedAt = new DateTime(2026, 4, 6, 13, 0, 0, DateTimeKind.Utc)
        };
        var draftWorkday = new Workday
        {
            UserId = "user-a",
            Title = "Draft Workday",
            Status = WorkdayStatus.Draft,
            Date = new DateOnly(2026, 4, 7),
            CreatedAt = new DateTime(2026, 4, 7, 13, 0, 0, DateTimeKind.Utc)
        };

        await factory.SeedAsync(dbContext =>
        {
            dbContext.Workdays.AddRange(
                olderCompletedWorkday,
                newerCompletedWorkday,
                draftWorkday);
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var completedWorkdays = await client.GetFromJsonAsync<List<Workday>>(
            "/api/workdays/completed",
            ApiJson.Options);

        completedWorkdays.Should().NotBeNull();
        completedWorkdays!.Select(workday => workday.Id).Should().ContainInOrder(
            newerCompletedWorkday.Id,
            olderCompletedWorkday.Id);
    }

    [Fact]
    public async Task AddAction_and_start_endpoints_support_workday_setup_flow()
    {
        await using var factory = new HerdFlowApiFactory();
        var cow = TestData.Cow("user-a", "A-100");
        var workday = new Workday
        {
            UserId = "user-a",
            Title = "Morning Checks",
            WorkdayCows = new List<WorkdayCow>
            {
                new() { CowId = cow.Id }
            }
        };

        await factory.SeedAsync(dbContext =>
        {
            dbContext.Cows.Add(cow);
            dbContext.Workdays.Add(workday);
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var addActionResponse = await client.PostAsJsonAsync(
            $"/api/workdays/{workday.Id}/actions",
            new { name = "Vaccinate" });

        addActionResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var fetchedWorkday = await client.GetFromJsonAsync<Workday>(
            $"/api/workdays/{workday.Id}",
            ApiJson.Options);

        fetchedWorkday.Should().NotBeNull();
        fetchedWorkday!.Actions.Should().ContainSingle(action => action.Name == "Vaccinate");

        var startResponse = await client.PostAsync($"/api/workdays/{workday.Id}/start", null);
        startResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var startedWorkday = await client.GetFromJsonAsync<Workday>(
            $"/api/workdays/{workday.Id}",
            ApiJson.Options);

        startedWorkday.Should().NotBeNull();
        startedWorkday!.Status.Should().Be(WorkdayStatus.InProgress);
    }

    [Fact]
    public async Task Complete_endpoint_moves_workday_to_completed()
    {
        await using var factory = new HerdFlowApiFactory();
        var workday = new Workday
        {
            UserId = "user-a",
            Title = "Morning Checks",
            Status = WorkdayStatus.InProgress
        };

        await factory.SeedAsync(dbContext =>
        {
            dbContext.Workdays.Add(workday);
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var completeResponse = await client.PostAsync($"/api/workdays/{workday.Id}/complete", null);
        completeResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var activeWorkdays = await client.GetFromJsonAsync<List<Workday>>(
            "/api/workdays",
            ApiJson.Options);
        activeWorkdays.Should().NotContain(w => w.Id == workday.Id);

        var completedWorkdays = await client.GetFromJsonAsync<List<Workday>>(
            "/api/workdays/completed",
            ApiJson.Options);
        completedWorkdays.Should().Contain(w => w.Id == workday.Id);

        var completedWorkday = await client.GetFromJsonAsync<Workday>(
            $"/api/workdays/{workday.Id}",
            ApiJson.Options);
        completedWorkday.Should().NotBeNull();
        completedWorkday!.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Toggle_endpoint_updates_existing_workday_entry_completion()
    {
        await using var factory = new HerdFlowApiFactory();
        var cow = TestData.Cow("user-a", "A-100");
        var action = new WorkdayAction
        {
            Name = "Vaccinate"
        };
        var workday = new Workday
        {
            UserId = "user-a",
            Title = "Morning Checks",
            Status = WorkdayStatus.InProgress,
            WorkdayCows = new List<WorkdayCow>
            {
                new() { CowId = cow.Id }
            },
            Actions = new List<WorkdayAction>
            {
                action
            }
        };

        await factory.SeedAsync(dbContext =>
        {
            dbContext.Cows.Add(cow);
            dbContext.Workdays.Add(workday);
            dbContext.WorkdayEntries.Add(new WorkdayEntry
            {
                WorkdayId = workday.Id,
                CowId = cow.Id,
                ActionId = action.Id,
                IsCompleted = false
            });
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var toggleResponse = await client.PostAsJsonAsync(
            $"/api/workdays/{workday.Id}/toggle",
            new
            {
                cowId = cow.Id,
                actionId = action.Id,
                completed = true
            });

        toggleResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var fetchedWorkday = await client.GetFromJsonAsync<Workday>(
            $"/api/workdays/{workday.Id}",
            ApiJson.Options);

        fetchedWorkday.Should().NotBeNull();
        fetchedWorkday!.Entries.Should().ContainSingle(entry =>
            entry.CowId == cow.Id &&
            entry.ActionId == action.Id &&
            entry.IsCompleted);
    }
}
