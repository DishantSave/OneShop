namespace Application.DTOs.ApiKey;

public record ApiKeyDto
{
    public string KeyId { get; init; } = string.Empty;
    public string AccountId { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string ApiKeyMasked { get; init; } = string.Empty;
    public string ApiToken { get; init; } = string.Empty;
    public string Permissions { get; init; } = "read:orders,read:items,read:companies,read:stores,read:warehouses,read:labels";
    public string Status { get; init; } = "Active";
    public DateTime DateCreated { get; init; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; init; }
    public DateTime? LastUsed { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
}
