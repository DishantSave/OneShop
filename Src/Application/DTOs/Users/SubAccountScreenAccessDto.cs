namespace Application.DTOs.Users;

public class SubAccountScreenAccessDto
{
    public required string ScreenName { get; set; }
    public bool CanView { get; set; } = true;
    public bool CanCreate { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
}
