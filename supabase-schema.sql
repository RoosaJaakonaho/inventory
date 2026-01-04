-- ============================================
-- VARASTO - SUPABASE SCHEMA
-- ============================================
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. ITEMS TABLE
-- Stores all inventory items for both Koti and Mökki
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_type TEXT NOT NULL CHECK (location_type IN ('koti', 'mokki')),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  weight TEXT,
  expiry_date DATE,
  frozen_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_items_location_type ON items(location_type);
CREATE INDEX idx_items_expiry ON items(expiry_date);
CREATE INDEX idx_items_category ON items(category);

-- 2. SHOPPING LIST TABLE
-- Stores shopping list items per location (koti/mokki)
CREATE TABLE shopping_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_type TEXT NOT NULL CHECK (location_type IN ('koti', 'mokki')),
  name TEXT NOT NULL,
  category TEXT,
  weight TEXT,
  expiry_date DATE,
  frozen_date DATE,
  checked BOOLEAN DEFAULT false,
  is_non_inventory BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_shopping_list_location ON shopping_list(location_type);

-- 3. RECIPES TABLE
-- Stores recipes with name, category, and instructions
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipes_name ON recipes(name);

-- 4. RECIPE INGREDIENTS TABLE
-- Stores ingredients for each recipe
CREATE TABLE recipe_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount TEXT,
  sub_location TEXT NOT NULL,
  category TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

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

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Items policies
CREATE POLICY "Allow authenticated read items"
  ON items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert items"
  ON items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update items"
  ON items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete items"
  ON items FOR DELETE TO authenticated USING (true);

-- Shopping list policies
CREATE POLICY "Allow authenticated read shopping_list"
  ON shopping_list FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert shopping_list"
  ON shopping_list FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update shopping_list"
  ON shopping_list FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete shopping_list"
  ON shopping_list FOR DELETE TO authenticated USING (true);

-- Recipes policies
CREATE POLICY "Allow authenticated read recipes"
  ON recipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert recipes"
  ON recipes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update recipes"
  ON recipes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete recipes"
  ON recipes FOR DELETE TO authenticated USING (true);

-- Recipe ingredients policies
CREATE POLICY "Allow authenticated read recipe_ingredients"
  ON recipe_ingredients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert recipe_ingredients"
  ON recipe_ingredients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update recipe_ingredients"
  ON recipe_ingredients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete recipe_ingredients"
  ON recipe_ingredients FOR DELETE TO authenticated USING (true);

-- ============================================
-- DONE!
-- ============================================