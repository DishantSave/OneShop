namespace Application.GraphQL.Payloads;

using Application.DTOs.ApiKey;

public class ApiKeyPayload
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? ApiKey { get; set; }
    public string? ApiToken { get; set; }
    public ApiKeyDto? KeyDetails { get; set; }
}
