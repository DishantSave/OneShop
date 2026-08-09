USE [ONESHOP];
GO

CREATE TABLE [dbo].[Company]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[Code] [VARCHAR](2) NOT NULL,
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
	[Website] [VARCHAR](250) NULL,
	[Logo] [VARCHAR](MAX) NULL,
	[CurrencyCode] [VARCHAR](10) NOT NULL,
	[TimeZone] [VARCHAR](100) NOT NULL,
	[IsTestCompany] [BIT] NOT NULL,
	[IsActive] [BIT] NOT NULL,
	[DateCreated] [DATETIME] NOT NULL,

CONSTRAINT [PK_Company] PRIMARY KEY CLUSTERED
(
	[AccountId] ASC,
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

ALTER TABLE [dbo].[Company]
ADD CONSTRAINT [DF_Company_IsTestCompany]
DEFAULT ((0)) FOR [IsTestCompany];
GO

ALTER TABLE [dbo].[Company]
ADD CONSTRAINT [DF_Company_IsActive]
DEFAULT ((1)) FOR [IsActive];
GO

ALTER TABLE [dbo].[Company]
ADD CONSTRAINT [DF_Company_DateCreated]
DEFAULT (SYSDATETIME()) FOR [DateCreated];
GO

/*************************************************************************************************
	Unique Constraints
*************************************************************************************************/

ALTER TABLE [dbo].[Company]
ADD CONSTRAINT [UQ_Company_Name]
UNIQUE ([AccountId], [Name]);
GO

/*************************************************************************************************
	Check Constraints
*************************************************************************************************/

ALTER TABLE [dbo].[Company]
ADD CONSTRAINT [CK_Company_Code]
CHECK (LEN([Code]) = 2);
GO

ALTER TABLE [dbo].[Company]
ADD CONSTRAINT [CK_Company_Contact]
CHECK (LEN([Contact]) >= 10);
GO

/*************************************************************************************************
	Foreign Keys
*************************************************************************************************/

ALTER TABLE [dbo].[Company]
WITH CHECK
ADD CONSTRAINT [FK_Company_AccountCredential]
FOREIGN KEY ([AccountId])
REFERENCES [dbo].[AccountCredential]([AccountId]);
GO

ALTER TABLE [dbo].[Company]
CHECK CONSTRAINT [FK_Company_AccountCredential];
GO

ALTER TABLE [dbo].[Company]
WITH CHECK
ADD CONSTRAINT [FK_Company_CountryMaster]
FOREIGN KEY ([CountryCode])
REFERENCES [dbo].[CountryMaster]([CountryCode]);
GO

ALTER TABLE [dbo].[Company]
CHECK CONSTRAINT [FK_Company_CountryMaster];
GO