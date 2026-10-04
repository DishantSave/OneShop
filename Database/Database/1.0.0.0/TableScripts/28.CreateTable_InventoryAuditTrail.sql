USE [ONESHOP];
GO

CREATE TABLE [dbo].[InventoryAuditTrail]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[ItemNumber] [VARCHAR](50) NOT NULL,
	[ColourCode] [VARCHAR](10) NOT NULL,
	[SizeCode] [VARCHAR](10) NOT NULL,
	[LocationType] [VARCHAR](20) NOT NULL,
	[LocationCode] [VARCHAR](10) NOT NULL,
	[Field] [VARCHAR](200) NOT NULL,
	[Description] [VARCHAR](1000) NOT NULL,
	[DateModified] [DATETIME] NOT NULL,
	[ModifiedBy] [VARCHAR](200) NOT NULL,
	[TimestampedAt] [TIMESTAMP] NULL,

CONSTRAINT [PK_InventoryAuditTrail] PRIMARY KEY CLUSTERED
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

ALTER TABLE [dbo].[InventoryAuditTrail]
ADD CONSTRAINT [DF_InventoryAuditTrail_DateModified]
DEFAULT (SYSDATETIME()) FOR [DateModified];
GO
