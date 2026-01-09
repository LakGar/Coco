# Supabase Database Setup

This directory contains database migrations and setup scripts for the COCO application.

## Structure

```
supabase/
├── migrations/          # SQL migration files (run in order)
│   └── 001_initial_auth_setup.sql
└── README.md           # This file
```

## Database Schema

### Tables

1. **user_profiles** - Extended user profile information

   - Links to `auth.users` via `id`
   - Stores: full_name, given_name, family_name, avatar_url
   - Automatically created when a user signs up

2. **user_settings** - User preferences and settings

   - Key-value store with JSONB values
   - Each user can have multiple settings

3. **consents** - User consent tracking
   - Tracks privacy policy, terms of service, marketing emails, etc.
   - Version-aware consent management

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended for initial setup)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `migrations/001_initial_auth_setup.sql`
4. Run the migration

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Features

### Automatic Profile Creation

When a user signs up via Supabase Auth, a profile is automatically created in `user_profiles` table using the `handle_new_user()` trigger function.

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:

- Users can only access their own data
- Users can read, update, and delete their own records
- No cross-user data access

### Updated Timestamps

All tables automatically update `updated_at` timestamp on record updates.

## Next Steps

After running the initial migration, you can:

1. Test user signup - profiles should be created automatically
2. Add custom settings via the `user_settings` table
3. Track user consents via the `consents` table

## Adding New Migrations

When you need to add new migrations:

1. Create a new file: `migrations/002_your_migration_name.sql`
2. Number them sequentially
3. Run them in order through the Supabase dashboard or CLI
