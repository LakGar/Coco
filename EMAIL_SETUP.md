# Email Setup Guide

This project uses [Resend](https://resend.com) for sending transactional emails.

## Setup Steps

1. **Create a Resend account**
   - Go to [resend.com](https://resend.com) and sign up
   - Verify your email address

2. **Get your API key**
   - Navigate to API Keys in the Resend dashboard
   - Create a new API key
   - Copy the API key

3. **Add environment variables**
   Add these to your `.env.local` file:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM_EMAIL=Coco <onboarding@resend.dev>
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
   
   **Note:** For testing, you can use Resend's default domain (`onboarding@resend.dev`). 
   The sender name will appear as "Coco" in the recipient's inbox.

4. **Domain setup (for production)**
   - Add your domain in Resend dashboard
   - Verify DNS records
   - Update `RESEND_FROM_EMAIL` to use your verified domain

## Email Templates

The email templates are designed to match Coco's aesthetic:
- Warm stone/beige color scheme (#d4a574, #c8966a)
- Rounded corners and modern design
- Responsive layout
- Clear call-to-action buttons

## Testing

In development, if `RESEND_API_KEY` is not set, emails will be logged to the console instead of being sent.

