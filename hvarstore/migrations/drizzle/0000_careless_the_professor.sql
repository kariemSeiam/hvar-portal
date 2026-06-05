CREATE TABLE `customer_addresses` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`customer_id` bigint unsigned NOT NULL,
	`governorate_id` int NOT NULL,
	`district_id` int NOT NULL,
	`street` varchar(255) NOT NULL,
	`building` varchar(100) NOT NULL,
	`apartment` varchar(50),
	`phone` varchar(15) NOT NULL,
	`notes` text,
	`is_default` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`contact_id` int NOT NULL,
	`phone` varchar(15) NOT NULL,
	`name` varchar(100) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_contact_id_unique` UNIQUE(`contact_id`),
	CONSTRAINT `customers_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`order_id` bigint unsigned NOT NULL,
	`product_id` int NOT NULL,
	`variation_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`sku` varchar(100),
	`quantity` int NOT NULL,
	`unit_price` decimal(10,2) NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`customer_id` bigint unsigned NOT NULL,
	`contact_id` int NOT NULL,
	`payment_method` varchar(30) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`subtotal` decimal(10,2) NOT NULL,
	`shipping_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL,
	`governorate_id` int NOT NULL,
	`district_id` int NOT NULL,
	`street` varchar(255) NOT NULL,
	`building` varchar(100) NOT NULL,
	`apartment` varchar(50),
	`shipping_phone` varchar(15) NOT NULL,
	`notes` text,
	`erp_transaction_id` int,
	`bill_code` varchar(100),
	`erp_webhook_sent` boolean NOT NULL DEFAULT false,
	`cancelled_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pending_payments` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`order_id` bigint unsigned NOT NULL,
	`kashier_order_id` varchar(50) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'EGP',
	`payment_method` varchar(30) NOT NULL,
	`redirect_url` text,
	`processed_at` timestamp,
	`expires_at` timestamp NOT NULL,
	`kashier_reference` varchar(128),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pending_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `pending_payments_kashier_order_id_unique` UNIQUE(`kashier_order_id`)
);
--> statement-breakpoint
ALTER TABLE `customer_addresses` ADD CONSTRAINT `customer_addresses_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pending_payments` ADD CONSTRAINT `pending_payments_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_phone` ON `customers` (`phone`);--> statement-breakpoint
CREATE INDEX `idx_order` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_customer` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_contact` ON `orders` (`contact_id`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_order` ON `pending_payments` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_kashier_order` ON `pending_payments` (`kashier_order_id`);--> statement-breakpoint
CREATE INDEX `idx_expires` ON `pending_payments` (`expires_at`);