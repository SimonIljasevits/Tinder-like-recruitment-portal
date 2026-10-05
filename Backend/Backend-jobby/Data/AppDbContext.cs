using Backend_jobby.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_jobby.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<JobseekerProfile> JobseekerProfiles => Set<JobseekerProfile>();
    public DbSet<EmployerProfile> EmployerProfiles => Set<EmployerProfile>();

    public DbSet<JobseekerSkill> JobseekerSkills => Set<JobseekerSkill>();
    public DbSet<JobseekerAccommodation> JobseekerAccommodations => Set<JobseekerAccommodation>();
    public DbSet<JobseekerSchedule> JobseekerSchedules => Set<JobseekerSchedule>();
    public DbSet<JobseekerExperience> JobseekerExperiences => Set<JobseekerExperience>();

    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<JobShift> JobShifts => Set<JobShift>();
    public DbSet<JobAccommodation> JobAccommodations => Set<JobAccommodation>();
    public DbSet<JobRequirement> JobRequirements => Set<JobRequirement>();
    public DbSet<JobOffer> JobOffers => Set<JobOffer>();

    public DbSet<IgnoredJob> IgnoredJobs => Set<IgnoredJob>();
    public DbSet<SavedJob> SavedJobs => Set<SavedJob>();
    public DbSet<Application> Applications => Set<Application>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
        });

        // 1-to-1 User <-> JobseekerProfile
        modelBuilder.Entity<JobseekerProfile>(entity =>
        {
            entity.HasOne(jp => jp.User)
                  .WithOne(u => u.JobseekerProfile)
                  .HasForeignKey<JobseekerProfile>(jp => jp.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(jp => jp.MinHourlyPay)
                  .HasPrecision(6, 2);
        });

        // 1-to-1 User <-> EmployerProfile
        modelBuilder.Entity<EmployerProfile>(entity =>
        {
            entity.HasOne(ep => ep.User)
                  .WithOne(u => u.EmployerProfile)
                  .HasForeignKey<EmployerProfile>(ep => ep.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Job
        modelBuilder.Entity<Job>(entity =>
        {
            entity.Property(j => j.HourlyPay)
                  .HasPrecision(6, 2);

            entity.Property(j => j.DistanceKm)
                  .HasPrecision(5, 1);

            entity.HasOne(j => j.EmployerProfile)
                  .WithMany(ep => ep.PostedJobs)
                  .HasForeignKey(j => j.EmployerProfileId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Unique constraints on swipes/actions
        modelBuilder.Entity<IgnoredJob>(entity =>
        {
            entity.HasIndex(ij => new { ij.JobseekerProfileId, ij.JobId }).IsUnique();

            entity.HasOne(ij => ij.JobseekerProfile)
                  .WithMany(jp => jp.IgnoredJobs)
                  .HasForeignKey(ij => ij.JobseekerProfileId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ij => ij.Job)
                  .WithMany(j => j.IgnoredJobs)
                  .HasForeignKey(ij => ij.JobId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SavedJob>(entity =>
        {
            entity.HasIndex(sj => new { sj.JobseekerProfileId, sj.JobId }).IsUnique();

            entity.HasOne(sj => sj.JobseekerProfile)
                  .WithMany(jp => jp.SavedJobs)
                  .HasForeignKey(sj => sj.JobseekerProfileId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sj => sj.Job)
                  .WithMany(j => j.SavedJobs)
                  .HasForeignKey(sj => sj.JobId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Application>(entity =>
        {
            entity.HasIndex(a => new { a.JobseekerProfileId, a.JobId }).IsUnique();

            entity.HasOne(a => a.JobseekerProfile)
                  .WithMany(jp => jp.Applications)
                  .HasForeignKey(a => a.JobseekerProfileId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.Job)
                  .WithMany(j => j.Applications)
                  .HasForeignKey(a => a.JobId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Application 1-to-1 Conversation
        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.HasOne(c => c.Application)
                  .WithOne(a => a.Conversation)
                  .HasForeignKey<Conversation>(c => c.ApplicationId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Message
        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasOne(m => m.Conversation)
                  .WithMany(c => c.Messages)
                  .HasForeignKey(m => m.ConversationId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.SenderUser)
                  .WithMany()
                  .HasForeignKey(m => m.SenderUserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
