#!/bin/bash

# Script to set DATABASE_URL in Vercel using Prisma Accelerate
# This is the recommended approach for serverless environments

echo "🚀 Setting DATABASE_URL in Vercel..."
echo ""
echo "Using Prisma Accelerate connection (recommended for Vercel serverless)"
echo ""

# Prisma Accelerate URL (better for serverless/Vercel)
PRISMA_ACCELERATE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19IdWIweXRBQU5lU2xGQkc3NWpUc04iLCJhcGlfa2V5IjoiMDFLRlhXOFAzRFNRUlo0MjBTQlkzMTQ4OUYiLCJ0ZW5hbnRfaWQiOiI5NDJmYmE3ZjVjODE0MDRmNDJmN2JmNTkwZGFjMTY5OWE2ZWFmOGM3Yzg1NWYyOTQ3OGIxODMwOTE1MWJhZTE0IiwiaW50ZXJuYWxfc2VjcmV0IjoiYWM0Zjg0N2ItNDE4OS00MWM2LTg3OGQtNGFmMTczN2NlNWNiIn0.EYANYIFnQAhtDjNw3560iE0DXRbAoD_yiI1ZC6HCOr0"

# Direct PostgreSQL URL (alternative - use if Accelerate doesn't work)
DIRECT_POSTGRES_URL="postgres://942fba7f5c81404f42f7bf590dac1699a6eaf8c7c855f29478b18309151bae14:sk_Hub0ytAANeSlFBG75jTsN@db.prisma.io:5432/postgres?sslmode=require"

ENVIRONMENTS=("production" "preview" "development")

echo "Choose connection type:"
echo "1) Prisma Accelerate (recommended for Vercel serverless) - uses connection pooling"
echo "2) Direct PostgreSQL connection"
read -p "Enter choice [1 or 2] (default: 1): " choice
choice=${choice:-1}

if [ "$choice" = "2" ]; then
  DB_URL="$DIRECT_POSTGRES_URL"
  echo "Using direct PostgreSQL connection..."
else
  DB_URL="$PRISMA_ACCELERATE_URL"
  echo "Using Prisma Accelerate connection..."
fi

echo ""
echo "Adding DATABASE_URL to the following environments:"
for env in "${ENVIRONMENTS[@]}"; do
  echo "  - $env"
done
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

for env in "${ENVIRONMENTS[@]}"; do
  echo ""
  echo "Setting DATABASE_URL for $env..."
  echo "$DB_URL" | vercel env add DATABASE_URL "$env"
done

echo ""
echo "✅ Done! DATABASE_URL has been set."
echo ""
echo "📝 Next steps:"
echo "   1. Run database migrations:"
echo "      DATABASE_URL='$DB_URL' npx prisma migrate deploy"
echo ""
echo "   2. Redeploy your application:"
echo "      vercel --prod"
echo ""
