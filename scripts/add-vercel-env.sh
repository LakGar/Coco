#!/bin/bash

# Script to add all required environment variables to Vercel
# Usage: bash scripts/add-vercel-env.sh

echo "🚀 Adding environment variables to Vercel..."
echo ""
echo "⚠️  You'll be prompted to enter each value."
echo "⚠️  Make sure you have all your values ready before starting."
echo ""
read -p "Press Enter to continue..."

ENV_VARS=(
  "DATABASE_URL"
  "UPSTASH_REDIS_REST_URL"
  "UPSTASH_REDIS_REST_TOKEN"
  "RESEND_API_KEY"
  "RESEND_FROM_EMAIL"
  "NEXT_PUBLIC_APP_URL"
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  "CLERK_SECRET_KEY"
)

ENVIRONMENTS=("production" "preview" "development")

for env in "${ENVIRONMENTS[@]}"; do
  echo ""
  echo "📦 Adding variables for $env environment..."
  echo "----------------------------------------"
  
  for var in "${ENV_VARS[@]}"; do
    echo "Adding $var to $env..."
    vercel env add "$var" "$env"
  done
done

echo ""
echo "✅ Done! All environment variables have been added."
echo ""
echo "🔄 Now redeploy your application:"
echo "   vercel --prod"
echo ""
echo "📝 Don't forget to run database migrations on your production database:"
echo "   DATABASE_URL='your-production-url' npx prisma migrate deploy"
