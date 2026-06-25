import { usersRoute } from "./src/routes/users-route";
import { db } from "./src/db";
import { users, sessions } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function runTests() {
  console.log("Starting logout tests...");

  const testEmail = `test-${Date.now()}@example.com`;
  const testUsername = "testuser";
  const testPassword = "password123";

  try {
    // 1. Register test user
    console.log("1. Registering test user...");
    const regRes = await usersRoute.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: testUsername,
          email: testEmail,
          password: testPassword,
        }),
      })
    );
    const regData = await regRes.json();
    console.log("Register Response:", regRes.status, regData);
    if (regRes.status !== 200 || regData.data !== "OK") {
      throw new Error("Registration failed");
    }

    // 2. Login to get token
    console.log("2. Logging in...");
    const loginRes = await usersRoute.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      })
    );
    const loginData = await loginRes.json();
    console.log("Login Response:", loginRes.status, loginData);
    if (loginRes.status !== 200 || !loginData.data) {
      throw new Error("Login failed");
    }
    const token = loginData.data;

    // 3. Verify getCurrentUser works with valid token
    console.log("3. Verifying /api/users/current with valid token...");
    const currentRes = await usersRoute.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const currentData = await currentRes.json();
    console.log("Current User Response:", currentRes.status, currentData);
    if (currentRes.status !== 200 || currentData.data.email !== testEmail) {
      throw new Error("Get current user failed");
    }

    // 4. Logout with missing/invalid auth header
    console.log("4. Testing DELETE /api/users/logout with invalid auth headers...");
    const logoutFailRes1 = await usersRoute.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
      })
    );
    console.log("Logout (no header) Response status:", logoutFailRes1.status, await logoutFailRes1.json());
    if (logoutFailRes1.status !== 401) {
      throw new Error("Should fail with 401 when no token is provided");
    }

    const logoutFailRes2 = await usersRoute.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: { Authorization: "Bearer invalidtoken123" },
      })
    );
    console.log("Logout (invalid token) Response status:", logoutFailRes2.status, await logoutFailRes2.json());
    if (logoutFailRes2.status !== 401) {
      throw new Error("Should fail with 401 when invalid token is provided");
    }

    // 5. Successful logout
    console.log("5. Testing successful logout...");
    const logoutRes = await usersRoute.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    const logoutData = await logoutRes.json();
    console.log("Logout Response:", logoutRes.status, logoutData);
    if (logoutRes.status !== 200 || logoutData.data !== "OK") {
      throw new Error("Logout failed");
    }

    // 6. Verify token is now invalid (cannot get current user)
    console.log("6. Verifying token is now invalid...");
    const currentResPostLogout = await usersRoute.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    console.log("Current User Post-Logout Response:", currentResPostLogout.status, await currentResPostLogout.json());
    if (currentResPostLogout.status !== 401) {
      throw new Error("Token should be invalid post-logout");
    }

    // 7. Verify session is deleted from DB
    console.log("7. Checking DB directly for session...");
    const dbSessions = await db.select().from(sessions).where(eq(sessions.token, token));
    console.log("DB Sessions remaining for token:", dbSessions.length);
    if (dbSessions.length !== 0) {
      throw new Error("Session was not deleted from DB");
    }

    console.log("ALL TESTS PASSED!");
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    // Cleanup test user and sessions
    console.log("Cleaning up test data from DB...");
    const testUsers = await db.select().from(users).where(eq(users.email, testEmail));
    if (testUsers.length > 0) {
      const uId = testUsers[0].id;
      await db.delete(sessions).where(eq(sessions.userId, uId));
      await db.delete(users).where(eq(users.id, uId));
    }
    console.log("Cleanup done.");
    process.exit(0);
  }
}

runTests();
