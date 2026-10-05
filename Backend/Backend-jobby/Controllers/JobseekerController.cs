using Backend_jobby.Data;
using Backend_jobby.DTOs;
using Backend_jobby.Models;
using Backend_jobby.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_jobby.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobseekerController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ProfileService _profileService;

    public JobseekerController(AppDbContext context, ProfileService profileService)
    {
        _context = context;
        _profileService = profileService;
    }

    // GET: api/jobseeker/profile
    [HttpGet("profile")]
    public async Task<ActionResult<JobseekerProfileDto>> GetProfile(
        [FromHeader(Name = "X-Candidate-Name")] string? headerName,
        [FromQuery] string? name)
    {
        var candidateName = !string.IsNullOrWhiteSpace(headerName)
            ? Uri.UnescapeDataString(headerName)
            : name;

        var profile = await _profileService.GetOrCreateProfileAsync(candidateName);
        return Ok(MapToDto(profile));
    }

    // PUT: api/jobseeker/profile
    [HttpPut("profile")]
    public async Task<ActionResult<JobseekerProfileDto>> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        [FromHeader(Name = "X-Candidate-Name")] string? headerName)
    {
        var candidateName = !string.IsNullOrWhiteSpace(request.FullName)
            ? request.FullName
            : (!string.IsNullOrWhiteSpace(headerName) ? Uri.UnescapeDataString(headerName) : "Kadri Lepik");

        var profile = await _profileService.GetOrCreateProfileAsync(candidateName);

        profile.FullName = candidateName;
        if (!string.IsNullOrWhiteSpace(request.Phone)) profile.Phone = request.Phone;
        if (!string.IsNullOrWhiteSpace(request.City)) profile.City = request.City;
        if (request.MinHourlyPay > 0) profile.MinHourlyPay = request.MinHourlyPay;
        if (request.Summary != null) profile.Summary = request.Summary;
        if (request.Availability != null) profile.Availability = request.Availability;
        if (request.Conditions != null) profile.Conditions = request.Conditions;
        profile.UpdatedAt = DateTime.UtcNow;

        // Replace skills
        _context.JobseekerSkills.RemoveRange(profile.Skills);
        profile.Skills = request.Skills.Select(s => new JobseekerSkill { SkillCode = s }).ToList();

        // Replace accommodations
        _context.JobseekerAccommodations.RemoveRange(profile.Accommodations);
        profile.Accommodations = request.Accommodations.Select(a => new JobseekerAccommodation { AccommodationCode = a }).ToList();

        // Replace schedules
        _context.JobseekerSchedules.RemoveRange(profile.Schedules);
        profile.Schedules = request.Schedules.Select(s => new JobseekerSchedule { ScheduleCode = s }).ToList();

        // Replace experiences
        _context.JobseekerExperiences.RemoveRange(profile.Experiences);
        profile.Experiences = request.Experiences.Select(e => new JobseekerExperience
        {
            RoleTitle = e.RoleTitle,
            Organization = e.Organization,
            Period = e.Period,
            Description = e.Description
        }).ToList();

        await _context.SaveChangesAsync();

        return Ok(MapToDto(profile));
    }

    private static JobseekerProfileDto MapToDto(JobseekerProfile p) => new()
    {
        Id = p.Id,
        FullName = p.FullName,
        Phone = p.Phone,
        City = p.City,
        MinHourlyPay = p.MinHourlyPay,
        Summary = p.Summary,
        Availability = p.Availability,
        Conditions = p.Conditions,
        Skills = p.Skills.Select(s => s.SkillCode).ToList(),
        Accommodations = p.Accommodations.Select(a => a.AccommodationCode).ToList(),
        Schedules = p.Schedules.Select(s => s.ScheduleCode).ToList(),
        Experiences = p.Experiences.Select(e => new ExperienceDto
        {
            RoleTitle = e.RoleTitle,
            Organization = e.Organization,
            Period = e.Period,
            Description = e.Description
        }).ToList()
    };
}
