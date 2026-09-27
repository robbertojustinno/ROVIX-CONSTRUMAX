INSERT INTO app_settings(key,value) VALUES
  ('mobile_enabled','true')
ON CONFLICT(key) DO NOTHING;
