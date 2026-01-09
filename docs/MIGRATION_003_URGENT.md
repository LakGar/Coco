# Migration 003 RLS Fix - URGENT

## Issue

When creating a patient, you're getting this error:
```
Error creating patient: {
  code: '42501',
  details: null,
  hint: null,
  message: 'new row violates row-level security policy for table "patients"'
}
```

## Root Cause

The RLS policy for `patient_memberships` INSERT requires that an owner membership already exists before you can create a membership. However, when creating a patient, you need to create the **first** owner membership, which creates a chicken-and-egg problem.

Additionally, the `patients` table INSERT might fail if the session context isn't properly available for RLS.

## Solution

A fix migration has been created: `supabase/migrations/003_patients_and_memberships_fix.sql`

This migration:
1. Updates the `patient_memberships` INSERT policy to allow creating the initial owner membership if the user created the patient
2. Re-creates the `patients` INSERT policy to ensure it's correct

## How to Apply

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/003_patients_and_memberships_fix.sql`
4. Click **Run**

### Option 2: Using Supabase CLI

```bash
# If you have Supabase CLI set up
supabase db push
```

## Verification

After running the migration:

1. **Test patient creation:**
   - Sign in to your app
   - Navigate to `/dashboard/patients`
   - Try creating a new patient
   - ✅ Should succeed without RLS errors

2. **Check the database:**
   - Go to Supabase Dashboard → Table Editor
   - Check `patients` table - should have your new patient
   - Check `patient_memberships` table - should have an owner membership for the patient

## What Changed

### Before (Broken)
- `patient_memberships` INSERT policy required an existing owner membership
- This prevented creating the initial owner membership when creating a patient

### After (Fixed)
- `patient_memberships` INSERT policy allows:
  1. Creating initial owner membership if user created the patient
  2. Existing owners can still create memberships (for invites)

## Code Changes

The `createPatient` function in `utils/supabase/patients.ts` was also updated to use `getSession()` instead of `getUser()` to ensure the session is available for RLS. This is a minor change that shouldn't affect functionality.

## Next Steps

After applying the fix:
1. Test patient creation
2. Test inviting caregivers (should still work)
3. Test accepting invites (should still work)

If you still encounter issues, check:
- Session cookies are being set correctly
- User is properly authenticated
- Database migration was applied successfully
