-- Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS `user_notification_preferences` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `email_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `sms_notifications` tinyint(1) NOT NULL DEFAULT '0',
  `push_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `application_updates` tinyint(1) NOT NULL DEFAULT '1',
  `system_alerts` tinyint(1) NOT NULL DEFAULT '1',
  `marketing_emails` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_notification_preferences_user_id_unique` (`user_id`),
  CONSTRAINT `user_notification_preferences_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create system_settings table
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) NOT NULL,
  `value` text,
  `type` varchar(255) NOT NULL DEFAULT 'string',
  `description` text,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_settings_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default system settings
INSERT INTO `system_settings` (`key`, `value`, `type`, `description`, `created_at`, `updated_at`) VALUES
('maintenance_mode', '0', 'boolean', 'Enable or disable maintenance mode', NOW(), NOW()),
('registration_enabled', '1', 'boolean', 'Enable or disable user registration', NOW(), NOW()),
('email_verification_required', '1', 'boolean', 'Require email verification for new users', NOW(), NOW()),
('max_file_upload_size', '10485760', 'integer', 'Maximum file upload size in bytes', NOW(), NOW()),
('session_timeout', '120', 'integer', 'Session timeout in minutes', NOW(), NOW()),
('password_min_length', '8', 'integer', 'Minimum password length', NOW(), NOW()),
('require_strong_password', '1', 'boolean', 'Require strong password with special characters', NOW(), NOW()),
('backup_frequency', 'daily', 'string', 'Backup frequency: daily, weekly, monthly', NOW(), NOW()),
('log_retention_days', '90', 'integer', 'Number of days to retain logs', NOW(), NOW()),
('notification_batch_size', '100', 'integer', 'Number of notifications to process in a batch', NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

