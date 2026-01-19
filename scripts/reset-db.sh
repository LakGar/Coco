#!/bin/bash

# Reset Prisma database script
# This will drop all tables and recreate them from the schema

echo "🔄 Resetting Prisma database..."

# Step 1: Force reset the database (drops all tables and recreates)
echo "📤 Pushing schema with force reset..."
npx prisma@6.19.2 db push --force-reset --skip-generate

# Step 2: Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma@6.19.2 generate

echo "✅ Database reset complete!"
echo ""
echo "Next steps:"
echo "  - Your database is now empty and ready for fresh data"
echo "  - All tables have been recreated from your schema"
echo "  - Prisma client has been regenerated"

