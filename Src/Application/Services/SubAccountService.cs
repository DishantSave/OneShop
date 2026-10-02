using Application.DTOs.Users;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;
using Microsoft.AspNetCore.Identity;

namespace Application.Services;

public class SubAccountService(ISubAccountRepository subAccountRepository) : ISubAccountService
{
    private readonly ISubAccountRepository _subAccountRepository = subAccountRepository;
    private readonly PasswordHasher<object> _passwordHasher = new();

    public async Task<IEnumerable<SubAccountDto>> GetSubAccountsAsync(string accountId, string adminUserName, CancellationToken cancellationToken = default)
    {
        if (!await _subAccountRepository.IsMainAccountHolderAsync(accountId, adminUserName, cancellationToken))
            throw new UnauthorizedAccessException("Access denied. Only the primary account holder can access User Management.");

        return await _subAccountRepository.GetAllSubAccountsAsync(accountId, cancellationToken);
    }

    public async Task<SubAccountDto?> GetSubAccountByUserNameAsync(string accountId, string adminUserName, string userName, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(userName))
            return null;

        if (!await _subAccountRepository.IsMainAccountHolderAsync(accountId, adminUserName, cancellationToken))
            throw new UnauthorizedAccessException("Access denied. Only the primary account holder can access User Management.");

        return await _subAccountRepository.GetSubAccountByUserNameAsync(accountId, userName.Trim(), cancellationToken);
    }

    public async Task<bool> CheckUserNameExistsAsync(string userName, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userName))
            return false;

        return await _subAccountRepository.ExistsByUserNameAsync(userName.Trim(), cancellationToken);
    }

    public async Task<SubAccountPayload> CreateSubAccountAsync(SubAccountRequest request, CancellationToken cancellationToken = default)
    {
        if (!await _subAccountRepository.IsMainAccountHolderAsync(request.UserAccountId, request.AdminUserName, cancellationToken))
        {
            return new SubAccountPayload
            {
                Success = false,
                Message = "Access denied. Only the primary account holder can create sub-accounts."
            };
        }

        var userName = request.UserName.Trim();

        if (string.IsNullOrWhiteSpace(userName) || userName.Length < 3)
        {
            return new SubAccountPayload
            {
                Success = false,
                Message = "Username must be at least 3 characters long."
            };
        }

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
        {
            return new SubAccountPayload
            {
                Success = false,
                Message = "Password must be at least 6 characters long."
            };
        }

        if (await _subAccountRepository.ExistsByUserNameAsync(userName, cancellationToken))
        {
            return new SubAccountPayload
            {
                Success = false,
                Message = $"Username [{userName}] is already taken. Please choose another username."
            };
        }

        var passwordHash = _passwordHasher.HashPassword(userName, request.Password);

        return await _subAccountRepository.RegisterSubAccountTransactionAsync(request, passwordHash, cancellationToken);
    }

    public async Task<SubAccountPayload> UpdateSubAccountAsync(SubAccountRequest request, CancellationToken cancellationToken = default)
    {
        if (!await _subAccountRepository.IsMainAccountHolderAsync(request.UserAccountId, request.AdminUserName, cancellationToken))
        {
            return new SubAccountPayload
            {
                Success = false,
                Message = "Access denied. Only the primary account holder can update sub-accounts."
            };
        }

        var userName = request.UserName.Trim();

        if (!await _subAccountRepository.ExistsByUserNameAsync(userName, cancellationToken))
        {
            return new SubAccountPayload
            {
                Success = false,
                Message = $"Sub-account [{userName}] could not be found."
            };
        }

        string? passwordHash = null;
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            if (request.Password.Length < 6)
            {
                return new SubAccountPayload
                {
                    Success = false,
                    Message = "New password must be at least 6 characters long."
                };
            }
            passwordHash = _passwordHasher.HashPassword(userName, request.Password);
        }

        return await _subAccountRepository.UpdateSubAccountTransactionAsync(request, passwordHash, cancellationToken);
    }

    public async Task<SubAccountPayload> DeleteSubAccountAsync(string accountId, string adminUserName, string userName, CancellationToken cancellationToken = default)
    {
        if (!await _subAccountRepository.IsMainAccountHolderAsync(accountId, adminUserName, cancellationToken))
        {
            return new SubAccountPayload
            {
                Success = false,
                Message = "Access denied. Only the primary account holder can delete sub-accounts."
            };
        }

        var targetUserName = userName.Trim();

        if (!await _subAccountRepository.ExistsByUserNameAsync(targetUserName, cancellationToken))
        {
            return new SubAccountPayload
            {
                Success = false,
                Message = $"Sub-account [{targetUserName}] could not be found."
            };
        }

        return await _subAccountRepository.DeleteSubAccountTransactionAsync(accountId, targetUserName, adminUserName, cancellationToken);
    }
}
