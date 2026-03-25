using Microsoft.EntityFrameworkCore;
using HerdFlow.Api.Models;
using System.Net.Http.Headers;

namespace HerdFlow.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Cow> Cows { get; set; }

    public DbSet<Note> Notes { get; set; }

    public DbSet<ActivityLogEntry> ActivityLogEntries { get; set; }

    public DbSet<Workday> Workdays { get; set; }
    public DbSet<WorkdayCow> WorkdayCows { get; set; }
    public DbSet<WorkdayNote> WorkdayNotes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cow>()
            .Property(c => c.HealthStatus)
            .HasConversion<string>();

        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<WorkdayCow>()
            .HasIndex(wc => new { wc.WorkdayId, wc.CowId })
            .IsUnique();

        // 👇 ADD THIS
        modelBuilder.Entity<WorkdayCow>()
            .HasOne(wc => wc.Workday)
            .WithMany(w => w.WorkdayCows)
            .HasForeignKey(wc => wc.WorkdayId);

        modelBuilder.Entity<WorkdayCow>()
            .HasOne(wc => wc.Cow)
            .WithMany(c => c.WorkdayCows)
            .HasForeignKey(wc => wc.CowId);

        modelBuilder.Entity<WorkdayNote>()
            .HasOne(n => n.Workday)
            .WithMany(w => w.WorkdayNotes)
            .HasForeignKey(n => n.WorkdayId);
    }

}
