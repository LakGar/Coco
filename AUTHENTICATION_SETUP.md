# Authentication Flow Setup

## Overview

Authentication is now fully set up with Clerk + Supabase integration, including:
- Sign up → Onboarding page
- Sign in → Dashboard page  
- Automatic redirect to onboarding if user hasn't completed it

## Pages Created

### 1. `/onboarding` - Onboarding Page
- Empty placeholder page
- Users are redirected here after sign up
- Users are redirected here if they haven't completed onboarding

### 2. `/dashboard` - Dashboard Page
- Empty placeholder page
- Users are redirected here after sign in (if onboarding is complete)

## Authentication Flow

### Sign Up Flow
1. User signs up via Clerk → `/sign-up`
2. Clerk webhook creates Supabase Auth user
3. User redirected to `/onboarding`
4. Middleware checks if onboarding is complete
5. If not complete, user stays on `/onboarding`
6. Once complete (display_name set), user can access `/dashboard`

### Sign In Flow
1. User signs in via Clerk → `/sign-in`
2. Middleware checks if onboarding is complete
3. If not complete → redirect to `/onboarding`
4. If complete → redirect to `/dashboard`

## Middleware Logic (`middleware.ts`)

The middleware:
- ✅ Allows public routes (home, sign-in, sign-up, webhooks)
- ✅ Redirects unauthenticated users to `/sign-in`
- ✅ Checks onboarding completion for authenticated users
- ✅ Redirects to `/onboarding` if not complete
- ✅ Allows access to `/dashboard` if onboarding is complete

## Onboarding Check

The system checks if a user has completed onboarding by verifying:
- User has a `display_name` set in `user_profiles` table

**To complete onboarding:**
- Update `user_profiles.display_name` for the user
- The middleware will then allow access to protected routes

## Files Created/Modified

### Created:
- `app/onboarding/page.tsx` - Onboarding page
- `app/dashboard/page.tsx` - Dashboard page
- `lib/auth/onboarding.ts` - Onboarding check utilities
- `middleware.ts` - Authentication & onboarding middleware (renamed from `proxy.ts`)

### Modified:
- `app/sign-in/[[...sign-in]]/page.tsx` - Added redirect URLs
- `app/sign-up/[[...sign-up]]/page.tsx` - Added redirect URLs

## Testing

1. **Sign Up Flow:**
   - Go to `/sign-up`
   - Create account
   - Should redirect to `/onboarding`
   - Try accessing `/dashboard` → should redirect back to `/onboarding`

2. **Sign In Flow (New User):**
   - Sign in with new account
   - Should redirect to `/onboarding` (if not complete)

3. **Sign In Flow (Onboarded User):**
   - Sign in with account that has `display_name` set
   - Should redirect to `/dashboard`

4. **Protected Routes:**
   - Try accessing `/dashboard` without auth → redirects to `/sign-in`
   - Try accessing `/dashboard` without onboarding → redirects to `/onboarding`

## Next Steps

1. **Build Onboarding Form:**
   - Add form fields to collect required user information
   - Update `user_profiles` table when form is submitted
   - Redirect to dashboard after completion

2. **Build Dashboard:**
   - Add dashboard content and features

3. **Optional Enhancements:**
   - Add loading states during onboarding check
   - Add error handling for edge cases
   - Cache onboarding status to reduce DB queries

