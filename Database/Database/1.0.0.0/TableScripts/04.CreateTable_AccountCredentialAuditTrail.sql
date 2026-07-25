USE [ONESHOP];
GO

CREATE TABLE [dbo].[AccountCredentialAuditTrail](
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,  -- Has to keep this incremental.
	[UserName] [VARCHAR](200) NOT NULL,
	[Field] [VARCHAR](200) NOT NULL,
	[Description] [VARCHAR](1000) NOT NULL,
	[DateModified] [DATETIME] NOT NULL,
	[TimestampedAt] [TIMESTAMP] NULL,
 CONSTRAINT [PK_AccountCredentialAuditTrail] PRIMARY KEY CLUSTERED 
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
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[AccountCredentialAuditTrail] WITH CHECK ADD CONSTRAINT [FK_AccountCredentialAuditTrail_AccountCredential] FOREIGN KEY([UserName])
	REFERENCES [dbo].[AccountCredential] ([UserName]);

ALTER TABLE [dbo].[AccountCredentialAuditTrail] CHECK CONSTRAINT [FK_AccountCredentialAuditTrail_AccountCredential];

ALTER TABLE [dbo].[AccountCredentialAuditTrail] ADD  CONSTRAINT [DF_AccountCredentialAuditTrail_DateModified] DEFAULT (SYSDATETIME()) FOR [DateModified];
GO