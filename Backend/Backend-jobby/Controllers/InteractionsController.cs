using Backend_jobby.Data;
using Backend_jobby.DTOs;
using Backend_jobby.Models;
using Backend_jobby.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_jobby.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InteractionsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ProfileService _profileService;

    public InteractionsController(AppDbContext context, ProfileService profileService)
    {
        _context = context;
        _profileService = profileService;
    }

    private string ResolveCandidateName(string? headerName, string? queryName)
    {
        if (!string.IsNullOrWhiteSpace(headerName))
            return Uri.UnescapeDataString(headerName);
        if (!string.IsNullOrWhiteSpace(queryName))
            return queryName;
        return "Kadri Lepik";
    }

    // POST: api/interactions/pass (Swipe Left)
    [HttpPost("pass")]
    public async Task<IActionResult> PassJob(
        [FromBody] SwipeRequest request,
        [FromHeader(Name = "X-Candidate-Name")] string? headerName,
        [FromQuery] string? name)
    {
        var candidateName = ResolveCandidateName(headerName, name);
        var profile = await _profileService.GetOrCreateProfileAsync(candidateName);

        var exists = await _context.IgnoredJobs.AnyAsync(ij => ij.JobseekerProfileId == profile.Id && ij.JobId == request.JobId);
        if (!exists)
        {
            _context.IgnoredJobs.Add(new IgnoredJob
            {
                JobseekerProfileId = profile.Id,
                JobId = request.JobId
            });
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Job passed" });
    }

    // POST: api/interactions/save (Swipe Up)
    [HttpPost("save")]
    public async Task<IActionResult> SaveJob(
        [FromBody] SwipeRequest request,
        [FromHeader(Name = "X-Candidate-Name")] string? headerName,
        [FromQuery] string? name)
    {
        var candidateName = ResolveCandidateName(headerName, name);
        var profile = await _profileService.GetOrCreateProfileAsync(candidateName);

        var exists = await _context.SavedJobs.AnyAsync(sj => sj.JobseekerProfileId == profile.Id && sj.JobId == request.JobId);
        if (!exists)
        {
            _context.SavedJobs.Add(new SavedJob
            {
                JobseekerProfileId = profile.Id,
                JobId = request.JobId
            });
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Job saved" });
    }

    // POST: api/interactions/apply (Swipe Right / Submit Application)
    [HttpPost("apply")]
    public async Task<IActionResult> ApplyToJob(
        [FromBody] ApplyRequest request,
        [FromHeader(Name = "X-Candidate-Name")] string? headerName,
        [FromQuery] string? name)
    {
        var candidateName = ResolveCandidateName(headerName, name);
        var profile = await _profileService.GetOrCreateProfileAsync(candidateName);

        var job = await _context.Jobs.FindAsync(request.JobId);
        if (job == null) return NotFound("Job not found");

        var existingApp = await _context.Applications
            .FirstOrDefaultAsync(a => a.JobseekerProfileId == profile.Id && a.JobId == request.JobId);

        if (existingApp != null)
        {
            return Ok(new { message = "Already applied", applicationId = existingApp.Id, status = existingApp.Status });
        }

        var application = new Application
        {
            JobseekerProfileId = profile.Id,
            JobId = request.JobId,
            Status = "Pending",
            IsTailoredCv = request.IsTailoredCv,
            CvSnapshotJson = request.CvSnapshotJson,
            AppliedAt = DateTime.UtcNow
        };

        _context.Applications.Add(application);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Application submitted", applicationId = application.Id, status = application.Status });
    }

    // GET: api/interactions/saved
    [HttpGet("saved")]
    public async Task<IActionResult> GetSavedJobs(
        [FromHeader(Name = "X-Candidate-Name")] string? headerName,
        [FromQuery] string? name)
    {
        var candidateName = ResolveCandidateName(headerName, name);
        var profile = await _profileService.GetOrCreateProfileAsync(candidateName);

        var saved = await _context.SavedJobs
            .AsNoTracking()
            .Where(sj => sj.JobseekerProfileId == profile.Id)
            .Include(sj => sj.Job)
            .Select(sj => new
            {
                sj.Id,
                sj.SavedAt,
                Job = new
                {
                    sj.Job.Id,
                    sj.Job.Title,
                    sj.Job.CompanyName,
                    sj.Job.CompanyInitials,
                    sj.Job.HourlyPay,
                    sj.Job.Location
                }
            })
            .ToListAsync();

        return Ok(saved);
    }

    // GET: api/interactions/applied
    [HttpGet("applied")]
    public async Task<IActionResult> GetAppliedJobs(
        [FromHeader(Name = "X-Candidate-Name")] string? headerName,
        [FromQuery] string? name)
    {
        var candidateName = ResolveCandidateName(headerName, name);
        var profile = await _profileService.GetOrCreateProfileAsync(candidateName);
        if (profile == null) return NotFound("Profile not found");

        var applications = await _context.Applications
            .AsNoTracking()
            .Where(a => a.JobseekerProfileId == profile.Id)
            .Include(a => a.Job)
            .Include(a => a.Conversation)
            .Select(a => new
            {
                a.Id,
                a.Status,
                a.IsTailoredCv,
                a.AppliedAt,
                HasConversation = a.Conversation != null,
                Job = new
                {
                    a.Job.Id,
                    a.Job.Title,
                    a.Job.CompanyName,
                    a.Job.CompanyInitials,
                    a.Job.HourlyPay,
                    a.Job.Location,
                    a.Job.FirstMessage
                }
            })
            .ToListAsync();

        return Ok(applications);
    }

    // POST: api/interactions/simulate-match/{id}
    // Simulates employer accepting the application (by ApplicationId or JobId)
    [HttpPost("simulate-match/{id:guid}")]
    public async Task<IActionResult> SimulateMatch(Guid id)
    {
        var application = await _context.Applications
            .Include(a => a.Job)
            .Include(a => a.Conversation)
            .FirstOrDefaultAsync(a => a.Id == id || a.JobId == id);

        if (application == null) return NotFound("Application not found");

        application.Status = "Accepted";
        application.RespondedAt = DateTime.UtcNow;

        if (application.Conversation == null)
        {
            var conversation = new Conversation
            {
                ApplicationId = application.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.Conversations.Add(conversation);

            // Add initial employer message if available
            var employer = await _context.Users.FirstOrDefaultAsync(u => u.Role == "Employer");
            if (employer != null && !string.IsNullOrEmpty(application.Job.FirstMessage))
            {
                conversation.Messages.Add(new Message
                {
                    ConversationId = conversation.Id,
                    SenderUserId = employer.Id,
                    Content = application.Job.FirstMessage,
                    IsSystemMessage = false,
                    SentAt = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Application matched and conversation opened!" });
    }
}
