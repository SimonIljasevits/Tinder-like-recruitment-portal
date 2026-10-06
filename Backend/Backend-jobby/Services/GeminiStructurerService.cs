using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Backend_jobby.Models;

namespace Backend_jobby.Services;

public class StructuredJobDto
{
    [JsonPropertyName("companyName")]
    public string CompanyName { get; set; } = string.Empty;

    [JsonPropertyName("companyInitials")]
    public string CompanyInitials { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("primarySkill")]
    public string PrimarySkill { get; set; } = "commercial";

    [JsonPropertyName("hourlyPay")]
    public decimal HourlyPay { get; set; } = 7.50m;

    [JsonPropertyName("shifts")]
    public List<string> Shifts { get; set; } = new();

    [JsonPropertyName("accommodations")]
    public List<string> Accommodations { get; set; } = new();

    [JsonPropertyName("location")]
    public string Location { get; set; } = "Tallinn";

    [JsonPropertyName("distanceKm")]
    public decimal DistanceKm { get; set; } = 3.5m;

    [JsonPropertyName("workingHours")]
    public string? WorkingHours { get; set; }

    [JsonPropertyName("startDateText")]
    public string? StartDateText { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("requirements")]
    public List<string> Requirements { get; set; } = new();

    [JsonPropertyName("offers")]
    public List<string> Offers { get; set; } = new();

    [JsonPropertyName("firstMessage")]
    public string FirstMessage { get; set; } = string.Empty;
}

