-- DB Patch v3: Adding missing fields for Contacts and Deals
-- Ensures full synchronization with Frontend UI

ALTER TABLE `contacts` 
  ADD COLUMN IF NOT EXISTS `birthday` DATE NULL AFTER `mobile`,
  ADD COLUMN IF NOT EXISTS `address` TEXT NULL AFTER `notes`,
  ADD COLUMN IF NOT EXISTS `city` VARCHAR(100) NULL AFTER `address`,
  ADD COLUMN IF NOT EXISTS `ward` VARCHAR(100) NULL AFTER `city`,
  ADD COLUMN IF NOT EXISTS `expected_revenue` DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER `ward`,
  ADD COLUMN IF NOT EXISTS `win_probability` INT NOT NULL DEFAULT 50 AFTER `expected_revenue`,
  ADD COLUMN IF NOT EXISTS `last_contact` DATETIME NULL AFTER `win_probability`,
  ADD COLUMN IF NOT EXISTS `lead_score` INT NOT NULL DEFAULT 0 AFTER `last_contact`,
  ADD COLUMN IF NOT EXISTS `stage_id` INT(11) NULL AFTER `status`,
  ADD COLUMN IF NOT EXISTS `avatar_url` TEXT NULL AFTER `stage_id`;

ALTER TABLE `deals`
  ADD COLUMN IF NOT EXISTS `description` TEXT NULL AFTER `title`,
  ADD COLUMN IF NOT EXISTS `priority` ENUM('low','medium','high') NOT NULL DEFAULT 'medium' AFTER `description`;

ALTER TABLE `contacts` ADD INDEX IF NOT EXISTS `idx_contact_stage` (`stage_id`);
ALTER TABLE `contacts` ADD INDEX IF NOT EXISTS `idx_contact_owner` (`owner_id`);

ALTER TABLE `companies`
  ADD COLUMN IF NOT EXISTS `tax_id` VARCHAR(50) NULL AFTER `name`,
  ADD COLUMN IF NOT EXISTS `social_link` VARCHAR(255) NULL AFTER `website`,
  ADD COLUMN IF NOT EXISTS `ward` VARCHAR(100) NULL AFTER `address`,
  ADD COLUMN IF NOT EXISTS `stage_id` INT(11) NULL AFTER `status`;

ALTER TABLE `companies` ADD INDEX IF NOT EXISTS `idx_company_stage` (`stage_id`);

