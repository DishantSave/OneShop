USE [ONESHOP];
GO

CREATE TABLE [dbo].[Size]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[Code] [VARCHAR](10) NOT NULL,
	[Name] [VARCHAR](100) NOT NULL,
	[SortOrder] [INT] NOT NULL,
	[IsActive] [BIT] NOT NULL,
	[DateCreated] [DATETIME] NOT NULL,

CONSTRAINT [PK_Size] PRIMARY KEY CLUSTERED
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

ALTER TABLE [dbo].[Size]
ADD CONSTRAINT [DF_Size_SortOrder]
DEFAULT ((0)) FOR [SortOrder];
GO

ALTER TABLE [dbo].[Size]
ADD CONSTRAINT [DF_Size_IsActive]
DEFAULT ((1)) FOR [IsActive];
GO

ALTER TABLE [dbo].[Size]
ADD CONSTRAINT [DF_Size_DateCreated]
DEFAULT (SYSDATETIME()) FOR [DateCreated];
GO

/*************************************************************************************************
	Unique Constraints
*************************************************************************************************/

ALTER TABLE [dbo].[Size]
ADD CONSTRAINT [UQ_Size_Name]
UNIQUE ([AccountId], [CompanyCode], [Name]);
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[Size]
WITH CHECK
ADD CONSTRAINT [FK_Size_Company]
FOREIGN KEY ([AccountId], [CompanyCode])
REFERENCES [dbo].[Company]([AccountId], [Code]);
GO

ALTER TABLE [dbo].[Size]
CHECK CONSTRAINT [FK_Size_Company];
GO
