USE [ONESHOP];
GO

IF OBJECT_ID('dbo.SubAccountCredential', 'U') IS NULL
BEGIN
	CREATE TABLE [dbo].[SubAccountCredential](
		[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
		[UserName] [VARCHAR](200) NOT NULL,
		[AccountId] [VARCHAR](16) NOT NULL,
		[SubUserId] [VARCHAR](20) NOT NULL,
 		[Password] [NVARCHAR](100) NOT NULL,
		[Designation] [VARCHAR](100) NULL,
		[Department] [VARCHAR](100) NULL,
		[IsCustomerAccount] [BIT] NOT NULL,
		[IsSellerAccount] [BIT] NOT NULL,
		[Company] [VARCHAR](200) NOT NULL,
		[ProfilePicture] [VARCHAR](MAX) NULL,
		[Email] [VARCHAR](200) NOT NULL,
		[Contact] [VARCHAR](20) NOT NULL,
		[Country] [VARCHAR](50) NOT NULL,
		[IsTestAccount] [BIT] NOT NULL,
		[IsActive] [BIT] NOT NULL,
		[DateCreated] [DATETIME] NOT NULL,
		[DateModified] [DATETIME] NOT NULL,
		[TimestampedAt] [TIMESTAMP] NULL,
	 CONSTRAINT [PK_SubAccountCredential] PRIMARY KEY CLUSTERED 
	(
		[UserName] ASC
	) WITH (
		PAD_INDEX = OFF,
		STATISTICS_NORECOMPUTE = OFF,
		IGNORE_DUP_KEY = OFF,
		ALLOW_ROW_LOCKS = ON,
		ALLOW_PAGE_LOCKS = ON,
		FILLFACTOR = 90
	) ON [PRIMARY]
	) ON [PRIMARY];
END
ELSE
BEGIN
	-- Add columns if table already exists
	IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SubAccountCredential') AND name = 'Designation')
		ALTER TABLE [dbo].[SubAccountCredential] ADD [Designation] [VARCHAR](100) NULL;

	IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SubAccountCredential') AND name = 'Department')
		ALTER TABLE [dbo].[SubAccountCredential] ADD [Department] [VARCHAR](100) NULL;

	IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SubAccountCredential') AND name = 'IsActive')
		ALTER TABLE [dbo].[SubAccountCredential] ADD [IsActive] [BIT] NOT NULL CONSTRAINT [DF_SubAccountCredential_IsActive] DEFAULT ((1));

	-- Allow ProfilePicture to be NULL if previously NOT NULL
	ALTER TABLE [dbo].[SubAccountCredential] ALTER COLUMN [ProfilePicture] [VARCHAR](MAX) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SubAccountCredential_Users')
BEGIN
	ALTER TABLE [dbo].[SubAccountCredential] WITH CHECK ADD CONSTRAINT [FK_SubAccountCredential_Users] FOREIGN KEY([UserName])
		REFERENCES [dbo].[Users] ([UserName]);
	ALTER TABLE [dbo].[SubAccountCredential] CHECK CONSTRAINT [FK_SubAccountCredential_Users];
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SubAccountCredential_AccountCredential')
BEGIN
	ALTER TABLE [dbo].[SubAccountCredential] WITH CHECK ADD CONSTRAINT [FK_SubAccountCredential_AccountCredential] FOREIGN KEY([AccountId])
		REFERENCES [dbo].[AccountCredential] ([AccountId]);
	ALTER TABLE [dbo].[SubAccountCredential] CHECK CONSTRAINT [FK_SubAccountCredential_AccountCredential];
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_SubAccountCredential_Contact')
BEGIN
	ALTER TABLE [dbo].[SubAccountCredential] ADD CONSTRAINT [CK_SubAccountCredential_Contact] CHECK (LEN(Contact) >= 10);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_SubAccountCredential_DateCreated')
BEGIN
	ALTER TABLE [dbo].[SubAccountCredential] ADD CONSTRAINT [DF_SubAccountCredential_DateCreated] DEFAULT (SYSDATETIME()) FOR [DateCreated];
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_SubAccountCredential_DateModified')
BEGIN
	ALTER TABLE [dbo].[SubAccountCredential] ADD CONSTRAINT [DF_SubAccountCredential_DateModified] DEFAULT (SYSDATETIME()) FOR [DateModified];
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_SubAccountCredential_IsActive')
BEGIN
	ALTER TABLE [dbo].[SubAccountCredential] ADD CONSTRAINT [DF_SubAccountCredential_IsActive] DEFAULT ((1)) FOR [IsActive];
END
GO