using Domain.Enums;

namespace Domain.Accessibility;

public static class SubscriptionScreensAccess
{
    private static readonly Dictionary<SubscriptionType, IReadOnlyList<FeatureAccessibility>> _screens = new()
    {
        [SubscriptionType.Basic] = [
            new FeatureAccessibility(new(Screen.Dashboard, 1, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.CompanyMaster, 2, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.DivisionMaster, 3, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.CustomerMaster, 2, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Items, 5, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Inventory, 5, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Orders, 20, false), true, true, true, true),
            //new FeatureAccessibility(new(Screen.Invoicing, 20, false), true, true, true, true), // Has to comment this
            //new FeatureAccessibility(new(Screen.Reports, 1, false), true, true, true, true),
            //new FeatureAccessibility(new(Screen.Analytics, 1, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Users, 1, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Settings, 0, true), true, true, true, true),
            //new FeatureAccessibility(new(Screen.Integrations, 1, false), true, true, true, true)
        ],

        [SubscriptionType.Plus] = [
            new FeatureAccessibility(new(Screen.Dashboard, 1, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.CompanyMaster, 25, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.DivisionMaster, 50, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.CustomerMaster, 100, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Items, 150, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Inventory, 150, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Orders, 1000, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Invoicing, 1000, false), true, true, true, true),
            //new FeatureAccessibility(new(Screen.Reports, 1, false), true, true, true, true),
            //new FeatureAccessibility(new(Screen.Analytics, 1, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Users, 1, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Settings, 0, true), true, true, true, true),
            //new FeatureAccessibility(new(Screen.Integrations, 1, false), true, true, true, true)
        ],

        [SubscriptionType.Pro] = [
            new FeatureAccessibility(new(Screen.Dashboard, 1, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.CompanyMaster, 50, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.DivisionMaster, 100, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.CustomerMaster, 250, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Items, 500, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Inventory, 500, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Orders, 5000, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Invoicing, 5000, false), true, true, true, true),
            //new FeatureAccessibility(new(Screen.Reports, 1, false), true, true, true, true),
            //new FeatureAccessibility(new(Screen.Analytics, 1, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Users, 10, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Settings, 0, true), true, true, true, true),
            new FeatureAccessibility(new(Screen.Integrations, 1, false), true, true, true, true)
        ],

        [SubscriptionType.Enterprise] = [
            new FeatureAccessibility(new(Screen.Dashboard, 0, true), true, true, true, true),
            new FeatureAccessibility(new(Screen.CompanyMaster, 0, true), true, true, true, true),
            new FeatureAccessibility(new(Screen.DivisionMaster, 0, true), true, true, true, true),
            new FeatureAccessibility(new(Screen.CustomerMaster, 0, true), true, true, true, true),
            new FeatureAccessibility(new(Screen.Items, 0, true), true, true, true, true),
            new FeatureAccessibility(new(Screen.Inventory, 0, true), true, true, true, true),
            new FeatureAccessibility(new(Screen.Orders, 10000, false), true, true, true, true),
            new FeatureAccessibility(new(Screen.Invoicing, 0, true), true, true, true, true),
            new FeatureAccessibility(new(Screen.Reports, 0, true), true, true, true, true),
            new FeatureAccessibility(new(Screen.Analytics, 0, true), true, true, true, true),
            new FeatureAccessibility(new(Screen.Users, 0, true), true, true, true, true),
            new FeatureAccessibility(new(Screen.Settings, 0, true), true, true, true, true),
            new FeatureAccessibility(new(Screen.Integrations, 0, true), true, true, true, true)
        ]
    };

    public static IReadOnlyList<FeatureAccessibility> GetScreens(SubscriptionType subscriptionType)
        => _screens[subscriptionType];
}