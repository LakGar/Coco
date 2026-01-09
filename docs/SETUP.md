# Setup Instructions

## Required Dependencies

Install the following packages:

```bash
npm install zod
npm install -D tsx @types/node
```

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

## Running Tests

```bash
# Type check
npm run typecheck

# Smoke tests (requires dev server running)
npm run dev  # in one terminal
npm run test:smoke  # in another terminal
```

