using Application.DTOs.Address;
using Application.GraphQL.Payloads;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services.Address;

public class UserAddressService(IUserAddressRepository repository) : IUserAddressService
{
    private readonly IUserAddressRepository _repository = repository;

    public Task<IEnumerable<UserAddressDto>> GetUserAddressesAsync(string accountId, string userName, CancellationToken cancellationToken = default)
        => _repository.GetUserAddressesAsync(accountId, userName, cancellationToken);

    public Task<UserAddressDto?> GetUserAddressByIdAsync(string accountId, string userName, string addressId, CancellationToken cancellationToken = default)
        => _repository.GetUserAddressByIdAsync(accountId, userName, addressId, cancellationToken);

    public Task<UserAddressPayload> SaveUserAddressAsync(UserAddressRequest request, CancellationToken cancellationToken = default)
        => _repository.SaveUserAddressAsync(request, cancellationToken);

    public Task<UserAddressPayload> DeleteUserAddressAsync(string accountId, string userName, string addressId, CancellationToken cancellationToken = default)
        => _repository.DeleteUserAddressAsync(accountId, userName, addressId, cancellationToken);

    public Task<UserAddressPayload> SetDefaultAddressAsync(string accountId, string userName, string addressId, CancellationToken cancellationToken = default)
        => _repository.SetDefaultAddressAsync(accountId, userName, addressId, cancellationToken);
}
