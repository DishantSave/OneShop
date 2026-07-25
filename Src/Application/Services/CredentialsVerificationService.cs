using Application.Interfaces.GraphQLService;
using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace Application.Services;

public class CredentialsVerificationService : ICredentialsVerificationService
{
    // Variable for Contact OTP generation and validation
    private static readonly ConcurrentDictionary<string, (string Otp, DateTime Expiry)> _otpStore = new();
    private static readonly RandomNumberGenerator _rng = RandomNumberGenerator.Create();
    //----------------------------------------------------------------------------------------------------------

    // Variable for Email OTP generation and validation
    private static readonly ConcurrentDictionary<string, (string Otp, DateTime Expiry)> _emailOtpStore = new();
    private static readonly RandomNumberGenerator _rngEmail = RandomNumberGenerator.Create();
    //----------------------------------------------------------------------------------------------------------

    // OTP Based Validation Mutations section starts...
    public async Task<string> SendContactValidationOTP(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            throw new Exception("Phone number is required.");

        if (_otpStore.TryGetValue(phoneNumber, out var existingOtp)
            && existingOtp.Expiry > DateTime.UtcNow)
        {
            return "OTP already sent. Please try again later.";
        }

        var newOtp = GenerateContactValidationOTP();
        var expiry = DateTime.UtcNow.AddMinutes(5);

        _otpStore.AddOrUpdate(phoneNumber, (newOtp, expiry), (key, old) => (newOtp, expiry));

        Console.WriteLine($"[DEBUG] OTP for {phoneNumber}: {newOtp}");

        return "OTP sent successfully!";
    }

    public async Task<string> ValidateOTPForGivenContact(string phoneNumber, string otp)
    {
        if (!_otpStore.TryGetValue(phoneNumber, out var entry))
            throw new Exception("No OTP found for this number.");

        if (DateTime.UtcNow > entry.Expiry)
        {
            _otpStore.TryRemove(phoneNumber, out _);
            throw new Exception("OTP expired. Please request again.");
        }

        if (entry.Otp != otp)
            throw new Exception("Invalid OTP. Please try again.");

        _otpStore.TryRemove(
            new KeyValuePair<string, (string, DateTime)>(phoneNumber, entry));

        return "Contact verified successfully!";
    }

    public async Task<string> SendEmailValidationOTP(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new Exception("Email is required.");

        if (_emailOtpStore.TryGetValue(email, out var existingOtp)
            && existingOtp.Expiry > DateTime.UtcNow)
        {
            return "OTP already sent. Please try again later.";
        }

        var newOtp = GenerateEmailValidationOTP();
        var expiry = DateTime.UtcNow.AddMinutes(5);

        _emailOtpStore.AddOrUpdate(email, (newOtp, expiry), (key, old) => (newOtp, expiry));

        Console.WriteLine($"[DEBUG] Email OTP for {email}: {newOtp}");

        return "OTP sent successfully!";
    }

    public async Task<string> ValidateOTPForGivenEmail(string email, string otp)
    {
        if (!_emailOtpStore.TryGetValue(email, out var entry))
            throw new Exception("No OTP found for this email.");

        if (DateTime.UtcNow > entry.Expiry)
        {
            _emailOtpStore.TryRemove(email, out _);
            throw new Exception("OTP expired. Please request again.");
        }

        if (entry.Otp != otp)
            throw new Exception("Invalid OTP. Please try again.");

        _emailOtpStore.TryRemove(
            new KeyValuePair<string, (string, DateTime)>(email, entry));

        return "Email verified successfully!";
    }
    // OTP Based Validation Mutations section ends...

    /*****************************************************************************************************************/

    // Private methods section starts...
    private static string GenerateContactValidationOTP()
    {
        var bytes = new byte[4];
        _rng.GetBytes(bytes);
        return (Math.Abs(BitConverter.ToInt32(bytes, 0)) % 1_000_000).ToString("D6");
    }

    private static string GenerateEmailValidationOTP()
    {
        var bytes = new byte[4];
        _rngEmail.GetBytes(bytes);
        return (Math.Abs(BitConverter.ToInt32(bytes, 0)) % 1_000_000).ToString("D6");
    }
    // Private methods section ends...
}