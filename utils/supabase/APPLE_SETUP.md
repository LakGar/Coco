# Apple Sign In Setup Guide

## Step-by-Step Instructions

### 1. Apple Developer Account
- Go to [developer.apple.com](https://developer.apple.com/account)
- Sign in with your Apple ID
- Enroll in the Apple Developer Program ($99/year) if you haven't already

### 2. Create App ID
1. Go to **Certificates, Identifiers & Profiles**
2. Click **Identifiers** → **+** button
3. Select **App IDs** → **Continue**
4. Fill in:
   - **Description**: COCO App
   - **Bundle ID**: `com.yourcompany.coco` (or your preferred bundle ID)
5. Check **Sign In with Apple** capability
6. Click **Continue** → **Register**

### 3. Create Services ID (This is your Client ID)
1. Still in **Identifiers**, click **+** button
2. Select **Services IDs** → **Continue**
3. Fill in:
   - **Description**: COCO Web Service
   - **Identifier**: `com.yourcompany.coco.web` (this will be your Client ID)
4. Click **Continue** → **Register**
5. **Edit** the Services ID you just created
6. Check **Sign In with Apple** → **Configure**
7. Select your **Primary App ID** (the one from step 2)
8. Add **Website URLs**:
   - **Domains and Subdomains**: `yourdomain.com` (your production domain)
   - **Return URLs**: 
     - `https://yourdomain.com/auth/callback` (production)
     - `http://localhost:3000/auth/callback` (local development)
9. Click **Save** → **Continue** → **Save**

### 4. Create a Key (For Client Secret)
1. Go to **Keys** → **+** button
2. Fill in:
   - **Key Name**: COCO Sign In with Apple Key
3. Check **Sign In with Apple** → **Configure**
4. Select your **Primary App ID** → **Save** → **Continue**
5. Click **Register**
6. **IMPORTANT**: Download the `.p8` key file immediately (you can only download it once!)
7. Note the **Key ID** shown on the page

### 5. Get Your Team ID
1. Go to **Membership** in the sidebar
2. Your **Team ID** is displayed at the top (e.g., `ABC123DEF4`)

### 6. Generate Client Secret
The Client Secret is a JWT token that you need to generate using your key file.

**Option A: Use the provided script**
1. Edit `utils/supabase/apple-secret-generator.js`
2. Replace the placeholder values:
   - `TEAM_ID`: Your Team ID from step 5
   - `KEY_ID`: Your Key ID from step 4
   - `KEY_FILE_PATH`: Path to your downloaded `.p8` file
   - `CLIENT_ID`: Your Services ID from step 3
3. Run: `node utils/supabase/apple-secret-generator.js`
4. Copy the generated token

**Option B: Use an online tool**
- Use [jwt.io](https://jwt.io) or similar tools to generate the JWT
- Algorithm: ES256
- Payload:
  ```json
  {
    "iss": "YOUR_TEAM_ID",
    "iat": CURRENT_TIMESTAMP,
    "exp": CURRENT_TIMESTAMP + 15777000,
    "aud": "https://appleid.apple.com",
    "sub": "YOUR_SERVICES_ID"
  }
  ```

### 7. Configure in Supabase
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Apple** and enable it
4. Enter:
   - **Client ID (Services ID)**: `com.yourcompany.coco.web`
   - **Client Secret**: The JWT token you generated
   - **Authorized Client IDs**: Your App ID (e.g., `com.yourcompany.coco`)
5. Save

### 8. Add Environment Variables
Add to your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

## Important Notes

- **Client Secret expires**: The JWT token expires in 6 months. You'll need to regenerate it.
- **Return URLs**: Make sure your return URLs match exactly what you configured in Apple Developer Portal
- **Bundle ID**: Must match between App ID and Services ID configuration
- **Key file**: Keep your `.p8` file secure - you can't download it again!

## Troubleshooting

- **"Invalid client"**: Check that your Services ID matches exactly
- **"Invalid redirect URI"**: Verify return URLs match in both Apple Developer Portal and Supabase
- **"Invalid client secret"**: Regenerate the JWT token - it may have expired

