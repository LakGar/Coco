// Test script to verify invite API route
const testInviteCode = process.argv[2]

if (!testInviteCode) {
  console.error('Usage: node scripts/test-invite-api.js <invite-code>')
  process.exit(1)
}

const API_URL = process.env.API_URL || 'http://localhost:3000'

async function testInviteAPI() {
  try {
    console.log(`Testing invite API with code: ${testInviteCode}`)
    console.log(`URL: ${API_URL}/api/invites/${testInviteCode}`)
    
    const response = await fetch(`${API_URL}/api/invites/${testInviteCode}`)
    const data = await response.json()
    
    console.log(`\nStatus: ${response.status}`)
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (response.ok) {
      console.log('\n✅ API route is working!')
      console.log(`Team: ${data.teamName}`)
      console.log(`Inviter: ${data.inviterName}`)
      console.log(`Role: ${data.roleDisplay}`)
    } else {
      console.log('\n❌ API returned an error')
    }
  } catch (error) {
    console.error('Error testing API:', error.message)
    process.exit(1)
  }
}

testInviteAPI()

