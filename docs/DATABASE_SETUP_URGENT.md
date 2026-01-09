# ⚠️ URGENT: Database Setup Required

## Error You're Seeing

```
Could not find the table 'public.user_profiles' in the schema cache
```

This means the database migrations haven't been run yet!

## Quick Fix (5 minutes)

### Step 1: Go to Supabase Dashboard

1. Open your Supabase project: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run Migration 001

1. Open `supabase/migrations/001_initial_auth_setup.sql` in your code editor
2. Copy the **entire contents** of the file
3. Paste into the SQL Editor in Supabase dashboard
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Run Migration 002

1. Open `supabase/migrations/002_add_display_name.sql` in your code editor
2. Copy the **entire contents** of the file
3. Paste into the SQL Editor in Supabase dashboard
4. Click **Run**

### Step 4: Verify

After running both migrations, you should see:

- ✅ `user_profiles` table created
- ✅ `user_settings` table created
- ✅ `consents` table created
- ✅ `display_name` column added to `user_profiles`

## What These Migrations Do

**001_initial_auth_setup.sql:**

- Creates `user_profiles`, `user_settings`, and `consents` tables
- Sets up Row Level Security (RLS) policies
- Creates trigger to auto-create profiles on signup

**002_add_display_name.sql:**

- Adds `display_name` column to `user_profiles`
- Updates the trigger function to handle `display_name`

## After Running Migrations

1. Restart your dev server (`npm run dev`)
2. Try signing up again
3. The onboarding flow should work now!

## Alternative: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Link your project (first time only)
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

## Need Help?

If you see any errors when running the migrations:

1. Check that you're in the correct Supabase project
2. Make sure you have the right permissions
3. Check the error message - it will tell you what went wrong
