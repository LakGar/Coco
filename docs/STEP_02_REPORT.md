# Step 02: Onboarding Flow + Profiles

**Date:** 2024  
**Status:** ✅ Complete  
**Branch:** `step-02-onboarding`

## Repo Inventory

### Existing Auth/Session Logic
- **Client Auth:** `utils/supabase/auth.ts` - Google, Apple, email/password, OTP
- **Server Client:** `utils/supabase/server.ts` - Server-side Supabase client
- **Middleware Client:** `utils/supabase/middleware.ts` - Middleware Supabase client
- **Database Functions:** `utils/supabase/database.ts` - Client-side profile/settings/consents (client-side only)

### Current Protected Routes
- **Middleware:** `middleware.ts` protects `/dashboard`, `/app`, `/settings`, `/profile`
- **Public Routes:** `/`, `/signin`, `/auth/callback`, `/auth/auth-code-error`
- **No `/dashboard` route exists yet** - needs to be created

### Database Schema
- **Table:** `public.user_profiles` exists (from migration 001)
- **Fields:** id, email, full_name, given_name, family_name, avatar_url, created_at, updated_at
- **Missing:** `display_name` field (added in migration 002)
- **RLS:** Enabled, users can select/update own profile

## Plan

1. ✅ Add `display_name` column to `user_profiles` table (migration)
2. ✅ Create server-side profile utilities
3. ✅ Create onboarding page with 3 steps (Welcome → Display Name → Done)
4. ✅ Create dashboard page
5. ✅ Update middleware to redirect users without display_name to onboarding
6. ✅ Create server action for updating display name
7. ✅ Add onboarding tests
8. ✅ Document changes

## Implementation

### Files Created

1. **`supabase/migrations/002_add_display_name.sql`**
   - Adds `display_name` column to `user_profiles`
   - Updates `handle_new_user()` trigger to include display_name from metadata

2. **`utils/supabase/profile.ts`**
   - Server-side profile utilities
   - `getProfile()` - Get profile by user ID
   - `getCurrentProfile()` - Get current user's profile
   - `needsOnboarding()` - Check if user needs onboarding
   - `updateDisplayName()` - Update display name

3. **`app/actions/onboarding.ts`**
   - Server action: `updateUserDisplayName()`
   - Validates display name with Zod
   - Uses `getAuthenticatedUser()` helper
   - Returns `ActionResult` type

4. **`app/onboarding/page.tsx`**
   - Client component with 3-step flow:
     1. Welcome screen
     2. Display name input (required)
     3. Completion screen → redirects to dashboard
   - Form validation and error handling
   - Loading states

5. **`app/dashboard/page.tsx`**
   - Server component
   - Checks for profile and display_name
   - Redirects to onboarding if missing
   - Displays welcome message with display name

6. **`scripts/test-onboarding.ts`**
   - Tests onboarding route accessibility
   - Tests dashboard route accessibility
   - Tests redirect behavior for unauthenticated users

### Files Modified

1. **`middleware.ts`**
   - Added `ONBOARDING_ROUTE` constant
   - Added `needsOnboarding()` function to check profile/display_name
   - Redirects authenticated users without display_name to `/onboarding`
   - Allows `/onboarding` route for authenticated users
   - Redirects unauthenticated users from `/onboarding` to `/signin`

2. **`package.json`**
   - Added `test:onboarding` script

## What Works Now

✅ **Database Schema**
- `display_name` column added to `user_profiles`
- Trigger updated to handle display_name from auth metadata
- RLS policies already in place (users can only access own profile)

✅ **Onboarding Flow**
- 3-step onboarding: Welcome → Display Name → Done
- Display name is required and validated
- Form has error handling and loading states
- Redirects to dashboard on completion

✅ **Route Protection**
- Middleware checks for `display_name` on protected routes
- Redirects to `/onboarding` if missing
- Allows access to `/onboarding` when authenticated
- Protects `/onboarding` from unauthenticated users

✅ **Dashboard**
- Basic dashboard page created
- Checks for profile and display_name
- Redirects to onboarding if incomplete
- Displays personalized welcome message

✅ **Server Actions**
- `updateUserDisplayName()` with validation
- Uses authentication helper
- Returns consistent `ActionResult` type

## What is NOT Implemented Yet

⚠️ **Optional Patient Creation**
- Step 3 (patient creation) was skipped as requested
- Can be added in future step
- Onboarding currently goes: Welcome → Display Name → Done

⚠️ **Patient Table**
- No patient table exists yet
- Will be created when patient feature is implemented

