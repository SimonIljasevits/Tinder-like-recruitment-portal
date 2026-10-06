using System.Net;
using System.Text.RegularExpressions;
using Backend_jobby.Data;
using Backend_jobby.DTOs;
using Backend_jobby.Models;
using HtmlAgilityPack;
using Microsoft.EntityFrameworkCore;

namespace Backend_jobby.Services;

public class CrawlProgressEvent
{
    public string Status { get; set; } = string.Empty;
    public string? Detail { get; set; }
    public JobDto? Job { get; set; }
}

public class CvKeskusCrawlerService
{
    private readonly HttpClient _httpClient;
    private readonly GeminiStructurerService _geminiService;
    private readonly AppDbContext _context;
    private readonly ILogger<CvKeskusCrawlerService> _logger;

    public CvKeskusCrawlerService(
        HttpClient httpClient,
        GeminiStructurerService geminiService,
        AppDbContext context,
        ILogger<CvKeskusCrawlerService> logger)
    {
        _httpClient = httpClient;
        _geminiService = geminiService;
        _context = context;
        _logger = logger;

        // Set standard browser user agent to ensure CVKeskus serves normal HTML
        if (!_httpClient.DefaultRequestHeaders.Contains("User-Agent"))
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36");
            _httpClient.DefaultRequestHeaders.Add("Accept-Language", "et,en;q=0.9");
        }
    }

    public async Task<List<JobDto>> SearchAndCrawlAsync(string keyword, int limit = 3)
    {
        keyword = string.IsNullOrWhiteSpace(keyword) ? "koristaja" : keyword.Trim();
        limit = Math.Clamp(limit, 1, 10);

        var searchUrl = $"https://www.cvkeskus.ee/toopakkumised?q={Uri.EscapeDataString(keyword)}";
        _logger.LogInformation("Searching CVKeskus: {Url}", searchUrl);

        var html = await _httpClient.GetStringAsync(searchUrl);
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        // Find article cards
        var articleNodes = doc.DocumentNode.SelectNodes("//article[contains(@id, 'jobad_')]")
            ?? doc.DocumentNode.SelectNodes("//article");

        if (articleNodes == null || articleNodes.Count == 0)
        {
            _logger.LogWarning("No job articles found on CVKeskus search page.");
            return new List<JobDto>();
        }

        var importedJobs = new List<JobDto>();
        var seenLinks = new HashSet<string>();

        foreach (var article in articleNodes)
        {
            if (importedJobs.Count >= limit) break;

            var linkNode = article.SelectSingleNode(".//a[contains(@class, 'jobad-url')]")
                ?? article.SelectSingleNode(".//a[@href]");

            if (linkNode == null) continue;

            var href = linkNode.GetAttributeValue("href", "");
            if (string.IsNullOrWhiteSpace(href) || seenLinks.Contains(href)) continue;

            seenLinks.Add(href);
            var fullUrl = href.StartsWith("http") ? href : $"https://www.cvkeskus.ee{href}";

            try
            {
                var jobDto = await CrawlAndImportUrlAsync(fullUrl);
                if (jobDto != null)
                {
                    importedJobs.Add(jobDto);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to crawl individual job ad at {Url}", fullUrl);
            }
        }

        return importedJobs;
    }

    public async Task<JobDto?> CrawlAndImportUrlAsync(string url)
    {
        if (url.Contains("tootukassa.ee", StringComparison.OrdinalIgnoreCase))
        {
            return await CrawlTootukassaUrlAsync(url);
        }

        _logger.LogInformation("Fetching job detail from {Url}", url);
        var html = await _httpClient.GetStringAsync(url);
        var rawText = ExtractJobText(html, url);

        if (string.IsNullOrWhiteSpace(rawText))
        {
            _logger.LogWarning("Extracted job text was empty for {Url}", url);
            return null;
        }

        var source = url.Contains("cv.ee", StringComparison.OrdinalIgnoreCase) ? "cvee" : "cvkeskus";
        return await ParseTextAndSaveJobAsync(rawText, source: source, externalUrl: url);
    }

    public async Task<JobDto?> CrawlTootukassaUrlAsync(string url)
    {
        _logger.LogInformation("Importing Töötukassa job from {Url}", url);

        // Extract numeric ID from URL (e.g. "klienditeenindaja-839999" -> 839999)
        var idMatch = Regex.Match(url, @"-(\d+)(?:\D|$)");
        if (!idMatch.Success)
        {
            idMatch = Regex.Match(url, @"\b(\d{5,8})\b");
        }

        if (!idMatch.Success || !int.TryParse(idMatch.Groups[1].Value, out var jobId))
        {
            _logger.LogWarning("Could not extract Töötukassa job offer ID from {Url}", url);
            return null;
        }

        var rawText = await FetchTootukassaJobTextAsync(jobId);
        if (string.IsNullOrWhiteSpace(rawText))
        {
            _logger.LogWarning("Töötukassa returned empty details for job {Id}", jobId);
            return null;
        }

        return await ParseTextAndSaveJobAsync(rawText, source: "tootukassa", externalUrl: url);
    }

    public async Task<List<JobDto>> SearchTootukassaAsync(string keyword, int limit = 3)
    {
        keyword = string.IsNullOrWhiteSpace(keyword) ? "klienditeenindaja" : keyword.Trim();
        limit = Math.Clamp(limit, 1, 10);

        _logger.LogInformation("Searching Töötukassa for keyword: {Keyword}, limit: {Limit}", keyword, limit);

        var query = @"
            query jobOfferSearch($first: Int, $searchInput: InputToopakkumineAvalikOtsingDTO) {
              jobOffersQuery(first: $first, searchInput: $searchInput) {
                edges {
                  id
                  nimetus
                  alias
                  asutusNimi
                  brandNimi
                  aadressid
                  onTaiskohaga
                  onOsakohaga
                }
                pageInfo {
                  totalCount
                }
              }
            }";

        var requestBody = new
        {
            query,
            variables = new
            {
                first = limit,
                searchInput = new { otsisona = keyword }
            }
        };

        var content = new StringContent(
            System.Text.Json.JsonSerializer.Serialize(requestBody),
            System.Text.Encoding.UTF8,
            "application/json");

        var response = await _httpClient.PostAsync("https://www.tootukassa.ee/web/graphql", content);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Töötukassa GraphQL search request failed: {Status}", response.StatusCode);
            return new List<JobDto>();
        }

        var jsonString = await response.Content.ReadAsStringAsync();
        using var doc = System.Text.Json.JsonDocument.Parse(jsonString);

        if (!doc.RootElement.TryGetProperty("data", out var data) ||
            !data.TryGetProperty("jobOffersQuery", out var jobOffers) ||
            !jobOffers.TryGetProperty("edges", out var edges) ||
            edges.ValueKind != System.Text.Json.JsonValueKind.Array)
        {
            return new List<JobDto>();
        }

        var importedJobs = new List<JobDto>();

        foreach (var edge in edges.EnumerateArray())
        {
            if (importedJobs.Count >= limit) break;
            if (!edge.TryGetProperty("id", out var idProp) || !idProp.TryGetInt32(out var jobId)) continue;

            string? alias = edge.TryGetProperty("alias", out var aProp) ? aProp.GetString() : null;
            var tkUrl = !string.IsNullOrWhiteSpace(alias)
                ? $"https://www.tootukassa.ee/et/toopakkumised/{alias}-{jobId}"
                : $"https://www.tootukassa.ee/et/toopakkumised/{jobId}";

            try
            {
                var rawText = await FetchTootukassaJobTextAsync(jobId);
                if (!string.IsNullOrWhiteSpace(rawText))
                {
                    var jobDto = await ParseTextAndSaveJobAsync(rawText, source: "tootukassa", externalUrl: tkUrl);
                    if (jobDto != null)
                    {
                        importedJobs.Add(jobDto);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to crawl individual Töötukassa job ad {Id}", jobId);
            }
        }

        return importedJobs;
    }

    private async Task<string?> FetchTootukassaJobTextAsync(int jobId)
    {
        var query = @"
            query jobofferquery($id: Int!) {
              publicJobOfferQuery(jobOfferId: $id) {
                id
                nimetus
                ametinimetusTapsustus
                toopakkujaBrand {
                  nimi
                }
                toopakkuja {
                  nimi
                  registrikood
                  tutvustus
                }
                tookohaAndmed {
                  tooylesanded
                  omaltPooltPakume
                  onOsakohaga
                  onTaiskohaga
                  onVahetustega
                  onOositi
                  tooaegTapsustus
                  tootasuAlates
                  tootasuKuni
                  onPalkAvalik
                  tootasuTapsustus
                }
                noudedKandidaadile {
                  varasemTookogemus
                  haridusTase
                  arvutiOskusTase
                  nouded
                  lisainfoKandideerijale
                  keeleoskused {
                    onNoutud
                    keel
                    taseKirjas
                    taseKones
                  }
                }
                aadressid {
                  aadressTekst
                  aadressTapsustus
                }
              }
            }";

        var requestBody = new
        {
            query,
            variables = new { id = jobId }
        };

        var content = new StringContent(
            System.Text.Json.JsonSerializer.Serialize(requestBody),
            System.Text.Encoding.UTF8,
            "application/json");

        var response = await _httpClient.PostAsync("https://www.tootukassa.ee/web/graphql", content);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Töötukassa GraphQL request failed: {Status}", response.StatusCode);
            return null;
        }

        var jsonString = await response.Content.ReadAsStringAsync();
        using var doc = System.Text.Json.JsonDocument.Parse(jsonString);

        if (!doc.RootElement.TryGetProperty("data", out var data) ||
            !data.TryGetProperty("publicJobOfferQuery", out var offer) ||
            offer.ValueKind != System.Text.Json.JsonValueKind.Object)
        {
            return null;
        }

        var sb = new System.Text.StringBuilder();

        var title = offer.TryGetProperty("nimetus", out var n) ? n.GetString() : "";
        var titleDetail = offer.TryGetProperty("ametinimetusTapsustus", out var at) ? at.GetString() : "";
        sb.AppendLine($"Ametikoht: {title} {titleDetail}".Trim());

        string? company = null;
        if (offer.TryGetProperty("toopakkujaBrand", out var brand) && brand.ValueKind == System.Text.Json.JsonValueKind.Object && brand.TryGetProperty("nimi", out var bn))
        {
            company = bn.GetString();
        }
        if (string.IsNullOrWhiteSpace(company) && offer.TryGetProperty("toopakkuja", out var tp) && tp.ValueKind == System.Text.Json.JsonValueKind.Object && tp.TryGetProperty("nimi", out var tpn))
        {
            company = tpn.GetString();
        }
        if (!string.IsNullOrWhiteSpace(company))
        {
            sb.AppendLine($"Ettevõte: {company}");
        }

        if (offer.TryGetProperty("tookohaAndmed", out var tk) && tk.ValueKind == System.Text.Json.JsonValueKind.Object)
        {
            if (tk.TryGetProperty("tootasuTapsustus", out var tt) && !string.IsNullOrWhiteSpace(tt.GetString()))
                sb.AppendLine($"Töötasu: {tt.GetString()}");
            else if (tk.TryGetProperty("tootasuAlates", out var ta) && ta.ValueKind == System.Text.Json.JsonValueKind.Number)
                sb.AppendLine($"Töötasu: {ta.GetDecimal()} EUR");

            if (tk.TryGetProperty("tooaegTapsustus", out var tat) && !string.IsNullOrWhiteSpace(tat.GetString()))
                sb.AppendLine($"Tööaeg: {tat.GetString()}");

            if (tk.TryGetProperty("tooylesanded", out var ty) && !string.IsNullOrWhiteSpace(ty.GetString()))
                sb.AppendLine($"Tööülesanded:\n{ty.GetString()}");

            if (tk.TryGetProperty("omaltPooltPakume", out var opp) && !string.IsNullOrWhiteSpace(opp.GetString()))
                sb.AppendLine($"Omalt poolt pakume:\n{opp.GetString()}");
        }

        if (offer.TryGetProperty("noudedKandidaadile", out var nk) && nk.ValueKind == System.Text.Json.JsonValueKind.Object)
        {
            if (nk.TryGetProperty("nouded", out var req) && !string.IsNullOrWhiteSpace(req.GetString()))
                sb.AppendLine($"Nõuded kandidaadile:\n{req.GetString()}");
        }

        if (offer.TryGetProperty("aadressid", out var adrs) && adrs.ValueKind == System.Text.Json.JsonValueKind.Array)
        {
            foreach (var addr in adrs.EnumerateArray())
            {
                if (addr.TryGetProperty("aadressTekst", out var atxt) && !string.IsNullOrWhiteSpace(atxt.GetString()))
                {
                    sb.AppendLine($"Asukoht: {atxt.GetString()}");
                    break;
                }
            }
        }

        var fullText = sb.ToString().Trim();
        if (fullText.Length > 8000) fullText = fullText[..8000];
        return fullText;
    }

    private string ExtractJobText(string html, string url)
    {
        // 1. Check for Next.js __NEXT_DATA__ (used by CV.ee and modern job portals)
        var nextDataMatch = Regex.Match(html, @"<script\s+id=""__NEXT_DATA__""[^>]*>(.*?)</script>", RegexOptions.Singleline | RegexOptions.IgnoreCase);
        if (nextDataMatch.Success)
        {
            try
            {
                using var jsonDoc = System.Text.Json.JsonDocument.Parse(nextDataMatch.Groups[1].Value);
                if (jsonDoc.RootElement.TryGetProperty("props", out var props) &&
                    props.TryGetProperty("pageProps", out var pageProps))
                {
                    var sb = new System.Text.StringBuilder();

                    if (pageProps.TryGetProperty("vacancy", out var vacancyProp))
                    {
                        foreach (var vacancyItem in vacancyProp.EnumerateObject())
                        {
                            var v = vacancyItem.Value;
                            if (v.ValueKind != System.Text.Json.JsonValueKind.Object) continue;

                            if (v.TryGetProperty("position", out var pos) && !string.IsNullOrWhiteSpace(pos.GetString()))
                                sb.AppendLine($"Ametikoht: {pos.GetString()}");
                            if (v.TryGetProperty("employerName", out var emp) && !string.IsNullOrWhiteSpace(emp.GetString()))
                                sb.AppendLine($"Ettevõte: {emp.GetString()}");

                            if (v.TryGetProperty("details", out var details) &&
                                details.TryGetProperty("standardDetails", out var stdDetails) &&
                                stdDetails.ValueKind == System.Text.Json.JsonValueKind.Array)
                            {
                                foreach (var d in stdDetails.EnumerateArray())
                                {
                                    if (d.TryGetProperty("content", out var content) && !string.IsNullOrWhiteSpace(content.GetString()))
                                    {
                                        sb.AppendLine(content.GetString());
                                    }
                                }
                            }
                        }
                    }

                    var extracted = sb.ToString();
                    if (!string.IsNullOrWhiteSpace(extracted))
                    {
                        extracted = Regex.Replace(extracted, @"<[^>]+>", " ");
                        extracted = Regex.Replace(extracted, @"\s+", " ").Trim();
                        if (extracted.Length > 8000) extracted = extracted[..8000];
                        return extracted;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse __NEXT_DATA__ from {Url}", url);
            }
        }

        // 2. Check for Schema.org JobPosting JSON-LD
        var jsonLdMatches = Regex.Matches(html, @"<script\s+type=""application/ld\+json""[^>]*>(.*?)</script>", RegexOptions.Singleline | RegexOptions.IgnoreCase);
        foreach (Match m in jsonLdMatches)
        {
            var content = m.Groups[1].Value;
            if (content.Contains("JobPosting", StringComparison.OrdinalIgnoreCase))
            {
                var clean = Regex.Replace(content, @"<[^>]+>", " ");
                clean = Regex.Replace(clean, @"\s+", " ").Trim();
                if (clean.Length > 8000) clean = clean[..8000];
                return clean;
            }
        }

        // 3. Fallback to standard HTML parsing (e.g. CVKeskus)
        var doc = new HtmlDocument();
        doc.LoadHtml(html);

        var unwantedNodes = doc.DocumentNode.SelectNodes("//script|//style|//nav|//header|//footer");
        if (unwantedNodes != null)
        {
            foreach (var node in unwantedNodes)
            {
                node.Remove();
            }
        }

        var mainNode = doc.DocumentNode.SelectSingleNode("//div[contains(@class, 'job-details')]")
            ?? doc.DocumentNode.SelectSingleNode("//article")
            ?? doc.DocumentNode.SelectSingleNode("//main")
            ?? doc.DocumentNode.SelectSingleNode("//body");

        var rawText = mainNode != null
            ? HtmlEntity.DeEntitize(mainNode.InnerText)
            : HtmlEntity.DeEntitize(doc.DocumentNode.InnerText);

        rawText = Regex.Replace(rawText, @"\s+", " ").Trim();
        if (rawText.Length > 8000)
        {
            rawText = rawText[..8000];
        }

        return rawText;
    }

    public async Task<JobDto?> ParseTextAndSaveJobAsync(string rawText, string source = "cvkeskus", string? externalUrl = null)
    {
        var structured = await _geminiService.StructureJobTextAsync(rawText);
        if (structured == null)
            return null;

        // Check if job already exists with same title & company to prevent duplicates
        var existing = await _context.Jobs
            .FirstOrDefaultAsync(j => j.Title == structured.Title && j.CompanyName == structured.CompanyName);

        if (existing != null)
        {
            if (!string.IsNullOrWhiteSpace(externalUrl) && string.IsNullOrWhiteSpace(existing.ExternalUrl))
            {
                existing.ExternalUrl = externalUrl;
                await _context.SaveChangesAsync();
            }
            _logger.LogInformation("Job '{Title}' by '{Company}' already exists in database.", structured.Title, structured.CompanyName);
            return MapToDto(existing);
        }

        // Create new Job entity
        var job = new Job
        {
            Id = Guid.NewGuid(),
            CompanyName = string.IsNullOrWhiteSpace(structured.CompanyName) ? "Tööpakkuja" : structured.CompanyName,
            CompanyInitials = !string.IsNullOrWhiteSpace(structured.CompanyInitials) ? structured.CompanyInitials : "TO",
            Title = string.IsNullOrWhiteSpace(structured.Title) ? "Tööpakkumine" : structured.Title,
            HourlyPay = structured.HourlyPay > 0 ? structured.HourlyPay : 8.00m,
            PrimarySkill = string.IsNullOrWhiteSpace(structured.PrimarySkill) ? "commercial" : structured.PrimarySkill,
            Location = string.IsNullOrWhiteSpace(structured.Location) ? "Tallinn" : structured.Location,
            DistanceKm = structured.DistanceKm > 0 ? structured.DistanceKm : 3.0m,
            WorkingHours = structured.WorkingHours,
            StartDateText = structured.StartDateText ?? "Kohe",
            Description = structured.Description,
            FirstMessage = structured.FirstMessage,
            Source = source,
            ExternalUrl = externalUrl,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        // Add shifts
        foreach (var shift in structured.Shifts)
        {
            job.Shifts.Add(new JobShift { ShiftCode = shift, JobId = job.Id });
        }
        if (job.Shifts.Count == 0)
        {
            job.Shifts.Add(new JobShift { ShiftCode = "morning", JobId = job.Id });
        }

        // Add accommodations
        foreach (var accom in structured.Accommodations)
        {
            job.Accommodations.Add(new JobAccommodation { AccommodationCode = accom, JobId = job.Id });
        }
        if (job.Accommodations.Count == 0)
        {
            job.Accommodations.Add(new JobAccommodation { AccommodationCode = "stepfree", JobId = job.Id });
            job.Accommodations.Add(new JobAccommodation { AccommodationCode = "max10", JobId = job.Id });
        }

        // Add requirements
        foreach (var req in structured.Requirements)
        {
            job.Requirements.Add(new JobRequirement { RequirementText = req, JobId = job.Id });
        }

        // Add offers
        foreach (var offer in structured.Offers)
        {
            job.Offers.Add(new JobOffer { OfferText = offer, JobId = job.Id });
        }

        _context.Jobs.Add(job);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Successfully ingested job: {Title} by {Company}", job.Title, job.CompanyName);
        return MapToDto(job);
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
        IsExternal = j.EmployerProfileId == null || j.Source != "internal",
        Source = !string.IsNullOrWhiteSpace(j.Source) ? j.Source : (j.EmployerProfileId == null ? "cvkeskus" : "internal"),
        ExternalUrl = j.ExternalUrl,
        Shifts = j.Shifts.Select(s => s.ShiftCode).ToList(),
        Accommodations = j.Accommodations.Select(a => a.AccommodationCode).ToList(),
        Requirements = j.Requirements.Select(r => r.RequirementText).ToList(),
        Offers = j.Offers.Select(o => o.OfferText).ToList()
    };
}
