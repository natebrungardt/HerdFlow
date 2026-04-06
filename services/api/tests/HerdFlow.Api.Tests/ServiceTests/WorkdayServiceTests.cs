using FluentAssertions;
using HerdFlow.Api.Exceptions;
using HerdFlow.Api.Models;
using HerdFlow.Api.Tests.TestInfrastructure;

namespace HerdFlow.Api.Tests.ServiceTests;

public class WorkdayServiceTests
{
    [Fact]
    public async Task CreateWorkday_defaults_date_and_deduplicates_cow_ids()
    {
        await using var testContext = new ServiceTestContext();
        var cow = TestData.Cow("test-user", "A-100");
        testContext.DbContext.Cows.Add(cow);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateWorkdayService();
        var before = DateOnly.FromDateTime(DateTime.UtcNow);

        var workday = await service.CreateWorkday(
            TestData.CreateWorkdayDto(cowIds: new List<Guid> { cow.Id, cow.Id }));

        workday.Date.Should().Be(before);
        workday.WorkdayCows.Should().ContainSingle(wc => wc.CowId == cow.Id);
    }

    [Fact]
    public async Task CreateWorkday_rejects_foreign_or_removed_cows()
    {
        await using var testContext = new ServiceTestContext();
        var foreignCow = TestData.Cow("other-user", "A-100");
        var removedCow = TestData.Cow("test-user", "B-200", isRemoved: true);
        testContext.DbContext.Cows.AddRange(foreignCow, removedCow);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateWorkdayService();
        var dto = TestData.CreateWorkdayDto(cowIds: new List<Guid> { foreignCow.Id, removedCow.Id });

        var action = () => service.CreateWorkday(dto);

        await action.Should().ThrowAsync<ValidationException>()
            .WithMessage("One or more selected cows could not be added to the workday.");
    }

    [Fact]
    public async Task AddCowsToWorkday_noops_when_cows_are_already_assigned()
    {
        await using var testContext = new ServiceTestContext();
        var cow = TestData.Cow("test-user", "A-100");
        var workday = new Workday
        {
            UserId = "test-user",
            Title = "Morning Checks",
            WorkdayCows = new List<WorkdayCow>
            {
                new() { CowId = cow.Id }
            }
        };

        testContext.DbContext.Cows.Add(cow);
        testContext.DbContext.Workdays.Add(workday);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateWorkdayService();

        await service.AddCowsToWorkday(workday.Id, new List<Guid> { cow.Id, cow.Id });

        testContext.DbContext.WorkdayCows.Should().ContainSingle();
    }

    [Fact]
    public async Task AddCowsToWorkday_rejects_removed_or_foreign_cows()
    {
        await using var testContext = new ServiceTestContext();
        var allowedCow = TestData.Cow("test-user", "A-100");
        var invalidCow = TestData.Cow("other-user", "B-200");
        var workday = new Workday
        {
            UserId = "test-user",
            Title = "Morning Checks"
        };

        testContext.DbContext.Cows.AddRange(allowedCow, invalidCow);
        testContext.DbContext.Workdays.Add(workday);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateWorkdayService();

        var action = () => service.AddCowsToWorkday(workday.Id, new List<Guid> { allowedCow.Id, invalidCow.Id });

        await action.Should().ThrowAsync<ValidationException>()
            .WithMessage("One or more selected cows could not be added to the workday.");
    }

    [Fact]
    public async Task RemoveCowFromWorkday_throws_when_workday_does_not_exist()
    {
        await using var testContext = new ServiceTestContext();
        var service = testContext.CreateWorkdayService();

        var action = () => service.RemoveCowFromWorkday(Guid.NewGuid(), Guid.NewGuid());

        await action.Should().ThrowAsync<NotFoundException>()
            .WithMessage("Workday not found.");
    }

    [Fact]
    public async Task RemoveCowFromWorkday_noops_when_workday_exists_but_cow_is_not_assigned()
    {
        await using var testContext = new ServiceTestContext();
        var workday = new Workday
        {
            UserId = "test-user",
            Title = "Morning Checks"
        };

        testContext.DbContext.Workdays.Add(workday);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateWorkdayService();

        await service.RemoveCowFromWorkday(workday.Id, Guid.NewGuid());

        testContext.DbContext.WorkdayCows.Should().BeEmpty();
    }
}
