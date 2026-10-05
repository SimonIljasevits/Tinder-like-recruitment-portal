using Backend_jobby.DTOs;
using Backend_jobby.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend_jobby.Controllers;

public class CrawlSearchRequest
{
    public string Keyword { get; set; } = "koristaja";
    public int Limit { get; set; } = 3;
}

public class CrawlUrlRequest
{
    public string Url { get; set; } = string.Empty;
}

public class CrawlTextRequest
{
    public string RawText { get; set; } = string.Empty;
}

[ApiController]
[Route("api/[controller]")]
public class CrawlerController : ControllerBase
{
    private readonly CvKeskusCrawlerService _crawlerService;
    private readonly ILogger<CrawlerController> _logger;

    public CrawlerController(CvKeskusCrawlerService crawlerService, ILogger<CrawlerController> logger)
    {
        _crawlerService = crawlerService;
        _logger = logger;
    }

    // POST: api/crawler/search
    [HttpPost("search")]
    public async Task<IActionResult> SearchAndCrawl([FromBody] CrawlSearchRequest request)
    {
        try
        {
            var jobs = await _crawlerService.SearchAndCrawlAsync(request.Keyword, request.Limit);
            return Ok(new
            {
                success = true,
                message = $"Successfully crawled and ingested {jobs.Count} jobs from CVKeskus.",
                keyword = request.Keyword,
                count = jobs.Count,
                jobs = jobs
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to crawl CVKeskus for keyword: {Keyword}", request.Keyword);
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // POST: api/crawler/parse-url
    [HttpPost("parse-url")]
    public async Task<IActionResult> ParseFromUrl([FromBody] CrawlUrlRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Url))
            return BadRequest(new { success = false, message = "Url cannot be empty." });

        try
        {
            var job = await _crawlerService.CrawlAndImportUrlAsync(request.Url);
            if (job == null)
                return BadRequest(new { success = false, message = "Failed to extract or structure job from URL. Please check if the URL is valid or paste the job description text directly." });

            return Ok(new
            {
                success = true,
                message = "Job successfully parsed and saved into database.",
                job = job
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse job from URL: {Url}", request.Url);
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // POST: api/crawler/parse-text
    [HttpPost("parse-text")]
    public async Task<IActionResult> ParseFromText([FromBody] CrawlTextRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RawText))
            return BadRequest(new { success = false, message = "RawText cannot be empty." });

        try
        {
            var job = await _crawlerService.ParseTextAndSaveJobAsync(request.RawText);
            if (job == null)
                return BadRequest(new { success = false, message = "Failed to structure job from text using Gemini AI." });

            return Ok(new
            {
                success = true,
                message = "Job successfully structured and saved into database.",
                job = job
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse job from raw text.");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}
