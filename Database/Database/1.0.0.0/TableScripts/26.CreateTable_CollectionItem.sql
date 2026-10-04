USE [ONESHOP];
GO

CREATE TABLE [dbo].[CollectionItem]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[CollectionCode] [VARCHAR](30) NOT NULL,
	[ItemNumber] [VARCHAR](50) NOT NULL,
	[SizeCode] [VARCHAR](10) NOT NULL,
	[SortOrder] [INT] NOT NULL,
	[DateAdded] [DATETIME] NOT NULL,

CONSTRAINT [PK_CollectionItem] PRIMARY KEY CLUSTERED
(
	[AccountId] ASC,
	[CompanyCode] ASC,
	[CollectionCode] ASC,
	[ItemNumber] ASC,
	[SizeCode] ASC
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

ALTER TABLE [dbo].[CollectionItem]
ADD CONSTRAINT [DF_CollectionItem_SizeCode]
DEFAULT ('ALL') FOR [SizeCode];
GO

ALTER TABLE [dbo].[CollectionItem]
ADD CONSTRAINT [DF_CollectionItem_SortOrder]
DEFAULT ((0)) FOR [SortOrder];
GO

ALTER TABLE [dbo].[CollectionItem]
ADD CONSTRAINT [DF_CollectionItem_DateAdded]
DEFAULT (SYSDATETIME()) FOR [DateAdded];
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[CollectionItem]
WITH CHECK
ADD CONSTRAINT [FK_CollectionItem_Collection]
FOREIGN KEY ([AccountId], [CompanyCode], [CollectionCode])
REFERENCES [dbo].[Collection]([AccountId], [CompanyCode], [Code])
ON DELETE CASCADE;
GO

ALTER TABLE [dbo].[CollectionItem]
CHECK CONSTRAINT [FK_CollectionItem_Collection];
GO

ALTER TABLE [dbo].[CollectionItem]
WITH CHECK
ADD CONSTRAINT [FK_CollectionItem_Item]
FOREIGN KEY ([AccountId], [CompanyCode], [ItemNumber])
REFERENCES [dbo].[Item]([AccountId], [CompanyCode], [ItemNumber])
ON DELETE CASCADE;
GO

ALTER TABLE [dbo].[CollectionItem]
CHECK CONSTRAINT [FK_CollectionItem_Item];
GO
