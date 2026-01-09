-- ============================================
-- PATIENTS AND CARE CIRCLE MIGRATION
-- ============================================
-- This migration creates the patient management and care circle system
-- with secure invite-based access control

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CREATE ALL TABLES FIRST
-- ============================================

-- PATIENTS TABLE
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_name TEXT NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- PATIENT MEMBERSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.patient_memberships (
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'caregiver', 'viewer')),
  status TEXT NOT NULL CHECK (status IN ('accepted', 'pending')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (patient_id, user_id)
);

-- PATIENT INVITES TABLE
CREATE TABLE IF NOT EXISTS public.patient_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('caregiver', 'viewer')),
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

-- ============================================
-- CREATE INDEXES
-- ============================================

-- Indexes for patients
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON public.patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_archived ON public.patients(archived);

-- Indexes for patient_memberships
CREATE INDEX IF NOT EXISTS idx_patient_memberships_user_id ON public.patient_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_memberships_patient_id ON public.patient_memberships(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_memberships_status ON public.patient_memberships(status);

-- Indexes for patient_invites
CREATE INDEX IF NOT EXISTS idx_patient_invites_patient_id ON public.patient_invites(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_invites_email ON public.patient_invites(email);
CREATE INDEX IF NOT EXISTS idx_patient_invites_token_hash ON public.patient_invites(token_hash);
CREATE INDEX IF NOT EXISTS idx_patient_invites_expires_at ON public.patient_invites(expires_at);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_invites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR PATIENTS
-- ============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view patients they have accepted membership in" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can create patients" ON public.patients;
DROP POLICY IF EXISTS "Only owners can update patients" ON public.patients;

-- RLS Policy: Users can only select patients they have accepted membership in
CREATE POLICY "Users can view patients they have accepted membership in"
  ON public.patients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_memberships
      WHERE patient_memberships.patient_id = patients.id
        AND patient_memberships.user_id = auth.uid()
        AND patient_memberships.status = 'accepted'
    )
  );

-- RLS Policy: Only authenticated users can create patients
CREATE POLICY "Authenticated users can create patients"
  ON public.patients
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

-- RLS Policy: Only owners can update patients
CREATE POLICY "Only owners can update patients"
  ON public.patients
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_memberships
      WHERE patient_memberships.patient_id = patients.id
        AND patient_memberships.user_id = auth.uid()
        AND patient_memberships.role = 'owner'
        AND patient_memberships.status = 'accepted'
    )
  );

-- ============================================
-- RLS POLICIES FOR PATIENT_MEMBERSHIPS
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.patient_memberships;
DROP POLICY IF EXISTS "Only owners can create memberships" ON public.patient_memberships;
DROP POLICY IF EXISTS "Owners can update memberships, users can accept their own" ON public.patient_memberships;

-- RLS Policy: Users can view their own memberships
CREATE POLICY "Users can view their own memberships"
  ON public.patient_memberships
  FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policy: Only owners can insert memberships (for invites)
CREATE POLICY "Only owners can create memberships"
  ON public.patient_memberships
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_memberships pm
      WHERE pm.patient_id = patient_memberships.patient_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'owner'
        AND pm.status = 'accepted'
    )
  );

-- RLS Policy: Only owners can update role/status, but users can accept their own invites
CREATE POLICY "Owners can update memberships, users can accept their own"
  ON public.patient_memberships
  FOR UPDATE
  USING (
    -- Owner updating any membership
    EXISTS (
      SELECT 1 FROM public.patient_memberships pm
      WHERE pm.patient_id = patient_memberships.patient_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'owner'
        AND pm.status = 'accepted'
    )
    OR
    -- User accepting their own pending invite
    (user_id = auth.uid() AND status = 'pending')
  );

-- ============================================
-- RLS POLICIES FOR PATIENT_INVITES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Owners can view invites for their patients" ON public.patient_invites;
DROP POLICY IF EXISTS "Only owners can create invites" ON public.patient_invites;
DROP POLICY IF EXISTS "Only owners can revoke invites" ON public.patient_invites;

-- RLS Policy: Only owners can view invites for their patients
CREATE POLICY "Owners can view invites for their patients"
  ON public.patient_invites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_memberships
      WHERE patient_memberships.patient_id = patient_invites.patient_id
        AND patient_memberships.user_id = auth.uid()
        AND patient_memberships.role = 'owner'
        AND patient_memberships.status = 'accepted'
    )
  );

-- RLS Policy: Only owners can create invites
CREATE POLICY "Only owners can create invites"
  ON public.patient_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_memberships
      WHERE patient_memberships.patient_id = patient_invites.patient_id
        AND patient_memberships.user_id = auth.uid()
        AND patient_memberships.role = 'owner'
        AND patient_memberships.status = 'accepted'
    )
    AND auth.uid() = created_by
  );

-- RLS Policy: Only owners can update (revoke) invites
CREATE POLICY "Only owners can revoke invites"
  ON public.patient_invites
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_memberships
      WHERE patient_memberships.patient_id = patient_invites.patient_id
        AND patient_memberships.user_id = auth.uid()
        AND patient_memberships.role = 'owner'
        AND patient_memberships.status = 'accepted'
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on patients
DROP TRIGGER IF EXISTS update_patients_updated_at ON public.patients;
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER FUNCTION: Check if user is owner of patient
-- ============================================

CREATE OR REPLACE FUNCTION public.is_patient_owner(p_patient_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.patient_memberships
    WHERE patient_id = p_patient_id
      AND user_id = p_user_id
      AND role = 'owner'
      AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
