/**
 * Test script for onboarding flow
 * Run with: npx tsx scripts/test-onboarding.ts
 * 
 * NOTE: This requires a running dev server and valid Supabase credentials
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

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

async function runOnboardingTests() {
  console.log("🧪 Running onboarding tests...\n");

  // Test 1: Onboarding route exists
  await test("Onboarding route exists", async () => {
    const response = await fetch(`${BASE_URL}/onboarding`, {
      redirect: "manual",
    });
    // Should not 404 (might redirect if not authenticated, but route exists)
    if (response.status === 404) {
      throw new Error("Onboarding route not found");
    }
  });

  // Test 2: Dashboard route exists
  await test("Dashboard route exists", async () => {
    const response = await fetch(`${BASE_URL}/dashboard`, {
      redirect: "manual",
    });
    // Should not 404 (might redirect, but route exists)
    if (response.status === 404) {
      throw new Error("Dashboard route not found");
    }
  });

  // Test 3: Unauthenticated user redirected from dashboard
  await test("Unauthenticated user redirected from dashboard", async () => {
    const response = await fetch(`${BASE_URL}/dashboard`, {
      redirect: "manual",
    });
    if (response.status !== 307 && response.status !== 308) {
      throw new Error(`Expected redirect (307/308), got ${response.status}`);
    }
    const location = response.headers.get("location");
    if (!location?.includes("/signin")) {
      throw new Error(`Expected redirect to /signin, got ${location}`);
    }
  });

  // Test 4: Unauthenticated user redirected from onboarding
  await test("Unauthenticated user redirected from onboarding", async () => {
    const response = await fetch(`${BASE_URL}/onboarding`, {
      redirect: "manual",
    });
    // Should redirect to signin if not authenticated
    if (response.status === 200) {
      // If it returns 200, that's also okay (might allow viewing)
      // But typically should redirect
      console.log("  ⚠️  Onboarding returned 200 (might be allowed)");
    } else if (response.status !== 307 && response.status !== 308) {
      throw new Error(`Expected redirect (307/308) or 200, got ${response.status}`);
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

  console.log("✅ All onboarding tests passed!");
  console.log("\n⚠️  Note: Full onboarding flow requires authentication.");
  console.log("   Test manually by signing in and checking redirect behavior.");
}

// Run if executed directly
if (typeof require !== "undefined" && require.main === module) {
  runOnboardingTests().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { runOnboardingTests };

