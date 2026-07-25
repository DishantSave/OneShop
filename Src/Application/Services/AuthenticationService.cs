using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services;

public class AuthenticationService(IAuthenticationRepository userRepository) : IAuthenticationService
{
    readonly IAuthenticationRepository _userRepository = userRepository;

    public async Task<AuthenticationPayload> AuthenticateUserAsync(string userName, string password, CancellationToken cancellationToken = default)
    {
        return await _userRepository.AuthenticateUserAsync(userName, password, cancellationToken);
    }
}