USE [ONESHOP];
GO

CREATE TABLE [dbo].[OrderItem]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[OrderId] [VARCHAR](50) NOT NULL,
	[ItemNumber] [VARCHAR](50) NOT NULL,
	[ItemName] [VARCHAR](200) NOT NULL,
	[ColourCode] [VARCHAR](10) NULL,
	[SizeCode] [VARCHAR](10) NOT NULL,
	[Sku] [VARCHAR](50) NULL,
	[Quantity] [INT] NOT NULL,
	[UnitPrice] [DECIMAL](18, 2) NOT NULL,
	[TotalPrice] [DECIMAL](18, 2) NOT NULL,
	[DateAdded] [DATETIME] NOT NULL,

CONSTRAINT [PK_OrderItem] PRIMARY KEY CLUSTERED
(
	[AccountId] ASC,
	[CompanyCode] ASC,
	[OrderId] ASC,
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

) ON [PRIMARY]
GO

/*************************************************************************************************
	Default Constraints
*************************************************************************************************/

ALTER TABLE [dbo].[OrderItem]
ADD CONSTRAINT [DF_OrderItem_SizeCode]
DEFAULT ('ALL') FOR [SizeCode];
GO

ALTER TABLE [dbo].[OrderItem]
ADD CONSTRAINT [DF_OrderItem_Quantity]
DEFAULT ((1)) FOR [Quantity];
GO

ALTER TABLE [dbo].[OrderItem]
ADD CONSTRAINT [DF_OrderItem_UnitPrice]
DEFAULT ((0.00)) FOR [UnitPrice];
GO

ALTER TABLE [dbo].[OrderItem]
ADD CONSTRAINT [DF_OrderItem_TotalPrice]
DEFAULT ((0.00)) FOR [TotalPrice];
GO

ALTER TABLE [dbo].[OrderItem]
ADD CONSTRAINT [DF_OrderItem_DateAdded]
DEFAULT (SYSDATETIME()) FOR [DateAdded];
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[OrderItem]
WITH CHECK
ADD CONSTRAINT [FK_OrderItem_Orders]
FOREIGN KEY ([AccountId], [CompanyCode], [OrderId])
REFERENCES [dbo].[Orders]([AccountId], [CompanyCode], [OrderId])
ON DELETE CASCADE;
GO

ALTER TABLE [dbo].[OrderItem]
CHECK CONSTRAINT [FK_OrderItem_Orders];
GO
