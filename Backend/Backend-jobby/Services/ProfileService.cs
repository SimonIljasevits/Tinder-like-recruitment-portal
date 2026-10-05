using Backend_jobby.Data;
using Backend_jobby.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend_jobby.Services;

public class ProfileService
{
    private readonly AppDbContext _context;

    public ProfileService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<JobseekerProfile> GetOrCreateProfileAsync(string? candidateName)
    {
        var name = string.IsNullOrWhiteSpace(candidateName) ? "Kadri Lepik" : candidateName.Trim();

        var profile = await _context.JobseekerProfiles
            .Include(p => p.User)
            .Include(p => p.Skills)
            .Include(p => p.Accommodations)
            .Include(p => p.Schedules)
            .Include(p => p.Experiences)
            .Include(p => p.IgnoredJobs)
            .Include(p => p.SavedJobs)
            .Include(p => p.Applications)
            .FirstOrDefaultAsync(p => p.FullName.ToLower() == name.ToLower());

        if (profile != null)
            return profile;

        // Auto-create a fresh profile for this new candidate session
        var cleanName = name.ToLower().Replace(" ", ".");
        var email = $"{cleanName}@example.ee";
        if (await _context.Users.AnyAsync(u => u.Email == email))
        {
            email = $"{cleanName}_{Guid.NewGuid().ToString()[..4]}@example.ee";
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            PasswordHash = "demo_hash",
            Role = "Jobseeker"
        };
        _context.Users.Add(user);

        profile = new JobseekerProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            FullName = name,
            Phone = "+372 5000 0000",
            City = "Tallinn",
            MinHourlyPay = 7.00m,
            Summary = $"Tööotsija {name}.",
            Availability = "Saadaval kokkuleppel.",
            Conditions = "Tõstan kuni 10 kg. Vajan astmeteta ligipääsu.",
            Skills = new List<JobseekerSkill>
            {
                new() { SkillCode = "commercial" },
                new() { SkillCode = "floor" }
            },
            Accommodations = new List<JobseekerAccommodation>
            {
                new() { AccommodationCode = "max10" },
                new() { AccommodationCode = "stepfree" }
            },
            Schedules = new List<JobseekerSchedule>
            {
                new() { ScheduleCode = "evening" },
                new() { ScheduleCode = "parttime" }
            },
            Experiences = new List<JobseekerExperience>
            {
                new()
                {
                    RoleTitle = "Koristaja",
                    Organization = "Büroohaldus OÜ",
                    Period = "2023–2026",
                    Description = "Kontorite koristus ja hooldus."
                }
            }
        };

        _context.JobseekerProfiles.Add(profile);
        await _context.SaveChangesAsync();

        return profile;
    }
}
