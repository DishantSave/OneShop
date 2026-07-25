USE [ONESHOP];
GO

CREATE TABLE [dbo].[SubAccountScreenAccess](
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[SubUserId] [VARCHAR](20) NOT NULL,
 	[CompanyMaster] [BIT] NOT NULL,
	[CustomerMaster] [BIT] NOT NULL,
	[ItemMaster] [BIT] NOT NULL,
	[Orders] [BIT] NOT NULL,
 CONSTRAINT [PK_SubAccountScreenAccess] PRIMARY KEY CLUSTERED 
(
	[AccountId] ASC,
	[SubUserId] ASC
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

ALTER TABLE [dbo].[SubAccountScreenAccess] WITH CHECK ADD CONSTRAINT [FK_SubAccountScreenAccess_AccountCredential] FOREIGN KEY([AccountId])
	REFERENCES [dbo].[AccountCredential] ([AccountId]);

ALTER TABLE [dbo].[SubAccountScreenAccess] CHECK CONSTRAINT [FK_SubAccountScreenAccess_AccountCredential];