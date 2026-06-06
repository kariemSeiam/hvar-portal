CREATE TABLE `webhook_outbox` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`event_type` enum('order_created','payment_confirmed') NOT NULL,
	`order_id` bigint NOT NULL,
	`payload` json NOT NULL,
	`target_url` varchar(500) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`max_attempts` int NOT NULL DEFAULT 8,
	`next_attempt_at` datetime NOT NULL,
	`last_error` text,
	`delivered_at` datetime,
	`dead_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_outbox_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `outbox_due_idx` ON `webhook_outbox` (`delivered_at`,`dead_at`,`next_attempt_at`);--> statement-breakpoint
CREATE INDEX `outbox_order_idx` ON `webhook_outbox` (`order_id`);