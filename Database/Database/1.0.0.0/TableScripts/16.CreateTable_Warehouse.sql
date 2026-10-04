USE [ONESHOP];
GO

CREATE TABLE [dbo].[Warehouse]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[Code] [VARCHAR](4) NOT NULL,
	[Name] [VARCHAR](200) NOT NULL,
	[DisplayName] [VARCHAR](200) NOT NULL,
	[AddressLine1] [VARCHAR](250) NOT NULL,
	[AddressLine2] [VARCHAR](250) NULL,
	[City] [VARCHAR](100) NOT NULL,
	[StateCode] [VARCHAR](20) NOT NULL,
	[CountryCode] [VARCHAR](3) NOT NULL,
	[PostalCode] [VARCHAR](20) NOT NULL,
	[Contact] [VARCHAR](20) NOT NULL,
	[Email] [VARCHAR](200) NOT NULL,
	[IsTestWarehouse] [BIT] NOT NULL,
	[IsActive] [BIT] NOT NULL,
	[DateCreated] [DATETIME] NOT NULL,

CONSTRAINT [PK_Warehouse] PRIMARY KEY CLUSTERED
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

ALTER TABLE [dbo].[Warehouse]
ADD CONSTRAINT [DF_Warehouse_IsTestWarehouse]
DEFAULT ((0)) FOR [IsTestWarehouse];
GO

ALTER TABLE [dbo].[Warehouse]
ADD CONSTRAINT [DF_Warehouse_IsActive]
DEFAULT ((1)) FOR [IsActive];
GO

ALTER TABLE [dbo].[Warehouse]
ADD CONSTRAINT [DF_Warehouse_DateCreated]
DEFAULT (SYSDATETIME()) FOR [DateCreated];
GO

/*************************************************************************************************
	Unique Constraints
*************************************************************************************************/

ALTER TABLE [dbo].[Warehouse]
ADD CONSTRAINT [UQ_Warehouse_Name]
UNIQUE ([AccountId], [CompanyCode], [Name]);
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[Warehouse]
WITH CHECK
ADD CONSTRAINT [FK_Warehouse_Company]
FOREIGN KEY ([AccountId], [CompanyCode])
REFERENCES [dbo].[Company]([AccountId], [Code]);
GO

ALTER TABLE [dbo].[Warehouse]
CHECK CONSTRAINT [FK_Warehouse_Company];
GO
