# Environment Variables Setup

## Quick Fix

Create a `.env.local` file in the root of your project with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Clerk Configuration (if not already set)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk Webhook Secret
CLERK_WEBHOOK_SECRET=whsec_...
```

## Where to Get These Values

### Supabase Variables

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

### Clerk Variables

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **API Keys**
4. Copy:
   - **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`

### Clerk Webhook Secret

1. Go to Clerk Dashboard → **Webhooks**
2. Create or select your webhook endpoint
3. Copy the **Signing Secret** → `CLERK_WEBHOOK_SECRET`

## After Setting Up

1. **Restart your dev server** (the error should go away)
2. Make sure `.env.local` is in your `.gitignore` (it should be by default)
3. See `env.example` for a template

## Troubleshooting

- **Error persists?** Make sure you've restarted the Next.js dev server after adding `.env.local`
- **Still missing variables?** Check that variable names match exactly (case-sensitive)
- **Supabase not configured?** The app will still work for basic auth, but onboarding checks will be skipped until Supabase is set up

