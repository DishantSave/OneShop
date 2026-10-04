USE [ONESHOP];
GO

CREATE TABLE [dbo].[ItemAuditTrail]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[ItemNumber] [VARCHAR](50) NOT NULL,
	[Field] [VARCHAR](200) NOT NULL,
	[Description] [VARCHAR](1000) NOT NULL,
	[DateModified] [DATETIME] NOT NULL,
	[ModifiedBy] [VARCHAR](200) NOT NULL,
	[TimestampedAt] [TIMESTAMP] NULL,

CONSTRAINT [PK_ItemAuditTrail] PRIMARY KEY CLUSTERED
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

ALTER TABLE [dbo].[ItemAuditTrail]
ADD CONSTRAINT [DF_ItemAuditTrail_DateModified]
DEFAULT (SYSDATETIME()) FOR [DateModified];
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[ItemAuditTrail]
WITH CHECK
ADD CONSTRAINT [FK_ItemAuditTrail_Item]
FOREIGN KEY ([AccountId], [CompanyCode], [ItemNumber])
REFERENCES [dbo].[Item]([AccountId], [CompanyCode], [ItemNumber])
ON DELETE CASCADE;
GO

ALTER TABLE [dbo].[ItemAuditTrail]
CHECK CONSTRAINT [FK_ItemAuditTrail_Item];
GO
