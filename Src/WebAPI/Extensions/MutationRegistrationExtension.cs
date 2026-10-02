using HotChocolate.Execution.Configuration;
using WebAPI.Mutations;
using WebAPI.Mutations.Masters;

namespace WebAPI.Extensions;

public static class MutationRegistrationExtension
{
    public static IRequestExecutorBuilder RegisterMutationTypes(this IRequestExecutorBuilder builder)
    {
        builder.AddMutationType(d => d.Name("Mutation"));
        
        //Authentication
        builder.AddTypeExtension<AuthenticationMutation>();


        //Masters
        builder.AddTypeExtension<CompanyMutation>();
        builder.AddTypeExtension<StoreMutation>();

        //Users
        builder.AddTypeExtension<UserMutation>();

        return builder;
    }
}