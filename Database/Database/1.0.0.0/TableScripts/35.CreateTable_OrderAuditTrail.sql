USE [ONESHOP];
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderAuditTrail')
BEGIN
    CREATE TABLE [dbo].[OrderAuditTrail]
    (
        [Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
        [AccountId] [VARCHAR](16) NOT NULL,
        [CompanyCode] [VARCHAR](50) NOT NULL,
        [OrderId] [VARCHAR](50) NOT NULL,
        [ActionType] [VARCHAR](50) NOT NULL, -- 'Created', 'StatusChanged', 'DetailsUpdated', 'CommentAdded'
        [Field] [VARCHAR](100) NULL,
        [OldValue] [VARCHAR](MAX) NULL,
        [NewValue] [VARCHAR](MAX) NULL,
        [Description] [VARCHAR](1000) NOT NULL,
        [DateModified] [DATETIME] NOT NULL CONSTRAINT [DF_OrderAuditTrail_DateModified] DEFAULT (SYSDATETIME()),
        [ModifiedBy] [VARCHAR](200) NOT NULL,
        [UserRole] [VARCHAR](50) NULL,

        CONSTRAINT [PK_OrderAuditTrail] PRIMARY KEY CLUSTERED ([Sequence] ASC)
    );

    CREATE NONCLUSTERED INDEX [IX_OrderAuditTrail_Order]
    ON [dbo].[OrderAuditTrail] ([AccountId], [CompanyCode], [OrderId], [DateModified] DESC);
END
GO
