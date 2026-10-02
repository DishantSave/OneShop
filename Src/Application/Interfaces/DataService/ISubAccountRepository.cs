using Application.DTOs.Users;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.DataService;

public interface ISubAccountRepository
{
    Task<bool> IsMainAccountHolderAsync(string accountId, string userName, CancellationToken cancellationToken = default);
    Task<IEnumerable<SubAccountDto>> GetAllSubAccountsAsync(string accountId, CancellationToken cancellationToken = default);
    Task<SubAccountDto?> GetSubAccountByUserNameAsync(string accountId, string userName, CancellationToken cancellationToken = default);
    Task<bool> ExistsByUserNameAsync(string userName, CancellationToken cancellationToken = default);
    Task<SubAccountPayload> RegisterSubAccountTransactionAsync(SubAccountRequest request, string passwordHash, CancellationToken cancellationToken = default);
    Task<SubAccountPayload> UpdateSubAccountTransactionAsync(SubAccountRequest request, string? passwordHash, CancellationToken cancellationToken = default);
    Task<SubAccountPayload> DeleteSubAccountTransactionAsync(string accountId, string userName, string adminUserName, CancellationToken cancellationToken = default);
}
