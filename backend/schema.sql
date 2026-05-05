-- ============================================================
-- MINTH CRM SaaS — Full Database Schema
-- Engine: MySQL 8.0+  |  Charset: utf8mb4_unicode_ci
-- ============================================================

CREATE DATABASE IF NOT EXISTS vhvxoigh_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vhvxoigh_crm;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. TENANTS (Multi-tenant SaaS organizations)
-- ============================================================
CREATE TABLE IF NOT EXISTS `tenants` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `name`       VARCHAR(255) NOT NULL,
  `slug`       VARCHAR(100) NOT NULL UNIQUE,
  `plan`       ENUM('free','pro','enterprise') NOT NULL DEFAULT 'free',
  `logo_url`   TEXT NULL,
  `primary_color` VARCHAR(20) DEFAULT '#5b21b6',
  `currency`   CHAR(3) DEFAULT 'VND',
  `timezone`   VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
  `is_active`  TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_slug` (`slug`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. USERS (Employees / Admins per tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`      INT NOT NULL,
  `email`          VARCHAR(255) NOT NULL,
  `password_hash`  VARCHAR(255) NOT NULL,
  `full_name`      VARCHAR(200) NOT NULL,
  `avatar_url`     TEXT NULL,
  `role`           ENUM('super_admin','admin','manager','sales','viewer') NOT NULL DEFAULT 'sales',
  `phone`          VARCHAR(50) NULL,
  `is_active`      TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at`  TIMESTAMP NULL DEFAULT NULL,
  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_email_per_tenant` (`email`, `tenant_id`),
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  INDEX `idx_users_tenant` (`tenant_id`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. REFRESH TOKENS (JWT auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`     INT NOT NULL,
  `token_hash`  VARCHAR(255) NOT NULL UNIQUE,
  `expires_at`  TIMESTAMP NOT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_rt_user` (`user_id`),
  INDEX `idx_rt_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. COMPANIES (Client organizations)
-- ============================================================
CREATE TABLE IF NOT EXISTS `companies` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`   INT NOT NULL,
  `owner_id`    INT NULL,
  `created_by`  INT NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `industry`    VARCHAR(150) NULL,
  `website`     VARCHAR(255) NULL,
  `phone`       VARCHAR(50) NULL,
  `email`       VARCHAR(255) NULL,
  `address`     TEXT NULL,
  `city`        VARCHAR(100) NULL,
  `country`     VARCHAR(100) DEFAULT 'Việt Nam',
  `size`        ENUM('1-10','11-50','51-200','201-500','500+') NULL,
  `status`      ENUM('active','inactive','prospect') NOT NULL DEFAULT 'prospect',
  `tags`        JSON NULL,
  `notes`       TEXT NULL,
  `total_spent` DECIMAL(15,2) DEFAULT 0.00,
  `order_count` INT DEFAULT 0,
  `last_order_at` DATETIME NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  TIMESTAMP NULL,
  FOREIGN KEY (`tenant_id`)  REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`owner_id`)   REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_company_tenant`  (`tenant_id`, `deleted_at`),
  INDEX `idx_company_owner`   (`owner_id`),
  INDEX `idx_company_status`  (`status`),
  FULLTEXT INDEX `idx_company_search` (`name`, `email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. CONTACTS (Individual people)
-- ============================================================
CREATE TABLE IF NOT EXISTS `contacts` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`   INT NOT NULL,
  `company_id`  INT NULL,
  `owner_id`    INT NULL,
  `created_by`  INT NOT NULL,
  `first_name`  VARCHAR(100) NOT NULL,
  `last_name`   VARCHAR(100) NOT NULL DEFAULT '',
  `email`       VARCHAR(255) NULL,
  `phone`       VARCHAR(50) NULL,
  `mobile`      VARCHAR(50) NULL,
  `job_title`   VARCHAR(150) NULL,
  `department`  VARCHAR(150) NULL,
  `source`      ENUM('website','referral','social','cold_call','event','other') DEFAULT 'other',
  `status`      ENUM('lead','qualified','customer','churned') NOT NULL DEFAULT 'lead',
  `tags`        JSON NULL,
  `notes`       TEXT NULL,
  `total_spent` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `order_count` INT NOT NULL DEFAULT 0,
  `last_order_at` TIMESTAMP NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  TIMESTAMP NULL,
  FOREIGN KEY (`tenant_id`)  REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`owner_id`)   REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_contact_tenant`  (`tenant_id`, `deleted_at`),
  INDEX `idx_contact_company` (`company_id`),
  INDEX `idx_contact_owner`   (`owner_id`),
  INDEX `idx_contact_status`  (`status`),
  FULLTEXT INDEX `idx_contact_search` (`first_name`, `last_name`, `email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. PIPELINE STAGES (Kanban columns)
-- ============================================================
CREATE TABLE IF NOT EXISTS `pipeline_stages` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`   INT NOT NULL,
  `name`        VARCHAR(100) NOT NULL,
  `color`       VARCHAR(20) DEFAULT '#6366f1',
  `order_index` SMALLINT NOT NULL DEFAULT 0,
  `is_won`      TINYINT(1) NOT NULL DEFAULT 0,
  `is_lost`     TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  INDEX `idx_stage_tenant` (`tenant_id`),
  INDEX `idx_stage_order`  (`tenant_id`, `order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. DEALS (Sales opportunities)
-- ============================================================
CREATE TABLE IF NOT EXISTS `deals` (
  `id`                  INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`           INT NOT NULL,
  `stage_id`            INT NULL,
  `contact_id`          INT NULL,
  `company_id`          INT NULL,
  `owner_id`            INT NULL,
  `created_by`          INT NOT NULL,
  `title`               VARCHAR(255) NOT NULL,
  `value`               DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `currency`            CHAR(3) NOT NULL DEFAULT 'VND',
  `probability`         TINYINT UNSIGNED NOT NULL DEFAULT 50,
  `expected_close_date` DATE NULL,
  `actual_close_date`   DATE NULL,
  `source`              VARCHAR(100) NULL,
  `lost_reason`         TEXT NULL,
  `tags`                JSON NULL,
  `created_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`          TIMESTAMP NULL,
  FOREIGN KEY (`tenant_id`)  REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`stage_id`)   REFERENCES `pipeline_stages`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`owner_id`)   REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_deal_tenant`  (`tenant_id`, `deleted_at`),
  INDEX `idx_deal_stage`   (`stage_id`),
  INDEX `idx_deal_owner`   (`owner_id`),
  INDEX `idx_deal_close`   (`expected_close_date`),
  INDEX `idx_deal_value`   (`tenant_id`, `value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. DEAL STAGE HISTORY (Audit trail for Kanban moves)
-- ============================================================
CREATE TABLE IF NOT EXISTS `deal_stage_history` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `deal_id`    INT NOT NULL,
  `from_stage` INT NULL,
  `to_stage`   INT NOT NULL,
  `moved_by`   INT NOT NULL,
  `moved_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`deal_id`)  REFERENCES `deals`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`moved_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_dsh_deal` (`deal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. ACTIVITIES (Calls, Emails, Meetings, Tasks, Notes)
-- ============================================================
CREATE TABLE IF NOT EXISTS `activities` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`    INT NOT NULL,
  `user_id`      INT NULL,
  `type`         ENUM('call','email','meeting','task','note') NOT NULL,
  `subject`      VARCHAR(255) NOT NULL,
  `body`         TEXT NULL,
  `status`       ENUM('planned','done','cancelled') NOT NULL DEFAULT 'planned',
  `priority`     ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  `due_date`     DATETIME NULL,
  `done_at`      DATETIME NULL,
  `related_type` ENUM('contact','company','deal') NULL,
  `related_id`   INT NULL,
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_activity_tenant`  (`tenant_id`),
  INDEX `idx_activity_user`    (`user_id`),
  INDEX `idx_activity_related` (`related_type`, `related_id`),
  INDEX `idx_activity_due`     (`due_date`),
  INDEX `idx_activity_status`  (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `products` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`   INT NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `sku`         VARCHAR(100) NULL,
  `description` TEXT NULL,
  `price`       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `currency`    CHAR(3) NOT NULL DEFAULT 'VND',
  `unit`        VARCHAR(50) NULL DEFAULT 'cái',
  `stock`       INT DEFAULT 0,
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`  TIMESTAMP NULL,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  INDEX `idx_product_tenant` (`tenant_id`, `deleted_at`),
  INDEX `idx_product_sku`    (`tenant_id`, `sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. QUOTES & QUOTE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS `quotes` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`   INT NOT NULL,
  `deal_id`     INT NULL,
  `contact_id`  INT NULL,
  `created_by`  INT NOT NULL,
  `quote_number` VARCHAR(50) NOT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `status`      ENUM('draft','sent','accepted','rejected','expired') NOT NULL DEFAULT 'draft',
  `subtotal`    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `discount`    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `tax`         DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total`       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `valid_until` DATE NULL,
  `notes`       TEXT NULL,
  `terms`       TEXT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`)  REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`deal_id`)    REFERENCES `deals`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_quote_tenant`  (`tenant_id`),
  INDEX `idx_quote_deal`    (`deal_id`),
  INDEX `idx_quote_status`  (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quote_items` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `quote_id`    INT NOT NULL,
  `product_id`  INT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `quantity`    DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `unit_price`  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `discount`    DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `subtotal`    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `sort_order`  SMALLINT NOT NULL DEFAULT 0,
  FOREIGN KEY (`quote_id`)   REFERENCES `quotes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL,
  INDEX `idx_qi_quote` (`quote_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`     INT NOT NULL,
  `tenant_id`   INT NOT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `body`        TEXT NULL,
  `type`        VARCHAR(50) DEFAULT 'info',
  `is_read`     TINYINT(1) NOT NULL DEFAULT 0,
  `link`        VARCHAR(255) NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  INDEX `idx_notif_user`    (`user_id`, `is_read`),
  INDEX `idx_notif_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`          BIGINT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`   INT NULL,
  `user_id`     INT NULL,
  `action`      VARCHAR(100) NOT NULL,
  `resource`    VARCHAR(100) NOT NULL,
  `resource_id` INT NULL,
  `old_data`    JSON NULL,
  `new_data`    JSON NULL,
  `ip_address`  VARCHAR(45) NULL,
  `user_agent`  VARCHAR(500) NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_tenant`   (`tenant_id`),
  INDEX `idx_audit_resource` (`resource`, `resource_id`),
  INDEX `idx_audit_created`  (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. CONTACT PHONES (multi-phone per contact)
-- ============================================================
CREATE TABLE IF NOT EXISTS `contact_phones` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `contact_id` INT NOT NULL,
  `phone`      VARCHAR(50) NOT NULL,
  `type`       ENUM('mobile','work','home','fax','other') DEFAULT 'mobile',
  `is_primary` TINYINT(1) DEFAULT 0,
  FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE CASCADE,
  INDEX `idx_cp_contact` (`contact_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. CONTACT EMAILS (multi-email per contact)
-- ============================================================
CREATE TABLE IF NOT EXISTS `contact_emails` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `contact_id` INT NOT NULL,
  `email`      VARCHAR(255) NOT NULL,
  `type`       ENUM('work','personal','other') DEFAULT 'work',
  `is_primary` TINYINT(1) DEFAULT 0,
  FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE CASCADE,
  INDEX `idx_ce_contact` (`contact_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. CUSTOM FIELD DEFINITIONS (dynamic fields per tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS `custom_fields` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`    INT NOT NULL,
  `entity_type`  ENUM('contact','company','deal') NOT NULL,
  `field_key`    VARCHAR(100) NOT NULL,
  `label`        VARCHAR(200) NOT NULL,
  `field_type`   ENUM('text','number','date','dropdown','multiselect','checkbox','url','email','phone') NOT NULL DEFAULT 'text',
  `options`      JSON NULL,
  `is_required`  TINYINT(1) DEFAULT 0,
  `is_filterable` TINYINT(1) DEFAULT 1,
  `order_index`  SMALLINT DEFAULT 0,
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_field_key` (`tenant_id`, `entity_type`, `field_key`),
  INDEX `idx_cf_tenant_entity` (`tenant_id`, `entity_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. CUSTOM FIELD VALUES
-- ============================================================
CREATE TABLE IF NOT EXISTS `custom_field_values` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `custom_field_id` INT NOT NULL,
  `entity_id`       INT NOT NULL,
  `value_text`      TEXT NULL,
  `value_number`    DECIMAL(15,4) NULL,
  `value_date`      DATE NULL,
  `value_json`      JSON NULL,
  `updated_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`custom_field_id`) REFERENCES `custom_fields`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_field_value` (`custom_field_id`, `entity_id`),
  INDEX `idx_cfv_entity` (`custom_field_id`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. NOTES (threaded comments on contacts/deals/companies)
-- ============================================================
CREATE TABLE IF NOT EXISTS `notes` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`    INT NOT NULL,
  `user_id`      INT NOT NULL,
  `parent_id`    INT NULL,
  `entity_type`  ENUM('contact','company','deal') NOT NULL,
  `entity_id`    INT NOT NULL,
  `body`         TEXT NOT NULL,
  `type`         ENUM('internal','public') NOT NULL DEFAULT 'internal',
  `is_pinned`    TINYINT(1) DEFAULT 0,
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`parent_id`) REFERENCES `notes`(`id`) ON DELETE CASCADE,
  INDEX `idx_note_entity`  (`entity_type`, `entity_id`),
  INDEX `idx_note_parent`  (`parent_id`),
  INDEX `idx_note_tenant`  (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `note_mentions` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `note_id`     INT NOT NULL,
  `user_id`     INT NOT NULL,
  FOREIGN KEY (`note_id`)  REFERENCES `notes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`)  REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_mention` (`note_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 19. FILES (attachments on contacts / deals / notes)
-- ============================================================
CREATE TABLE IF NOT EXISTS `files` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`    INT NOT NULL,
  `uploaded_by`  INT NOT NULL,
  `entity_type`  ENUM('contact','company','deal','note') NOT NULL,
  `entity_id`    INT NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `file_path`    VARCHAR(500) NOT NULL,
  `mime_type`    VARCHAR(100) NULL,
  `file_size`    BIGINT UNSIGNED DEFAULT 0,
  `tags`         JSON NULL,
  `version`      SMALLINT DEFAULT 1,
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`)   REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_file_entity` (`entity_type`, `entity_id`),
  INDEX `idx_file_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 20. TAGS (reusable labels per tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS `tags` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`   INT NOT NULL,
  `name`        VARCHAR(100) NOT NULL,
  `color`       VARCHAR(20) DEFAULT '#6366f1',
  `entity_type` ENUM('contact','company','deal','all') DEFAULT 'all',
  UNIQUE KEY `unique_tag` (`tenant_id`, `name`, `entity_type`),
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `entity_tags` (
  `tag_id`       INT NOT NULL,
  `entity_type`  ENUM('contact','company','deal') NOT NULL,
  `entity_id`    INT NOT NULL,
  PRIMARY KEY (`tag_id`, `entity_type`, `entity_id`),
  FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE,
  INDEX `idx_et_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 21. SEGMENTS (saved smart filters)
-- ============================================================
CREATE TABLE IF NOT EXISTS `segments` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`    INT NOT NULL,
  `created_by`   INT NOT NULL,
  `name`         VARCHAR(200) NOT NULL,
  `entity_type`  ENUM('contact','company','deal') NOT NULL,
  `filters`      JSON NOT NULL,
  `is_shared`    TINYINT(1) DEFAULT 0,
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`)  REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_seg_tenant` (`tenant_id`, `entity_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 22. WORKFLOWS (automation rules)
-- ============================================================
CREATE TABLE IF NOT EXISTS `workflows` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`    INT NOT NULL,
  `name`         VARCHAR(255) NOT NULL,
  `trigger_type` VARCHAR(100) NOT NULL,
  `trigger_data` JSON NULL,
  `conditions`   JSON NULL,
  `actions`      JSON NOT NULL,
  `is_active`    TINYINT(1) DEFAULT 1,
  `run_count`    INT DEFAULT 0,
  `created_by`   INT NOT NULL,
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`)  REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_wf_tenant_active` (`tenant_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 23. FORM BUILDER
-- ============================================================
CREATE TABLE IF NOT EXISTS `forms` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`   INT NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `schema`      JSON NOT NULL,
  `mapping`     JSON NULL,
  `embed_token` VARCHAR(64) NOT NULL UNIQUE,
  `is_active`   TINYINT(1) DEFAULT 1,
  `submit_count` INT DEFAULT 0,
  `created_by`  INT NOT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `form_submissions` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `form_id`     INT NOT NULL,
  `tenant_id`   INT NOT NULL,
  `data`        JSON NOT NULL,
  `source_url`  TEXT NULL,
  `ip_address`  VARCHAR(45) NULL,
  `created_contact_id` INT NULL,
  `status`      ENUM('new','processed','spam') DEFAULT 'new',
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`form_id`)   REFERENCES `forms`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  INDEX `idx_fs_form`   (`form_id`),
  INDEX `idx_fs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 24. IMPORT JOBS (CSV/Excel imports)
-- ============================================================
CREATE TABLE IF NOT EXISTS `import_jobs` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`    INT NOT NULL,
  `user_id`      INT NOT NULL,
  `entity_type`  ENUM('contact','company','deal') NOT NULL,
  `file_name`    VARCHAR(255) NOT NULL,
  `mapping`      JSON NULL,
  `status`       ENUM('pending','processing','done','failed') DEFAULT 'pending',
  `total_rows`   INT DEFAULT 0,
  `imported`     INT DEFAULT 0,
  `duplicates`   INT DEFAULT 0,
  `errors`       INT DEFAULT 0,
  `error_log`    JSON NULL,
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 25. DUPLICATE LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS `duplicate_log` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`    INT NOT NULL,
  `entity_type`  ENUM('contact','company') NOT NULL,
  `original_id`  INT NOT NULL,
  `duplicate_id` INT NOT NULL,
  `match_field`  VARCHAR(50) NOT NULL,
  `resolved`     TINYINT(1) DEFAULT 0,
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  INDEX `idx_dup_tenant` (`tenant_id`, `resolved`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default tenant
INSERT INTO `tenants` (`name`, `slug`, `plan`) VALUES ('Minth Demo', 'minth-demo', 'pro');

-- Default admin user (password: Admin@123)
INSERT INTO `users` (`tenant_id`, `email`, `password_hash`, `full_name`, `role`) VALUES
(1, 'admin@minth.crm', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Quản trị viên', 'admin'),
(1, 'sales@minth.crm', '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Nhân viên Kinh doanh', 'sales');

-- Pipeline stages for tenant 1
INSERT INTO `pipeline_stages` (`tenant_id`, `name`, `color`, `order_index`, `is_won`, `is_lost`) VALUES
(1, 'Khách hàng tiềm năng', '#6366f1', 1, 0, 0),
(1, 'Đã liên hệ',          '#f59e0b', 2, 0, 0),
(1, 'Đang thương lượng',   '#8b5cf6', 3, 0, 0),
(1, 'Gửi báo giá',         '#3b82f6', 4, 0, 0),
(1, 'Đã chốt — Thành công','#10b981', 5, 1, 0),
(1, 'Đã chốt — Thất bại',  '#ef4444', 6, 0, 1);

-- Sample companies
INSERT INTO `companies` (`tenant_id`, `owner_id`, `created_by`, `name`, `industry`, `city`, `status`) VALUES
(1, 1, 1, 'Công ty TNHH ABC Tech',      'Công nghệ',       'TP.HCM',  'active'),
(1, 1, 1, 'Tập đoàn XYZ Holdings',      'Tài chính',       'Hà Nội',  'active'),
(1, 2, 1, 'Startup Green Solutions',    'Năng lượng',      'Đà Nẵng', 'prospect'),
(1, 2, 1, 'Chuỗi nhà hàng Phở 24',     'F&B',             'TP.HCM',  'active');

-- Sample contacts
INSERT INTO `contacts` (`tenant_id`, `company_id`, `owner_id`, `created_by`, `first_name`, `last_name`, `email`, `phone`, `job_title`, `status`, `source`) VALUES
(1, 1, 1, 1, 'Nguyễn',  'Văn An',     'an.nguyen@abctech.vn',    '0901234567', 'Giám đốc',         'customer', 'referral'),
(1, 1, 1, 1, 'Trần',    'Thị Bình',   'binh.tran@abctech.vn',    '0912345678', 'Trưởng phòng IT',  'customer', 'website'),
(1, 2, 1, 1, 'Lê',      'Minh Cường', 'cuong.le@xyz.vn',         '0923456789', 'CFO',              'qualified','cold_call'),
(1, 3, 2, 1, 'Phạm',    'Thị Dung',   'dung.pham@green.vn',      '0934567890', 'CEO',              'lead',     'event'),
(1, 4, 2, 1, 'Hoàng',   'Văn Em',     'em.hoang@pho24.vn',       '0945678901', 'Quản lý vận hành', 'qualified','social');

-- Sample deals
INSERT INTO `deals` (`tenant_id`, `stage_id`, `contact_id`, `company_id`, `owner_id`, `created_by`, `title`, `value`, `probability`, `expected_close_date`) VALUES
(1, 1, 4, 3, 2, 1, 'Giải pháp năng lượng mặt trời 2025', 250000000, 20, '2025-08-30'),
(1, 2, 1, 1, 1, 1, 'Nâng cấp hệ thống ERP',              450000000, 40, '2025-07-15'),
(1, 3, 3, 2, 1, 1, 'Tư vấn chiến lược tài chính Q3',     120000000, 60, '2025-06-30'),
(1, 4, 5, 4, 2, 1, 'Triển khai POS cho chuỗi nhà hàng',  85000000,  75, '2025-06-15'),
(1, 5, 2, 1, 1, 1, 'Dự án website thương mại điện tử',   180000000, 100,'2025-05-01');

-- Sample activities
INSERT INTO `activities` (`tenant_id`, `user_id`, `type`, `subject`, `status`, `due_date`, `related_type`, `related_id`) VALUES
(1, 1, 'call',    'Gọi điện tư vấn sản phẩm ERP',          'planned',  '2025-06-10 09:00:00', 'deal', 2),
(1, 2, 'meeting', 'Demo giải pháp năng lượng mặt trời',     'planned',  '2025-06-12 14:00:00', 'deal', 1),
(1, 1, 'email',   'Gửi báo giá tư vấn tài chính',           'done',     '2025-06-01 10:00:00', 'deal', 3),
(1, 2, 'task',    'Chuẩn bị tài liệu demo POS',             'planned',  '2025-06-08 17:00:00', 'deal', 4),
(1, 1, 'note',    'Khách hàng yêu cầu báo giá thêm module', 'done',     NULL,                  'contact', 1);

-- Sample products
INSERT INTO `products` (`tenant_id`, `name`, `sku`, `price`, `unit`) VALUES
(1, 'Phần mềm CRM Pro',         'SW-CRM-PRO', 15000000, 'license/năm'),
(1, 'Dịch vụ tư vấn triển khai','SV-CONSULT', 8000000,  'ngày/người'),
(1, 'Module Kho hàng nâng cao', 'SW-WH-ADV',  5000000,  'module/năm'),
(1, 'Bảo trì hệ thống hàng năm','SV-MAINTAIN',3000000,  'năm');

-- ============================================================
-- 26. PRODUCT CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS `product_categories` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`  INT NOT NULL,
  `name`       VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_category` (`tenant_id`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `products` ADD COLUMN `category_id` INT NULL AFTER `tenant_id`;
ALTER TABLE `products` ADD FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`) ON DELETE SET NULL;

-- ============================================================
-- 27. INVOICES & INVOICE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS `invoices` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`      INT NOT NULL,
  `deal_id`        INT NULL,
  `company_id`     INT NULL,
  `contact_id`     INT NULL,
  `created_by`     INT NOT NULL,
  `invoice_number` VARCHAR(50) NOT NULL,
  `title`          VARCHAR(255) NOT NULL,
  `status`         ENUM('draft','pending','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
  `issue_date`     DATE NOT NULL,
  `due_date`       DATE NOT NULL,
  `paid_at`        DATETIME NULL,
  `subtotal`       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `discount`       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `tax`            DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total`          DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `notes`          TEXT NULL,
  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`)  REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`deal_id`)    REFERENCES `deals`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE SET NULL,
  INDEX `idx_inv_tenant` (`tenant_id`),
  INDEX `idx_inv_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id`  INT NOT NULL,
  `product_id`  INT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `quantity`    DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `unit_price`  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `subtotal`    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 28. EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS `expenses` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`   INT NOT NULL,
  `created_by`  INT NOT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `category`    VARCHAR(100) NOT NULL,
  `amount`      DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `date`        DATE NOT NULL,
  `status`      ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `notes`       TEXT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`)  REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_exp_tenant` (`tenant_id`),
  INDEX `idx_exp_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 29. TICKETS (Helpdesk)
-- ============================================================
CREATE TABLE IF NOT EXISTS `tickets` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`      INT NOT NULL,
  `contact_id`     INT NULL,
  `created_by`     INT NOT NULL,
  `assignee_id`    INT NULL,
  `subject`        VARCHAR(255) NOT NULL,
  `customer_name`  VARCHAR(255) NOT NULL,
  `description`    TEXT NULL,
  `status`         ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  `priority`       ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `due_date`       DATETIME NULL,
  `resolved_at`    DATETIME NULL,
  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`)   REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`contact_id`)  REFERENCES `contacts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`)  REFERENCES `users`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_ticket_tenant` (`tenant_id`),
  INDEX `idx_ticket_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ticket_comments` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id`   INT NOT NULL,
  `user_id`     INT NOT NULL,
  `body`        TEXT NOT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_tc_ticket` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
