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
    public async Task CreateCowAsync_rejects_invalid_tag_number()
    {
        await using var testContext = new ServiceTestContext();
        var service = testContext.CreateCowService();
        var dto = TestData.CreateCowDto(tagNumber: "bad tag");

        var action = () => service.CreateCowAsync(dto);

        await action.Should().ThrowAsync<ValidationException>()
            .WithMessage("Tag number can only include letters, numbers, and dashes.");
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
        (await service.GetRemovedCowsAsync()).Should().ContainSingle(c => c.Id == cow.Id);

        await service.RestoreCowAsync(cow.Id);
        (await service.GetRemovedCowsAsync()).Should().BeEmpty();
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
