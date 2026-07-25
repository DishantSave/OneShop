using Application.DTOs.Schema;
using Application.Interfaces.DataService;
using Application.Interfaces.GraphQLService;

namespace Application.Services;

public class SchemaFetchService(ISchemaRepository schemaRepository) : ISchemaFetchService
{
    readonly ISchemaRepository _schemaRepository = schemaRepository;

    public async Task<SchemaVersionDto?> GetSchemaAsync(CancellationToken cancellationToken = default)
    {
        return await _schemaRepository.GetLatestSchemaVersionAsync(cancellationToken);
    }
}