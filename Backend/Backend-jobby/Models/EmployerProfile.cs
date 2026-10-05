namespace Backend_jobby.Models;

public class EmployerProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string FullName { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? CompanyInitials { get; set; }
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Job> PostedJobs { get; set; } = new();
}
