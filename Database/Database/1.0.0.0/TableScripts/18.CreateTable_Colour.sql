USE [ONESHOP];
GO

CREATE TABLE [dbo].[Colour]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[Code] [VARCHAR](10) NOT NULL,
	[Name] [VARCHAR](100) NOT NULL,
	[HexCode] [VARCHAR](10) NULL,
	[IsActive] [BIT] NOT NULL,
	[DateCreated] [DATETIME] NOT NULL,

CONSTRAINT [PK_Colour] PRIMARY KEY CLUSTERED
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

ALTER TABLE [dbo].[Colour]
ADD CONSTRAINT [DF_Colour_IsActive]
DEFAULT ((1)) FOR [IsActive];
GO

ALTER TABLE [dbo].[Colour]
ADD CONSTRAINT [DF_Colour_DateCreated]
DEFAULT (SYSDATETIME()) FOR [DateCreated];
GO

/*************************************************************************************************
	Unique Constraints
*************************************************************************************************/

ALTER TABLE [dbo].[Colour]
ADD CONSTRAINT [UQ_Colour_Name]
UNIQUE ([AccountId], [CompanyCode], [Name]);
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[Colour]
WITH CHECK
ADD CONSTRAINT [FK_Colour_Company]
FOREIGN KEY ([AccountId], [CompanyCode])
REFERENCES [dbo].[Company]([AccountId], [Code]);
GO

ALTER TABLE [dbo].[Colour]
CHECK CONSTRAINT [FK_Colour_Company];
GO
