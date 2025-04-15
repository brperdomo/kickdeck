CREATE TABLE IF NOT EXISTS event_brackets (
  id SERIAL PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  age_group_id INTEGER NOT NULL REFERENCES event_age_groups(id),
  name TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL DEFAULT 'intermediate',
  eligibility TEXT,
  created_at TEXT NOT NULL DEFAULT NOW(),
  updated_at TEXT NOT NULL DEFAULT NOW()
);