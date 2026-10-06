USE [ONESHOP];
GO

CREATE TABLE [dbo].[StateTax]
(
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[AccountId] [VARCHAR](16) NOT NULL,
	[CountryCode] [VARCHAR](3) NOT NULL CONSTRAINT [DF_StateTax_CountryCode] DEFAULT ('IN'),
	[StateCode] [VARCHAR](10) NOT NULL,
	[StateName] [VARCHAR](100) NOT NULL,
	[TaxRate] [DECIMAL](5, 2) NOT NULL,
	[TaxType] [VARCHAR](50) NOT NULL CONSTRAINT [DF_StateTax_TaxType] DEFAULT ('GST'),
	[IsActive] [BIT] NOT NULL CONSTRAINT [DF_StateTax_IsActive] DEFAULT (1),
	[DateCreated] [DATETIME] NOT NULL CONSTRAINT [DF_StateTax_DateCreated] DEFAULT (SYSDATETIME()),
	[DateModified] [DATETIME] NOT NULL CONSTRAINT [DF_StateTax_DateModified] DEFAULT (SYSDATETIME()),
	[CreatedBy] [VARCHAR](100) NOT NULL,

	CONSTRAINT [PK_StateTax] PRIMARY KEY CLUSTERED
	(
		[AccountId] ASC,
		[CountryCode] ASC,
		[StateCode] ASC
	)
) ON [PRIMARY];
GO
