namespace Application.Interfaces.GraphQLService;

public interface IJwtTokenService
{
    string GenerateToken(
        string accountId,
        string userId,
        string userName,
        bool isCustomerAccount = false,
        bool isSellerAccount = false);
}