⚠️ **Onboarding Completion Tracking**
- No explicit "onboarding_completed" flag
- Relies on `display_name` presence as indicator
- Could add explicit flag in future if needed

⚠️ **Google/Apple User Name Extraction**
- Google/Apple OAuth users may have name in metadata
- Trigger attempts to extract but may need enhancement
- Users can always set display_name in onboarding

⚠️ **Email Signup Flow Integration**
- Email signup flow in `sign-up.tsx` doesn't redirect to onboarding
- Users complete email signup → need to manually navigate or will be redirected by middleware
- Could enhance to redirect directly to onboarding after email verification

## How to Test Locally

### Prerequisites

1. Run database migration:
   ```bash
   # In Supabase Dashboard → SQL Editor
   # Copy and paste: supabase/migrations/002_add_display_name.sql
   # Run the migration
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

### Manual Testing

1. **New User Flow:**
   - Sign up with Google/Apple or email
   - Should be redirected to `/onboarding`
   - Complete display name
   - Should redirect to `/dashboard`

2. **Existing User Without Display Name:**
   - Sign in with existing account (without display_name)
   - Try to access `/dashboard`
   - Should redirect to `/onboarding`
   - Complete onboarding
   - Should access `/dashboard`

3. **User With Display Name:**
   - Sign in with account that has display_name
   - Access `/dashboard` → should work
   - Access `/onboarding` → should work (but not required)

4. **Unauthenticated User:**
   - Try to access `/dashboard` → redirects to `/signin`
   - Try to access `/onboarding` → redirects to `/signin`

### Automated Tests

```bash
# Run onboarding tests (requires dev server)
npm run test:onboarding
```

**Expected:** All 4 tests pass

### Type Check

```bash
npm run typecheck
```

**Expected:** Only pre-existing errors (zod, canvas-confetti types)

## Security Notes

✅ **RLS Enforcement**
- Profile queries use RLS policies
- Users can only access their own profile
- Server-side utilities use authenticated Supabase client

✅ **Input Validation**
- Display name validated with Zod (min 1, max 100 chars)
- Server action validates before database update
- Client-side validation as well

✅ **Authentication Required**
- Server actions require authentication
- Middleware protects routes
- Onboarding requires authentication

⚠️ **Rate Limiting**
- Server actions don't have rate limiting yet
- Can add using `withRateLimit()` wrapper if needed

⚠️ **CSRF Protection**
- Next.js provides some CSRF protection
- Server actions are protected by default
- Consider explicit CSRF tokens for sensitive operations

## Verification Results

### Pre-Change Tests
- **Typecheck:** 4 pre-existing errors (zod not installed, canvas-confetti types, MarginType)
- **Smoke Tests:** Not run (requires dev server running)

### Post-Change Tests
- **Typecheck:** Same 4 pre-existing errors (no new errors in Step 02 code)
  - All new files (`app/onboarding`, `app/dashboard`, `app/actions/onboarding.ts`, `utils/supabase/profile.ts`) pass type checking
  - Errors only in pre-existing files (`lib/validation.ts` needs zod, `components/ui/sign-up.tsx` has canvas-confetti issues)
- **Linter:** No errors in new files
- **New Test Script:** `npm run test:onboarding` created (requires dev server)

## Git Actions

**Branch:** `step-02-onboarding` (created)  
**Status:** Ready for commit

**Files Changed:**
- **New Files (8):**
  - `supabase/migrations/002_add_display_name.sql`
  - `utils/supabase/profile.ts`
  - `app/actions/onboarding.ts`
  - `app/onboarding/page.tsx`
  - `app/dashboard/page.tsx`
  - `scripts/test-onboarding.ts`
  - `docs/STEP_02_REPORT.md`
- **Modified Files (2):**
  - `middleware.ts` - Added onboarding redirect logic
  - `package.json` - Added test:onboarding script

```bash
git add .
git commit -m "Step 02: onboarding flow + profiles"
git push origin step-02-onboarding
```

## Summary

✅ **Completed:**
- Database migration for `display_name`
- Server-side profile utilities
- 3-step onboarding flow
- Dashboard page
- Middleware redirect logic
- Server action for display name
- Basic tests

⚠️ **Open Issues:**
- Patient creation step skipped (as requested)
- Email signup flow doesn't directly redirect to onboarding (middleware handles it)
- No explicit onboarding completion flag (uses display_name as indicator)

🎯 **Next Steps:**
- Step 03: Add patient creation to onboarding (optional)
- Step 04: Enhance email signup flow integration
- Step 05: Add patient table and management

