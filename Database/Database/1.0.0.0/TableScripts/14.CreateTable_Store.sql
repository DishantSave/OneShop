USE [ONESHOP];
GO

CREATE TABLE [dbo].[Store]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CompanyCode] [VARCHAR](2) NOT NULL,
	[Code] [VARCHAR](4) NOT NULL,
	[Name] [VARCHAR](200) NOT NULL,
	[DisplayName] [VARCHAR](200) NOT NULL,
	[StoreType] [VARCHAR](50) NOT NULL,
	[AddressLine1] [VARCHAR](250) NOT NULL,
	[AddressLine2] [VARCHAR](250) NULL,
	[City] [VARCHAR](100) NOT NULL,
	[StateCode] [VARCHAR](20) NOT NULL,
	[CountryCode] [VARCHAR](3) NOT NULL,
	[PostalCode] [VARCHAR](20) NOT NULL,
	[Contact] [VARCHAR](20) NOT NULL,
	[Email] [VARCHAR](200) NOT NULL,
	[Website] [VARCHAR](250) NULL,
	[Logo] [VARCHAR](MAX) NULL,
	[CurrencyCode] [VARCHAR](10) NOT NULL,
	[TimeZone] [VARCHAR](100) NOT NULL,
	[IsTestStore] [BIT] NOT NULL,
	[OriginalIsTestStore] [BIT] NOT NULL,
	[IsActive] [BIT] NOT NULL,
	[OriginalIsActive] [BIT] NOT NULL,
	[DateCreated] [DATETIME] NOT NULL,

CONSTRAINT [PK_Store] PRIMARY KEY CLUSTERED
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

ALTER TABLE [dbo].[Store]
ADD CONSTRAINT [DF_Store_StoreType]
DEFAULT ('Physical') FOR [StoreType];
GO

ALTER TABLE [dbo].[Store]
ADD CONSTRAINT [DF_Store_IsTestStore]
DEFAULT ((0)) FOR [IsTestStore];
GO

ALTER TABLE [dbo].[Store]
ADD CONSTRAINT [DF_Store_OriginalIsTestStore]
DEFAULT ((0)) FOR [OriginalIsTestStore];
GO

ALTER TABLE [dbo].[Store]
ADD CONSTRAINT [DF_Store_IsActive]
DEFAULT ((1)) FOR [IsActive];
GO

ALTER TABLE [dbo].[Store]
ADD CONSTRAINT [DF_Store_OriginalIsActive]
DEFAULT ((1)) FOR [OriginalIsActive];
GO

ALTER TABLE [dbo].[Store]
ADD CONSTRAINT [DF_Store_DateCreated]
DEFAULT (SYSDATETIME()) FOR [DateCreated];
GO

/*************************************************************************************************
	Unique Constraints
*************************************************************************************************/

ALTER TABLE [dbo].[Store]
ADD CONSTRAINT [UQ_Store_Name]
UNIQUE ([AccountId], [CompanyCode], [Name]);
GO

/*************************************************************************************************
	Check Constraints
*************************************************************************************************/

ALTER TABLE [dbo].[Store]
ADD CONSTRAINT [CK_Store_Code]
CHECK (LEN([Code]) >= 2 AND LEN([Code]) <= 4);
GO

ALTER TABLE [dbo].[Store]
ADD CONSTRAINT [CK_Store_Contact]
CHECK (LEN([Contact]) >= 10);
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[Store]
WITH CHECK
ADD CONSTRAINT [FK_Store_Company]
FOREIGN KEY ([AccountId], [CompanyCode])
REFERENCES [dbo].[Company]([AccountId], [Code]);
GO

ALTER TABLE [dbo].[Store]
CHECK CONSTRAINT [FK_Store_Company];
GO

ALTER TABLE [dbo].[Store]
WITH CHECK
ADD CONSTRAINT [FK_Store_CountryMaster]
FOREIGN KEY ([CountryCode])
REFERENCES [dbo].[CountryMaster]([CountryCode]);
GO

ALTER TABLE [dbo].[Store]
CHECK CONSTRAINT [FK_Store_CountryMaster];
GO
