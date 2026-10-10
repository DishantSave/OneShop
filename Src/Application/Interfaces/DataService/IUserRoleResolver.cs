using System.Security.Claims;

namespace Application.Interfaces.DataService;

public interface IUserRoleResolver
{
    Task<bool> IsCustomerAsync(ClaimsPrincipal user, CancellationToken cancellationToken = default);
}
