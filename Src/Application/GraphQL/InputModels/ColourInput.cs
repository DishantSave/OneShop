namespace Application.GraphQL.InputModels;

public class ColourInput
{
    public string CompanyCode { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? HexCode { get; set; }
    public bool IsActive { get; set; } = true;
}
