namespace Domain.Accessibility;

public sealed record FeatureAccessibility(
    ScreenThreshold Screen,
    bool CanView,
    bool CanCreate,
    bool CanEdit,
    bool CanDelete);