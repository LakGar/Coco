#!/usr/bin/env node

// Simple script to verify database connection
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Try to query the database
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Query test successful:', result)
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log('📊 Existing tables:', tables.map(t => t.table_name))
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found. You need to run: npm run db:push')
    } else {
      console.log('✅ Tables exist in database')
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('\nMake sure:')
    console.error('1. Docker is running: docker-compose up -d')
    console.error('2. DATABASE_URL is set in .env.local')
    console.error('3. DATABASE_URL matches: postgresql://postgres:postgres@localhost:5432/coco')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

