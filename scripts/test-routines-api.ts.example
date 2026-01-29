/**
 * Test script for Routines API
 * 
 * Run with: npx tsx scripts/test-routines-api.ts
 * 
 * Make sure you have:
 * 1. A valid team ID (replace TEAM_ID below)
 * 2. Clerk session token (get from browser dev tools -> Application -> Cookies -> __session)
 * 3. Server running on localhost:3000
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000'
const TEAM_ID = process.env.TEAM_ID || 'YOUR_TEAM_ID_HERE'
const SESSION_TOKEN = process.env.SESSION_TOKEN || 'YOUR_SESSION_TOKEN_HERE'

interface TestResult {
  name: string
  status: 'pass' | 'fail'
  message?: string
  data?: any
}

const results: TestResult[] = []

async function test(name: string, fn: () => Promise<any>) {
  try {
    console.log(`\n🧪 Testing: ${name}`)
    const result = await fn()
    results.push({ name, status: 'pass', data: result })
    console.log(`✅ PASS: ${name}`)
    if (result) {
      console.log('   Response:', JSON.stringify(result, null, 2).substring(0, 200))
    }
    return result
  } catch (error: any) {
    results.push({ name, status: 'fail', message: error.message })
    console.log(`❌ FAIL: ${name}`)
    console.log('   Error:', error.message)
    return null
  }
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `__session=${SESSION_TOKEN}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`)
  }

  return response.json()
}

async function main() {
  console.log('🚀 Starting Routines API Tests')
  console.log(`📍 Base URL: ${BASE_URL}`)
  console.log(`👥 Team ID: ${TEAM_ID}`)

  if (TEAM_ID === 'YOUR_TEAM_ID_HERE' || SESSION_TOKEN === 'YOUR_SESSION_TOKEN_HERE') {
    console.log('\n⚠️  Please set TEAM_ID and SESSION_TOKEN environment variables')
    console.log('   Example: TEAM_ID=xxx SESSION_TOKEN=yyy npx tsx scripts/test-routines-api.ts')
    return
  }

  let routineId: string | null = null
  let instanceId: string | null = null

  // Test 1: GET routines (should be empty initially)
  await test('GET /api/teams/[teamId]/routines', async () => {
    return fetchAPI(`/api/teams/${TEAM_ID}/routines`)
  })

  // Test 2: POST create routine (DAILY)
  const createdRoutine = await test('POST /api/teams/[teamId]/routines (DAILY)', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)

    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    return fetchAPI(`/api/teams/${TEAM_ID}/routines`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Morning Medication',
        description: 'Take morning medication with breakfast',
        priority: 'HIGH',
        recurrenceType: 'DAILY',
        startDate: tomorrow.toISOString(),
        endDate: nextWeek.toISOString(),
        timeOfDay: '09:00',
        autoGenerateTasks: true,
        generateDaysAhead: 7,
        hasJournalEntry: true,
        journalPrompts: ['How did you feel?', 'Any side effects?'],
      }),
    })
  })

  if (createdRoutine?.routine?.id) {
    routineId = createdRoutine.routine.id
    console.log(`\n📝 Created routine ID: ${routineId}`)
  }

  if (!routineId) {
    console.log('\n⚠️  Cannot continue tests without a routine ID')
    return
  }

  // Test 3: GET routines (should now have one)
  await test('GET /api/teams/[teamId]/routines (after create)', async () => {
    return fetchAPI(`/api/teams/${TEAM_ID}/routines`)
  })

  // Test 4: GET single routine instances
  await test('GET /api/teams/[teamId]/routines/[routineId]/instances', async () => {
    return fetchAPI(`/api/teams/${TEAM_ID}/routines/${routineId}/instances`)
  })

  // Test 5: POST create routine (WEEKLY)
  const weeklyRoutine = await test('POST /api/teams/[teamId]/routines (WEEKLY)', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0)

    return fetchAPI(`/api/teams/${TEAM_ID}/routines`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Weekly Therapy Session',
        description: 'Weekly check-in with therapist',
        priority: 'MEDIUM',
        recurrenceType: 'WEEKLY',
        recurrenceDaysOfWeek: [1], // Monday
        startDate: tomorrow.toISOString(),
        timeOfDay: '14:00',
        autoGenerateTasks: true,
        hasJournalEntry: false,
      }),
    })
  })

  // Test 6: POST create routine (CUSTOM_WEEKDAYS)
  const customRoutine = await test('POST /api/teams/[teamId]/routines (CUSTOM_WEEKDAYS)', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(8, 0, 0, 0)

    return fetchAPI(`/api/teams/${TEAM_ID}/routines`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Exercise Routine',
        description: 'Workout on weekdays',
        priority: 'MEDIUM',
        recurrenceType: 'CUSTOM_WEEKDAYS',
        recurrenceDaysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
        startDate: tomorrow.toISOString(),
        timeOfDay: '08:00',
        autoGenerateTasks: true,
        hasJournalEntry: true,
        journalPrompts: ['Duration?', 'Type of exercise?', 'How did it feel?'],
      }),
    })
  })

  // Test 7: PATCH update routine
  if (routineId) {
    await test('PATCH /api/teams/[teamId]/routines/[routineId]', async () => {
      return fetchAPI(`/api/teams/${TEAM_ID}/routines/${routineId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          description: 'Updated description',
          priority: 'URGENT',
        }),
      })
    })
  }

  // Test 8: PATCH update instance (if we have one)
  // Note: This requires an instance to exist, which would be created by a cron job
  // For now, we'll skip this or create an instance manually

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Test Summary')
  console.log('='.repeat(50))
  
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : '❌'
    console.log(`${icon} ${result.name}`)
    if (result.message) {
      console.log(`   ${result.message}`)
    }
  })
  
  console.log(`\n✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Total: ${results.length}`)
}

main().catch(console.error)

