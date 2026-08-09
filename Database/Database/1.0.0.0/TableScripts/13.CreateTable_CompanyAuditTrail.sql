USE [ONESHOP];
GO

CREATE TABLE [dbo].[CompanyAuditTrail]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[Code] [VARCHAR](2) NOT NULL,
	[Field] [VARCHAR](200) NOT NULL,
	[Description] [VARCHAR](1000) NOT NULL,
	[DateModified] [DATETIME] NOT NULL,
	[ModifiedBy] [VARCHAR](200) NOT NULL,
	[TimestampedAt] [TIMESTAMP] NULL,

CONSTRAINT [PK_CompanyAuditTrail] PRIMARY KEY CLUSTERED
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

ALTER TABLE [dbo].[CompanyAuditTrail]
ADD CONSTRAINT [DF_CompanyAuditTrail_DateModified]
DEFAULT (SYSDATETIME()) FOR [DateModified];
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[CompanyAuditTrail]
WITH CHECK
ADD CONSTRAINT [FK_CompanyAuditTrail_Company]
FOREIGN KEY ([AccountId], [Code])
REFERENCES [dbo].[Company]([AccountId], [Code]);
GO

ALTER TABLE [dbo].[CompanyAuditTrail]
CHECK CONSTRAINT [FK_CompanyAuditTrail_Company];
GO