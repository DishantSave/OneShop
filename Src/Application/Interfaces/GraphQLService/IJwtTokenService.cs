namespace Application.Interfaces.GraphQLService;

public interface IJwtTokenService
{
    string GenerateToken(
        string accountId,
        string userId,
        string userName);
}