using Backend_jobby.Data;
using Backend_jobby.DTOs;
using Backend_jobby.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_jobby.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConversationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ConversationsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/conversations
    [HttpGet]
    public async Task<IActionResult> GetConversations()
    {
        var profile = await _context.JobseekerProfiles.FirstOrDefaultAsync();
        if (profile == null) return NotFound("Profile not found");

        var conversations = await _context.Conversations
            .AsNoTracking()
            .Where(c => c.Application.JobseekerProfileId == profile.Id)
            .Include(c => c.Application.Job)
            .Include(c => c.Messages)
            .Select(c => new
            {
                c.Id,
                c.CreatedAt,
                Job = new
                {
                    c.Application.Job.Id,
                    c.Application.Job.Title,
                    c.Application.Job.CompanyName,
                    c.Application.Job.CompanyInitials
                },
                LastMessage = c.Messages.OrderByDescending(m => m.SentAt).FirstOrDefault()
            })
            .ToListAsync();

        return Ok(conversations);
    }

    // GET: api/conversations/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetConversationById(Guid id)
    {
        var conversation = await _context.Conversations
            .AsNoTracking()
            .Include(c => c.Application.Job)
            .Include(c => c.Messages.OrderBy(m => m.SentAt))
                .ThenInclude(m => m.SenderUser)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (conversation == null)
            return NotFound("Conversation not found");

        return Ok(new
        {
            conversation.Id,
            conversation.CreatedAt,
            Job = new
            {
                conversation.Application.Job.Id,
                conversation.Application.Job.Title,
                conversation.Application.Job.CompanyName,
                conversation.Application.Job.CompanyInitials
            },
            Messages = conversation.Messages.Select(m => new
            {
                m.Id,
                m.Content,
                m.IsSystemMessage,
                m.SentAt,
                SenderRole = m.SenderUser.Role,
                IsMe = m.SenderUser.Role == "Jobseeker"
            })
        });
    }

    // POST: api/conversations/{id}/messages
    [HttpPost("{id:guid}/messages")]
    public async Task<IActionResult> SendMessage(Guid id, [FromBody] MessageRequest request)
    {
        var conversation = await _context.Conversations
            .Include(c => c.Application.JobseekerProfile)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (conversation == null)
            return NotFound("Conversation not found");

        var jobseeker = await _context.Users.FirstOrDefaultAsync(u => u.Role == "Jobseeker");
        if (jobseeker == null) return BadRequest("Jobseeker user not found");

        var message = new Message
        {
            ConversationId = conversation.Id,
            SenderUserId = jobseeker.Id,
            Content = request.Content,
            IsSystemMessage = false,
            SentAt = DateTime.UtcNow
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message.Id,
            message.Content,
            message.SentAt,
            SenderRole = "Jobseeker",
            IsMe = true
        });
    }
}
