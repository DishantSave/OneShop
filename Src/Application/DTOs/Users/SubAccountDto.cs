namespace Application.DTOs.Users;

public class SubAccountDto
{
    public long Sequence { get; init; }
    public required string UserName { get; init; }
    public required string AccountId { get; init; }
    public required string SubUserId { get; init; }
    public string? Designation { get; init; }
    public string? Department { get; init; }
    public bool IsCustomerAccount { get; init; }
    public bool IsSellerAccount { get; init; }
    public required string Company { get; init; }
    public string? ProfilePicture { get; init; }
    public required string Email { get; init; }
    public required string Contact { get; init; }
    public required string Country { get; init; }
    public bool IsTestAccount { get; init; }
    public bool IsActive { get; init; }
    public DateTime DateCreated { get; init; }
    public DateTime DateModified { get; init; }
    public List<SubAccountScreenAccessDto> ScreenAccess { get; set; } = [];
    public List<SubAccountAuditTrailDto> Audit { get; set; } = [];
    public List<SubAccountAuditTrailDto> AuditTrail => Audit;
}
