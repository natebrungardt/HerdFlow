using Microsoft.EntityFrameworkCore;
using HerdFlow.Api.Models;
using HerdFlow.Api.Models.Enums;

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
    public DbSet<WorkdayAction> WorkdayActions { get; set; }
    public DbSet<WorkdayEntry> WorkdayEntries { get; set; }

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

        modelBuilder.Entity<Workday>()
            .Property(w => w.Status)
            .HasConversion<int>()
            .HasDefaultValue(WorkdayStatus.Draft);

        modelBuilder.Entity<Workday>()
            .HasIndex(w => new { w.UserId, w.Status, w.CreatedAt });

        modelBuilder.Entity<Workday>()
            .HasIndex(w => new { w.UserId, w.Status, w.CompletedAt });

        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<WorkdayCow>()
            .HasIndex(wc => new { wc.WorkdayId, wc.CowId })
            .IsUnique();

        modelBuilder.Entity<WorkdayCow>()
            .HasOne(wc => wc.Workday)
            .WithMany(w => w.WorkdayCows)
            .HasForeignKey(wc => wc.WorkdayId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WorkdayCow>()
            .HasOne(wc => wc.Cow)
            .WithMany(c => c.WorkdayCows)
            .HasForeignKey(wc => wc.CowId);

        modelBuilder.Entity<WorkdayNote>()
            .HasOne(n => n.Workday)
            .WithMany(w => w.WorkdayNotes)
            .HasForeignKey(n => n.WorkdayId);

        modelBuilder.Entity<WorkdayAction>()
            .Property(a => a.CreatedAt)
            .HasDefaultValueSql("NOW()");

        modelBuilder.Entity<WorkdayAction>()
            .HasOne(a => a.Workday)
            .WithMany(w => w.Actions)
            .HasForeignKey(a => a.WorkdayId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WorkdayEntry>()
            .HasKey(e => new { e.WorkdayId, e.CowId, e.ActionId });

        modelBuilder.Entity<WorkdayEntry>()
            .Property(e => e.IsCompleted)
            .HasDefaultValue(false);

        modelBuilder.Entity<WorkdayEntry>()
            .HasOne(e => e.Workday)
            .WithMany(w => w.Entries)
            .HasForeignKey(e => e.WorkdayId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WorkdayEntry>()
            .HasOne(e => e.Cow)
            .WithMany(c => c.WorkdayEntries)
            .HasForeignKey(e => e.CowId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WorkdayEntry>()
            .HasOne(e => e.WorkdayAction)
            .WithMany(a => a.Entries)
            .HasForeignKey(e => e.ActionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ActivityLogEntry>()
            .HasOne(a => a.Workday)
            .WithMany()
            .HasForeignKey(a => a.WorkdayId)
            .OnDelete(DeleteBehavior.SetNull);
    }

}
