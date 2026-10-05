namespace Backend_jobby.Models;

public class JobseekerSkill
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobseekerProfileId { get; set; }
    public JobseekerProfile JobseekerProfile { get; set; } = null!;
    public string SkillCode { get; set; } = string.Empty;
}

public class JobseekerAccommodation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobseekerProfileId { get; set; }
    public JobseekerProfile JobseekerProfile { get; set; } = null!;
    public string AccommodationCode { get; set; } = string.Empty;
}

public class JobseekerSchedule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobseekerProfileId { get; set; }
    public JobseekerProfile JobseekerProfile { get; set; } = null!;
    public string ScheduleCode { get; set; } = string.Empty;
}

public class JobseekerExperience
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobseekerProfileId { get; set; }
    public JobseekerProfile JobseekerProfile { get; set; } = null!;
    public string RoleTitle { get; set; } = string.Empty;
    public string Organization { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
