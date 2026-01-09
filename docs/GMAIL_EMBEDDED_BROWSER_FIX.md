# Fixing Gmail Embedded Browser PKCE Error

## Problem

When users click magic links in Gmail, Gmail opens the link in an embedded in-app browser. This browser doesn't have access to the PKCE code verifier stored in the original browser's localStorage, causing the error:

> "PKCE code verifier not found in storage"

## Solution

We've implemented a two-part solution:

### 1. Client-Side Detection Page (`/auth/callback/page.tsx`)

This page:
- Detects if the link is opened in an embedded browser (Gmail, iframe, etc.)
- Shows instructions to open in a new window
- Provides alternative methods to complete verification

### 2. Server-Side Route Handler (`/auth/callback/route.ts`)

The route handler:
- Catches PKCE errors and redirects to the client-side page
- Handles the code exchange server-side (which doesn't require PKCE)
- Redirects to onboarding or dashboard after successful verification

## How It Works

1. **User clicks link in Gmail** → Opens in embedded browser
2. **Client page detects embedded context** → Shows instructions
3. **User clicks "Open in New Window"** → Opens in default browser
4. **Server route handler processes code** → Exchanges code for session
5. **User redirected** → To onboarding or dashboard

## Alternative Solutions

### Option 1: Disable Gmail In-App Browser (User Setting)

Users can disable Gmail's in-app browser:
1. Open Gmail app
2. Settings → Your account
3. Uncheck "Open web links in Gmail"

### Option 2: Use 6-Digit Codes Instead

Instead of magic links, use 6-digit codes:
- Configure Supabase email templates to send codes
- Users enter code manually (no browser context needed)
- See `docs/EMAIL_OTP_SETUP.md` for details

### Option 3: Custom Email Template

Update Supabase email template to include instructions:
```
Click this link to verify: {{ .ConfirmationURL }}

⚠️ If clicking from Gmail, please:
1. Copy this link
2. Open in your default browser
3. Paste and open the link
```

## Technical Details

The PKCE flow requires:
- `code_verifier` stored in the same browser context
- `code_challenge` sent to Supabase
- Both must match during code exchange

When Gmail opens links in embedded browser:
- Different storage context
- No access to original `code_verifier`
- PKCE flow fails

Our solution:
- Server-side code exchange (no PKCE needed)
- Client-side detection and user guidance
- Fallback instructions for manual steps

## Testing

1. Send verification email
2. Open email in Gmail app
3. Click link → Should show instructions page
4. Click "Open in New Window" → Should complete verification
5. Or copy link and open in browser → Should work directly

