using Backend_jobby.Data;
using Backend_jobby.DTOs;
using Backend_jobby.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_jobby.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InteractionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public InteractionsController(AppDbContext context)
    {
        _context = context;
    }

    // POST: api/interactions/pass (Swipe Left)
    [HttpPost("pass")]
    public async Task<IActionResult> PassJob([FromBody] SwipeRequest request)
    {
        var profile = await _context.JobseekerProfiles.FirstOrDefaultAsync();
        if (profile == null) return NotFound("Profile not found");

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
    public async Task<IActionResult> SaveJob([FromBody] SwipeRequest request)
    {
        var profile = await _context.JobseekerProfiles.FirstOrDefaultAsync();
        if (profile == null) return NotFound("Profile not found");

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
    public async Task<IActionResult> ApplyToJob([FromBody] ApplyRequest request)
    {
        var profile = await _context.JobseekerProfiles.FirstOrDefaultAsync();
        if (profile == null) return NotFound("Profile not found");

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
    public async Task<IActionResult> GetSavedJobs()
    {
        var profile = await _context.JobseekerProfiles.FirstOrDefaultAsync();
        if (profile == null) return NotFound("Profile not found");

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
                    sj.Job.HourlyPay,
                    sj.Job.Location
                }
            })
            .ToListAsync();

        return Ok(saved);
    }

    // GET: api/interactions/applied
    [HttpGet("applied")]
    public async Task<IActionResult> GetAppliedJobs()
    {
        var profile = await _context.JobseekerProfiles.FirstOrDefaultAsync();
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
                    a.Job.HourlyPay,
                    a.Job.Location,
                    a.Job.FirstMessage
                }
            })
            .ToListAsync();

        return Ok(applications);
    }

    // POST: api/interactions/simulate-match/{applicationId}
    // Simulates employer accepting the application and initiating chat with initial greeting
    [HttpPost("simulate-match/{applicationId:guid}")]
    public async Task<IActionResult> SimulateMatch(Guid applicationId)
    {
        var application = await _context.Applications
            .Include(a => a.Job)
            .Include(a => a.Conversation)
            .FirstOrDefaultAsync(a => a.Id == applicationId);

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
