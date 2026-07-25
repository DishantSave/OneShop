using Application.DTOs.Auth;
using Domain.Accessibility;
using Domain.Enums;

namespace Application.GraphQL.Payloads;

public class AuthenticationPayload
{
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;
    public UserDetailDto? UserDetails { get; init; }
    public IReadOnlyList<FeatureAccessibility>? AccessibleScreens => Success ? SubscriptionScreensAccess.GetScreens(UserDetails?.SubscriptionType ?? SubscriptionType.Basic) : null;
}