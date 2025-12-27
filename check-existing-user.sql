-- Check if a user with citizen_id 'USER-001' exists
SELECT 
    id,
    citizen_id,
    email,
    CONCAT(first_name, ' ', last_name) as name,
    role,
    is_active,
    status,
    created_at
FROM 
    users
WHERE 
    citizen_id = 'USER-001';

-- If you want to delete this user (if it's a test user):
-- DELETE FROM users WHERE citizen_id = 'USER-001';

-- Or if you want to update the existing user's role:
-- UPDATE users SET role = 'ssc_city_council' WHERE citizen_id = 'USER-001';

-- To see all SSC users:
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
WHERE 
    role IN ('ssc', 'ssc_city_council', 'ssc_budget_dept', 'ssc_education_affairs')
ORDER BY 
    created_at DESC;

