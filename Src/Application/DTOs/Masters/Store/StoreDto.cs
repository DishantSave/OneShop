namespace Application.DTOs.Masters.Store;

public class StoreDto
{
    public long Sequence { get; init; }
    public required string AccountId { get; init; }
    public required string CompanyCode { get; init; }
    public string? CompanyName { get; set; }
    public required string Code { get; init; }
    public required string Name { get; init; }
    public required string DisplayName { get; init; }
    public required string StoreType { get; init; }
    public required string AddressLineOne { get; init; }
    public string? AddressLineTwo { get; init; }
    public required string City { get; init; }
    public required string StateCode { get; init; }
    public required string CountryCode { get; init; }
    public required string PostalCode { get; init; }
    public required string Contact { get; init; }
    public required string Email { get; init; }
    public string? Website { get; init; }
    public string? Logo { get; init; }
    public required string CurrencyCode { get; init; }
    public required string TimeZone { get; init; }
    public bool IsTestStore { get; init; }
    public bool OriginalIsTestStore { get; init; }
    public bool IsActive { get; init; }
    public bool OriginalIsActive { get; init; }
    public DateTime DateCreated { get; init; }
    public List<StoreAuditTrailDto> Audit { get; set; } = [];
}
