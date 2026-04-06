using FluentAssertions;
using HerdFlow.Api.DTOs;
using HerdFlow.Api.Exceptions;
using HerdFlow.Api.Tests.TestInfrastructure;

namespace HerdFlow.Api.Tests.ServiceTests;

public class NoteServiceTests
{
    [Fact]
    public async Task CreateNoteAsync_rejects_blank_content()
    {
        await using var testContext = new ServiceTestContext();
        var cow = TestData.Cow("test-user");
        testContext.DbContext.Cows.Add(cow);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateNoteService();

        var action = () => service.CreateNoteAsync(cow.Id, new CreateNoteDto { Content = "   " });

        await action.Should().ThrowAsync<ValidationException>()
            .WithMessage("Note content is required.");
    }

    [Fact]
    public async Task CreateNoteAsync_trims_content()
    {
        await using var testContext = new ServiceTestContext();
        var cow = TestData.Cow("test-user");
        testContext.DbContext.Cows.Add(cow);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateNoteService();

        var note = await service.CreateNoteAsync(cow.Id, new CreateNoteDto { Content = "  Needs check  " });

        note.Content.Should().Be("Needs check");
    }

    [Fact]
    public async Task GetNotesAsync_only_returns_notes_for_current_user()
    {
        await using var testContext = new ServiceTestContext();
        var cow = TestData.Cow("test-user");
        testContext.DbContext.Cows.Add(cow);
        testContext.DbContext.Notes.AddRange(
            TestData.Note("test-user", cow.Id, "Mine"),
            TestData.Note("other-user", cow.Id, "Not mine"));
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateNoteService();

        var notes = await service.GetNotesAsync(cow.Id);

        notes.Should().ContainSingle();
        notes[0].Content.Should().Be("Mine");
    }

    [Fact]
    public async Task GetNotesAsync_throws_when_cow_does_not_exist_for_current_user()
    {
        await using var testContext = new ServiceTestContext();
        var cow = TestData.Cow("other-user");
        testContext.DbContext.Cows.Add(cow);
        await testContext.DbContext.SaveChangesAsync();

        var service = testContext.CreateNoteService();

        var action = () => service.GetNotesAsync(cow.Id);

        await action.Should().ThrowAsync<NotFoundException>()
            .WithMessage("Cow not found.");
    }
}
