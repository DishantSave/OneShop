USE [ONESHOP];
GO

IF OBJECT_ID('dbo.SubAccountScreenAccess', 'U') IS NOT NULL
BEGIN
	-- If older schema exists without ScreenName, drop and recreate
	IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SubAccountScreenAccess') AND name = 'ScreenName')
	BEGIN
		DROP TABLE [dbo].[SubAccountScreenAccess];
	END
END
GO

IF OBJECT_ID('dbo.SubAccountScreenAccess', 'U') IS NULL
BEGIN
	CREATE TABLE [dbo].[SubAccountScreenAccess](
		[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
		[AccountId] [VARCHAR](16) NOT NULL,
		[SubUserId] [VARCHAR](20) NOT NULL,
		[ScreenName] [VARCHAR](50) NOT NULL,
		[CanView] [BIT] NOT NULL,
		[CanCreate] [BIT] NOT NULL,
		[CanEdit] [BIT] NOT NULL,
		[CanDelete] [BIT] NOT NULL,
	 CONSTRAINT [PK_SubAccountScreenAccess] PRIMARY KEY CLUSTERED 
	(
		[AccountId] ASC,
		[SubUserId] ASC,
		[ScreenName] ASC
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
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_SubAccountScreenAccess_CanView')
BEGIN
	ALTER TABLE [dbo].[SubAccountScreenAccess] ADD CONSTRAINT [DF_SubAccountScreenAccess_CanView] DEFAULT ((1)) FOR [CanView];
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_SubAccountScreenAccess_CanCreate')
BEGIN
	ALTER TABLE [dbo].[SubAccountScreenAccess] ADD CONSTRAINT [DF_SubAccountScreenAccess_CanCreate] DEFAULT ((0)) FOR [CanCreate];
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_SubAccountScreenAccess_CanEdit')
BEGIN
	ALTER TABLE [dbo].[SubAccountScreenAccess] ADD CONSTRAINT [DF_SubAccountScreenAccess_CanEdit] DEFAULT ((0)) FOR [CanEdit];
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_SubAccountScreenAccess_CanDelete')
BEGIN
	ALTER TABLE [dbo].[SubAccountScreenAccess] ADD CONSTRAINT [DF_SubAccountScreenAccess_CanDelete] DEFAULT ((0)) FOR [CanDelete];
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SubAccountScreenAccess_AccountCredential')
BEGIN
	ALTER TABLE [dbo].[SubAccountScreenAccess] WITH CHECK ADD CONSTRAINT [FK_SubAccountScreenAccess_AccountCredential] FOREIGN KEY([AccountId])
		REFERENCES [dbo].[AccountCredential] ([AccountId]);
	ALTER TABLE [dbo].[SubAccountScreenAccess] CHECK CONSTRAINT [FK_SubAccountScreenAccess_AccountCredential];
END
GO