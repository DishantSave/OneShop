using Application.GraphQL.Payloads;

namespace Application.Interfaces.GraphQLService;

public interface IAuthenticationService
{
    Task<AuthenticationPayload> AuthenticateUserAsync(string userName, string password, CancellationToken cancellationToken = default);
}