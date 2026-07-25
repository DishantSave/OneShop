USE [ONESHOP];
GO

CREATE TABLE [dbo].[AccountCredential](
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,  -- Has to keep this incremental.
	[UserName] [VARCHAR](200) NOT NULL,
	[AccountId] AS ('ONESHOP' + RIGHT(REPLICATE('0', 9) + CAST([Sequence] AS VARCHAR(9)), 9)) PERSISTED NOT NULL UNIQUE,
	[UserId] [VARCHAR](20) NOT NULL,
 	[Password] [NVARCHAR](100) NOT NULL,
	[ApiTokenKey] [NVARCHAR](1000) NULL,
	[IsCustomerAccount] [Bit] NOT NULL,
	[IsSellerAccount] [Bit] NOT NULL,
	[Company] [VARCHAR](200) NULL,
	[ProfilePicture] [VARCHAR](MAX) NULL,
	[Email] [VARCHAR](200) NOT NULL,
	[Contact] [VARCHAR](20) NOT NULL,
	[Country] [VARCHAR](50) NOT NULL,
	[IsTestAccount] [BIT] NOT NULL,
	[DateCreated] [DATETIME] NOT NULL,
	[DateModified] [DATETIME] NOT NULL,
	[TimestampedAt] [TIMESTAMP] NULL,
 CONSTRAINT [PK_AccountCredential] PRIMARY KEY CLUSTERED 
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

ALTER TABLE [dbo].[AccountCredential]  WITH CHECK ADD CONSTRAINT [FK_AccountCredential_Users] FOREIGN KEY([UserName])
	REFERENCES [dbo].[Users] ([UserName]);

ALTER TABLE [dbo].[AccountCredential] CHECK CONSTRAINT [FK_AccountCredential_Users];

ALTER TABLE [dbo].[AccountCredential] ADD  CONSTRAINT [CK_AccountCredential_Contact] CHECK (LEN(Contact) >= 10);
GO

ALTER TABLE [dbo].[AccountCredential] ADD  CONSTRAINT [DF_AccountCredential_DateCreated] DEFAULT (SYSDATETIME()) FOR [DateCreated];
GO

ALTER TABLE [dbo].[AccountCredential] ADD  CONSTRAINT [DF_AccountCredential_DateModified] DEFAULT (SYSDATETIME()) FOR [DateModified];
GO