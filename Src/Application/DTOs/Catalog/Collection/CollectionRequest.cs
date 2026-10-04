namespace Application.DTOs.Catalog.Collection;

public record CollectionItemRequest(
    string ItemNumber,
    string SizeCode = "ALL",
    int SortOrder = 0
);

public record CollectionRequest(
    string UserAccountId,
    string UserName,
    string CompanyCode,
    string Code,
    string Name,
    string? Description,
    string? Season,
    string Channel,
    string? BannerImage,
    bool IsActive,
    List<CollectionItemRequest>? Items = null,
    List<string>? ItemNumbers = null
);
