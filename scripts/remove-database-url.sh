#!/bin/bash

# Script to remove existing DATABASE_URL from Vercel
# This allows Vercel Postgres to automatically create the correct DATABASE_URL

echo "🗑️  Removing existing DATABASE_URL from Vercel..."
echo ""
echo "⚠️  This will remove DATABASE_URL from all environments."
echo "⚠️  Vercel Postgres will automatically create a new one when you connect the database."
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

ENVIRONMENTS=("production" "preview" "development")

for env in "${ENVIRONMENTS[@]}"; do
  echo ""
  echo "Removing DATABASE_URL from $env..."
  vercel env rm DATABASE_URL $env --yes
done

echo ""
echo "✅ Done! DATABASE_URL has been removed."
echo ""
echo "📝 Now go back to Vercel dashboard and connect your coco-db database."
echo "   Vercel will automatically create the DATABASE_URL with the correct connection string."
