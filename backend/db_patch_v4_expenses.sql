-- Database Patch: Linking Expenses to Entities (Contacts/Companies/Deals)

CREATE TABLE IF NOT EXISTS `expense_entities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `expense_id` int(11) NOT NULL,
  `entity_type` enum('contact','company','deal') NOT NULL,
  `entity_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ee_tenant` (`tenant_id`),
  KEY `idx_ee_expense` (`expense_id`),
  KEY `idx_ee_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key if possible (optional based on your DB setup)
-- ALTER TABLE `expense_entities` ADD CONSTRAINT `fk_ee_expense` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE CASCADE;
