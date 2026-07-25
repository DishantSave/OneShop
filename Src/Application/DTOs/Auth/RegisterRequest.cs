namespace Application.DTOs.Auth;

public record RegisterRequest(
    string UserName,
    string Password,
    string ApiTokenKey,
    bool IsCustomerAccount,
    bool IsSellerAccount,
    string? Company,
    string ProfilePicture,
    string Email,
    string Contact,
    string Country,
    bool IsTestAccount = false
);