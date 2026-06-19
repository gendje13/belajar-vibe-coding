import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

export class UsersService {
  async register(payload: any) {
    const { name, email, password } = payload;

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("Email sudah terdaftar");
    }

    // Hash password using Bun's native bcrypt support
    const hashedPassword = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    // Insert new user
    await db.insert(users).values({
      username: name,
      email,
      password: hashedPassword,
    });

    return "OK";
  }

  async login(payload: any) {
    const { email, password } = payload;

    // Find user by email
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length === 0) {
      throw new Error("Email atau password salah");
    }

    const user = existingUser[0];

    // Verify password using Bun's native bcrypt support
    const isPasswordValid = await Bun.password.verify(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Email atau password salah");
    }

    // Generate token (UUID)
    const token = crypto.randomUUID();

    // Insert session into database
    await db.insert(sessions).values({
      token,
      userId: user.id,
    });

    return token;
  }

  async getCurrentUser(token: string) {
    const result = await db
      .select({
        id: users.id,
        name: users.username,
        email: users.email,
        created_at: users.createdAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1);

    if (result.length === 0) {
      throw new Error("Unauthorized");
    }

    return result[0];
  }
}

