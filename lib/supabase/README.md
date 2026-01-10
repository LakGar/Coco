# Clerk + Supabase Integration

This setup syncs Clerk users to Supabase Auth so your RLS policies work correctly.

## Setup Instructions

### 1. Run the Schema Migration

Run the SQL in `lib/supabase/schema-migration.sql` in your Supabase SQL editor to create the mapping table.

### 2. Configure Environment Variables

Add these to your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk Webhook
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
```

### 3. Set Up Clerk Webhook

1. Go to your Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy the webhook secret to your `.env.local`

### 4. How It Works

1. **User signs up with Clerk** → Clerk webhook fires
2. **Webhook creates Supabase Auth user** → Maps Clerk ID to Supabase ID
3. **Your app uses Clerk for auth** → Maps to Supabase user for database queries
4. **RLS policies work** → Because Supabase users exist

## Usage

### Server-Side (Server Components / API Routes)

```typescript
import { getSupabaseWithClerk, getSupabaseUserId } from "@/lib/supabase/client";

// Get authenticated Supabase client
const supabase = await getSupabaseWithClerk();

// Query with RLS (if using proper session)
const { data } = await supabase.from("patients").select("*");

// Or get Supabase user ID for manual checks
const supabaseUserId = await getSupabaseUserId();
```

### Client-Side

For client-side, you need to authenticate with Supabase after Clerk auth:

```typescript
"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export function useSupabaseSession() {
  const { getToken } = useAuth();
  
  useEffect(() => {
    async function setupSession() {
      const response = await fetch("/api/auth/supabase-session");
      const { access_token } = await response.json();
      
      // Set the session in Supabase client
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      await supabase.auth.setSession({
        access_token,
        refresh_token: "", // You'll need to handle refresh
      });
    }
    
    setupSession();
  }, []);
}
```

## Important Notes

⚠️ **RLS Limitation**: Currently, server-side RLS doesn't work perfectly because we can't easily create Supabase JWT tokens. The admin client bypasses RLS.

**Solutions:**
1. Use manual authorization checks (see `checkPatientAccess()` helper)
2. Use client-side Supabase client with proper session (better for RLS)
3. Implement custom JWT generation (advanced)

## Manual Authorization

When using admin client, add manual checks:

```typescript
import { checkPatientAccess } from "@/lib/supabase/client";

const hasAccess = await checkPatientAccess(patientId);
if (!hasAccess) {
  return new Response("Forbidden", { status: 403 });
}
```

