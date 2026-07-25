USE [ONESHOP];
GO

CREATE TABLE [dbo].[Settings](
	[AccountId] [VARCHAR](16) NOT NULL,
	[UserId] [VARCHAR](20) NOT NULL,
	[SettingName] [VARCHAR](100) NOT NULL,
	[SettingValue] [VARCHAR](500) NOT NULL,
	[SettingType] [VARCHAR](50) NOT NULL,
	[Description] [VARCHAR](MAX) NULL,
	[SettingDefault] [VARCHAR](500) NOT NULL,
	[LastUpdatedDate] [DATETIME] NOT NULL,
 CONSTRAINT [PK_Settings] PRIMARY KEY CLUSTERED 
(
	[AccountId] ASC,
	[UserId] ASC,
	[SettingName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 90) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[Settings] WITH CHECK ADD CONSTRAINT [FK_Settings_AccountCredential] FOREIGN KEY([AccountId])
	REFERENCES [dbo].[AccountCredential] ([AccountId]);

ALTER TABLE [dbo].[Settings] CHECK CONSTRAINT [FK_Settings_AccountCredential];

ALTER TABLE [dbo].[Settings] WITH CHECK ADD CONSTRAINT [FK_Settings_Users] FOREIGN KEY([UserId])
	REFERENCES [dbo].[Users] ([UserId]);

ALTER TABLE [dbo].[Settings] CHECK CONSTRAINT [FK_Settings_Users];

ALTER TABLE [dbo].[Settings] ADD  CONSTRAINT [DF_Settings_LastUpdatedDate] DEFAULT (SYSDATETIME()) FOR [LastUpdatedDate];
GO