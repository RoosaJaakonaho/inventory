# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Varasto (Pantry) is a Finnish-language home inventory management app for tracking food supplies across multiple household locations. Built with React + Vite, deployed to GitHub Pages, with Supabase for auth and database.

## Commands

```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

No test runner or linter is configured.

## Architecture

### Tech Stack
- React 18 with Vite (ES modules)
- React Router DOM with HashRouter (for GitHub Pages compatibility)
- Supabase for PostgreSQL database and authentication
- @dnd-kit for drag-and-drop sorting
- CSS Modules for component styling

### Key Files

- `src/lib/supabase.js` - Supabase client + all constants (categories, units, locations, expiry calculations)
- `src/lib/auth.jsx` - AuthProvider context for session management
- `src/App.jsx` - Root component with routing (PrivateRoute/PublicRoute wrappers)

### Data Model

All configuration is centralized in `supabase.js`:
- `LOCATION_TYPES` - "koti" (home), "mokki" (cabin)
- `SUB_LOCATIONS` - Per location type: pakastin (freezer), jaakaappi (fridge), kuiva (dry storage), muu (other)
- `CATEGORIES` - Per sub-location with emoji icons
- `RECIPE_CATEGORIES` - 12 recipe types
- `UNITS` - Measurement units (kpl, g, kg, ml, dl, l, tl, rkl, ripaus)
- `FREEZER_EXPIRY_DAYS` - Category-specific freezer expiry rules

### Database Tables (Supabase)
- `items` - Inventory items with name, category, expiry_date, frozen_date, location_type
- `recipes` - Recipes with name, category, description
- `recipe_ingredients` - Ingredients linked to recipes with quantity/unit

### Patterns

**State Management**: Local useState + useMemo for filtering. Direct Supabase queries, no Redux.

**Modal Pattern**: Parent components control modal visibility via state. AddItemModal/RecipeModal detect `editingItem` prop to switch between add/edit modes.

**Category ID Convention**: Category IDs are prefixed with sub-location (e.g., `pakastin_kana`, `kuiva_vilja`). Helper functions like `getSubLocationFromCategory()` parse these.

**Expiry Logic**: `getExpiryStatus()` returns 'expired', 'critical' (≤7 days), 'warning' (≤21 days), or 'ok'. Freezer items auto-calculate expiry from `frozen_date` based on category-specific rules.

## Language

All UI text is in Finnish. Variable names and code comments are in English.

## Code Style Rules

**CSS - No hardcoded values:**
- No hardcoded pixel values for layout (use `%`, `rem`, `em`, `vh`, `vw`, flexbox, grid)
- No magic numbers - use CSS variables if a value needs to be reused
- No `position: absolute` hacks for layout - use proper flexbox/grid
- No `!important` unless absolutely necessary
- No inline styles in JSX

**General - No hacks:**
- No setTimeout/setInterval hacks to "fix" rendering issues
- No z-index wars (keep z-index values minimal and documented)
- If something needs a hack to work, the underlying problem should be fixed instead
