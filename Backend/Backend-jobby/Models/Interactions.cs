namespace Backend_jobby.Models;

public class IgnoredJob
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid JobseekerProfileId { get; set; }
    public JobseekerProfile JobseekerProfile { get; set; } = null!;

    public Guid JobId { get; set; }
    public Job Job { get; set; } = null!;

    public DateTime PassedAt { get; set; } = DateTime.UtcNow;
}

public class SavedJob
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid JobseekerProfileId { get; set; }
    public JobseekerProfile JobseekerProfile { get; set; } = null!;

    public Guid JobId { get; set; }
    public Job Job { get; set; } = null!;

    public DateTime SavedAt { get; set; } = DateTime.UtcNow;
}

public class Application
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid JobseekerProfileId { get; set; }
    public JobseekerProfile JobseekerProfile { get; set; } = null!;

    public Guid JobId { get; set; }
    public Job Job { get; set; } = null!;

    public string Status { get; set; } = "Pending"; // "Pending", "Accepted", "Rejected"
    public bool IsTailoredCv { get; set; }
    public string? CvSnapshotJson { get; set; }
    public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }

    public Conversation? Conversation { get; set; }
}

public class Conversation
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ApplicationId { get; set; }
    public Application Application { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<Message> Messages { get; set; } = new();
}

public class Message
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;

    public Guid SenderUserId { get; set; }
    public User SenderUser { get; set; } = null!;

    public string Content { get; set; } = string.Empty;
    public bool IsSystemMessage { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; }
}
