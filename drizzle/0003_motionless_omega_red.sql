ALTER TABLE `leads` MODIFY COLUMN `hasVendorPortal` int;--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `hasRfqSystem` int;--> statement-breakpoint
ALTER TABLE `leads` ADD `procurementPortalUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `leads` ADD `portalType` varchar(64);--> statement-breakpoint
ALTER TABLE `leads` ADD `portalName` varchar(255);--> statement-breakpoint
ALTER TABLE `leads` ADD `registrationUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `leads` ADD `portalNotes` text;