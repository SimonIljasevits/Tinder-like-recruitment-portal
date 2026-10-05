namespace Backend_jobby.DTOs;

public class JobDto
{
    public Guid Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? CompanyInitials { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal HourlyPay { get; set; }
    public string PrimarySkill { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal DistanceKm { get; set; }
    public string? WorkingHours { get; set; }
    public string? StartDateText { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? FirstMessage { get; set; }

    public List<string> Shifts { get; set; } = new();
    public List<string> Accommodations { get; set; } = new();
    public List<string> Requirements { get; set; } = new();
    public List<string> Offers { get; set; } = new();
}

public class JobseekerProfileDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? City { get; set; }
    public decimal MinHourlyPay { get; set; }
    public string? Summary { get; set; }
    public string? Availability { get; set; }
    public string? Conditions { get; set; }

    public List<string> Skills { get; set; } = new();
    public List<string> Accommodations { get; set; } = new();
    public List<string> Schedules { get; set; } = new();
    public List<ExperienceDto> Experiences { get; set; } = new();
}

public class UpdateProfileRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? City { get; set; }
    public decimal MinHourlyPay { get; set; }
    public string? Summary { get; set; }
    public string? Availability { get; set; }
    public string? Conditions { get; set; }

    public List<string> Skills { get; set; } = new();
    public List<string> Accommodations { get; set; } = new();
    public List<string> Schedules { get; set; } = new();
    public List<ExperienceDto> Experiences { get; set; } = new();
}

public class ExperienceDto
{
    public string RoleTitle { get; set; } = string.Empty;
    public string Organization { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class SwipeRequest
{
    public Guid JobId { get; set; }
}

public class ApplyRequest
{
    public Guid JobId { get; set; }
    public bool IsTailoredCv { get; set; }
    public string? CvSnapshotJson { get; set; }
}

public class MessageRequest
{
    public string Content { get; set; } = string.Empty;
}
