ALTER TABLE `dse_market_tickers` DROP INDEX `dse_market_tickers_symbol_unique`;--> statement-breakpoint
ALTER TABLE `bank_market_rates` ADD `companyId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `dse_market_tickers` ADD `companyId` varchar(64) NOT NULL;--> statement-breakpoint
CREATE INDEX `bank_market_rates_company_bank_idx` ON `bank_market_rates` (`companyId`,`bankName`);--> statement-breakpoint
CREATE INDEX `dse_market_tickers_company_symbol_idx` ON `dse_market_tickers` (`companyId`,`symbol`);