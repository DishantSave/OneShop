USE [ONESHOP];
GO

CREATE TABLE [dbo].[ItemVariant]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[ItemNumber] [VARCHAR](50) NOT NULL,
	[ColourCode] [VARCHAR](10) NOT NULL,
	[SizeCode] [VARCHAR](10) NOT NULL,
	[Sku] [VARCHAR](100) NULL,
	[Barcode] [VARCHAR](100) NULL,
	[AdditionalPrice] [DECIMAL](18,2) NOT NULL,
	[IsActive] [BIT] NOT NULL,
	[DateCreated] [DATETIME] NOT NULL,

CONSTRAINT [PK_ItemVariant] PRIMARY KEY CLUSTERED
(
	[AccountId] ASC,
	[CompanyCode] ASC,
	[ItemNumber] ASC,
	[ColourCode] ASC,
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

ALTER TABLE [dbo].[ItemVariant]
ADD CONSTRAINT [DF_ItemVariant_AdditionalPrice]
DEFAULT ((0.00)) FOR [AdditionalPrice];
GO

ALTER TABLE [dbo].[ItemVariant]
ADD CONSTRAINT [DF_ItemVariant_IsActive]
DEFAULT ((1)) FOR [IsActive];
GO

ALTER TABLE [dbo].[ItemVariant]
ADD CONSTRAINT [DF_ItemVariant_DateCreated]
DEFAULT (SYSDATETIME()) FOR [DateCreated];
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[ItemVariant]
WITH CHECK
ADD CONSTRAINT [FK_ItemVariant_Item]
FOREIGN KEY ([AccountId], [CompanyCode], [ItemNumber])
REFERENCES [dbo].[Item]([AccountId], [CompanyCode], [ItemNumber])
ON DELETE CASCADE;
GO

ALTER TABLE [dbo].[ItemVariant]
CHECK CONSTRAINT [FK_ItemVariant_Item];
GO

ALTER TABLE [dbo].[ItemVariant]
WITH CHECK
ADD CONSTRAINT [FK_ItemVariant_Colour]
FOREIGN KEY ([AccountId], [CompanyCode], [ColourCode])
REFERENCES [dbo].[Colour]([AccountId], [CompanyCode], [Code]);
GO

ALTER TABLE [dbo].[ItemVariant]
CHECK CONSTRAINT [FK_ItemVariant_Colour];
GO

ALTER TABLE [dbo].[ItemVariant]
WITH CHECK
ADD CONSTRAINT [FK_ItemVariant_Size]
FOREIGN KEY ([AccountId], [CompanyCode], [SizeCode])
REFERENCES [dbo].[Size]([AccountId], [CompanyCode], [Code]);
GO

ALTER TABLE [dbo].[ItemVariant]
CHECK CONSTRAINT [FK_ItemVariant_Size];
GO
