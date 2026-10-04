USE [ONESHOP];
GO

CREATE TABLE [dbo].[Item]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[ItemNumber] [VARCHAR](50) NOT NULL,
	[Name] [VARCHAR](200) NOT NULL,
	[DisplayName] [VARCHAR](200) NOT NULL,
	[Description] [VARCHAR](1000) NULL,
	[Category] [VARCHAR](100) NOT NULL,
	[SalesChannel] [VARCHAR](20) NOT NULL,
	[B2CPrice] [DECIMAL](18,2) NOT NULL,
	[B2CCompareAtPrice] [DECIMAL](18,2) NULL,
	[B2BPrice] [DECIMAL](18,2) NOT NULL,
	[B2BMinQuantity] [INT] NOT NULL,
	[UnitOfMeasure] [VARCHAR](20) NOT NULL,
	[Season] [VARCHAR](50) NULL,
	[Brand] [VARCHAR](100) NULL,
	[Tags] [VARCHAR](500) NULL,
	[Images] [VARCHAR](MAX) NULL,
	[IsActive] [BIT] NOT NULL,
	[DateCreated] [DATETIME] NOT NULL,

CONSTRAINT [PK_Item] PRIMARY KEY CLUSTERED
(
	[AccountId] ASC,
	[CompanyCode] ASC,
	[ItemNumber] ASC
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

ALTER TABLE [dbo].[Item]
ADD CONSTRAINT [DF_Item_SalesChannel]
DEFAULT ('Both') FOR [SalesChannel];
GO

ALTER TABLE [dbo].[Item]
ADD CONSTRAINT [DF_Item_B2CPrice]
DEFAULT ((0.00)) FOR [B2CPrice];
GO

ALTER TABLE [dbo].[Item]
ADD CONSTRAINT [DF_Item_B2BPrice]
DEFAULT ((0.00)) FOR [B2BPrice];
GO

ALTER TABLE [dbo].[Item]
ADD CONSTRAINT [DF_Item_B2BMinQuantity]
DEFAULT ((1)) FOR [B2BMinQuantity];
GO

ALTER TABLE [dbo].[Item]
ADD CONSTRAINT [DF_Item_UnitOfMeasure]
DEFAULT ('PCS') FOR [UnitOfMeasure];
GO

ALTER TABLE [dbo].[Item]
ADD CONSTRAINT [DF_Item_IsActive]
DEFAULT ((1)) FOR [IsActive];
GO

ALTER TABLE [dbo].[Item]
ADD CONSTRAINT [DF_Item_DateCreated]
DEFAULT (SYSDATETIME()) FOR [DateCreated];
GO

/*************************************************************************************************
	Check Constraints
*************************************************************************************************/

ALTER TABLE [dbo].[Item]
ADD CONSTRAINT [CK_Item_SalesChannel]
CHECK ([SalesChannel] IN ('B2C', 'B2B', 'Both'));
GO

ALTER TABLE [dbo].[Item]
ADD CONSTRAINT [CK_Item_B2BMinQuantity]
CHECK ([B2BMinQuantity] >= 1);
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[Item]
WITH CHECK
ADD CONSTRAINT [FK_Item_Company]
FOREIGN KEY ([AccountId], [CompanyCode])
REFERENCES [dbo].[Company]([AccountId], [Code]);
GO

ALTER TABLE [dbo].[Item]
CHECK CONSTRAINT [FK_Item_Company];
GO
