-- Migration: Add System User support fields to whatsapp_accounts table
-- Date: 2026-05-12
-- Description: Adds facebook_user_id and token_type fields to support System User tokens

-- Add facebook_user_id column
ALTER TABLE whatsapp_accounts 
ADD COLUMN IF NOT EXISTS facebook_user_id VARCHAR(255);

-- Add token_type column with default value
ALTER TABLE whatsapp_accounts 
ADD COLUMN IF NOT EXISTS token_type VARCHAR(50) DEFAULT 'system_user' NOT NULL;

-- Create index on facebook_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_facebook_user_id 
ON whatsapp_accounts(facebook_user_id);

-- Update existing records to have token_type = 'system_user'
UPDATE whatsapp_accounts 
SET token_type = 'system_user' 
WHERE token_type IS NULL;

-- Add comment to table
COMMENT ON COLUMN whatsapp_accounts.facebook_user_id IS 'Facebook User ID from OAuth (for System Users)';
COMMENT ON COLUMN whatsapp_accounts.token_type IS 'Type of access token: system_user or user';
