namespace Application.GraphQL.InputModels;

public record RegisterInput(
    string UserName,
    string Password,
    string? Company,
    string? ProfilePicture,
    string Email,
    string Contact,
    string Country,
    bool IsCustomerAccount,
    bool IsSellerAccount,
    bool IsTestAccount = false
);