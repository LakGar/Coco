/**
 * Smoke test script for basic authentication flow
 * Run with: npx tsx scripts/smoke-test.ts
 * 
 * NOTE: This requires a running dev server and valid Supabase credentials
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: message });
    console.error(`❌ ${name}: ${message}`);
  }
}

async function runSmokeTests() {
  console.log("🧪 Running smoke tests...\n");

  // Test 1: Environment variables
  await test("Environment variables are set", () => {
    if (!SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
    if (!SUPABASE_ANON_KEY) throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is not set");
  });

  // Test 2: Public route accessibility
  await test("Public route (/) is accessible", async () => {
    const response = await fetch(`${BASE_URL}/`);
    if (!response.ok) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  });

  // Test 3: Sign in page accessibility
  await test("Sign in page is accessible", async () => {
    const response = await fetch(`${BASE_URL}/signin`);
    if (!response.ok) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  });

  // Test 4: Protected route redirect (when not authenticated)
  // Note: If user is authenticated but needs onboarding, redirects to /onboarding
  // If user is not authenticated, redirects to /signin
  await test("Protected route redirects when not authenticated", async () => {
    const response = await fetch(`${BASE_URL}/dashboard`, {
      redirect: "manual",
    });
    if (response.status !== 307 && response.status !== 308) {
      throw new Error(`Expected redirect (307/308), got ${response.status}`);
    }
    const location = response.headers.get("location");
    // Could redirect to /signin (not authenticated) or /onboarding (authenticated but incomplete)
    if (!location?.includes("/signin") && !location?.includes("/onboarding")) {
      throw new Error(`Expected redirect to /signin or /onboarding, got ${location}`);
    }
  });

  // Test 5: Auth callback route exists
  await test("Auth callback route exists", async () => {
    const response = await fetch(`${BASE_URL}/auth/callback`, {
      redirect: "manual",
    });
    // Should not 404 (might redirect or return error, but route exists)
    if (response.status === 404) {
      throw new Error("Auth callback route not found");
    }
  });

  // Summary
  console.log("\n📊 Test Summary:");
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`${passed}/${total} tests passed\n`);

  if (passed < total) {
    console.log("Failed tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    process.exit(1);
  }

  console.log("✅ All smoke tests passed!");
}

// Run if executed directly
if (typeof require !== "undefined" && require.main === module) {
  runSmokeTests().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { runSmokeTests };

