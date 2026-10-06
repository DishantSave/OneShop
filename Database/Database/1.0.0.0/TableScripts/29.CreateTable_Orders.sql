USE [ONESHOP];
GO

CREATE TABLE [dbo].[Orders]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[OrderId] [VARCHAR](50) NOT NULL,
	[ParentOrderId] [VARCHAR](50) NULL,
	[Channel] [VARCHAR](20) NOT NULL,
	[LocationType] [VARCHAR](20) NOT NULL,
	[LocationCode] [VARCHAR](10) NOT NULL,
	[Status] [VARCHAR](30) NOT NULL,
	[PaymentStatus] [VARCHAR](30) NOT NULL,
	[CustomerName] [VARCHAR](200) NULL,
	[CustomerEmail] [VARCHAR](200) NULL,
	[CustomerPhone] [VARCHAR](50) NULL,
	[ShippingAddress] [VARCHAR](500) NULL,
	[TotalItems] [INT] NOT NULL,
	[SubTotal] [DECIMAL](18, 2) NOT NULL,
	[Tax] [DECIMAL](18, 2) NOT NULL,
	[ShippingCost] [DECIMAL](18, 2) NOT NULL,
	[Discount] [DECIMAL](18, 2) NOT NULL,
	[TotalAmount] [DECIMAL](18, 2) NOT NULL,
	[Notes] [VARCHAR](1000) NULL,
	[OrderDate] [DATETIME] NOT NULL,
	[DateCreated] [DATETIME] NOT NULL,
	[CreatedBy] [VARCHAR](100) NOT NULL,

CONSTRAINT [PK_Orders] PRIMARY KEY CLUSTERED
(
	[AccountId] ASC,
	[CompanyCode] ASC,
	[OrderId] ASC
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

ALTER TABLE [dbo].[Orders]
ADD CONSTRAINT [DF_Orders_Channel]
DEFAULT ('Both') FOR [Channel];
GO

ALTER TABLE [dbo].[Orders]
ADD CONSTRAINT [DF_Orders_Status]
DEFAULT ('Pending') FOR [Status];
GO

ALTER TABLE [dbo].[Orders]
ADD CONSTRAINT [DF_Orders_PaymentStatus]
DEFAULT ('Unpaid') FOR [PaymentStatus];
GO

ALTER TABLE [dbo].[Orders]
ADD CONSTRAINT [DF_Orders_TotalItems]
DEFAULT ((0)) FOR [TotalItems];
GO

ALTER TABLE [dbo].[Orders]
ADD CONSTRAINT [DF_Orders_SubTotal]
DEFAULT ((0.00)) FOR [SubTotal];
GO

ALTER TABLE [dbo].[Orders]
ADD CONSTRAINT [DF_Orders_Tax]
DEFAULT ((0.00)) FOR [Tax];
GO

ALTER TABLE [dbo].[Orders]
ADD CONSTRAINT [DF_Orders_ShippingCost]
DEFAULT ((0.00)) FOR [ShippingCost];
GO

ALTER TABLE [dbo].[Orders]
ADD CONSTRAINT [DF_Orders_Discount]
DEFAULT ((0.00)) FOR [Discount];
GO

ALTER TABLE [dbo].[Orders]
ADD CONSTRAINT [DF_Orders_TotalAmount]
DEFAULT ((0.00)) FOR [TotalAmount];
GO

ALTER TABLE [dbo].[Orders]
ADD CONSTRAINT [DF_Orders_OrderDate]
DEFAULT (SYSDATETIME()) FOR [OrderDate];
GO

ALTER TABLE [dbo].[Orders]
ADD CONSTRAINT [DF_Orders_DateCreated]
DEFAULT (SYSDATETIME()) FOR [DateCreated];
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[Orders]
WITH CHECK
ADD CONSTRAINT [FK_Orders_Company]
FOREIGN KEY ([AccountId], [CompanyCode])
REFERENCES [dbo].[Company]([AccountId], [Code]);
GO

ALTER TABLE [dbo].[Orders]
CHECK CONSTRAINT [FK_Orders_Company];
GO
