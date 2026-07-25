namespace Application.DTOs.Auth;

public class UserDetailAuditTrailDto
{
    public required string UserName { get; init; }
    public required string Field { get; init; }
    public required string Description { get; init; }
    public DateTime DateModified { get; init; }
}