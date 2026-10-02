USE [ONESHOP];
GO

IF OBJECT_ID('dbo.SubAccountCredentialAuditTrail', 'U') IS NULL
BEGIN
	CREATE TABLE [dbo].[SubAccountCredentialAuditTrail](
		[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
		[UserName] [VARCHAR](200) NOT NULL,
		[Field] [VARCHAR](200) NOT NULL,
		[Description] [VARCHAR](1000) NOT NULL,
		[DateModified] [DATETIME] NOT NULL,
		[ModifiedBy] [VARCHAR](200) NOT NULL,
		[TimestampedAt] [TIMESTAMP] NULL,
	 CONSTRAINT [PK_SubAccountCredentialAuditTrail] PRIMARY KEY CLUSTERED 
	(
		[Sequence] ASC
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
	IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SubAccountCredentialAuditTrail') AND name = 'ModifiedBy')
		ALTER TABLE [dbo].[SubAccountCredentialAuditTrail] ADD [ModifiedBy] [VARCHAR](200) NOT NULL CONSTRAINT [DF_SubAccountCredentialAuditTrail_ModifiedBy] DEFAULT ('System');
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SubAccountCredentialAuditTrail_SubAccountCredential')
BEGIN
	ALTER TABLE [dbo].[SubAccountCredentialAuditTrail] WITH CHECK ADD CONSTRAINT [FK_SubAccountCredentialAuditTrail_SubAccountCredential] FOREIGN KEY([UserName])
		REFERENCES [dbo].[SubAccountCredential] ([UserName]);
	ALTER TABLE [dbo].[SubAccountCredentialAuditTrail] CHECK CONSTRAINT [FK_SubAccountCredentialAuditTrail_SubAccountCredential];
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_SubAccountCredentialAuditTrail_DateModified')
BEGIN
	ALTER TABLE [dbo].[SubAccountCredentialAuditTrail] ADD CONSTRAINT [DF_SubAccountCredentialAuditTrail_DateModified] DEFAULT (SYSDATETIME()) FOR [DateModified];
END
GO