namespace Application.GraphQL.InputModels;

public record SubAccountInput(
    string UserName,
    string? Password,
    string? Designation,
    string? Department,
    string? Company,
    string? ProfilePicture,
    string Email,
    string Contact,
    string Country,
    bool IsTestAccount = false,
    bool IsActive = true,
    List<ScreenAccessInput>? ScreenAccess = null
);
