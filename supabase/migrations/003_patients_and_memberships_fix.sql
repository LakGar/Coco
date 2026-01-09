-- ============================================
-- FIX FOR PATIENT CREATION RLS ISSUE
-- ============================================
-- This migration fixes the RLS policies to allow:
-- 1. Patient creation (fixes auth.uid() context issue)
-- 2. Initial owner membership creation (chicken-and-egg problem)

-- ============================================
-- FIX PATIENT_MEMBERSHIPS INSERT POLICY
-- ============================================
-- Allow users to create initial owner membership if they created the patient
-- OR allow existing owners to create memberships (for invites)

DROP POLICY IF EXISTS "Only owners can create memberships" ON public.patient_memberships;

CREATE POLICY "Users can create initial owner membership or owners can create memberships"
  ON public.patient_memberships
  FOR INSERT
  WITH CHECK (
    -- Allow creating initial owner membership if user created the patient
    (
      user_id = auth.uid()
      AND role = 'owner'
      AND status = 'accepted'
      AND EXISTS (
        SELECT 1 FROM public.patients
        WHERE patients.id = patient_memberships.patient_id
          AND patients.created_by = auth.uid()
      )
    )
    OR
    -- Allow existing owners to create memberships (for invites)
    (
      EXISTS (
        SELECT 1 FROM public.patient_memberships pm
        WHERE pm.patient_id = patient_memberships.patient_id
          AND pm.user_id = auth.uid()
          AND pm.role = 'owner'
          AND pm.status = 'accepted'
      )
    )
  );

-- ============================================
-- VERIFY PATIENTS INSERT POLICY
-- ============================================
-- The patients INSERT policy should already be correct, but let's ensure it exists

DROP POLICY IF EXISTS "Authenticated users can create patients" ON public.patients;

CREATE POLICY "Authenticated users can create patients"
  ON public.patients
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

