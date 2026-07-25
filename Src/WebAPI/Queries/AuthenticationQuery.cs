using Application.Interfaces.GraphQLService;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class AuthenticationQuery
{
    [GraphQLDescription("Check UserName Availability. Returns true if available, false if taken.")]
    public async Task<bool> CheckUserNameAvailabilityAsync(
        [Service] IRegisterationService registerUserService,
        string username,
        CancellationToken cancellationToken)
    {
        return await registerUserService.IsUserNameAvailableAsync(username, cancellationToken);
    }

    [GraphQLDescription("Check Email Availability. Returns true if available, false if taken.")]
    public async Task<bool> CheckEmailAvailabilityAsync(
        [Service] IRegisterationService registerUserService,
        string email,
        CancellationToken cancellationToken)
    {
        return await registerUserService.IsEmailRegisteredAsync(email, cancellationToken);
    }

    [GraphQLDescription("Check Contact Availability. Returns true if available, false if taken.")]
    public async Task<bool> CheckContactAvailabilityAsync(
    [Service] IRegisterationService registerUserService,
    string contactNumber,
    CancellationToken cancellationToken)
    {
        return await registerUserService.IsContactRegisteredAsync(contactNumber, cancellationToken);
    }
}