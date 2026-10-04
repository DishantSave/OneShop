namespace Application.GraphQL.InputModels;

public class CollectionItemInput
{
    public string ItemNumber { get; set; } = string.Empty;
    public string SizeCode { get; set; } = "ALL";
    public int? SortOrder { get; set; } = 0;
}

public class CollectionInput
{
    public string CompanyCode { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Season { get; set; }
    public string Channel { get; set; } = "Both";
    public string? BannerImage { get; set; }
    public bool IsActive { get; set; } = true;
    public List<CollectionItemInput>? Items { get; set; }
    public List<string>? ItemNumbers { get; set; }
}
