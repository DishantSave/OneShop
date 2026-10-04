USE [ONESHOP];
GO

CREATE TABLE [dbo].[ColourAuditTrail]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[ColourCode] [VARCHAR](10) NOT NULL,
	[Field] [VARCHAR](200) NOT NULL,
	[Description] [VARCHAR](1000) NOT NULL,
	[DateModified] [DATETIME] NOT NULL,
	[ModifiedBy] [VARCHAR](200) NOT NULL,
	[TimestampedAt] [TIMESTAMP] NULL,

CONSTRAINT [PK_ColourAuditTrail] PRIMARY KEY CLUSTERED
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

ALTER TABLE [dbo].[ColourAuditTrail]
ADD CONSTRAINT [DF_ColourAuditTrail_DateModified]
DEFAULT (SYSDATETIME()) FOR [DateModified];
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[ColourAuditTrail]
WITH CHECK
ADD CONSTRAINT [FK_ColourAuditTrail_Colour]
FOREIGN KEY ([AccountId], [CompanyCode], [ColourCode])
REFERENCES [dbo].[Colour]([AccountId], [CompanyCode], [Code]);
GO

ALTER TABLE [dbo].[ColourAuditTrail]
CHECK CONSTRAINT [FK_ColourAuditTrail_Colour];
GO
