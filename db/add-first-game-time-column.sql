-- Add firstGameTime column to event_field_configurations table
ALTER TABLE event_field_configurations 
ADD COLUMN IF NOT EXISTS first_game_time TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN event_field_configurations.first_game_time IS 'When first games should start on this field (e.g., "08:00")';