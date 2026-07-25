USE [ONESHOP];
GO

CREATE TABLE [dbo].[SubAccountCredential](
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[UserName] [VARCHAR](200) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[SubUserId] [VARCHAR](20) NOT NULL,
 	[Password] [NVARCHAR](100) NOT NULL,
	[IsCustomerAccount] [Bit] NOT NULL,
	[IsSellerAccount] [Bit] NOT NULL,
	[Company] [VARCHAR](200) NOT NULL,
	[ProfilePicture] [VARCHAR](MAX) NOT NULL,
	[Email] [VARCHAR](200) NOT NULL,
	[Contact] [VARCHAR](20) NOT NULL,
	[Country] [VARCHAR](50) NOT NULL,
	[IsTestAccount] [BIT] NOT NULL,
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
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[SubAccountCredential]  WITH CHECK ADD CONSTRAINT [FK_SubAccountCredential_Users] FOREIGN KEY([UserName])
	REFERENCES [dbo].[Users] ([UserName]);

ALTER TABLE [dbo].[SubAccountCredential] CHECK CONSTRAINT [FK_SubAccountCredential_Users];

ALTER TABLE [dbo].[SubAccountCredential]  WITH CHECK ADD CONSTRAINT [FK_SubAccountCredential_AccountCredential] FOREIGN KEY([AccountId])
	REFERENCES [dbo].[AccountCredential] ([AccountId]);

ALTER TABLE [dbo].[SubAccountCredential] CHECK CONSTRAINT [FK_SubAccountCredential_AccountCredential];

ALTER TABLE [dbo].[SubAccountCredential] ADD  CONSTRAINT [CK_SubAccountCredential_Contact] CHECK (LEN(Contact) >= 10);
GO

ALTER TABLE [dbo].[SubAccountCredential] ADD  CONSTRAINT [DF_SubAccountCredential_DateCreated] DEFAULT (SYSDATETIME()) FOR [DateCreated];
GO

ALTER TABLE [dbo].[SubAccountCredential] ADD  CONSTRAINT [DF_SubAccountCredential_DateModified] DEFAULT (SYSDATETIME()) FOR [DateModified];
GO