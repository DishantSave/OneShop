namespace Application.DTOs.Users;

public record SubAccountRequest(
    string UserAccountId,
    string AdminUserName,
    string UserName,
    string? Password,
    string? Designation,
    string? Department,
    string Company,
    string? ProfilePicture,
    string Email,
    string Contact,
    string Country,
    bool IsTestAccount,
    bool IsActive,
    List<SubAccountScreenAccessDto> ScreenAccess
);
