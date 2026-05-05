-- ==============================================================================
-- MINTH CRM - MIGRATION SCRIPT
-- Bổ sung các bảng còn thiếu cho các Module: Sản phẩm, Kế toán, Helpdesk
-- ==============================================================================

-- 1. PRODUCT CATEGORIES (Danh mục sản phẩm)
CREATE TABLE IF NOT EXISTS `product_categories` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`  INT(11) NOT NULL,
  `name`       VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_category` (`tenant_id`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cập nhật bảng products để hỗ trợ category_id
ALTER TABLE `products` ADD COLUMN `category_id` INT(11) NULL AFTER `tenant_id`;
ALTER TABLE `products` ADD CONSTRAINT `fk_prod_cat` FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`) ON DELETE SET NULL;


-- 2. INVOICES & INVOICE ITEMS (Hóa đơn và chi tiết hóa đơn)
CREATE TABLE IF NOT EXISTS `invoices` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`      INT(11) NOT NULL,
  `deal_id`        INT(11) NULL,
  `company_id`     INT(11) NULL,
  `contact_id`     INT(11) NULL,
  `created_by`     INT(11) NOT NULL,
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
  `invoice_id`  INT(11) NOT NULL,
  `product_id`  INT(11) NULL,
  `name`        VARCHAR(255) NOT NULL,
  `quantity`    DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `unit_price`  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `subtotal`    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 3. EXPENSES (Chi phí/Sổ quỹ)
CREATE TABLE IF NOT EXISTS `expenses` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`   INT(11) NOT NULL,
  `created_by`  INT(11) NOT NULL,
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


-- 4. TICKETS & TICKET COMMENTS (Phân hệ Hỗ trợ/Helpdesk)
CREATE TABLE IF NOT EXISTS `tickets` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `tenant_id`      INT(11) NOT NULL,
  `contact_id`     INT(11) NULL,
  `created_by`     INT(11) NOT NULL,
  `assignee_id`    INT(11) NULL,
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
  `ticket_id`   INT(11) NOT NULL,
  `user_id`     INT(11) NOT NULL,
  `body`        TEXT NOT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_tc_ticket` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
