using Application.GraphQL.Payloads;

namespace Application.Interfaces.DataService;

public interface IAuthenticationRepository
{
    Task<bool> ExistsByUserNameAsync(string userName, CancellationToken cancellationToken = default);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> ExistsByContactAsync(string contact, CancellationToken cancellationToken = default);
    Task<AuthenticationPayload> RegisterUserTransactionAsync(
        string userName,
        string passwordHash,
        string apiTokenKey,
        bool isCustomer,
        bool isSeller,
        string? company,
        string profilePicture,
        string email,
        string contact,
        string country,
        bool isTestAccount,
        CancellationToken cancellationToken = default);
    Task<AuthenticationPayload> AuthenticateUserAsync(string userName, string password, CancellationToken cancellationToken = default);
}