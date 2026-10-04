namespace Application.DTOs.Masters.Size;

public record SizeRequest(
    string UserAccountId,
    string UserName,
    string CompanyCode,
    string Code,
    string Name,
    int SortOrder,
    bool IsActive
);
