USE [ONESHOP];
GO

CREATE TABLE [dbo].[SubscriptionTypeScreenAccess](
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[SubscriptionId] AS (UPPER(LEFT([SubscriptionType], 3)) + RIGHT(REPLICATE('0', 9) + CAST([Sequence] AS VARCHAR(9)), 9)) PERSISTED NOT NULL UNIQUE,
	[SubscriptionType] [VARCHAR](50) NOT NULL,
 	[CompanyMaster] [BIT] NOT NULL,
	[CompanyMasterThreshold] [BIGINT] NOT NULL,
	[CustomerMaster] [BIT] NOT NULL,
	[CustomerMasterThreshold] [BIGINT] NOT NULL,
 	[ItemMaster] [BIT] NOT NULL,
	[ItemMasterThreshold] [BIGINT] NOT NULL,
 	[Orders] [BIT] NOT NULL,
	[OrdersThreshold] [BIGINT] NOT NULL,
 CONSTRAINT [PK_SubscriptionTypeScreenAccess] PRIMARY KEY CLUSTERED 
(
	[SubscriptionId] ASC
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