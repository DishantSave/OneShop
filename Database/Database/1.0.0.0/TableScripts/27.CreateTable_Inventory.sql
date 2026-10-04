USE [ONESHOP];
GO

CREATE TABLE [dbo].[Inventory]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[ItemNumber] [VARCHAR](50) NOT NULL,
	[ColourCode] [VARCHAR](10) NOT NULL,
	[SizeCode] [VARCHAR](10) NOT NULL,
	[LocationType] [VARCHAR](20) NOT NULL,
	[LocationCode] [VARCHAR](10) NOT NULL,
	[QuantityOnHand] [INT] NOT NULL,
	[AllocatedQuantity] [INT] NOT NULL,
	[AvailableQuantity] AS ([QuantityOnHand] - [AllocatedQuantity]),
	[ReorderLevel] [INT] NOT NULL,
	[DateModified] [DATETIME] NOT NULL,

CONSTRAINT [PK_Inventory] PRIMARY KEY CLUSTERED
(
	[AccountId] ASC,
	[CompanyCode] ASC,
	[ItemNumber] ASC,
	[ColourCode] ASC,
	[SizeCode] ASC,
	[LocationType] ASC,
	[LocationCode] ASC
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

ALTER TABLE [dbo].[Inventory]
ADD CONSTRAINT [DF_Inventory_QuantityOnHand]
DEFAULT ((0)) FOR [QuantityOnHand];
GO

ALTER TABLE [dbo].[Inventory]
ADD CONSTRAINT [DF_Inventory_AllocatedQuantity]
DEFAULT ((0)) FOR [AllocatedQuantity];
GO

ALTER TABLE [dbo].[Inventory]
ADD CONSTRAINT [DF_Inventory_ReorderLevel]
DEFAULT ((0)) FOR [ReorderLevel];
GO

ALTER TABLE [dbo].[Inventory]
ADD CONSTRAINT [DF_Inventory_DateModified]
DEFAULT (SYSDATETIME()) FOR [DateModified];
GO

/*************************************************************************************************
	Check Constraints
*************************************************************************************************/

ALTER TABLE [dbo].[Inventory]
ADD CONSTRAINT [CK_Inventory_LocationType]
CHECK ([LocationType] IN ('Warehouse', 'Store'));
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[Inventory]
WITH CHECK
ADD CONSTRAINT [FK_Inventory_ItemVariant]
FOREIGN KEY ([AccountId], [CompanyCode], [ItemNumber], [ColourCode], [SizeCode])
REFERENCES [dbo].[ItemVariant]([AccountId], [CompanyCode], [ItemNumber], [ColourCode], [SizeCode])
ON DELETE CASCADE;
GO

ALTER TABLE [dbo].[Inventory]
CHECK CONSTRAINT [FK_Inventory_ItemVariant];
GO
