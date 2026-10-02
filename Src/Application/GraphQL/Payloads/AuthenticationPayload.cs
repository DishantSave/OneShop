using Application.DTOs.Auth;
using Domain.Accessibility;
using Domain.Enums;

namespace Application.GraphQL.Payloads;

public class AuthenticationPayload
{
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;
    public UserDetailDto? UserDetails { get; init; }

    private IReadOnlyList<FeatureAccessibility>? _accessibleScreens;
    public IReadOnlyList<FeatureAccessibility>? AccessibleScreens
    {
        get
        {
            if (!Success) return null;
            if (_accessibleScreens != null) return _accessibleScreens;
            return SubscriptionScreensAccess.GetScreens(UserDetails?.SubscriptionType ?? SubscriptionType.Basic);
        }
        init => _accessibleScreens = value;
    }
}