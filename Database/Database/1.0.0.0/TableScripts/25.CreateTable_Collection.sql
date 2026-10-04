USE [ONESHOP];
GO

CREATE TABLE [dbo].[Collection]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[Code] [VARCHAR](30) NOT NULL,
	[Name] [VARCHAR](200) NOT NULL,
	[Description] [VARCHAR](1000) NULL,
	[Season] [VARCHAR](50) NULL,
	[Channel] [VARCHAR](20) NOT NULL,
	[BannerImage] [VARCHAR](MAX) NULL,
	[IsActive] [BIT] NOT NULL,
	[DateCreated] [DATETIME] NOT NULL,

CONSTRAINT [PK_Collection] PRIMARY KEY CLUSTERED
(
	[AccountId] ASC,
	[CompanyCode] ASC,
	[Code] ASC
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

) ON [PRIMARY]
GO

/*************************************************************************************************
	Default Constraints
*************************************************************************************************/

ALTER TABLE [dbo].[Collection]
ADD CONSTRAINT [DF_Collection_Channel]
DEFAULT ('Both') FOR [Channel];
GO

ALTER TABLE [dbo].[Collection]
ADD CONSTRAINT [DF_Collection_IsActive]
DEFAULT ((1)) FOR [IsActive];
GO

ALTER TABLE [dbo].[Collection]
ADD CONSTRAINT [DF_Collection_DateCreated]
DEFAULT (SYSDATETIME()) FOR [DateCreated];
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[Collection]
WITH CHECK
ADD CONSTRAINT [FK_Collection_Company]
FOREIGN KEY ([AccountId], [CompanyCode])
REFERENCES [dbo].[Company]([AccountId], [Code]);
GO

ALTER TABLE [dbo].[Collection]
CHECK CONSTRAINT [FK_Collection_Company];
GO
