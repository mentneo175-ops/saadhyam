-- Add latitude and longitude columns to users table
-- Run this with: psql -U your_username -d your_database -f add_location_coords_simple.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude VARCHAR(50);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('latitude', 'longitude');
