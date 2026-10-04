using HotChocolate.Execution.Configuration;
using WebAPI.Queries;

namespace WebAPI.Extensions;

public static class QueryRegistrationExtension
{
    public static IRequestExecutorBuilder RegisterQueryTypes(this IRequestExecutorBuilder builder)
    {
        builder.AddQueryType(d => d.Name("Query"));
        builder.AddTypeExtension<SchemaVersionQuery>();
        builder.AddTypeExtension<AuthenticationQuery>();
        builder.AddTypeExtension<MastersQuery>();
        builder.AddTypeExtension<CompanyQuery>();
        builder.AddTypeExtension<StoreQuery>();
        builder.AddTypeExtension<WarehouseQuery>();
        builder.AddTypeExtension<ColourQuery>();
        builder.AddTypeExtension<SizeQuery>();
        builder.AddTypeExtension<ItemQuery>();
        builder.AddTypeExtension<CollectionQuery>();
        builder.AddTypeExtension<InventoryQuery>();
        builder.AddTypeExtension<UserQuery>();

        return builder;
    }
}