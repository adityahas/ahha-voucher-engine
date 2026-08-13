ALTER TABLE client_settings
  ADD COLUMN IF NOT EXISTS point_base_rate decimal(12,2) NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS max_combined_discount_percent decimal(12,2) NOT NULL DEFAULT 50;

CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  level int NOT NULL,
  min_points decimal(12,2) NOT NULL DEFAULT 0,
  point_multiplier decimal(12,2) NOT NULL DEFAULT 1,
  extra_discount_percent decimal(12,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  exclusive_window_hours int NOT NULL DEFAULT 0,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamptz(3) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS loyalty_tier_category_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id uuid NOT NULL REFERENCES loyalty_tiers(id) ON DELETE CASCADE,
  category_slug varchar NOT NULL REFERENCES voucher_categories(slug),
  point_multiplier decimal(12,2) NOT NULL DEFAULT 1,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamptz(3) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS point_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES loyalty_users(id) ON DELETE CASCADE,
  event_type varchar NOT NULL,
  amount decimal(12,2) NOT NULL,
  balance_after decimal(12,2) NOT NULL,
  reference_type varchar DEFAULT NULL,
  reference_id varchar DEFAULT NULL,
  occurred_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamptz(3) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS tier_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES loyalty_users(id) ON DELETE CASCADE,
  from_tier_id uuid DEFAULT NULL REFERENCES loyalty_tiers(id),
  to_tier_id uuid NOT NULL REFERENCES loyalty_tiers(id),
  reason varchar NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamptz(3) DEFAULT NULL
);

ALTER TABLE loyalty_users
  ADD COLUMN IF NOT EXISTS tier_id uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lifetime_points decimal(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_points decimal(12,2) NOT NULL DEFAULT 0;

ALTER TABLE loyalty_users
  ADD CONSTRAINT fk_loyalty_users_tier_id FOREIGN KEY (tier_id) REFERENCES loyalty_tiers(id);

ALTER TABLE reward_items
  ADD COLUMN IF NOT EXISTS point_price decimal(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_tier_id uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS exclusive_days int NOT NULL DEFAULT 0;

ALTER TABLE reward_items
  ADD CONSTRAINT fk_reward_items_min_tier_id FOREIGN KEY (min_tier_id) REFERENCES loyalty_tiers(id);
