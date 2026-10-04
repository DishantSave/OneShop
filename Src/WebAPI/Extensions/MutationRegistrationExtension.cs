using HotChocolate.Execution.Configuration;
using WebAPI.Mutations;
using WebAPI.Mutations.Catalog;
using WebAPI.Mutations.Inventory;
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
        builder.AddTypeExtension<WarehouseMutation>();
        builder.AddTypeExtension<ColourMutation>();
        builder.AddTypeExtension<SizeMutation>();

        //Catalog
        builder.AddTypeExtension<ItemMutation>();
        builder.AddTypeExtension<CollectionMutation>();

        //Inventory
        builder.AddTypeExtension<InventoryMutation>();

        //Users
        builder.AddTypeExtension<UserMutation>();

        return builder;
    }
}