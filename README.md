# Belajar Vibe Coding

Aplikasi ini adalah sebuah RESTful API sederhana untuk manajemen pengguna (User Management) dan Autentikasi (Authentication). API ini dibangun menggunakan ekosistem modern berbasis Bun, Elysia, dan Drizzle ORM dengan database MySQL.

## 🏗 Arsitektur & Struktur Folder

Aplikasi ini menggunakan pola arsitektur yang memisahkan antara *Routing* (Controller), *Service* (Business Logic), dan *Database/Schema*.

```text
.
├── drizzle/              # Folder hasil generate migrasi database Drizzle
├── src/                  # Folder utama source code
│   ├── db/               # Konfigurasi database dan schema
│   │   ├── index.ts      # Koneksi utama ke database MySQL
│   │   └── schema.ts     # Definisi tabel database (Users & Sessions)
│   ├── routes/           # Endpoint API (Controller layer)
│   │   └── users-route.ts# Definisi rute untuk endpoint users & auth
│   ├── services/         # Business logic layer
│   │   └── users-service.ts # Logika untuk register, login, logout, dll
│   └── index.ts          # Entry point aplikasi (Inisialisasi server Elysia)
├── tests/                # Folder untuk unit & integration test
│   └── users.test.ts     # Test case untuk rute pengguna
├── .env                  # Environment variables (Database URL, dll)
├── package.json          # Script dan daftar dependencies
└── tsconfig.json         # Konfigurasi TypeScript
```

## 🚀 Tech Stack & Library

- **Runtime**: [Bun](https://bun.sh/) (Cepat, built-in package manager & test runner)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Framework**: [Elysia](https://elysiajs.com/) (Web framework yang sangat cepat untuk Bun)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) (Type-safe SQL ORM)
- **Database Driver**: `mysql2` untuk koneksi ke MySQL
- **Testing**: `bun test` (Built-in test runner dari Bun)

## 🗄 Database Schema

Terdapat dua tabel utama di dalam database:

1. **`users`**: Menyimpan data pengguna.
   - `id`: INT, Primary Key, Auto Increment
   - `username`: VARCHAR(255), Not Null
   - `email`: VARCHAR(255), Not Null, Unique
   - `password`: VARCHAR(255), Not Null (Di-hash/plaintext sesuai implementasi service)
   - `createdAt`: TIMESTAMP, Default Now

2. **`sessions`**: Menyimpan token sesi aktif untuk autentikasi.
   - `id`: INT, Primary Key, Auto Increment
   - `token`: VARCHAR(255), Not Null
   - `userId`: INT, Foreign Key (Merujuk ke `users.id`)
   - `createdAt`: TIMESTAMP, Default Now

## 📡 API Endpoints Tersedia

| Method | Endpoint | Deskripsi | Headers / Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Health check aplikasi | - |
| `GET` | `/users` | Mendapatkan semua data pengguna | - |
| `POST` | `/api/users` | Registrasi pengguna baru | Body: `{ name, email, password }` |
| `POST` | `/api/users/login` | Login pengguna | Body: `{ email, password }` |
| `GET` | `/api/users/current`| Mendapatkan data user saat ini | Header: `Authorization: Bearer <token>` |
| `DELETE`| `/api/users/logout` | Logout (menghapus session) | Header: `Authorization: Bearer <token>` |

## 🛠 Cara Setup Project

1. Clone repository ini.
2. Salin file `.env.example` menjadi `.env` (jika ada) dan sesuaikan konfigurasi koneksi database (`DATABASE_URL`).
   ```bash
   cp .env.example .env
   ```
3. Install semua dependencies menggunakan Bun:
   ```bash
   bun install
   ```

## ⚙️ Cara Menjalankan Aplikasi

1. **Generate schema & Migrasi Database** (Pastikan database MySQL sudah berjalan dan URL sesuai di `.env`):
   ```bash
   bun run db:generate
   bun run db:migrate
   ```
2. **Jalankan Development Server** (dengan fitur watch/auto-reload):
   ```bash
   bun run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000` (atau port di `.env`).

## 🧪 Cara Test Aplikasi

Aplikasi ini menggunakan test runner bawaan dari Bun. Pastikan environment untuk testing sudah disiapkan (database berjalan).

Jalankan perintah berikut untuk mengeksekusi semua test case (seperti skenario register, login, validasi token, dll):
```bash
bun test
```
