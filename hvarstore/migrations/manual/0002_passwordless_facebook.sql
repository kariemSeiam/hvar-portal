-- Passwordless (phone-only) login + optional Facebook login.
-- Apply with:  bun run push   (from hvarstore/migrations, diffs schema/index.ts)
-- Or run this file directly against hvar_site if you want a no-prompt apply:
--   mysql -u <user> -p hvar_site < manual/0002_passwordless_facebook.sql
--
-- password_hash becomes NULL-able: phone-only and Facebook accounts have no password.
-- email / facebook_id / avatar_url capture the profile info Facebook login returns.
-- phone stays NOT NULL + UNIQUE — it remains the identity every order/ticket keys on.

ALTER TABLE `customers`
	MODIFY COLUMN `password_hash` VARCHAR(255) NULL,
	ADD COLUMN `email` VARCHAR(255) NULL AFTER `name`,
	ADD COLUMN `facebook_id` VARCHAR(64) NULL AFTER `email`,
	ADD COLUMN `avatar_url` VARCHAR(512) NULL AFTER `facebook_id`,
	ADD UNIQUE KEY `uq_customers_facebook_id` (`facebook_id`);
