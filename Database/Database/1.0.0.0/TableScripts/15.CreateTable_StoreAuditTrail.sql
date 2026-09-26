USE [ONESHOP];
GO

CREATE TABLE [dbo].[StoreAuditTrail]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[StoreCode] [VARCHAR](4) NOT NULL,
	[Field] [VARCHAR](200) NOT NULL,
	[Description] [VARCHAR](1000) NOT NULL,
	[DateModified] [DATETIME] NOT NULL,
	[ModifiedBy] [VARCHAR](200) NOT NULL,
	[TimestampedAt] [TIMESTAMP] NULL,

CONSTRAINT [PK_StoreAuditTrail] PRIMARY KEY CLUSTERED
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

ALTER TABLE [dbo].[StoreAuditTrail]
ADD CONSTRAINT [DF_StoreAuditTrail_DateModified]
DEFAULT (SYSDATETIME()) FOR [DateModified];
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[StoreAuditTrail]
WITH CHECK
ADD CONSTRAINT [FK_StoreAuditTrail_Store]
FOREIGN KEY ([AccountId], [CompanyCode], [StoreCode])
REFERENCES [dbo].[Store]([AccountId], [CompanyCode], [Code]);
GO

ALTER TABLE [dbo].[StoreAuditTrail]
CHECK CONSTRAINT [FK_StoreAuditTrail_Store];
GO
