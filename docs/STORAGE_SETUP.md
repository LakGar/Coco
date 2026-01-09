# Supabase Storage Setup for Avatars

## Overview

This guide explains how to set up Supabase Storage for user avatar uploads.

## Step 1: Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `avatars`
   - **Public bucket**: ✅ **Yes** (so avatars can be accessed via URL)
   - **File size limit**: 5MB (or your preferred limit)
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp`

## Step 2: Set Up Storage Policies (RLS)

Go to **Storage** → **Policies** → **avatars** bucket and add the following policies:

### Policy 1: Users can upload their own avatars

```sql
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 2: Users can update their own avatars

```sql
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 3: Users can delete their own avatars

```sql
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 4: Public read access (for displaying avatars)

```sql
CREATE POLICY "Public avatar access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

## Step 3: Verify Setup

After setting up the bucket and policies:

1. Try uploading an avatar through the onboarding flow
2. Check that the avatar appears in the Storage dashboard
3. Verify the avatar URL is saved in `user_profiles.avatar_url`

## Troubleshooting

### Error: "new row violates row-level security policy"

- Make sure you've created all the storage policies above
- Verify the bucket name is exactly `avatars` (case-sensitive)
- Check that the user is authenticated when uploading

### Error: "Bucket not found"

- Ensure the bucket name is `avatars`
- Verify the bucket is set to **Public**

### Images not displaying

- Check that the bucket is set to **Public**
- Verify the `avatar_url` in the database is correct
- If using Next.js Image component, ensure the Supabase domain is added to `next.config.js` (see below)

## Next.js Image Configuration

If you're using the Next.js `Image` component, add your Supabase storage domain to `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-project-ref.supabase.co',
        pathname: '/storage/v1/object/public/avatars/**',
      },
    ],
  },
};

module.exports = nextConfig;
```

Replace `your-project-ref` with your actual Supabase project reference ID.

