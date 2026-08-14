ALTER TABLE client_settings
  ADD COLUMN IF NOT EXISTS point_to_currency_rate decimal (12,4) NOT NULL DEFAULT 1;
