CREATE TABLE IF NOT EXISTS client_settings (
  client_database_name varchar PRIMARY KEY REFERENCES clients(database_name) ON DELETE CASCADE,
  currency_code varchar(3) NOT NULL DEFAULT 'IDR',
  locale varchar(35) NOT NULL DEFAULT 'id-ID',
  number_format_options jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
