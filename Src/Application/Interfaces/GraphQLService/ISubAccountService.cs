using Application.DTOs.Users;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.GraphQLService;

public interface ISubAccountService
{
    Task<SubAccountPayload> CreateSubAccountAsync(SubAccountRequest request, CancellationToken cancellationToken = default);
    Task<SubAccountPayload> UpdateSubAccountAsync(SubAccountRequest request, CancellationToken cancellationToken = default);
    Task<IEnumerable<SubAccountDto>> GetSubAccountsAsync(string accountId, string adminUserName, CancellationToken cancellationToken = default);
    Task<SubAccountDto?> GetSubAccountByUserNameAsync(string accountId, string adminUserName, string userName, CancellationToken cancellationToken = default);
    Task<bool> CheckUserNameExistsAsync(string userName, CancellationToken cancellationToken = default);
    Task<SubAccountPayload> DeleteSubAccountAsync(string accountId, string adminUserName, string userName, CancellationToken cancellationToken = default);
}
