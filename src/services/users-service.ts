import { db } from "../db";
import { users } from "../db/schema";
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
}
