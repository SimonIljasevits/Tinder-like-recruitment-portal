namespace Backend_jobby.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Jobseeker"; // "Jobseeker" or "Employer"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public JobseekerProfile? JobseekerProfile { get; set; }
    public EmployerProfile? EmployerProfile { get; set; }
}
