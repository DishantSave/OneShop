namespace Application.DTOs.Masters.Company;

public class CompanyAuditTrailDto
{
    public long Sequence { get; init; }
    public required string AccountId { get; init; }
    public required string Code { get; init; }
    public required string Field { get; init; }
    public required string Description { get; init; }
    public DateTime DateModified { get; init; }
    public required string ModifiedBy { get; init; }
}