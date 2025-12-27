-- Add assigned_school_id column to users table in auth service
-- Run this in the auth service database

ALTER TABLE users ADD COLUMN assigned_school_id INTEGER NULL;

-- Verify the column was added
PRAGMA table_info(users);
