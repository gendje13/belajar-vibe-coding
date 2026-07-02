import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

export class UsersService {
  /**
   * Mendaftar pengguna (user) baru ke dalam sistem.
   * Melakukan validasi email unik, mengenkripsi password dengan bcrypt bawaan Bun,
   * dan menyimpan informasi pengguna baru ke database.
   * 
   * @param payload Objek berisi name, email, dan password dari pengguna baru
   * @returns String "OK" jika pendaftaran berhasil
   * @throws Error jika email sudah terdaftar
   */
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

  /**
   * Melakukan verifikasi kredensial pengguna dan menghasilkan token sesi baru.
   * Mencari pengguna berdasarkan email, mencocokkan password menggunakan bcrypt,
   * kemudian membuat token UUID baru yang disimpan di tabel sesi.
   * 
   * @param payload Objek berisi email dan password pengguna
   * @returns String token sesi (UUID) jika berhasil login
   * @throws Error jika email tidak ditemukan atau password salah
   */
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
    if (!user) {
      throw new Error("Email atau password salah");
    }

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

  /**
   * Mengambil data profil dari pengguna yang sedang aktif berdasarkan token sesi.
   * Melakukan query gabungan (inner join) antara tabel sesi dan pengguna.
   * 
   * @param token Token sesi pengguna
   * @returns Objek profil user berisi id, name, email, dan tanggal pembuatan akun
   * @throws Error "Unauthorized" jika token sesi tidak ditemukan atau tidak valid
   */
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

  /**
   * Menghapus sesi aktif pengguna berdasarkan token yang diberikan.
   * Memeriksa validitas sesi terlebih dahulu sebelum melakukan penghapusan data sesi dari database.
   * 
   * @param token Token sesi yang ingin dihapus/di-logout
   * @returns String "OK" jika proses logout berhasil
   * @throws Error "Unauthorized" jika token sesi tidak ditemukan atau tidak valid
   */
  async logout(token: string) {
    const existingSession = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    if (existingSession.length === 0) {
      throw new Error("Unauthorized");
    }

    await db.delete(sessions).where(eq(sessions.token, token));
    return "OK";
  }
}

