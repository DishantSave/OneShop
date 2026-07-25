using Domain.Enums;

namespace Application.DTOs.Auth;

public class UserDetailDto
{
    public required string UserName { get; init; }
    public required string UserId { get; init; }
    public required string AccountId { get; init; }
    public required string ApiToken { get; init; }
    public bool IsCustomerAccount { get; init; }
    public bool IsSellerAccount { get; init; }
    public required string Company { get; init; }
    public required string ProfilePicture { get; init; }
    public required string Email { get; init; }
    public required string Contact { get; init; }
    public required string Country { get; init; }
    public bool IsTestAccount { get; init; }
    public DateTime Created { get; init; }
    public required List<UserDetailAuditTrailDto> Audit { get; set; }
    public SubscriptionType? SubscriptionType { get; init; }
}