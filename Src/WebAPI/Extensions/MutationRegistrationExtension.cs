using HotChocolate.Execution.Configuration;
using WebAPI.Mutations;

namespace WebAPI.Extensions;

public static class MutationRegistrationExtension
{
    public static IRequestExecutorBuilder RegisterMutationTypes(this IRequestExecutorBuilder builder)
    {
        builder.AddMutationType(d => d.Name("Mutation"));
        builder.AddTypeExtension<AuthenticationMutation>();

        return builder;
    }
}