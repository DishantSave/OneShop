namespace Application.Common.Tenant;

public class TenantContext : ITenantContext
{
    public string TenantId { get; set; } = "DEFAULT_CLOUD";
    public TenantType TenantType { get; set; } = TenantType.CloudDefault;
    public string ConnectionString { get; set; } = string.Empty;
}