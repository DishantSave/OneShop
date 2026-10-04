namespace Application.DTOs.Catalog.Collection;

public class CollectionDto
{
    public long Sequence { get; set; }
    public string AccountId { get; set; } = string.Empty;
    public string CompanyCode { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Season { get; set; }
    public string Channel { get; set; } = "Both";
    public string? BannerImage { get; set; }
    public bool IsActive { get; set; }
    public DateTime DateCreated { get; set; }

    public List<CollectionItemDto> Items { get; set; } = [];
}
