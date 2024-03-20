CREATE TABLE `payouts` (
	`id` text,
	`place` integer,
	`name` text,
	`country` text,
	`prizeTwd` numeric DEFAULT 0,
	`buyInValue` integer,
	`eventId` text,
	`eventIndex` integer,
	`eventName` text,
	`flight` text
);
