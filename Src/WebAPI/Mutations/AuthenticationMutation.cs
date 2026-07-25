using Application.DTOs.Auth;
using Application.GraphQL.InputModels;
using Application.GraphQL.Payloads;
using Application.Interfaces.GraphQLService;

namespace WebAPI.Mutations;

[ExtendObjectType("Mutation")]
public class AuthenticationMutation
{
    [GraphQLDescription("Registers users and returns credentials on success.")]
    public async Task<AuthenticationPayload> RegisterUserAsync(
        RegisterInput input,
        [Service] IRegisterationService registerService,
        CancellationToken cancellationToken)
    {
        try
        {
            var request = new RegisterRequest(
                input.UserName.Trim(),
                input.Password,
                Guid.NewGuid().ToString(), //Replace with a actual Token Generation Library.
                input.IsCustomerAccount,
                input.IsSellerAccount,
                input.Company,
                input.ProfilePicture ?? "https://www.nicepng.com/png/detail/933-9332131_profile-picture-default-png.png",
                input.Email,
                input.Contact,
                input.Country,
                input.IsTestAccount
            );

            return await registerService.ExecuteAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            return new AuthenticationPayload()
            {
                Success = false,
                Message = $"An error occurred during registration. Error: {ex.Message}"
            };
        }
    }

    [GraphQLDescription("Authenticates users and returns credentials on success.")]
    public async Task<AuthenticationPayload> AuthenticateUserAsync(
        [Service] IAuthenticationService authenticationService,
        string userName,
        string password,
        CancellationToken cancellationToken)
    {
        return await authenticationService.AuthenticateUserAsync(userName, password, cancellationToken);
    }

    [GraphQLDescription("Send OTP to given contact number.")]
    public async Task<string> SendContactValidationOTPAsync(
        [Service] ICredentialsVerificationService validationService,
        string contactNumber,
        CancellationToken cancellationToken)
    {
        return await validationService.SendContactValidationOTP(contactNumber);
    }

    [GraphQLDescription("Validate OTP for given contact number.")]
    public async Task<string> ValidateOTPForGivenContactAsync(
        [Service] ICredentialsVerificationService validationService,
        string contactNumber,
        string otp,
        CancellationToken cancellationToken)
    {
        return await validationService.ValidateOTPForGivenContact(contactNumber, otp);
    }

    [GraphQLDescription("Send OTP to given email address.")]
    public async Task<string> SendEmailValidationOTPAsync(
        [Service] ICredentialsVerificationService validationService,
        string email,
        CancellationToken cancellationToken)
    {
        return await validationService.SendEmailValidationOTP(email);
    }

    [GraphQLDescription("Validate OTP for given email address.")]
    public async Task<string> ValidateOTPForGivenEmailAsync(
        [Service] ICredentialsVerificationService validationService,
        string email,
        string otp,
        CancellationToken cancellationToken)
    {
        return await validationService.ValidateOTPForGivenEmail(email, otp);
    }
}