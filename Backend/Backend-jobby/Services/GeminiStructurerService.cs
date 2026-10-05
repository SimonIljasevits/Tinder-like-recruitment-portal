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
            _logger.LogError("Gemini API key is not configured.");
            throw new InvalidOperationException("Gemini API key is missing. Set Gemini:ApiKey in configuration.");
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
            _logger.LogError("All Gemini model attempts failed.");
            return null;
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
                return null;

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

            return structured;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to structure job using Gemini.");
            return null;
        }
    }
}
