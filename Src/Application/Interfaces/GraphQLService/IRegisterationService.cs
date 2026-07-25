using Application.DTOs.Auth;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.GraphQLService;

public interface IRegisterationService
{
    Task<AuthenticationPayload> ExecuteAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<bool> IsContactRegisteredAsync(string contactNumber, CancellationToken cancellationToken = default);
    Task<bool> IsEmailRegisteredAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> IsUserNameAvailableAsync(string userName, CancellationToken cancellationToken = default);
}