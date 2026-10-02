namespace Application.DTOs.Users;

public class SubAccountAuditTrailDto
{
    public long Sequence { get; set; }
    public required string UserName { get; set; }
    public required string Field { get; set; }
    public required string Description { get; set; }
    public DateTime DateModified { get; set; }
    public required string ModifiedBy { get; set; }
}