public class GeminiStructurerService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<GeminiStructurerService> _logger;

    public GeminiStructurerService(HttpClient httpClient, IConfiguration config, ILogger<GeminiStructurerService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    public async Task<StructuredJobDto?> StructureJobTextAsync(string rawAdText)
    {
        var apiKey = _config["Gemini:ApiKey"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("Gemini API key is not configured, falling back to rule-based extractor.");
            return FallbackExtract(rawAdText);
        }

        var prompt = $@"Sa oled töövahendusäpi 'Sobib' töökuulutuste struktureerija.
Sinu ülesanne on võtta tavaline töökuulutuse tekst ja eraldada sellest rangelt järgmine JSON.

TAGIDE REEGLID:
- 'primarySkill' peab olema ÜKS neist: 'commercial', 'floor', 'windows', 'kitchen', 'laundry', 'warehouse', 'customer_service' (kui koristus/äriklient, vali 'commercial').
- 'shifts' võib sisaldada ainult neid väärtusi: 'morning', 'evening', 'night', 'weekend', 'parttime', 'fulltime'.
- 'accommodations' võib sisaldada: 'max10' (kerge tõstmine kuni 10kg), 'stepfree' (astmeteta ligipääs/lift), 'lownoise' (vaikne keskkond), 'mask' (kaitsemask/kaitsevahendid olemas), 'sitting' (istumispausid/istuv töö), 'nochem' (lõhnavabad või pehmed puhastusained). Vali need, mis kuulutuse tekstist loogiliselt järelduvad või selgelt välja toodud.
- 'hourlyPay': tunnitasu eurodes (arv). Kui kuulutuses on kuupalk (nt 1400 € kuus), jaga see 168-ga (nt 1400 / 168 = 8.33). Kui tasu pole märgitud, pane 8.00.
- 'companyInitials': 2-täheline suurtähtedes lühend firma nimest (nt 'CS', 'BH').
- 'firstMessage': soe ja professionaalne tervitussõnum tööandjalt kandidaadile, kui teineteisele matchitakse (1-2 lauset).

Väljasta AINULT kehtiv JSON ilma markdownita:
{{
  ""companyName"": ""Firma Nimi"",
  ""companyInitials"": ""FN"",
  ""title"": ""Ametikoha pealkiri"",
  ""primarySkill"": ""commercial"",
  ""hourlyPay"": 8.50,
  ""shifts"": [""morning"", ""parttime""],
  ""accommodations"": [""stepfree"", ""max10""],
  ""location"": ""Tallinn"",
  ""distanceKm"": 3.2,
  ""workingHours"": ""Tööaeg..."",
  ""startDateText"": ""Kohe"",
  ""description"": ""2-3 lauseline ülevaade tööst."",
  ""requirements"": [""Nõue 1"", ""Nõue 2""],
  ""offers"": [""Hüve 1"", ""Hüve 2""],
  ""firstMessage"": ""Tere! Meil on vaba koht hommikuses vahetuses. Kas soovite liituda?""
}}

TÖÖKUULUTUSE TEKST:
{rawAdText}";

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            },
            generationConfig = new
            {
                response_mime_type = "application/json"
            }
        };

        var json = JsonSerializer.Serialize(requestBody);

        var configuredModel = _config["Gemini:Model"] ?? "gemini-3.8-flash";
        var modelsToTry = new List<string> { configuredModel, "gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite" }
            .Distinct()
            .ToList();

        string? respString = null;

        foreach (var model in modelsToTry)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
            try
            {
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(url, content);
                if (response.IsSuccessStatusCode)
                {
                    respString = await response.Content.ReadAsStringAsync();
                    break;
                }

                var errBody = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Gemini request for model {Model} failed ({Status}): {Error}", model, response.StatusCode, errBody);

                // If 503 (high demand), short pause before next model
                if ((int)response.StatusCode == 503)
                {
                    await Task.Delay(500);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "HTTP exception calling Gemini model {Model}", model);
            }
        }

        if (string.IsNullOrWhiteSpace(respString))
        {
            _logger.LogWarning("All Gemini model attempts failed. Using intelligent rule-based fallback extractor.");
            return FallbackExtract(rawAdText);
        }

        try
        {
            using var doc = JsonDocument.Parse(respString);
            var root = doc.RootElement;
            var textResult = root
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrWhiteSpace(textResult))
                return FallbackExtract(rawAdText);

            // Strip code fences if model included ```json ... ```
            var cleaned = textResult.Trim();
            if (cleaned.StartsWith("```"))
            {
                var firstLine = cleaned.IndexOf('\n');
                if (firstLine != -1) cleaned = cleaned[(firstLine + 1)..];
                if (cleaned.EndsWith("```")) cleaned = cleaned[..^3];
            }

            var structured = JsonSerializer.Deserialize<StructuredJobDto>(cleaned, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return structured ?? FallbackExtract(rawAdText);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse Gemini response. Using intelligent rule-based fallback extractor.");
            return FallbackExtract(rawAdText);
        }
    }

    public static StructuredJobDto FallbackExtract(string rawAdText)
    {
        var lines = rawAdText.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        string title = "Tööpakkumine";
        string company = "Tööpakkuja";
        string location = "Tallinn";
        decimal pay = 8.00m;
        string hours = "Täistööaeg või osaline";
        var requirements = new List<string>();
        var offers = new List<string>();

        // 1. Detect title
        foreach (var l in lines)
        {
            if (l.StartsWith("Ametikoht:", StringComparison.OrdinalIgnoreCase))
            {
                title = l["Ametikoht:".Length..].Trim();
                break;
            }
        }
        if (title == "Tööpakkumine" && lines.Length > 0)
        {
            title = lines[0].Length > 60 ? lines[0][..60] : lines[0];
        }

        // 2. Detect company
        foreach (var l in lines)
        {
            if (l.StartsWith("Ettevõte:", StringComparison.OrdinalIgnoreCase))
            {
                company = l["Ettevõte:".Length..].Trim();
                break;
            }
        }

        // 3. Detect location
        foreach (var l in lines)
        {
            if (l.StartsWith("Asukoht:", StringComparison.OrdinalIgnoreCase))
            {
                location = l["Asukoht:".Length..].Trim();
                break;
            }
            if (l.Contains("Tallinn", StringComparison.OrdinalIgnoreCase)) location = "Tallinn";
            else if (l.Contains("Tartu", StringComparison.OrdinalIgnoreCase)) location = "Tartu";
            else if (l.Contains("Pärnu", StringComparison.OrdinalIgnoreCase)) location = "Pärnu";
            else if (l.Contains("Narva", StringComparison.OrdinalIgnoreCase)) location = "Narva";
        }

        // 4. Detect pay
        var payMatch = System.Text.RegularExpressions.Regex.Match(rawAdText, @"(\d+([.,]\d+)?)\s*(?:eurot|EUR|€|\/h)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (payMatch.Success && decimal.TryParse(payMatch.Groups[1].Value.Replace(',', '.'), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var p))
        {
            if (p > 500) pay = Math.Round(p / 168m, 2);
            else if (p > 0) pay = p;
        }

        // 5. Detect working hours
        foreach (var l in lines)
        {
            if (l.StartsWith("Tööaeg:", StringComparison.OrdinalIgnoreCase))
            {
                hours = l["Tööaeg:".Length..].Trim();
                break;
            }
        }

        // 6. Detect skill
        string skill = "commercial";
        var lower = rawAdText.ToLowerInvariant();
        if (lower.Contains("klienditeenind") || lower.Contains("kassapid") || lower.Contains("müüja")) skill = "customer_service";
        else if (lower.Contains("laotööt") || lower.Contains("komplekteer") || lower.Contains("tõstuk")) skill = "warehouse";
        else if (lower.Contains("nõudepes") || lower.Contains("köögi") || lower.Contains("toitlustus")) skill = "kitchen";
        else if (lower.Contains("pesumaja") || lower.Contains("pesu")) skill = "laundry";
        else if (lower.Contains("aken") || lower.Contains("akende")) skill = "windows";
        else if (lower.Contains("põranda")) skill = "floor";

        // 7. Shifts
        var shifts = new List<string>();
        if (lower.Contains("osaline") || lower.Contains("osaaeg")) shifts.Add("parttime");
        if (lower.Contains("täistöö") || lower.Contains("täisaeg") || lower.Contains("e-r")) shifts.Add("fulltime");
        if (lower.Contains("vahetustega") || lower.Contains("vahetus")) { shifts.Add("morning"); shifts.Add("evening"); }
        if (lower.Contains("hommik") || lower.Contains("päevane") || lower.Contains("7:00") || lower.Contains("8:00") || lower.Contains("e-r")) shifts.Add("morning");
        if (lower.Contains("õhtune") || lower.Contains("õhtul")) shifts.Add("evening");
        if (lower.Contains("öötöö") || lower.Contains("öövahetus") || System.Text.RegularExpressions.Regex.IsMatch(lower, @"\böösiti\b|\bööl\b")) shifts.Add("night");
        if (lower.Contains("nädalavahet")) shifts.Add("weekend");
        if (shifts.Count == 0) shifts.Add("morning");

        // 8. Extract requirements & offers from section lines
        bool inReq = false;
        bool inOffers = false;
        foreach (var l in lines)
        {
            if (l.StartsWith("Nõuded", StringComparison.OrdinalIgnoreCase)) { inReq = true; inOffers = false; continue; }
            if (l.StartsWith("Omalt poolt pakume", StringComparison.OrdinalIgnoreCase) || l.StartsWith("Pakume", StringComparison.OrdinalIgnoreCase)) { inOffers = true; inReq = false; continue; }
            if (l.StartsWith("Tööülesanded", StringComparison.OrdinalIgnoreCase) || l.StartsWith("Asukoht", StringComparison.OrdinalIgnoreCase)) { inReq = false; inOffers = false; continue; }

            if (inReq && l.Length > 3 && requirements.Count < 5) requirements.Add(l.TrimStart('-', '*', ' '));
            if (inOffers && l.Length > 3 && offers.Count < 5) offers.Add(l.TrimStart('-', '*', ' '));
        }

        // 9. Company initials
        var initials = company.Length >= 2 ? company[..2].ToUpperInvariant() : "TO";

        return new StructuredJobDto
        {
            CompanyName = company,
            CompanyInitials = initials,
            Title = title,
            PrimarySkill = skill,
            HourlyPay = pay,
            Shifts = shifts.Distinct().ToList(),
            Accommodations = new List<string> { "stepfree", "max10" },
            Location = location,
            DistanceKm = 3.0m,
            WorkingHours = hours,
            StartDateText = "Kohe",
            Description = rawAdText.Length > 1500 ? rawAdText[..1500] : rawAdText,
            Requirements = requirements.Count > 0 ? requirements : new List<string> { "Kohusetundlikkus ja täpsus", "Valmisolek meeskonnatööks" },
            Offers = offers.Count > 0 ? offers : new List<string> { "Konkurentsivõimeline töötasu", "Sõbralik meeskond" },
            FirstMessage = $"Tere! Meil on ettevõttes {company} pakkuda ametikoht: {title}."
        };
    }
}
