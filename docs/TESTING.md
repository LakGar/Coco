# Testing Guide

## Running Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Create `.env.local` file with:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
     ```

3. **Start dev server** (in a separate terminal):
   ```bash
   npm run dev
   ```

### Test Commands

#### Type Check
```bash
npm run typecheck
```
**Expected:** Exit code 0, no errors

#### Smoke Tests
```bash
npm run test:smoke
```
**Expected:** 5/5 tests pass
- ✅ Environment variables are set
- ✅ Public route (/) is accessible
- ✅ Sign in page is accessible
- ✅ Protected route redirects when not authenticated
- ✅ Auth callback route exists

**Note:** Smoke tests automatically load `.env.local` using dotenv.

#### Onboarding Tests
```bash
npm run test:onboarding
```
**Expected:** 4/4 tests pass
- ✅ Onboarding route exists
- ✅ Dashboard route exists
- ✅ Dashboard redirects when access attempted
- ✅ Unauthenticated user redirected from onboarding

### Pre-Commit Checklist

Before committing, ensure all tests pass:

```bash
npm run typecheck && npm run test:smoke && npm run test:onboarding
```

If all pass, proceed with commit:
```bash
git add -A
git commit -m "Your commit message"
git push
```

## Troubleshooting

### Smoke Tests Failing

**Issue:** "Environment variables are set" test fails

**Solution:** 
- Ensure `.env.local` exists in project root
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` are set
- The test script automatically loads `.env.local` via dotenv

### Tests Require Dev Server

**Issue:** Tests fail with connection errors

**Solution:**
- Start dev server: `npm run dev`
- Wait for server to be ready
- Run tests in a separate terminal

### Type Errors

**Issue:** Typecheck fails

**Solution:**
- Run `npm run typecheck` to see specific errors
- Fix type errors before committing
- Common issues: missing type definitions, incorrect imports

