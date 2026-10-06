namespace Application.GraphQL.InputModels;

public class StateTaxInput
{
    public string CountryCode { get; set; } = "IN";
    public string StateCode { get; set; } = string.Empty;
    public string StateName { get; set; } = string.Empty;
    public decimal TaxRate { get; set; } = 0;
    public string TaxType { get; set; } = "GST";
    public bool IsActive { get; set; } = true;
}
