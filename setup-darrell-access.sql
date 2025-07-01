-- Setup Tournament Director Access for Darrell Johnson
-- Event ID: 1825427780
-- Email: darrell.johnson@rebelssoccerclub.com

-- 1. Create tournament director role if it doesn't exist
INSERT INTO roles (name, description, created_at) 
VALUES ('tournament_director', 'Can manage assigned tournaments and events only. Has restricted access to specific events.', NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Create user account if it doesn't exist
INSERT INTO users (email, password, first_name, last_name, username, is_admin, is_parent, household_id, created_at)
VALUES (
  'darrell.johnson@rebelssoccerclub.com',
  '$2b$10$8Vz0ZkxXp1QL3b8DqV5OieH7PcJ5rUJKWFRwOsN4Y8n.7yQ1xG.vW', -- TempPassword123!
  'Darrell',
  'Johnson', 
  'darrell.johnson@rebelssoccerclub.com',
  true,
  false,
  1,
  NOW()
)
ON CONFLICT (email) DO UPDATE SET 
  is_admin = true,
  first_name = 'Darrell',
  last_name = 'Johnson';

-- 3. Get the user ID and role ID
WITH user_info AS (
  SELECT id as user_id FROM users WHERE email = 'darrell.johnson@rebelssoccerclub.com'
),
role_info AS (
  SELECT id as role_id FROM roles WHERE name = 'tournament_director'
)
-- 4. Assign tournament director role to user
INSERT INTO admin_roles (user_id, role_id, assigned_at, assigned_by)
SELECT ui.user_id, ri.role_id, NOW(), 24
FROM user_info ui, role_info ri
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 5. Assign access to specific event (1825427780)
WITH user_info AS (
  SELECT id as user_id FROM users WHERE email = 'darrell.johnson@rebelssoccerclub.com'
)
INSERT INTO event_administrators (user_id, event_id, role, permissions, created_at)
SELECT 
  ui.user_id,
  1825427780,
  'tournament_director',
  '{"can_view_teams": true, "can_edit_teams": true, "can_view_schedule": true, "can_edit_schedule": true, "can_view_payments": true, "can_edit_payments": false, "can_view_reports": true, "can_manage_admins": false}',
  NOW()
FROM user_info ui
ON CONFLICT (user_id, event_id) DO UPDATE SET
  role = 'tournament_director',
  permissions = '{"can_view_teams": true, "can_edit_teams": true, "can_view_schedule": true, "can_edit_schedule": true, "can_view_payments": true, "can_edit_payments": false, "can_view_reports": true, "can_manage_admins": false}';

-- 6. Verify the setup
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  u.is_admin,
  r.name as role_name,
  ea.event_id,
  ea.role as event_role,
  ea.permissions
FROM users u
JOIN admin_roles ar ON u.id = ar.user_id
JOIN roles r ON ar.role_id = r.id
LEFT JOIN event_administrators ea ON u.id = ea.user_id
WHERE u.email = 'darrell.johnson@rebelssoccerclub.com';