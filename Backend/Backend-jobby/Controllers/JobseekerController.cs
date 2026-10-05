using Backend_jobby.Data;
using Backend_jobby.DTOs;
using Backend_jobby.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_jobby.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobseekerController : ControllerBase
{
    private readonly AppDbContext _context;

    public JobseekerController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/jobseeker/profile
    [HttpGet("profile")]
    public async Task<ActionResult<JobseekerProfileDto>> GetProfile()
    {
        var profile = await _context.JobseekerProfiles
            .AsNoTracking()
            .Include(p => p.Skills)
            .Include(p => p.Accommodations)
            .Include(p => p.Schedules)
            .Include(p => p.Experiences)
            .FirstOrDefaultAsync();

        if (profile == null)
            return NotFound("Profile not found");

        return Ok(MapToDto(profile));
    }

    // PUT: api/jobseeker/profile
    [HttpPut("profile")]
    public async Task<ActionResult<JobseekerProfileDto>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var profile = await _context.JobseekerProfiles
            .Include(p => p.Skills)
            .Include(p => p.Accommodations)
            .Include(p => p.Schedules)
            .Include(p => p.Experiences)
            .FirstOrDefaultAsync();

        if (profile == null)
            return NotFound("Profile not found");

        profile.FullName = request.FullName;
        profile.Phone = request.Phone;
        profile.City = request.City;
        profile.MinHourlyPay = request.MinHourlyPay;
        profile.Summary = request.Summary;
        profile.Availability = request.Availability;
        profile.Conditions = request.Conditions;
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
