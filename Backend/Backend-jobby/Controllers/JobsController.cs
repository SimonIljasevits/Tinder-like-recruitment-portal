using Backend_jobby.Data;
using Backend_jobby.DTOs;
using Backend_jobby.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_jobby.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobsController : ControllerBase
{
    private readonly AppDbContext _context;

    public JobsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/jobs
    [HttpGet]
    public async Task<ActionResult<IEnumerable<JobDto>>> GetAllJobs()
    {
        var jobs = await _context.Jobs
            .AsNoTracking()
            .Where(j => j.IsActive)
            .Include(j => j.Shifts)
            .Include(j => j.Accommodations)
            .Include(j => j.Requirements)
            .Include(j => j.Offers)
            .Select(j => MapToDto(j))
            .ToListAsync();

        return Ok(jobs);
    }

    // GET: api/jobs/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<JobDto>> GetJobById(Guid id)
    {
        var job = await _context.Jobs
            .AsNoTracking()
            .Include(j => j.Shifts)
            .Include(j => j.Accommodations)
            .Include(j => j.Requirements)
            .Include(j => j.Offers)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (job == null)
            return NotFound();

        return Ok(MapToDto(job));
    }

    // GET: api/jobs/deck
    // Matches the frontend fits(job, profile) logic where a job must satisfy 100% of candidate conditions
    [HttpGet("deck")]
    public async Task<ActionResult<IEnumerable<JobDto>>> GetDeck()
    {
        var profile = await _context.JobseekerProfiles
            .Include(p => p.Skills)
            .Include(p => p.Accommodations)
            .Include(p => p.Schedules)
            .Include(p => p.IgnoredJobs)
            .Include(p => p.SavedJobs)
            .Include(p => p.Applications)
            .FirstOrDefaultAsync();

        if (profile == null)
            return NotFound("No jobseeker profile found.");

        var candidateSkills = profile.Skills.Select(s => s.SkillCode).ToHashSet();
        var requiredAccommodations = profile.Accommodations.Select(a => a.AccommodationCode).ToList();
        var candidateSchedules = profile.Schedules.Select(s => s.ScheduleCode).ToHashSet();
        var minPay = profile.MinHourlyPay;

        var seenJobIds = profile.IgnoredJobs.Select(ij => ij.JobId)
            .Concat(profile.SavedJobs.Select(sj => sj.JobId))
            .Concat(profile.Applications.Select(a => a.JobId))
            .ToHashSet();

        var jobs = await _context.Jobs
            .AsNoTracking()
            .Where(j => j.IsActive && !seenJobIds.Contains(j.Id))
            .Include(j => j.Shifts)
            .Include(j => j.Accommodations)
            .Include(j => j.Requirements)
            .Include(j => j.Offers)
            .ToListAsync();

        // 100% match filter
        var matchingJobs = jobs.Where(j =>
        {
            // 1. Skill match
            if (!candidateSkills.Contains(j.PrimarySkill))
                return false;

            // 2. Pay rate must meet or exceed minimum
            if (j.HourlyPay < minPay)
                return false;

            // 3. Must provide ALL accommodations required by candidate
            var jobAccoms = j.Accommodations.Select(a => a.AccommodationCode).ToHashSet();
            if (!requiredAccommodations.All(a => jobAccoms.Contains(a)))
                return false;

            // 4. Must match at least ONE of the candidate's preferred schedules
            var jobShifts = j.Shifts.Select(s => s.ShiftCode).ToHashSet();
            if (!candidateSchedules.Any(s => jobShifts.Contains(s)))
                return false;

            return true;
        }).Select(MapToDto).ToList();

        return Ok(matchingJobs);
    }

    private static JobDto MapToDto(Job j) => new()
    {
        Id = j.Id,
        CompanyName = j.CompanyName,
        CompanyInitials = j.CompanyInitials,
        Title = j.Title,
        HourlyPay = j.HourlyPay,
        PrimarySkill = j.PrimarySkill,
        Location = j.Location,
        DistanceKm = j.DistanceKm,
        WorkingHours = j.WorkingHours,
        StartDateText = j.StartDateText,
        Description = j.Description,
        FirstMessage = j.FirstMessage,
        Shifts = j.Shifts.Select(s => s.ShiftCode).ToList(),
        Accommodations = j.Accommodations.Select(a => a.AccommodationCode).ToList(),
        Requirements = j.Requirements.Select(r => r.RequirementText).ToList(),
        Offers = j.Offers.Select(o => o.OfferText).ToList()
    };
}
