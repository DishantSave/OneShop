using Application.DTOs.Discounts;

namespace Application.GraphQL.Payloads;

public class PromoCodePayload
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
    public PromoCodeDto? PromoDetails { get; init; }
}

public class ValidatePromoPayload
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
    public PromoValidationResultDto? ValidationDetails { get; init; }
}
