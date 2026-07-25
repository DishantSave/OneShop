namespace Application.Common.Tenant;

public interface ITenantContext
{
    string TenantId { get; }
    TenantType TenantType { get; }
    string ConnectionString { get; }
}