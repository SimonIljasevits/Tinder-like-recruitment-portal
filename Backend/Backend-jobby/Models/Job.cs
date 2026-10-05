namespace Backend_jobby.Models;

public class Job
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid? EmployerProfileId { get; set; }
    public EmployerProfile? EmployerProfile { get; set; }

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
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<JobShift> Shifts { get; set; } = new();
    public List<JobAccommodation> Accommodations { get; set; } = new();
    public List<JobRequirement> Requirements { get; set; } = new();
    public List<JobOffer> Offers { get; set; } = new();

    public List<IgnoredJob> IgnoredJobs { get; set; } = new();
    public List<SavedJob> SavedJobs { get; set; } = new();
    public List<Application> Applications { get; set; } = new();
}

public class JobShift
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobId { get; set; }
    public Job Job { get; set; } = null!;
    public string ShiftCode { get; set; } = string.Empty;
}

public class JobAccommodation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobId { get; set; }
    public Job Job { get; set; } = null!;
    public string AccommodationCode { get; set; } = string.Empty;
}

public class JobRequirement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobId { get; set; }
    public Job Job { get; set; } = null!;
    public string RequirementText { get; set; } = string.Empty;
}

public class JobOffer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobId { get; set; }
    public Job Job { get; set; } = null!;
    public string OfferText { get; set; } = string.Empty;
}
