-- Migration for Product Inventory Tracking, Ticket Tagging, and User Bio
-- Created: 2026-05-06

-- 1. Add track_inventory to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT TRUE;

-- 2. Add related entities tagging to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS related_contacts JSON DEFAULT NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS related_users JSON DEFAULT NULL;

-- 3. Add bio to users table for profile settings
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL;

-- 4. Ensure cost column exists in products (used for COGS)
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost DECIMAL(15, 2) DEFAULT 0;
