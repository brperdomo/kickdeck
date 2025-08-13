-- Fix for Event 2146728663: Add seasonal scope and age groups
-- Step 1: Add seasonal scope setting
INSERT INTO event_settings (event_id, setting_key, setting_value)
VALUES ('2146728663', 'seasonalScopeId', '23')
ON CONFLICT (event_id, setting_key) DO UPDATE SET setting_value = '23';

-- Step 2: Add age groups from seasonal scope 23 (2025-26)
INSERT INTO event_age_groups (
  event_id, 
  age_group, 
  birth_year, 
  gender, 
  division_code, 
  seasonal_scope_id,
  field_size, 
  projected_teams, 
  created_at, 
  birth_date_start, 
  is_eligible
)
SELECT 
  '2146728663' as event_id,
  ags.age_group,
  ags.birth_year,
  ags.gender,
  ags.division_code,
  23 as seasonal_scope_id,
  CASE 
    WHEN ags.age_group LIKE 'U7' OR ags.age_group LIKE 'U6' THEN '4v4'
    WHEN ags.age_group LIKE 'U8' OR ags.age_group LIKE 'U9' OR ags.age_group LIKE 'U10' THEN '7v7'
    WHEN ags.age_group LIKE 'U11' OR ags.age_group LIKE 'U12' THEN '9v9'
    ELSE '11v11'
  END as field_size,
  8 as projected_teams,
  NOW() as created_at,
  (ags.birth_year || '-01-01')::date as birth_date_start,
  true as is_eligible
FROM age_group_settings ags
WHERE ags.seasonal_scope_id = 23
ON CONFLICT (event_id, age_group, gender) DO NOTHING;