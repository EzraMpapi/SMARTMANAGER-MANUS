CREATE TABLE `bank_market_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bankName` varchar(160) NOT NULL,
	`currencyPair` varchar(32) NOT NULL DEFAULT 'USD/TZS',
	`buyRate` varchar(32) NOT NULL,
	`sellRate` varchar(32) NOT NULL,
	`lendingRateAnnual` varchar(32) NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'UNAVAILABLE',
	`source` varchar(160) NOT NULL DEFAULT 'Bank of Tanzania (BOT) Feed',
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bank_market_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dse_market_tickers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(32) NOT NULL,
	`companyName` varchar(160) NOT NULL,
	`priceTzs` varchar(32) NOT NULL,
	`changeTzs` varchar(32) NOT NULL,
	`changePercent` varchar(32) NOT NULL,
	`volume` int NOT NULL DEFAULT 0,
	`status` varchar(32) NOT NULL DEFAULT 'UNAVAILABLE',
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dse_market_tickers_id` PRIMARY KEY(`id`),
	CONSTRAINT `dse_market_tickers_symbol_unique` UNIQUE(`symbol`)
);
--> statement-breakpoint
CREATE INDEX `bank_market_rates_bank_name_idx` ON `bank_market_rates` (`bankName`);--> statement-breakpoint
CREATE INDEX `dse_market_tickers_symbol_idx` ON `dse_market_tickers` (`symbol`);