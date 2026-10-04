namespace Application.DTOs.Masters.Colour;

public class ColourAuditTrailDto
{
    public long Sequence { get; set; }
    public string AccountId { get; set; } = string.Empty;
    public string CompanyCode { get; set; } = string.Empty;
    public string ColourCode { get; set; } = string.Empty;
    public string Field { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DateModified { get; set; }
    public string ModifiedBy { get; set; } = string.Empty;
}
