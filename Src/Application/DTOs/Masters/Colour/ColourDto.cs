namespace Application.DTOs.Masters.Colour;

public class ColourDto
{
    public long Sequence { get; set; }
    public string AccountId { get; set; } = string.Empty;
    public string CompanyCode { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? HexCode { get; set; }
    public bool IsActive { get; set; }
    public DateTime DateCreated { get; set; }

    public List<ColourAuditTrailDto> Audit { get; set; } = [];
}
