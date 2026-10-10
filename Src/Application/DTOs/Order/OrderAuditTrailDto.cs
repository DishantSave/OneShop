namespace Application.DTOs.Order;

public record OrderAuditTrailDto
{
    public long Sequence { get; init; }
    public string AccountId { get; init; } = string.Empty;
    public string CompanyCode { get; init; } = string.Empty;
    public string OrderId { get; init; } = string.Empty;
    public string ActionType { get; init; } = string.Empty; // 'Created', 'StatusChanged', 'DetailsUpdated', 'CommentAdded'
    public string? Field { get; init; }
    public string? OldValue { get; init; }
    public string? NewValue { get; init; }
    public string Description { get; init; } = string.Empty;
    public DateTime DateModified { get; init; }
    public string ModifiedBy { get; init; } = string.Empty;
    public string? UserRole { get; init; }
}
