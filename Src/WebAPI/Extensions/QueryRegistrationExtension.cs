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

        return builder;
    }
}