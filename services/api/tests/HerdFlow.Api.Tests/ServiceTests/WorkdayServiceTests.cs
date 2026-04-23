using FluentAssertions;
using HerdFlow.Api.Exceptions;
using HerdFlow.Api.Models;
using HerdFlow.Api.Models.Enums;
using HerdFlow.Api.Tests.TestInfrastructure;

namespace HerdFlow.Api.Tests.ServiceTests;

public class WorkdayServiceTests
{
    [Fact]
    public async Task CreateWorkday_defaults_date_and_starts_with_no_assigned_cows()
    {
        await using var testContext = new ServiceTestContext();
        var service = testContext.CreateWorkdayService();
        var before = DateOnly.FromDateTime(DateTime.UtcNow);

        var workday = await service.CreateWorkday(TestData.CreateWorkdayDto());

        workday.Date.Should().Be(before);
        workday.WorkdayCows.Should().BeEmpty();
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
            .WithMessage("One or more cows could not be added to the workday.");
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
    public async Task CompleteWorkday_moves_workday_into_completed_results()
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

        await service.CompleteWorkday(workday.Id);

        var activeWorkdays = await service.GetActiveWorkdays();
        var completedWorkdays = await service.GetCompletedWorkdays();
        var updatedWorkday = await service.GetWorkdayById(workday.Id);

        activeWorkdays.Should().BeEmpty();
        completedWorkdays.Should().ContainSingle(w => w.Id == workday.Id);
        updatedWorkday.Status.Should().Be(WorkdayStatus.Completed);
        updatedWorkday.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task GetCompletedWorkdays_returns_most_recent_first()
    {
        await using var testContext = new ServiceTestContext();
        var olderCompletedWorkday = new Workday
        {
            UserId = "test-user",
            Title = "Older Completed Workday",
            Status = WorkdayStatus.Completed,
            Date = new DateOnly(2026, 4, 6),
            CreatedAt = new DateTime(2026, 4, 5, 13, 0, 0, DateTimeKind.Utc),
            CompletedAt = new DateTime(2026, 4, 5, 14, 0, 0, DateTimeKind.Utc)
        };
        var newerCompletedWorkday = new Workday
        {
            UserId = "test-user",
            Title = "Newer Completed Workday",
            Status = WorkdayStatus.Completed,
            Date = new DateOnly(2026, 4, 5),
            CreatedAt = new DateTime(2026, 4, 6, 13, 0, 0, DateTimeKind.Utc),
            CompletedAt = new DateTime(2026, 4, 6, 14, 0, 0, DateTimeKind.Utc)
        };
        var draftWorkday = new Workday
        {
            UserId = "test-user",
            Title = "Draft Workday",
            Status = WorkdayStatus.Draft,
            Date = new DateOnly(2026, 4, 7),
            CreatedAt = new DateTime(2026, 4, 7, 13, 0, 0, DateTimeKind.Utc)
        };

        testContext.DbContext.Workdays.AddRange(
            olderCompletedWorkday,
            newerCompletedWorkday,
            draftWorkday);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateWorkdayService();

        var completedWorkdays = await service.GetCompletedWorkdays();

        completedWorkdays.Select(workday => workday.Id).Should().ContainInOrder(
            newerCompletedWorkday.Id,
            olderCompletedWorkday.Id);
    }

    [Fact]
    public async Task GetCompletedWorkdays_falls_back_to_created_at_when_completed_at_is_missing()
    {
        await using var testContext = new ServiceTestContext();
        var legacyCompletedWorkday = new Workday
        {
            UserId = "test-user",
            Title = "Legacy Completed Workday",
            Status = WorkdayStatus.Completed,
            CreatedAt = new DateTime(2026, 4, 5, 13, 0, 0, DateTimeKind.Utc)
        };
        var newerLegacyCompletedWorkday = new Workday
        {
            UserId = "test-user",
            Title = "Newer Legacy Completed Workday",
            Status = WorkdayStatus.Completed,
            CreatedAt = new DateTime(2026, 4, 6, 13, 0, 0, DateTimeKind.Utc)
        };

        testContext.DbContext.Workdays.AddRange(
            legacyCompletedWorkday,
            newerLegacyCompletedWorkday);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateWorkdayService();

        var completedWorkdays = await service.GetCompletedWorkdays();

        completedWorkdays.Select(workday => workday.Id).Should().ContainInOrder(
            newerLegacyCompletedWorkday.Id,
            legacyCompletedWorkday.Id);
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

        await service.AddCowsToWorkday(workday.Id, new List<Guid> { cow.Id });

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
    public async Task SetEntryCompletion_updates_completion_state()
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

        await service.SetEntryCompletion(workday.Id, cow.Id, action.Id, true);
        testContext.DbContext.WorkdayEntries.Single().IsCompleted.Should().BeTrue();

        await service.SetEntryCompletion(workday.Id, cow.Id, action.Id, false);
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
