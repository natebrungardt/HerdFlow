using Microsoft.EntityFrameworkCore;
using HerdFlow.Api.Models;

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
        // Convert enums to string so they match text columns in Postgres
        modelBuilder.Entity<Cow>()
            .Property(c => c.HealthStatus)
            .HasConversion<string>();

        modelBuilder.Entity<Cow>()
            .Property(c => c.LivestockGroup)
            .HasConversion<string>();

        modelBuilder.Entity<Cow>()
            .Property(c => c.HeatStatus)
            .HasConversion<string>();

        modelBuilder.Entity<Cow>()
            .HasOne(c => c.Sire)
            .WithMany(c => c.SiredOffspring)
            .HasForeignKey(c => c.SireId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Cow>()
            .HasOne(c => c.Dam)
            .WithMany(c => c.BirthedOffspring)
            .HasForeignKey(c => c.DamId)
            .OnDelete(DeleteBehavior.SetNull);

        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<WorkdayCow>()
            .HasIndex(wc => new { wc.WorkdayId, wc.CowId })
            .IsUnique();

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
