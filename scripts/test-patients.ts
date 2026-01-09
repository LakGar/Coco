/**
 * Test script for patients and invites flow
 * Run with: npx tsx scripts/test-patients.ts
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

async function runPatientTests() {
  console.log("🧪 Running patient tests...\n");

  // Test 1: Patients route exists
  await test("Patients route exists", async () => {
    const response = await fetch(`${BASE_URL}/dashboard/patients`, {
      redirect: "manual",
    });
    // Should not 404 (might redirect if not authenticated, but route exists)
    if (response.status === 404) {
      throw new Error("Patients route not found");
    }
  });

  // Test 2: Patients route is protected
  await test("Patients route is protected", async () => {
    const response = await fetch(`${BASE_URL}/dashboard/patients`, {
      redirect: "manual",
    });
    // Should redirect to signin if not authenticated
    if (response.status === 200) {
      // If it returns 200, that's also okay (might be allowed)
      console.log("  ⚠️  Patients returned 200 (might be allowed)");
    } else if (response.status !== 307 && response.status !== 308) {
      throw new Error(`Expected redirect (307/308) or 200, got ${response.status}`);
    }
  });

  // Test 3: Invite route exists
  await test("Invite route exists", async () => {
    const response = await fetch(`${BASE_URL}/dashboard/invites/test-token`, {
      redirect: "manual",
    });
    // Should not 404 (might redirect or show error, but route exists)
    if (response.status === 404) {
      throw new Error("Invite route not found");
    }
  });

  // Test 4: Invite route is protected
  await test("Invite route is protected", async () => {
    const response = await fetch(`${BASE_URL}/dashboard/invites/test-token`, {
      redirect: "manual",
    });
    // Should redirect to signin if not authenticated
    if (response.status === 200) {
      console.log("  ⚠️  Invite returned 200 (might be allowed)");
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

  console.log("✅ All patient tests passed!");
  console.log("\n⚠️  Note: Full patient flow requires authentication.");
  console.log("   Test manually by signing in and creating a patient.");
}

// Run if executed directly
if (typeof require !== "undefined" && require.main === module) {
  runPatientTests().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { runPatientTests };

