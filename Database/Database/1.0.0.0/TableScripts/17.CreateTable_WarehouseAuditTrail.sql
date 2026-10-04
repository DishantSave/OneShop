USE [ONESHOP];
GO

CREATE TABLE [dbo].[WarehouseAuditTrail]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[WarehouseCode] [VARCHAR](4) NOT NULL,
	[Field] [VARCHAR](200) NOT NULL,
	[Description] [VARCHAR](1000) NOT NULL,
	[DateModified] [DATETIME] NOT NULL,
	[ModifiedBy] [VARCHAR](200) NOT NULL,
	[TimestampedAt] [TIMESTAMP] NULL,

CONSTRAINT [PK_WarehouseAuditTrail] PRIMARY KEY CLUSTERED
(
	[Sequence] ASC
)
WITH
(
	PAD_INDEX = OFF,
	STATISTICS_NORECOMPUTE = OFF,
	IGNORE_DUP_KEY = OFF,
	ALLOW_ROW_LOCKS = ON,
	ALLOW_PAGE_LOCKS = ON,
	FILLFACTOR = 90
) ON [PRIMARY]

) ON [PRIMARY];
GO

/*************************************************************************************************
	Default Constraints
*************************************************************************************************/

ALTER TABLE [dbo].[WarehouseAuditTrail]
ADD CONSTRAINT [DF_WarehouseAuditTrail_DateModified]
DEFAULT (SYSDATETIME()) FOR [DateModified];
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[WarehouseAuditTrail]
WITH CHECK
ADD CONSTRAINT [FK_WarehouseAuditTrail_Warehouse]
FOREIGN KEY ([AccountId], [CompanyCode], [WarehouseCode])
REFERENCES [dbo].[Warehouse]([AccountId], [CompanyCode], [Code]);
GO

ALTER TABLE [dbo].[WarehouseAuditTrail]
CHECK CONSTRAINT [FK_WarehouseAuditTrail_Warehouse];
GO
