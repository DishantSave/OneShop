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
            if (UserDetails?.IsCustomerAccount == true && !UserDetails.IsSellerAccount)
            {
                return
                [
                    new FeatureAccessibility(new(Screen.Dashboard, 1, false), true, false, false, false),
                    new FeatureAccessibility(new(Screen.Orders, 0, true), true, true, false, false),
                    new FeatureAccessibility(new(Screen.Settings, 0, true), true, true, true, false)
                ];
            }
            return SubscriptionScreensAccess.GetScreens(UserDetails?.SubscriptionType ?? SubscriptionType.Basic);
        }
        init => _accessibleScreens = value;
    }
}