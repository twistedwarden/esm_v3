-- Fix for User Creation Error with SSC Roles
-- This script updates the users table role enum to include all SSC roles
-- 
-- Run this on your Railway auth service database if you prefer direct SQL execution
-- over running Laravel migrations

-- Update the role enum to include all SSC roles
ALTER TABLE users MODIFY COLUMN role ENUM(
  'admin',
  'citizen',
  'staff',
  'ps_rep',
  'ssc',
  'ssc_city_council',
  'ssc_budget_dept',
  'ssc_education_affairs'
) DEFAULT 'citizen';

-- Verify the change
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_DEFAULT
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'role';

-- Show current users and their roles
SELECT 
    id,
    citizen_id,
    email,
    CONCAT(first_name, ' ', last_name) as name,
    role,
    is_active,
    created_at
FROM 
    users
ORDER BY 
    created_at DESC
LIMIT 10;

