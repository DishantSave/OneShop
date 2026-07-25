namespace Application.Interfaces.GraphQLService;

public interface ICredentialsVerificationService
{
    Task<string> SendContactValidationOTP(string phoneNumber);
    Task<string> SendEmailValidationOTP(string email);
    Task<string> ValidateOTPForGivenContact(string phoneNumber, string otp);
    Task<string> ValidateOTPForGivenEmail(string email, string otp);
}