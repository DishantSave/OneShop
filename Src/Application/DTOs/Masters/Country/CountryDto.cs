namespace Application.DTOs.Masters.Country;

public class CountryDto
{
    public long Sequence { get; set; }
    public string Country { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string ISDCode { get; set; } = string.Empty;
    public string? Flag { get; set; }
}