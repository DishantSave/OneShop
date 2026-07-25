using Application.DTOs.Schema;

namespace Application.Interfaces.DataService;

public interface ISchemaRepository
{
    Task<IEnumerable<SchemaVersionDto>> GetAllSchemaVersionsAsync(CancellationToken cancellationToken = default);
    Task<SchemaVersionDto?> GetLatestSchemaVersionAsync(CancellationToken cancellationToken = default);
}