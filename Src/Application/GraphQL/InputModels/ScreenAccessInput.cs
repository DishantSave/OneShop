namespace Application.GraphQL.InputModels;

public record ScreenAccessInput(
    string ScreenName,
    bool CanView = true,
    bool CanCreate = false,
    bool CanEdit = false,
    bool CanDelete = false
);
