# 🍽️ Pantry - Home Inventory

A minimal, mobile-first home inventory management system. Track what ingredients you have at home, monitor expiration dates, and keep a history of changes.

## Features

- **Multi-location support** - Start with "Home", add more locations later
- **Categories** - Meats, Fish, Chicken, Red Meat, Pasta, Vegetarian, Snacks, Dry Food, Canned Goods, Miscellaneous
- **Expiration alerts** - Visual warnings for items expiring soon
- **History tracking** - See who added/removed items and when
- **Restore items** - Accidentally removed something? Restore it from history
- **Search & filter** - Find items quickly
- **Mobile-first design** - Works great on phones

## Tech Stack

- **Frontend**: React + Vite (static site)
- **Hosting**: GitHub Pages
- **Database & Auth**: Supabase (free tier)

---

## Setup Guide

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (you can use GitHub login)
2. Click "New Project"
3. Fill in:
   - **Name**: `pantry-inventory` (or whatever you like)
   - **Database Password**: Generate a strong one and save it
   - **Region**: Choose the closest to you
4. Click "Create new project" and wait ~2 minutes

### 2. Set Up the Database

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql` and paste it
4. Click **Run** (or Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned" - that's correct!

### 3. Create User Accounts

1. Go to **Authentication** → **Users** (left sidebar)
2. Click **Add User** → **Create New User**
3. Enter email and password for your first user
4. Repeat for additional users
5. Users will receive a confirmation email (or you can auto-confirm in settings)

**Note**: Supabase free tier allows unlimited auth users.

### 4. Get Your API Keys

1. Go to **Settings** → **API** (left sidebar)
2. You'll need:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

### 5. Configure the App

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your Supabase values:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 6. Test Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173 and log in with one of your created users.

### 7. Deploy to GitHub Pages

#### Option A: Manual Deploy

1. Build the app:
   ```bash
   npm run build
   ```

2. The `dist` folder contains your static site

3. Push to GitHub and enable Pages:
   - Create a new repo on GitHub
   - Push your code
   - Go to Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: Select `gh-pages` (you'll need to create this)

#### Option B: Using GitHub Actions (Recommended)

1. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install and Build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: |
          npm ci
          npm run build
          
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

2. Add secrets in GitHub:
   - Go to your repo → Settings → Secrets and variables → Actions
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

3. Push to `main` and it will auto-deploy!

---

## Adding More Locations

To add a new location (e.g., "Cabin", "Office"):

1. Go to Supabase → SQL Editor
2. Run:
   ```sql
   INSERT INTO locations (name) VALUES ('Cabin');
   ```

The new location will appear in the app immediately.

---

## File Structure

```
inventory-app/
├── src/
│   ├── components/      # Reusable UI components
│   ├── lib/             # Supabase client & utilities
│   ├── pages/           # Login & Dashboard pages
│   ├── App.jsx          # Main app with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── supabase-schema.sql  # Database setup script
├── .env.example         # Environment template
└── package.json
```

---

## Security Notes

- **Never commit `.env`** - it's in `.gitignore` for a reason
- **anon key is safe to expose** - Supabase uses Row Level Security (RLS) to protect data
- **All tables have RLS enabled** - only authenticated users can read/write
- **Passwords are handled by Supabase** - they use industry-standard encryption

---

## Troubleshooting

**"Invalid API key"**
- Double-check your `.env` values match Supabase exactly
- Make sure there are no extra spaces or quotes

**"No rows returned" after running schema**
- This is correct! It means the tables were created successfully

**Can't log in**
- Check if the user was created in Supabase Authentication → Users
- Try the "Send magic link" option to verify email works

**Items not showing**
- Check browser console for errors
- Verify RLS policies were created (run the schema SQL again if needed)

---

## License

MIT - do whatever you want with it.
