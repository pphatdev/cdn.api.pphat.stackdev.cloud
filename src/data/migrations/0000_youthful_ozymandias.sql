CREATE TABLE `auth_audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`details` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`original_filename` text NOT NULL,
	`path` text NOT NULL,
	`relative_path` text NOT NULL,
	`folder_path` text NOT NULL,
	`size` integer NOT NULL,
	`extension` text NOT NULL,
	`mime_type` text NOT NULL,
	`created_at` text NOT NULL,
	`modified_at` text NOT NULL,
	`uploaded_at` text DEFAULT (datetime('now')) NOT NULL,
	`user_id` text,
	`tags` text,
	`metadata` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `migrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`executed_at` text DEFAULT (datetime('now')) NOT NULL,
	`checksum` text,
	`execution_time_ms` integer,
	`status` text DEFAULT 'success' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `migrations_name_unique` ON `migrations` (`name`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`refresh_token_hash` text,
	`ip_address` text,
	`user_agent` text,
	`is_valid` integer DEFAULT true NOT NULL,
	`expires_at` text NOT NULL,
	`refresh_expires_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`last_used_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`file_id` text,
	`user_id` text,
	`upload_type` text NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`uploaded_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`avatar` text,
	`role` text DEFAULT 'user' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`failed_login_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` text,
	`last_login_at` text,
	`password_changed_at` text DEFAULT (datetime('now')) NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);