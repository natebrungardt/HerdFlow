using FluentAssertions;
using HerdFlow.Api.Exceptions;
using HerdFlow.Api.Models;
using HerdFlow.Api.Models.Enums;
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

    [Fact]
    public async Task RemoveCowFromWorkday_removes_matching_entries()
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
            },
            Actions = new List<WorkdayAction>
            {
                new() { Name = "Vaccinate" }
            }
        };

        testContext.DbContext.Cows.Add(cow);
        testContext.DbContext.Workdays.Add(workday);
        await testContext.DbContext.SaveChangesAsync();

        testContext.DbContext.WorkdayEntries.Add(new WorkdayEntry
        {
            WorkdayId = workday.Id,
            CowId = cow.Id,
            ActionId = workday.Actions[0].Id,
            IsCompleted = false
        });
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateWorkdayService();

        await service.RemoveCowFromWorkday(workday.Id, cow.Id);

        testContext.DbContext.WorkdayCows.Should().BeEmpty();
        testContext.DbContext.WorkdayEntries.Should().BeEmpty();
    }

    [Fact]
    public async Task UpdateCowWorkdayStatus_sets_worked_status_when_checked()
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

        await service.UpdateCowWorkdayStatus(workday.Id, cow.Id, true);

        testContext.DbContext.WorkdayCows.Should()
            .ContainSingle(wc => wc.WorkdayId == workday.Id && wc.CowId == cow.Id && wc.Status == "Worked");
    }

    [Fact]
    public async Task UpdateCowWorkdayStatus_clears_worked_status_when_unchecked()
    {
        await using var testContext = new ServiceTestContext();
        var cow = TestData.Cow("test-user", "A-100");
        var workday = new Workday
        {
            UserId = "test-user",
            Title = "Morning Checks",
            WorkdayCows = new List<WorkdayCow>
            {
                new() { CowId = cow.Id, Status = "Worked" }
            }
        };

        testContext.DbContext.Cows.Add(cow);
        testContext.DbContext.Workdays.Add(workday);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateWorkdayService();

        await service.UpdateCowWorkdayStatus(workday.Id, cow.Id, false);

        testContext.DbContext.WorkdayCows.Should()
            .ContainSingle(wc => wc.WorkdayId == workday.Id && wc.CowId == cow.Id && wc.Status == null);
    }

    [Fact]
    public async Task UpdateCowWorkdayStatus_rejects_assignment_for_another_users_workday()
    {
        await using var testContext = new ServiceTestContext();
        var cow = TestData.Cow("other-user", "A-100");
        var workday = new Workday
        {
            UserId = "other-user",
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

        var action = () => service.UpdateCowWorkdayStatus(workday.Id, cow.Id, true);

        await action.Should().ThrowAsync<NotFoundException>()
            .WithMessage("Workday cow assignment not found.");
    }

    [Fact]
    public async Task UpdateCowWorkdayStatus_throws_when_assignment_does_not_exist()
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

        var action = () => service.UpdateCowWorkdayStatus(workday.Id, Guid.NewGuid(), true);

        await action.Should().ThrowAsync<NotFoundException>()
            .WithMessage("Workday cow assignment not found.");
    }

    [Fact]
    public async Task Archive_and_restore_workday_updates_removed_state_and_timestamp()
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

        await service.ArchiveWorkday(workday.Id);
        var removedWorkdays = await service.GetArchivedWorkdays();
        removedWorkdays.Should().ContainSingle(w => w.Id == workday.Id);
        removedWorkdays[0].RemovedAt.Should().NotBeNull();

        await service.RestoreWorkday(workday.Id);
        (await service.GetArchivedWorkdays()).Should().BeEmpty();

        var restoredWorkday = await service.GetWorkdayById(workday.Id);
        restoredWorkday.IsRemoved.Should().BeFalse();
        restoredWorkday.RemovedAt.Should().BeNull();
    }

    [Fact]
    public async Task GetArchivedWorkdays_returns_most_recently_removed_first()
    {
        await using var testContext = new ServiceTestContext();
        var olderRemovedWorkday = new Workday
        {
            UserId = "test-user",
            Title = "Older Removed Workday",
            IsRemoved = true,
            RemovedAt = new DateTime(2026, 4, 5, 13, 0, 0, DateTimeKind.Utc)
        };
        var newerRemovedWorkday = new Workday
        {
            UserId = "test-user",
            Title = "Newer Removed Workday",
            IsRemoved = true,
            RemovedAt = new DateTime(2026, 4, 6, 13, 0, 0, DateTimeKind.Utc)
        };
        var legacyRemovedWorkday = new Workday
        {
            UserId = "test-user",
            Title = "Legacy Removed Workday",
            IsRemoved = true
        };

        testContext.DbContext.Workdays.AddRange(
            olderRemovedWorkday,
            newerRemovedWorkday,
            legacyRemovedWorkday);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateWorkdayService();

        var removedWorkdays = await service.GetArchivedWorkdays();

        removedWorkdays.Select(workday => workday.Id).Should().ContainInOrder(
            newerRemovedWorkday.Id,
            olderRemovedWorkday.Id,
            legacyRemovedWorkday.Id);
    }

    [Fact]
    public async Task CreateWorkday_defaults_status_to_draft()
    {
        await using var testContext = new ServiceTestContext();
        var service = testContext.CreateWorkdayService();

        var workday = await service.CreateWorkday(TestData.CreateWorkdayDto());

        workday.Status.Should().Be(WorkdayStatus.Draft);
    }

    [Fact]
    public async Task AddCowsToWorkday_creates_entries_for_existing_actions()
    {
        await using var testContext = new ServiceTestContext();
        var cow = TestData.Cow("test-user", "A-100");
        var workday = new Workday
        {
            UserId = "test-user",
            Title = "Morning Checks",
            Actions = new List<WorkdayAction>
            {
                new() { Name = "Vaccinate" },
                new() { Name = "Tag" }
            }
        };

        testContext.DbContext.Cows.Add(cow);
        testContext.DbContext.Workdays.Add(workday);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateWorkdayService();

        await service.AddCowToWorkday(workday.Id, cow.Id);

        testContext.DbContext.WorkdayEntries.Should().HaveCount(2);
        testContext.DbContext.WorkdayEntries.Should().OnlyContain(entry =>
            entry.WorkdayId == workday.Id &&
            entry.CowId == cow.Id &&
            entry.IsCompleted == false);
    }

    [Fact]
    public async Task AddActionToWorkday_creates_entries_for_existing_assigned_cows()
    {
        await using var testContext = new ServiceTestContext();
        var cowOne = TestData.Cow("test-user", "A-100");
        var cowTwo = TestData.Cow("test-user", "A-101");
        var workday = new Workday
        {
            UserId = "test-user",
            Title = "Morning Checks",
            WorkdayCows = new List<WorkdayCow>
            {
                new() { CowId = cowOne.Id },
                new() { CowId = cowTwo.Id }
            }
        };

        testContext.DbContext.Cows.AddRange(cowOne, cowTwo);
        testContext.DbContext.Workdays.Add(workday);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateWorkdayService();

        var action = await service.AddActionToWorkday(workday.Id, "Vaccinate");

        action.Name.Should().Be("Vaccinate");
        testContext.DbContext.WorkdayEntries.Should().HaveCount(2);
        testContext.DbContext.WorkdayEntries.Should().OnlyContain(entry =>
            entry.WorkdayId == workday.Id &&
            entry.ActionId == action.Id &&
            entry.IsCompleted == false);
    }

    [Fact]
    public async Task AddActionToWorkday_rejects_duplicate_name_case_insensitively()
    {
        await using var testContext = new ServiceTestContext();
        var workday = new Workday
        {
            UserId = "test-user",
            Title = "Morning Checks",
            Actions = new List<WorkdayAction>
            {
                new() { Name = "Vaccinate" }
            }
        };

        testContext.DbContext.Workdays.Add(workday);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateWorkdayService();

        var action = () => service.AddActionToWorkday(workday.Id, "vaccinate");

        await action.Should().ThrowAsync<ValidationException>()
            .WithMessage("Action already exists.");
    }

    [Fact]
    public async Task RemoveActionFromWorkday_removes_action()
    {
        await using var testContext = new ServiceTestContext();
        var workday = new Workday
        {
            UserId = "test-user",
            Title = "Morning Checks",
            Actions = new List<WorkdayAction>
            {
                new() { Name = "Vaccinate" }
            }
        };

        testContext.DbContext.Workdays.Add(workday);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateWorkdayService();

        await service.RemoveActionFromWorkday(workday.Id, workday.Actions[0].Id);

        testContext.DbContext.WorkdayActions.Should().BeEmpty();
    }

    [Fact]
    public async Task ToggleEntry_flips_completion_state()
    {
        await using var testContext = new ServiceTestContext();
        var cow = TestData.Cow("test-user", "A-100");
        var workday = new Workday
        {
            UserId = "test-user",
            Title = "Morning Checks"
        };
        var action = new WorkdayAction
        {
            WorkdayId = workday.Id,
            Name = "Vaccinate"
        };
        var entry = new WorkdayEntry
        {
            WorkdayId = workday.Id,
            CowId = cow.Id,
            ActionId = action.Id,
            IsCompleted = false
        };

        testContext.DbContext.Cows.Add(cow);
        testContext.DbContext.Workdays.Add(workday);
        testContext.DbContext.WorkdayActions.Add(action);
        testContext.DbContext.WorkdayEntries.Add(entry);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateWorkdayService();

        await service.ToggleEntry(workday.Id, cow.Id, action.Id);
        testContext.DbContext.WorkdayEntries.Single().IsCompleted.Should().BeTrue();

        await service.ToggleEntry(workday.Id, cow.Id, action.Id);
        testContext.DbContext.WorkdayEntries.Single().IsCompleted.Should().BeFalse();
    }

    [Fact]
    public async Task StartAndCompleteWorkday_update_status()
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
            },
            Actions = new List<WorkdayAction>
            {
                new() { Name = "Vaccinate" }
            }
        };

        testContext.DbContext.Cows.Add(cow);
        testContext.DbContext.Workdays.Add(workday);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateWorkdayService();

        await service.StartWorkday(workday.Id);
        testContext.DbContext.Workdays.Single().Status.Should().Be(WorkdayStatus.InProgress);

        await service.CompleteWorkday(workday.Id);
        testContext.DbContext.Workdays.Single().Status.Should().Be(WorkdayStatus.Completed);
    }

    [Fact]
    public async Task StartWorkday_requires_at_least_one_cow_and_one_action()
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
        var action = () => service.StartWorkday(workday.Id);

        await action.Should().ThrowAsync<ValidationException>()
            .WithMessage("Workday must have at least one cow and one action.");
    }
}
