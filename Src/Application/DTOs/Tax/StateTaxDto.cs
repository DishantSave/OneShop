namespace Application.DTOs.Tax;

public record StateTaxDto
{
    public long Sequence { get; init; }
    public string AccountId { get; init; } = string.Empty;
    public string CountryCode { get; init; } = "IN";
    public string StateCode { get; init; } = string.Empty;
    public string StateName { get; init; } = string.Empty;
    public decimal TaxRate { get; init; }
    public string TaxType { get; init; } = "GST";
    public bool IsActive { get; init; } = true;
    public DateTime DateCreated { get; init; }
    public DateTime DateModified { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
}

public record StateTaxRequest(
    string AccountId,
    string CountryCode,
    string StateCode,
    string StateName,
    decimal TaxRate,
    string TaxType,
    bool IsActive,
    string UserName
);
