USE [ONESHOP];
GO

CREATE TABLE [dbo].[SchemaVersion](
	[Sequence] [BIGINT] IDENTITY(1,1) NOT NULL,
	[Company] [VARCHAR](200) NOT NULL,
	[Product] [VARCHAR](200) NOT NULL,
	[Version] [VARCHAR](12) NOT NULL,
 	[IsTestMode] [BIT] NOT NULL,
	[Description] [VARCHAR](MAX) NULL,
	[Author] [VARCHAR](100) NOT NULL,
	[ProductLogo] [VARCHAR](MAX) NOT NULL,
	[Copyright] [VARCHAR](MAX) NOT NULL,
	[DateCreated] [DATETIME] NOT NULL,
	[TimestampedAt] [TIMESTAMP] NULL,
 CONSTRAINT [PK_SchemaVersion] PRIMARY KEY CLUSTERED 
(
	[Version] ASC
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

ALTER TABLE [dbo].[SchemaVersion] ADD  CONSTRAINT [DF_SchemaVersion_DateCreated] DEFAULT (SYSDATETIME()) FOR [DateCreated];
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[SchemaVersion] WHERE [Version] = '1.0.0.0')
BEGIN
    INSERT INTO [dbo].[SchemaVersion]
               ([Company]
               ,[Product]
               ,[Version]
               ,[IsTestMode]
               ,[Description]
               ,[Author]
               ,[ProductLogo]
               ,[Copyright]
               ,[DateCreated])
         VALUES
               ('OneShop',
                'OneShop Application',
                '1.0.0.0',
                1,
                'Initial version of OneShop Application.',
                'Dishant Prashant Save',
                'https://play-lh.googleusercontent.com/9ZMCKKvxSarWWi2HwSAhUuDx8S-7UBigBKB13SMxPjChz_PQDHA-5s1a8Tax1Yzu63Cbtz5FlK5RSYiZaxtJTQ',
                'Copyright © 2026 Oneshop Business Solutions, LLP.',
                SYSDATETIME());
END
GO