using Application.DTOs.Auth;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;
using Microsoft.AspNetCore.Identity;

namespace Application.Services;

public class RegisterationService(IAuthenticationRepository userRepository) : IRegisterationService
{
    readonly IAuthenticationRepository _userRepository = userRepository;

    public async Task<bool> IsUserNameAvailableAsync(string userName, CancellationToken cancellationToken = default)
    {
        bool exists = await _userRepository.ExistsByUserNameAsync(userName, cancellationToken);
        return !exists;
    }

    public async Task<bool> IsEmailRegisteredAsync(string email, CancellationToken cancellationToken = default)
    {
        bool exists = await _userRepository.ExistsByEmailAsync(email, cancellationToken);
        return !exists;
    }

    public async Task<bool> IsContactRegisteredAsync(string contactNumber, CancellationToken cancellationToken = default)
    {
        bool exists = await _userRepository.ExistsByContactAsync(contactNumber, cancellationToken);
        return !exists;
    }

    public async Task<AuthenticationPayload> ExecuteAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        if (await _userRepository.ExistsByUserNameAsync(request.UserName, cancellationToken))
            return new AuthenticationPayload() { Success = false, Message = $"UserName {request.UserName} is already taken." };

        if (await _userRepository.ExistsByEmailAsync(request.Email, cancellationToken))
            return new AuthenticationPayload() { Success = false, Message = $"Email {request.Email} is already registered." };

        if (await _userRepository.ExistsByContactAsync(request.Contact, cancellationToken))
            return new AuthenticationPayload() { Success = false, Message = $"Phone Number {request.Contact} is already registered." };

        var hasher = new PasswordHasher<object>();

        string passwordHash = hasher.HashPassword(request.UserName, request.Password);

        return await _userRepository.RegisterUserTransactionAsync(
            request.UserName,
            passwordHash,
            request.ApiTokenKey,
            request.IsCustomerAccount,
            request.IsSellerAccount,
            request.Company,
            request.ProfilePicture,
            request.Email,
            request.Contact,
            request.Country,
            request.IsTestAccount,
            cancellationToken
        );
    }
}