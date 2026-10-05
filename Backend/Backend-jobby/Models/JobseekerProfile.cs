namespace Backend_jobby.Models;

public class JobseekerProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? City { get; set; }
    public decimal MinHourlyPay { get; set; } = 7.00m;
    public string? Summary { get; set; }
    public string? Availability { get; set; }
    public string? Conditions { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<JobseekerSkill> Skills { get; set; } = new();
    public List<JobseekerAccommodation> Accommodations { get; set; } = new();
    public List<JobseekerSchedule> Schedules { get; set; } = new();
    public List<JobseekerExperience> Experiences { get; set; } = new();

    public List<IgnoredJob> IgnoredJobs { get; set; } = new();
    public List<SavedJob> SavedJobs { get; set; } = new();
    public List<Application> Applications { get; set; } = new();
}
