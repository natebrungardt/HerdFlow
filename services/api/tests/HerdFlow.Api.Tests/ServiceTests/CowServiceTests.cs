using FluentAssertions;
using HerdFlow.Api.Exceptions;
using HerdFlow.Api.Tests.TestInfrastructure;

namespace HerdFlow.Api.Tests.ServiceTests;

public class CowServiceTests
{
    [Fact]
    public async Task CreateCowAsync_trims_tag_number_and_normalizes_pregnancy_status()
    {
        await using var testContext = new ServiceTestContext();
        var service = testContext.CreateCowService();
        var dto = TestData.CreateCowDto(tagNumber: "  A-100  ", pregnancyStatus: "   ");

        var cow = await service.CreateCowAsync(dto);

        cow.TagNumber.Should().Be("A-100");
        cow.PregnancyStatus.Should().Be("N/A");
    }

    [Fact]
    public async Task CreateCowAsync_sets_created_at_timestamp()
    {
        await using var testContext = new ServiceTestContext();
        var service = testContext.CreateCowService();

        var beforeCreate = DateTime.UtcNow;
        var cow = await service.CreateCowAsync(TestData.CreateCowDto(tagNumber: "A-101"));
        var afterCreate = DateTime.UtcNow;

        cow.CreatedAt.Should().BeOnOrAfter(beforeCreate.AddSeconds(-1));
        cow.CreatedAt.Should().BeOnOrBefore(afterCreate.AddSeconds(1));
    }

    [Fact]
    public async Task CreateCowAsync_rejects_invalid_tag_number()
    {
        await using var testContext = new ServiceTestContext();
        var service = testContext.CreateCowService();
        var dto = TestData.CreateCowDto(tagNumber: "bad tag");

        var action = () => service.CreateCowAsync(dto);

        await action.Should().ThrowAsync<ValidationException>()
            .WithMessage("Tag number can only include letters, numbers, and dashes. Spaces cannot be used.");
    }

    [Fact]
    public async Task CreateCowAsync_rejects_none_livestock_group()
    {
        await using var testContext = new ServiceTestContext();
        var service = testContext.CreateCowService();
        var dto = TestData.CreateCowDto(livestockGroup: HerdFlow.Api.Models.Enums.LivestockGroupType.None);

        var action = () => service.CreateCowAsync(dto);

        await action.Should().ThrowAsync<ValidationException>()
            .WithMessage("Livestock group is required.");
    }

    [Fact]
    public async Task CreateCowAsync_accepts_calf_livestock_group()
    {
        await using var testContext = new ServiceTestContext();
        var service = testContext.CreateCowService();
        var dto = TestData.CreateCowDto(
            tagNumber: "A-101",
            livestockGroup: HerdFlow.Api.Models.Enums.LivestockGroupType.Calf);

        var cow = await service.CreateCowAsync(dto);

        cow.LivestockGroup.Should().Be(HerdFlow.Api.Models.Enums.LivestockGroupType.Calf);
    }

    [Fact]
    public async Task CreateCowAsync_prevents_duplicate_tag_numbers_for_same_user()
    {
        await using var testContext = new ServiceTestContext();
        testContext.DbContext.Cows.Add(TestData.Cow("test-user", "A-100"));
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateCowService();

        var action = () => service.CreateCowAsync(TestData.CreateCowDto(tagNumber: "A-100"));

        await action.Should().ThrowAsync<ConflictException>()
            .WithMessage("Tag number already exists.");
    }

    [Fact]
    public async Task CreateCowAsync_allows_duplicate_tag_numbers_for_different_users()
    {
        await using var testContext = new ServiceTestContext();
        testContext.DbContext.Cows.Add(TestData.Cow("other-user", "A-100"));
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateCowService();

        var cow = await service.CreateCowAsync(TestData.CreateCowDto(tagNumber: "A-100"));

        cow.UserId.Should().Be("test-user");
        (await service.GetCowsAsync()).Should().ContainSingle();
    }

    [Fact]
    public async Task ArchiveCowAsync_and_RestoreCowAsync_toggle_removed_state()
    {
        await using var testContext = new ServiceTestContext();
        var cow = TestData.Cow("test-user", "A-100");
        testContext.DbContext.Cows.Add(cow);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateCowService();

        await service.ArchiveCowAsync(cow.Id);
        var removedCows = await service.GetRemovedCowsAsync();
        removedCows.Should().ContainSingle(c => c.Id == cow.Id);
        removedCows[0].RemovedAt.Should().NotBeNull();

        await service.RestoreCowAsync(cow.Id);
        (await service.GetRemovedCowsAsync()).Should().BeEmpty();

        var restoredCow = await service.GetCowByIdAsync(cow.Id);
        restoredCow.RemovedAt.Should().BeNull();
    }

    [Fact]
    public async Task GetRemovedCowsAsync_returns_most_recently_removed_first()
    {
        await using var testContext = new ServiceTestContext();
        var olderRemovedCow = TestData.Cow(
            "test-user",
            "A-100",
            isRemoved: true,
            removedAt: new DateTime(2026, 4, 5, 13, 0, 0, DateTimeKind.Utc));
        var newerRemovedCow = TestData.Cow(
            "test-user",
            "A-101",
            isRemoved: true,
            removedAt: new DateTime(2026, 4, 6, 13, 0, 0, DateTimeKind.Utc));
        var legacyRemovedCow = TestData.Cow("test-user", "A-102", isRemoved: true);
        testContext.DbContext.Cows.AddRange(olderRemovedCow, newerRemovedCow, legacyRemovedCow);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateCowService();

        var removedCows = await service.GetRemovedCowsAsync();

        removedCows.Select(cow => cow.Id).Should().ContainInOrder(
            newerRemovedCow.Id,
            olderRemovedCow.Id,
            legacyRemovedCow.Id);
    }

    [Fact]
    public async Task ExportCowsCsvAsync_includes_headers_sorted_rows_and_filtered_notes()
    {
        await using var testContext = new ServiceTestContext();
        var cowB = TestData.Cow("test-user", "B-200");
        var cowA = TestData.Cow("test-user", "A-100");
        testContext.DbContext.Cows.AddRange(cowB, cowA);
        testContext.DbContext.Notes.AddRange(
            TestData.Note("test-user", cowA.Id, " Second note ", new DateTime(2025, 1, 2, 0, 0, 0, DateTimeKind.Utc)),
            TestData.Note("test-user", cowA.Id, "First note", new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)),
            TestData.Note("other-user", cowA.Id, "Should not export", new DateTime(2025, 1, 3, 0, 0, 0, DateTimeKind.Utc)));
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateCowService();

        var csv = await service.ExportCowsCsvAsync();

        csv.Should().Contain("\"Tag Number\",\"Owner Name\",\"Livestock Group\"");
        csv.IndexOf("A-100", StringComparison.Ordinal).Should().BeLessThan(csv.IndexOf("B-200", StringComparison.Ordinal));
        csv.Should().Contain("2025-01-01: First note | 2025-01-02: Second note");
        csv.Should().NotContain("Should not export");
    }
}
