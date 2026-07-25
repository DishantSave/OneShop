using Application.DTOs.Schema;
using Application.Interfaces.GraphQLService;

namespace WebAPI.Queries;

[ExtendObjectType("Query")]
public class SchemaVersionQuery
{
    [GraphQLDescription("Get Schema Version details.")]
    public async Task<SchemaVersionDto?> GetSchemaAsync(
        [Service] ISchemaFetchService schemaFetchService,
        CancellationToken cancellationToken)
    {
        return await schemaFetchService.GetSchemaAsync(cancellationToken);
    }
}