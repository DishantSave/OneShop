namespace Application.DTOs.Masters.Store;

public class StoreAuditTrailDto
{
    public long Sequence { get; set; }
    public required string AccountId { get; set; }
    public required string CompanyCode { get; set; }
    public required string StoreCode { get; set; }
    public required string Field { get; set; }
    public required string Description { get; set; }
    public DateTime DateModified { get; set; }
    public required string ModifiedBy { get; set; }
}
