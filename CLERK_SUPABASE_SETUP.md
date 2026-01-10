# Clerk + Supabase Integration Setup

## Overview

Your Supabase schema uses `auth.users` and RLS policies, but you're using Clerk for authentication. This integration syncs Clerk users to Supabase Auth so everything works together.

## What Was Created

### 1. Database Schema (`lib/supabase/schema-migration.sql`)
- `clerk_user_mappings` table to map Clerk user IDs → Supabase user IDs
- Helper functions to get IDs in either direction
- RLS policies for the mapping table

### 2. Clerk Webhook (`app/api/webhooks/clerk/route.ts`)
- Listens for `user.created`, `user.updated`, `user.deleted` events
- Automatically creates/updates/deletes Supabase Auth users
- Creates mapping records

### 3. Supabase Client Utilities (`lib/supabase/client.ts`)
- `getSupabaseAdmin()` - Admin client (bypasses RLS)
- `getSupabaseServer()` - Regular server client
- `getSupabaseWithClerk()` - Gets client with Clerk context
- `getSupabaseUserId()` - Maps Clerk ID to Supabase ID

### 4. Auth Helpers (`lib/supabase/auth-helpers.ts`)
- `getCurrentSupabaseUserId()` - Get current user's Supabase ID
- `canAccessPatient()` - Check patient access
- `canEditPatient()` - Check editor permissions
- `isPatientOwner()` - Check if user owns patient
- `getAccessiblePatientIds()` - Get all accessible patients

### 5. Session API (`app/api/auth/supabase-session/route.ts`)
- Generates Supabase session tokens for client-side use

## Setup Steps

### Step 1: Run Schema Migration

1. Go to your Supabase Dashboard → SQL Editor
2. Run the SQL from `lib/supabase/schema-migration.sql`
3. This creates the mapping table and helper functions

### Step 2: Environment Variables

Add to `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk Webhook
CLERK_WEBHOOK_SECRET=whsec_...
```

**Where to find:**
- Supabase URL & Keys: Supabase Dashboard → Settings → API
- Service Role Key: Same place (keep secret!)
- Clerk Webhook Secret: See Step 3

### Step 3: Configure Clerk Webhook

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Webhooks
2. Click "Add Endpoint"
3. Enter URL: `https://your-domain.com/api/webhooks/clerk`
   - For local dev: Use [ngrok](https://ngrok.com) or Clerk's webhook testing
4. Subscribe to events:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
5. Copy the "Signing Secret" → Add to `.env.local` as `CLERK_WEBHOOK_SECRET`

### Step 4: Test the Integration

1. Sign up a new user via Clerk
2. Check Supabase Dashboard → Authentication → Users
   - You should see a new user with the same email
3. Check `clerk_user_mappings` table
   - Should have a mapping record

## Usage Examples

### Server-Side (API Routes / Server Components)

```typescript
import { getSupabaseWithClerk, getSupabaseUserId } from "@/lib/supabase/client";
import { canAccessPatient, canEditPatient } from "@/lib/supabase/auth-helpers";

// Example: Get patient data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return Response.json({ error: "Missing patientId" }, { status: 400 });
  }

  // Check authorization
  const hasAccess = await canAccessPatient(patientId);
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get Supabase client
  const supabase = await getSupabaseWithClerk();
  
  // Query (admin client bypasses RLS, but we checked manually)
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data });
}

// Example: Create episode (requires editor access)
export async function POST(request: Request) {
  const body = await request.json();
  const { patientId, ...episodeData } = body;

  // Check editor access
  const canEdit = await canEditPatient(patientId);
  if (!canEdit) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabaseUserId = await getSupabaseUserId();
  const supabase = await getSupabaseWithClerk();

  const { data, error } = await supabase
    .from("episodes")
    .insert({
      patient_id: patientId,
      created_by: supabaseUserId,
      ...episodeData,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data });
}
```

### Client-Side (React Components)

For client-side, you'll need to authenticate with Supabase after Clerk auth:

```typescript
"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export function useSupabaseClient() {
  const { isSignedIn, userId } = useAuth();
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setSupabase(null);
      return;
    }

    async function setupSession() {
      try {
        // Get Supabase session token
        const response = await fetch("/api/auth/supabase-session");
        if (!response.ok) throw new Error("Failed to get session");

        const { access_token, refresh_token } = await response.json();

        // Create Supabase client
        const client = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Set session (this enables RLS)
        await client.auth.setSession({
          access_token,
          refresh_token: refresh_token || "",
        });

        setSupabase(client);
      } catch (error) {
        console.error("Failed to setup Supabase session:", error);
      }
    }

    setupSession();
  }, [isSignedIn, userId]);

  return supabase;
}
```

## Important Notes

### RLS Limitations

⚠️ **Server-side RLS**: The admin client bypasses RLS. Always use manual authorization checks:
- Use `canAccessPatient()`, `canEditPatient()`, etc.
- Don't rely on RLS alone for server-side queries

✅ **Client-side RLS**: Works perfectly! Use the Supabase client with a proper session.

### Why This Approach?

1. **Clerk handles authentication** (sign up, sign in, MFA, etc.)
2. **Supabase handles data & RLS** (your existing schema works)
3. **Mapping table connects them** (Clerk ID → Supabase ID)

### Alternative Approaches

If you want full RLS on server-side, consider:
1. **Custom JWT**: Generate Supabase-compatible JWTs (complex)
2. **Supabase Auth only**: Migrate from Clerk (lose Clerk features)
3. **Hybrid**: Use client-side for RLS queries, server-side for admin ops

## Troubleshooting

### "User not synced to Supabase"
- Check webhook is configured correctly
- Check webhook logs in Clerk Dashboard
- Manually trigger sync by calling the webhook endpoint

### "Mapping not found"
- User might have signed up before webhook was set up
- Manually create mapping or re-trigger webhook

### RLS not working
- Server-side: Use manual checks (admin client bypasses RLS)
- Client-side: Ensure session is set properly

## Next Steps

1. ✅ Run schema migration
2. ✅ Set up environment variables
3. ✅ Configure Clerk webhook
4. ✅ Test user creation
5. 🔄 Update your API routes to use the new helpers
6. 🔄 Set up client-side Supabase session handling

