using Application.DTOs.Address;
using Application.GraphQL.Payloads;

namespace Application.Interfaces.GraphQLService;

public interface IUserAddressService
{
    Task<IEnumerable<UserAddressDto>> GetUserAddressesAsync(string accountId, string userName, CancellationToken cancellationToken = default);
    Task<UserAddressDto?> GetUserAddressByIdAsync(string accountId, string userName, string addressId, CancellationToken cancellationToken = default);
    Task<UserAddressPayload> SaveUserAddressAsync(UserAddressRequest request, CancellationToken cancellationToken = default);
    Task<UserAddressPayload> DeleteUserAddressAsync(string accountId, string userName, string addressId, CancellationToken cancellationToken = default);
    Task<UserAddressPayload> SetDefaultAddressAsync(string accountId, string userName, string addressId, CancellationToken cancellationToken = default);
}
