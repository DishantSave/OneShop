USE [ONESHOP];
GO

CREATE TABLE [dbo].[PromoCode]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[Code] [VARCHAR](50) NOT NULL,
	[Description] [VARCHAR](250) NULL,
	[DiscountType] [VARCHAR](20) NOT NULL CONSTRAINT [DF_PromoCode_DiscountType] DEFAULT ('Percentage'),
	[DiscountValue] [DECIMAL](18, 2) NOT NULL,
	[MinOrderAmount] [DECIMAL](18, 2) NOT NULL CONSTRAINT [DF_PromoCode_MinOrderAmount] DEFAULT (0.00),
	[MaxDiscountAmount] [DECIMAL](18, 2) NULL,
	[ValidFrom] [DATETIME] NOT NULL CONSTRAINT [DF_PromoCode_ValidFrom] DEFAULT (SYSDATETIME()),
	[ValidUntil] [DATETIME] NOT NULL CONSTRAINT [DF_PromoCode_ValidUntil] DEFAULT (DATEADD(year, 1, SYSDATETIME())),
	[UsageLimit] [INT] NOT NULL CONSTRAINT [DF_PromoCode_UsageLimit] DEFAULT (0),
	[TimesUsed] [INT] NOT NULL CONSTRAINT [DF_PromoCode_TimesUsed] DEFAULT (0),
	[IsActive] [BIT] NOT NULL CONSTRAINT [DF_PromoCode_IsActive] DEFAULT (1),
	[DateCreated] [DATETIME] NOT NULL CONSTRAINT [DF_PromoCode_DateCreated] DEFAULT (SYSDATETIME()),
	[CreatedBy] [VARCHAR](100) NOT NULL,

	CONSTRAINT [PK_PromoCode] PRIMARY KEY CLUSTERED
	(
		[AccountId] ASC,
		[Code] ASC
	)
) ON [PRIMARY];
GO
