using Application.DTOs.Schema;

namespace Application.Interfaces.GraphQLService;

public interface ISchemaFetchService
{
    Task<SchemaVersionDto?> GetSchemaAsync(CancellationToken cancellationToken = default);
}