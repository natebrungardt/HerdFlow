using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using HerdFlow.Api.Models;
using HerdFlow.Api.Tests.TestInfrastructure;
using Microsoft.AspNetCore.Mvc;

namespace HerdFlow.Api.Tests.IntegrationTests;

public class CowApiIntegrationTests
{
    [Fact]
    public async Task GetCows_returns_only_the_current_users_cows()
    {
        await using var factory = new HerdFlowApiFactory();
        await factory.SeedAsync(dbContext =>
        {
            dbContext.Cows.AddRange(
                TestData.Cow("user-a", "A-100"),
                TestData.Cow("user-b", "B-200"));
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var cows = await client.GetFromJsonAsync<List<Cow>>("/api/cows", ApiJson.Options);

        cows.Should().ContainSingle();
        cows![0].TagNumber.Should().Be("A-100");
    }

    [Fact]
    public async Task CreateCow_returns_created_cow_payload()
    {
        await using var factory = new HerdFlowApiFactory();
        using var client = factory.CreateClientForUser("user-a");

        var response = await client.PostAsJsonAsync("/api/cows", new
        {
            tagNumber = "A-100",
            ownerName = "Dev Ranch",
            livestockGroup = "Breeding",
            breed = "Angus",
            sex = "Female",
            healthStatus = "Healthy",
            heatStatus = "WatchHeat",
            pregnancyStatus = "Open",
            hasCalf = false
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var cow = await response.Content.ReadFromJsonAsync<Cow>(ApiJson.Options);
        cow.Should().NotBeNull();
        cow!.TagNumber.Should().Be("A-100");
        cow.UserId.Should().Be("user-a");
    }

    [Fact]
    public async Task CreateCow_returns_problem_details_for_duplicate_tag()
    {
        await using var factory = new HerdFlowApiFactory();
        await factory.SeedAsync(dbContext =>
        {
            dbContext.Cows.Add(TestData.Cow("user-a", "A-100"));
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var response = await client.PostAsJsonAsync("/api/cows", new
        {
            tagNumber = "A-100",
            ownerName = "Dev Ranch",
            livestockGroup = "Breeding"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problem.Should().NotBeNull();
        problem!.Detail.Should().Be("Tag number already exists.");
    }

    [Fact]
    public async Task CreateCow_returns_400_for_invalid_payload()
    {
        await using var factory = new HerdFlowApiFactory();
        using var client = factory.CreateClientForUser("user-a");

        var response = await client.PostAsJsonAsync("/api/cows", new
        {
            tagNumber = "A-100"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("OwnerName");
    }

    [Fact]
    public async Task Archive_and_restore_endpoints_update_removed_visibility()
    {
        await using var factory = new HerdFlowApiFactory();
        var cow = TestData.Cow("user-a", "A-100");
        await factory.SeedAsync(dbContext =>
        {
            dbContext.Cows.Add(cow);
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var archiveResponse = await client.PutAsync($"/api/cows/{cow.Id}/archive", null);
        archiveResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var removedCows = await client.GetFromJsonAsync<List<Cow>>("/api/cows/removed", ApiJson.Options);
        removedCows.Should().ContainSingle(c => c.Id == cow.Id);

        var restoreResponse = await client.PutAsync($"/api/cows/{cow.Id}/restore", null);
        restoreResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var activeCows = await client.GetFromJsonAsync<List<Cow>>("/api/cows", ApiJson.Options);
        activeCows.Should().ContainSingle(c => c.Id == cow.Id);
    }

    [Fact]
    public async Task Export_endpoint_returns_csv_file()
    {
        await using var factory = new HerdFlowApiFactory();
        await factory.SeedAsync(dbContext =>
        {
            dbContext.Cows.Add(TestData.Cow("user-a", "A-100"));
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var response = await client.GetAsync("/api/cows/export");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType!.MediaType.Should().Be("text/csv");
        response.Content.Headers.ContentDisposition!.FileName.Should().Contain("herd-export-");
    }
}
