namespace Application.DTOs.Masters.Colour;

public record ColourRequest(
    string UserAccountId,
    string UserName,
    string CompanyCode,
    string Code,
    string Name,
    string? HexCode,
    bool IsActive
);
