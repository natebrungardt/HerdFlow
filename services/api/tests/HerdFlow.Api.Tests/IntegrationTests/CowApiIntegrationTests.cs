using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using HerdFlow.Api.DTOs;
using HerdFlow.Api.Models;
using HerdFlow.Api.Tests.TestInfrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

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

        var cows = await client.GetFromJsonAsync<List<CowResponseDto>>("/api/cows", ApiJson.Options);

        cows.Should().ContainSingle();
        cows![0].TagNumber.Should().Be("A-100");
    }

    [Fact]
    public async Task GetCows_returns_created_at_for_cows()
    {
        await using var factory = new HerdFlowApiFactory();
        var createdAt = new DateTime(2026, 4, 6, 12, 0, 0, DateTimeKind.Utc);
        await factory.SeedAsync(dbContext =>
        {
            dbContext.Cows.Add(TestData.Cow("user-a", "A-100", createdAt: createdAt));
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var cows = await client.GetFromJsonAsync<List<CowResponseDto>>("/api/cows", ApiJson.Options);

        cows.Should().ContainSingle();
        cows![0].CreatedAt.Should().Be(createdAt);
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
            name = "Daisy",
            color = "Black",
            birthWeight = 82.5m,
            easeOfBirth = "Easy pull",
            healthStatus = "Healthy",
            heatStatus = "WatchHeat",
            pregnancyStatus = "Open",
            hasCalf = false
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var cow = await response.Content.ReadFromJsonAsync<CowResponseDto>(ApiJson.Options);
        cow.Should().NotBeNull();
        cow!.TagNumber.Should().Be("A-100");
        cow.UserId.Should().Be("user-a");
        cow.Name.Should().Be("Daisy");
        cow.Color.Should().Be("Black");
        cow.BirthWeight.Should().Be(82.5m);
        cow.CreatedAt.Should().NotBe(default);
    }

    [Fact]
    public async Task CreateCow_accepts_calf_livestock_group()
    {
        await using var factory = new HerdFlowApiFactory();
        using var client = factory.CreateClientForUser("user-a");

        var response = await client.PostAsJsonAsync("/api/cows", new
        {
            tagNumber = "A-101",
            ownerName = "Dev Ranch",
            livestockGroup = "Calf",
            breed = "Angus",
            sex = "Female",
            healthStatus = "Healthy",
            heatStatus = "WatchHeat",
            pregnancyStatus = "Open",
            hasCalf = false
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var cow = await response.Content.ReadFromJsonAsync<CowResponseDto>(ApiJson.Options);
        cow.Should().NotBeNull();
        cow!.LivestockGroup.ToString().Should().Be("Calf");
    }

    [Fact]
    public async Task CreateCalf_creates_first_available_tag_for_dam()
    {
        await using var factory = new HerdFlowApiFactory();
        var dam = TestData.Cow("user-a", "A-100");
        dam.Breed = "Angus";
        await factory.SeedAsync(dbContext =>
        {
            dbContext.Cows.Add(dam);
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var response = await client.PostAsync($"/api/cows/{dam.Id}/calves", null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var calf = await response.Content.ReadFromJsonAsync<CowResponseDto>(ApiJson.Options);
        calf.Should().NotBeNull();
        calf!.TagNumber.Should().Be($"A-100-{DateTime.UtcNow.Year}");
        calf.LivestockGroup.ToString().Should().Be("Calf");
        calf.DamId.Should().Be(dam.Id);
        calf.OwnerName.Should().Be(dam.OwnerName);
        calf.Breed.Should().Be("Angus");
    }

    [Fact]
    public async Task CreateCalf_uses_next_open_suffix_when_prior_tags_exist()
    {
        await using var factory = new HerdFlowApiFactory();
        var year = DateTime.UtcNow.Year;
        var dam = TestData.Cow("user-a", "A-100");
        var existingBaseCalf = TestData.Cow("user-a", $"A-100-{year}");
        existingBaseCalf.LivestockGroup = HerdFlow.Api.Models.Enums.LivestockGroupType.Calf;
        existingBaseCalf.DamId = dam.Id;
        var existingSuffixCalf = TestData.Cow("user-a", $"A-100-{year}-1");
        existingSuffixCalf.LivestockGroup = HerdFlow.Api.Models.Enums.LivestockGroupType.Calf;
        existingSuffixCalf.DamId = dam.Id;

        await factory.SeedAsync(dbContext =>
        {
            dbContext.Cows.AddRange(dam, existingBaseCalf, existingSuffixCalf);
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var response = await client.PostAsync($"/api/cows/{dam.Id}/calves", null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var calf = await response.Content.ReadFromJsonAsync<CowResponseDto>(ApiJson.Options);
        calf.Should().NotBeNull();
        calf!.TagNumber.Should().Be($"A-100-{year}-2");
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
    public async Task CreateCow_returns_fallback_parent_names_without_nested_parents()
    {
        await using var factory = new HerdFlowApiFactory();
        using var client = factory.CreateClientForUser("user-a");

        var response = await client.PostAsJsonAsync("/api/cows", new
        {
            tagNumber = "A-200",
            ownerName = "Dev Ranch",
            livestockGroup = "Breeding",
            sireName = "Bull Alpha",
            damName = "Cow Beta"
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var cow = await response.Content.ReadFromJsonAsync<CowResponseDto>(ApiJson.Options);
        cow.Should().NotBeNull();
        cow!.SireName.Should().Be("Bull Alpha");
        cow.Sire.Should().BeNull();
        cow.DamName.Should().Be("Cow Beta");
        cow.Dam.Should().BeNull();
    }

    [Fact]
    public async Task CreateCow_rejects_mutually_exclusive_parent_fields()
    {
        await using var factory = new HerdFlowApiFactory();
        using var client = factory.CreateClientForUser("user-a");

        var response = await client.PostAsJsonAsync("/api/cows", new
        {
            tagNumber = "A-201",
            ownerName = "Dev Ranch",
            livestockGroup = "Breeding",
            sireId = Guid.NewGuid(),
            sireName = "Bull Alpha"
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        problem.Should().NotBeNull();
        problem!.Detail.Should().Be("Provide either SireId or SireName, but not both.");
    }

    [Fact]
    public async Task GetCows_returns_compact_parent_summaries_without_offspring_collections()
    {
        await using var factory = new HerdFlowApiFactory();
        var sire = TestData.Cow("user-a", "S-100");
        sire.Name = "Bull Alpha";
        var dam = TestData.Cow("user-a", "D-200");
        dam.Name = "Cow Beta";
        var calf = TestData.Cow("user-a", "C-300");
        calf.SireId = sire.Id;
        calf.DamId = dam.Id;

        await factory.SeedAsync(dbContext =>
        {
            dbContext.Cows.AddRange(sire, dam, calf);
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var response = await client.GetAsync("/api/cows");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var cows = await response.Content.ReadFromJsonAsync<List<CowResponseDto>>(ApiJson.Options);
        cows.Should().NotBeNull();
        var calfResponse = cows!.Single(c => c.Id == calf.Id);
        calfResponse.Sire.Should().NotBeNull();
        calfResponse.Sire!.Id.Should().Be(sire.Id);
        calfResponse.Sire.TagNumber.Should().Be("S-100");
        calfResponse.Sire.Name.Should().Be("Bull Alpha");
        calfResponse.Dam.Should().NotBeNull();
        calfResponse.Dam!.Id.Should().Be(dam.Id);
        calfResponse.Dam.TagNumber.Should().Be("D-200");
        calfResponse.Dam.Name.Should().Be("Cow Beta");

        var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var calfJson = document.RootElement.EnumerateArray()
            .Single(element => element.GetProperty("id").GetGuid() == calf.Id);
        calfJson.TryGetProperty("siredOffspring", out _).Should().BeFalse();
        calfJson.TryGetProperty("birthedOffspring", out _).Should().BeFalse();
    }

    [Fact]
    public async Task UpdateCow_returns_compact_parent_summaries()
    {
        await using var factory = new HerdFlowApiFactory();
        var sire = TestData.Cow("user-a", "S-100");
        sire.Name = "Bull Alpha";
        var dam = TestData.Cow("user-a", "D-200");
        dam.Name = "Cow Beta";
        var calf = TestData.Cow("user-a", "C-300");

        await factory.SeedAsync(dbContext =>
        {
            dbContext.Cows.AddRange(sire, dam, calf);
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var response = await client.PutAsJsonAsync($"/api/cows/{calf.Id}", new
        {
            tagNumber = calf.TagNumber,
            ownerName = calf.OwnerName,
            livestockGroup = calf.LivestockGroup.ToString(),
            sex = calf.Sex,
            breed = calf.Breed,
            name = "Little Daisy",
            color = calf.Color,
            dateOfBirth = calf.DateOfBirth,
            birthWeight = calf.BirthWeight,
            easeOfBirth = calf.EaseOfBirth,
            sireId = sire.Id,
            damId = dam.Id,
            healthStatus = calf.HealthStatus.ToString(),
            heatStatus = calf.HeatStatus?.ToString(),
            pregnancyStatus = calf.PregnancyStatus,
            hasCalf = calf.HasCalf,
            purchasePrice = calf.PurchasePrice,
            salePrice = calf.SalePrice,
            purchaseDate = calf.PurchaseDate,
            saleDate = calf.SaleDate
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await response.Content.ReadFromJsonAsync<CowResponseDto>(ApiJson.Options);
        updated.Should().NotBeNull();
        updated!.Sire.Should().NotBeNull();
        updated.Sire!.Id.Should().Be(sire.Id);
        updated.Sire.TagNumber.Should().Be("S-100");
        updated.Sire.Name.Should().Be("Bull Alpha");
        updated.Dam.Should().NotBeNull();
        updated.Dam!.Id.Should().Be(dam.Id);
        updated.Dam.TagNumber.Should().Be("D-200");
        updated.Dam.Name.Should().Be("Cow Beta");
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

        var removedCows = await client.GetFromJsonAsync<List<CowResponseDto>>("/api/cows/removed", ApiJson.Options);
        removedCows.Should().ContainSingle(c => c.Id == cow.Id);
        removedCows![0].RemovedAt.Should().NotBeNull();

        var restoreResponse = await client.PutAsync($"/api/cows/{cow.Id}/restore", null);
        restoreResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var activeCows = await client.GetFromJsonAsync<List<CowResponseDto>>("/api/cows", ApiJson.Options);
        activeCows.Should().ContainSingle(c => c.Id == cow.Id);

        var restoredCow = await client.GetFromJsonAsync<CowResponseDto>($"/api/cows/{cow.Id}", ApiJson.Options);
        restoredCow.Should().NotBeNull();
        restoredCow!.RemovedAt.Should().BeNull();
    }

    [Fact]
    public async Task GetRemovedCows_returns_most_recently_removed_first_with_removed_at()
    {
        await using var factory = new HerdFlowApiFactory();
        var olderRemovedCow = TestData.Cow(
            "user-a",
            "A-100",
            isRemoved: true,
            removedAt: new DateTime(2026, 4, 5, 13, 0, 0, DateTimeKind.Utc));
        var newerRemovedCow = TestData.Cow(
            "user-a",
            "A-101",
            isRemoved: true,
            removedAt: new DateTime(2026, 4, 6, 13, 0, 0, DateTimeKind.Utc));
        var legacyRemovedCow = TestData.Cow("user-a", "A-102", isRemoved: true);
        await factory.SeedAsync(dbContext =>
        {
            dbContext.Cows.AddRange(olderRemovedCow, newerRemovedCow, legacyRemovedCow);
            return Task.CompletedTask;
        });
        using var client = factory.CreateClientForUser("user-a");

        var removedCows = await client.GetFromJsonAsync<List<CowResponseDto>>("/api/cows/removed", ApiJson.Options);

        removedCows.Should().NotBeNull();
        removedCows!.Select(cow => cow.Id).Should().ContainInOrder(
            newerRemovedCow.Id,
            olderRemovedCow.Id,
            legacyRemovedCow.Id);
        removedCows[0].RemovedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Deleting_parent_nulls_child_parent_fk_in_database()
    {
        await using var factory = new HerdFlowApiFactory();
        var sire = TestData.Cow("user-a", "S-100");
        var calf = TestData.Cow("user-a", "C-300");
        calf.SireId = sire.Id;

        await factory.SeedAsync(dbContext =>
        {
            dbContext.Cows.AddRange(sire, calf);
            return Task.CompletedTask;
        });

        await factory.SeedAsync(async dbContext =>
        {
            var storedSire = await dbContext.Cows.SingleAsync(c => c.Id == sire.Id);
            dbContext.Cows.Remove(storedSire);
        });

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HerdFlow.Api.Data.AppDbContext>();
        var refreshedCalf = await dbContext.Cows.AsNoTracking().SingleAsync(c => c.Id == calf.Id);
        refreshedCalf.SireId.Should().BeNull();
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
