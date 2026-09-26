USE [ONESHOP];
GO

CREATE OR ALTER TRIGGER [dbo].[TR_Company_CascadeStatusToStore]
ON [dbo].[Company]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Handle Company Active / Inactive Cascade
    IF UPDATE([IsActive])
    BEGIN
        -- Company changed from Active (1) to Inactive (0):
        -- Save existing store active state into OriginalIsActive and deactivate the store
        UPDATE s
        SET s.[OriginalIsActive] = s.[IsActive],
            s.[IsActive] = 0
        FROM [dbo].[Store] s
        INNER JOIN inserted i ON s.[AccountId] = i.[AccountId] AND s.[CompanyCode] = i.[Code]
        INNER JOIN deleted d ON d.[AccountId] = i.[AccountId] AND d.[Code] = i.[Code]
        WHERE d.[IsActive] = 1 AND i.[IsActive] = 0;

        -- Company changed from Inactive (0) to Active (1):
        -- Restore store active state back to its OriginalIsActive value
        UPDATE s
        SET s.[IsActive] = s.[OriginalIsActive]
        FROM [dbo].[Store] s
        INNER JOIN inserted i ON s.[AccountId] = i.[AccountId] AND s.[CompanyCode] = i.[Code]
        INNER JOIN deleted d ON d.[AccountId] = i.[AccountId] AND d.[Code] = i.[Code]
        WHERE d.[IsActive] = 0 AND i.[IsActive] = 1;
    END

    -- 2. Handle Company Test / Sandbox Cascade
    IF UPDATE([IsTestCompany])
    BEGIN
        -- Company changed from Production (0) to Sandbox (1):
        -- Save existing store sandbox state into OriginalIsTestStore and force sandbox mode
        UPDATE s
        SET s.[OriginalIsTestStore] = s.[IsTestStore],
            s.[IsTestStore] = 1
        FROM [dbo].[Store] s
        INNER JOIN inserted i ON s.[AccountId] = i.[AccountId] AND s.[CompanyCode] = i.[Code]
        INNER JOIN deleted d ON d.[AccountId] = i.[AccountId] AND d.[Code] = i.[Code]
        WHERE d.[IsTestCompany] = 0 AND i.[IsTestCompany] = 1;

        -- Company changed from Sandbox (1) to Production (0):
        -- Restore store sandbox state back to its OriginalIsTestStore value
        UPDATE s
        SET s.[IsTestStore] = s.[OriginalIsTestStore]
        FROM [dbo].[Store] s
        INNER JOIN inserted i ON s.[AccountId] = i.[AccountId] AND s.[CompanyCode] = i.[Code]
        INNER JOIN deleted d ON d.[AccountId] = i.[AccountId] AND d.[Code] = i.[Code]
        WHERE d.[IsTestCompany] = 1 AND i.[IsTestCompany] = 0;
    END
END;
GO
