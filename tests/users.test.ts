import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { usersRoute } from "../src/routes/users-route";
import { db, pool } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

const app = new Elysia()
  .get("/", () => "OK")
  .use(usersRoute)
  .get("/users", async () => {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          createdAt: users.createdAt,
        })
        .from(users);
      return { success: true, data: allUsers };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: message };
    }
  });

beforeEach(async () => {
  // Clear sessions first to satisfy foreign key constraints, then clear users
  await db.delete(sessions);
  await db.delete(users);
});

afterAll(async () => {
  await pool.end();
});

describe("General Routes", () => {
  it("GET / should return OK", async () => {
    const res = await app.handle(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
  });

  it("GET /users should return empty array when no users exist", async () => {
    const res = await app.handle(new Request("http://localhost/users"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: unknown[] };
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });
});

describe("POST /api/users (Register)", () => {
  it("should successfully register a new user", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        }),
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: string };
    expect(body.data).toBe("OK");

    // Verify user is in DB
    const dbUsers = await db.select().from(users).where(eq(users.email, "john@example.com"));
    expect(dbUsers.length).toBe(1);
    expect(dbUsers[0]!.username).toBe("John Doe");
  });

  it("should fail to register if email already exists", async () => {
    // Register first user
    await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        }),
      })
    );

    // Register second user with same email
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Smith",
          email: "john@example.com",
          password: "password456",
        }),
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Email sudah terdaftar");
  });

  it("should fail validation if fields are missing or invalid", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          // missing email
          password: "password123",
        }),
      })
    );
    expect(res.status).toBe(422); // Elysia's schema validation error default is 422
  });

});

describe("POST /api/users/login (Login)", () => {
  beforeEach(async () => {
    // Register a user for login tests
    await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Login User",
          email: "login@example.com",
          password: "password123",
        }),
      })
    );
  });

  it("should successfully login with valid credentials", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "login@example.com",
          password: "password123",
        }),
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: string };
    expect(body.data).toBeDefined();
    expect(typeof body.data).toBe("string");

    // Verify session in DB
    const dbSessions = await db.select().from(sessions);
    expect(dbSessions.length).toBe(1);
    expect(dbSessions[0]!.token).toBe(body.data);
  });

  it("should fail login if password is incorrect", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "login@example.com",
          password: "wrongpassword",
        }),
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Email atau password salah");
  });

  it("should fail login if email is not found", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "notfound@example.com",
          password: "password123",
        }),
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Email atau password salah");
  });
});

describe("GET /api/users/current (Get Current User)", () => {
  let token: string;

  beforeEach(async () => {
    // Register
    await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Current User",
          email: "current@example.com",
          password: "password123",
        }),
      })
    );

    // Login
    const loginRes = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "current@example.com",
          password: "password123",
        }),
      })
    );
    const loginBody = (await loginRes.json()) as { data: string };
    token = loginBody.data;
  });

  it("should successfully return current user data if valid token is provided", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { name: string; email: string } };
    expect(body.data).toBeDefined();
    expect(body.data.name).toBe("Current User");
    expect(body.data.email).toBe("current@example.com");
  });

  it("should fail with 401 if Authorization header is missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
      })
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
  });

  it("should fail with 401 if token is not prefixed with Bearer", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: { Authorization: token },
      })
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
  });

  it("should fail with 401 if token is invalid or non-existent", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: { Authorization: "Bearer invalidtoken123" },
      })
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
  });
});

describe("DELETE /api/users/logout (Logout)", () => {
  let token: string;

  beforeEach(async () => {
    // Register
    await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Logout User",
          email: "logout@example.com",
          password: "password123",
        }),
      })
    );

    // Login
    const loginRes = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "logout@example.com",
          password: "password123",
        }),
      })
    );
    const loginBody = (await loginRes.json()) as { data: string };
    token = loginBody.data;
  });

  it("should successfully logout and delete session from DB", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: string };
    expect(body.data).toBe("OK");

    // Verify session is removed from DB
    const dbSessions = await db.select().from(sessions).where(eq(sessions.token, token));
    expect(dbSessions.length).toBe(0);
  });

  it("should fail with 401 if Authorization header is missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
      })
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
  });

  it("should fail with 401 if token is invalid", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: { Authorization: "Bearer invalidtoken123" },
      })
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
  });
});
