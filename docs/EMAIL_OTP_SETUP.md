# Email OTP Setup: 6-Digit Codes vs Magic Links

## Current Issue

The signup flow expects a **6-digit code**, but Supabase by default sends **magic links** (clickable URLs in emails).

## Two Solutions

### Option 1: Use Magic Links (Recommended - Easier)

Magic links are the default Supabase behavior and work out of the box:

1. User enters email
2. Supabase sends email with magic link
3. User clicks link → redirects to `/auth/callback`
4. Callback exchanges code for session
5. User is logged in

**Pros:**
- Works immediately (no configuration needed)
- Better UX (one click)
- No code to type

**Cons:**
- Users need to check email and click link
- Links can expire (default: 1 hour)

**Current Implementation:**
- ✅ Callback route handles magic links
- ✅ Error handling for expired links
- ⚠️ UI still shows "6-digit code" message (needs update)

### Option 2: Configure 6-Digit Codes (Requires Supabase Config)

To send actual 6-digit codes instead of magic links:

1. **Go to Supabase Dashboard:**
   - Authentication → Email Templates
   - Edit the "Magic Link" template

2. **Update Email Template:**
   ```
   Your verification code is: {{ .Token }}
   
   Enter this 6-digit code in the app to verify your email.
   ```

3. **Configure OTP Settings:**
   - Authentication → Settings
   - Enable "Enable email confirmations"
   - Set OTP expiration (default: 1 hour)

**Note:** This requires custom email template configuration and may not work with all email providers.

## Recommended Fix

Since magic links are already working (just need better error handling), I recommend:

1. **Update the UI** to show "Check your email for a verification link" instead of "6-digit code"
2. **Keep the callback route** as-is (it handles magic links)
3. **Add error handling** for expired links (already done)

OR

Keep the 6-digit code UI but add a note: "If you received a link instead, click it to verify"

## Current Status

- ✅ Callback route handles magic links
- ✅ Error handling for expired/invalid links
- ⚠️ UI message says "6-digit code" but magic link is sent
- ⚠️ Need to either:
  - Update UI to mention magic links, OR
  - Configure Supabase to send 6-digit codes

