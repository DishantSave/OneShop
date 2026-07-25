USE [ONESHOP];
GO

CREATE TABLE [dbo].[AccountSubscription](
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	--[SubscriptionId] [VARCHAR](12) NOT NULL,
	[SubscriptionId] AS (UPPER(LEFT([SubscriptionType], 3)) + RIGHT(REPLICATE('0', 9) + CAST([Sequence] AS VARCHAR(9)), 9)) PERSISTED NOT NULL UNIQUE,
 	[SubscriptionType] [VARCHAR](50) NOT NULL,
	[StartDate] [DATETIME] NOT NULL,
	[EndDate] [DATETIME] NULL, --Should be nullable to provide a lifetime access.
	[TimestampedAt] [TIMESTAMP] NULL,
 CONSTRAINT [PK_AccountSubscription] PRIMARY KEY CLUSTERED 
(
	[AccountId] ASC
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

ALTER TABLE [dbo].[AccountSubscription] WITH CHECK ADD CONSTRAINT [FK_AccountSubscription_AccountCredential] FOREIGN KEY([AccountId])
	REFERENCES [dbo].[AccountCredential] ([AccountId]);

ALTER TABLE [dbo].[AccountSubscription] CHECK CONSTRAINT [FK_AccountSubscription_AccountCredential];

--ALTER TABLE [dbo].[AccountSubscription] WITH CHECK ADD CONSTRAINT [FK_AccountSubscription_SubscriptionTypeScreenAccess] FOREIGN KEY([SubscriptionId])
--	REFERENCES [dbo].[SubscriptionTypeScreenAccess] ([SubscriptionId]);

--ALTER TABLE [dbo].[AccountSubscription] CHECK CONSTRAINT [FK_AccountSubscription_SubscriptionTypeScreenAccess];

ALTER TABLE [dbo].[AccountSubscription] ADD  CONSTRAINT [DF_AccountSubscription_StartDate] DEFAULT (SYSDATETIME()) FOR [StartDate];
GO