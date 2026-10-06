USE [ONESHOP];
GO

CREATE TABLE [dbo].[UserAddress]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[UserName] [VARCHAR](100) NOT NULL,
	[AddressId] [VARCHAR](50) NOT NULL,
	[AddressType] [VARCHAR](50) NOT NULL CONSTRAINT [DF_UserAddress_AddressType] DEFAULT ('Office'),
	[ContactName] [VARCHAR](100) NOT NULL,
	[Phone] [VARCHAR](50) NULL,
	[AddressLine1] [VARCHAR](250) NOT NULL,
	[AddressLine2] [VARCHAR](250) NULL,
	[City] [VARCHAR](100) NOT NULL,
	[State] [VARCHAR](100) NOT NULL,
	[PostalCode] [VARCHAR](20) NOT NULL,
	[Country] [VARCHAR](50) NOT NULL CONSTRAINT [DF_UserAddress_Country] DEFAULT ('India'),
	[IsDefault] [BIT] NOT NULL CONSTRAINT [DF_UserAddress_IsDefault] DEFAULT (0),
	[DateCreated] [DATETIME] NOT NULL CONSTRAINT [DF_UserAddress_DateCreated] DEFAULT (SYSDATETIME()),

	CONSTRAINT [PK_UserAddress] PRIMARY KEY CLUSTERED
	(
		[AccountId] ASC,
		[UserName] ASC,
		[AddressId] ASC
	)
) ON [PRIMARY];
GO
