namespace Application.DTOs.Catalog.Item;

public record ItemVariantRequest(
    string ColourCode,
    string SizeCode,
    string? Sku,
    string? Barcode,
    decimal AdditionalPrice,
    bool IsActive
);

public record ItemRequest(
    string UserAccountId,
    string UserName,
    string CompanyCode,
    string ItemNumber,
    string Name,
    string DisplayName,
    string? Description,
    string Category,
    string SalesChannel,
    decimal B2cPrice,
    decimal? B2cCompareAtPrice,
    decimal B2bPrice,
    int B2bMinQuantity,
    string UnitOfMeasure,
    string? Season,
    string? Brand,
    string? Tags,
    string? Images,
    bool IsActive,
    List<ItemVariantRequest>? Variants
);
