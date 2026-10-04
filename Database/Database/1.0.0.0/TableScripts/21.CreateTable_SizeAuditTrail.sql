USE [ONESHOP];
GO

CREATE TABLE [dbo].[SizeAuditTrail]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[SizeCode] [VARCHAR](10) NOT NULL,
	[Field] [VARCHAR](200) NOT NULL,
	[Description] [VARCHAR](1000) NOT NULL,
	[DateModified] [DATETIME] NOT NULL,
	[ModifiedBy] [VARCHAR](200) NOT NULL,
	[TimestampedAt] [TIMESTAMP] NULL,

CONSTRAINT [PK_SizeAuditTrail] PRIMARY KEY CLUSTERED
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

ALTER TABLE [dbo].[SizeAuditTrail]
ADD CONSTRAINT [DF_SizeAuditTrail_DateModified]
DEFAULT (SYSDATETIME()) FOR [DateModified];
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[SizeAuditTrail]
WITH CHECK
ADD CONSTRAINT [FK_SizeAuditTrail_Size]
FOREIGN KEY ([AccountId], [CompanyCode], [SizeCode])
REFERENCES [dbo].[Size]([AccountId], [CompanyCode], [Code]);
GO

ALTER TABLE [dbo].[SizeAuditTrail]
CHECK CONSTRAINT [FK_SizeAuditTrail_Size];
GO
