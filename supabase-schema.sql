-- ============================================
-- PANTRY INVENTORY - SUPABASE SCHEMA
-- ============================================
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. LOCATIONS TABLE
-- Stores different inventory locations (Home, Cabin, etc.)
CREATE TABLE locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default location
INSERT INTO locations (name) VALUES ('Home');

-- 2. ITEMS TABLE
-- Stores all inventory items
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'misc',
  weight TEXT,
  expiry_date DATE,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_items_location ON items(location_id);
CREATE INDEX idx_items_in_stock ON items(in_stock);
CREATE INDEX idx_items_expiry ON items(expiry_date);

-- 3. HISTORY TABLE
-- Tracks all changes for audit trail
CREATE TABLE history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL, -- 'added', 'removed', 'updated', 'restored'
  user_email TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_history_location ON history(location_id);
CREATE INDEX idx_history_created ON history(created_at DESC);

-- 4. SHOPPING LIST TABLE
-- Stores shopping list items per location
CREATE TABLE shopping_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  weight TEXT,
  checked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shopping_list_location ON shopping_list(location_id);

-- 5. AUTO-UPDATE TIMESTAMP TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- Policies: Allow authenticated users full access
-- (All users share the same inventory)

CREATE POLICY "Allow authenticated read locations"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert locations"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated read items"
  ON items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update items"
  ON items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete items"
  ON items FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read history"
  ON history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert history"
  ON history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated read shopping_list"
  ON shopping_list FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert shopping_list"
  ON shopping_list FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update shopping_list"
  ON shopping_list FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete shopping_list"
  ON shopping_list FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- DONE!
-- ============================================
-- Next steps:
-- 1. Go to Authentication -> Users and create user accounts
-- 2. Copy your Supabase URL and anon key to your .env file