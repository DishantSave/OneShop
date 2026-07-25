using Domain.Enums;

namespace Domain.Accessibility;

public sealed record ScreenThreshold(
    Screen Screen,
    int Threshold,
    bool IsUnlimited = false);