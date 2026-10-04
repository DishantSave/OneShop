namespace Application.DTOs.Masters.Size;

public class SizeDto
{
    public long Sequence { get; set; }
    public string AccountId { get; set; } = string.Empty;
    public string CompanyCode { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime DateCreated { get; set; }

    public List<SizeAuditTrailDto> Audit { get; set; } = [];
}
