namespace Application.DTOs.Schema;

public class SchemaVersionDto
{
    public long Sequence { get; set; }
    public string Company { get; set; } = string.Empty;
    public string Product { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public bool IsTestMode { get; set; }
    public string? Description { get; set; }
    public string Author { get; set; } = string.Empty;
    public string ProductLogo { get; set; } = string.Empty;
    public string Copyright { get; set; } = string.Empty;
    public DateTime DateCreated { get; set; }
}