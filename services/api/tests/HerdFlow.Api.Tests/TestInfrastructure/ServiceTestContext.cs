using HerdFlow.Api.Data;
using HerdFlow.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace HerdFlow.Api.Tests.TestInfrastructure;

internal sealed class ServiceTestContext : IAsyncDisposable
{
    private readonly SqliteConnection _connection;

    public ServiceTestContext(string userId = "test-user")
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        DbContext = new AppDbContext(options);
        DbContext.Database.EnsureCreated();

        HttpContextAccessor = new HttpContextAccessor();
        SetCurrentUser(userId);
    }

    public AppDbContext DbContext { get; }

    public HttpContextAccessor HttpContextAccessor { get; }

    public void SetCurrentUser(string userId)
    {
        HttpContextAccessor.HttpContext = new DefaultHttpContext
        {
            User = TestClaimsPrincipalFactory.Create(userId)
        };
    }

    public CowService CreateCowService()
    {
        var activityLogService = new ActivityLogService(DbContext, HttpContextAccessor);
        var changeLogService = new CowChangeLogService();
        return new CowService(DbContext, activityLogService, changeLogService, HttpContextAccessor);
    }

    public WorkdayService CreateWorkdayService() => new(DbContext, HttpContextAccessor);

    public NoteService CreateNoteService() => new(DbContext, HttpContextAccessor);

    public async ValueTask DisposeAsync()
    {
        await DbContext.DisposeAsync();
        await _connection.DisposeAsync();
    }
}
