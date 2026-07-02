# Implementasi Fitur Swagger API Documentation

## Deskripsi Tugas
Kita perlu menambahkan dokumentasi API interaktif menggunakan **Swagger** di project ini. Tujuannya adalah agar pengguna lain (atau *frontend developer*) yang ingin menggunakan API kita dapat dengan mudah melihat dokumentasi dan mencoba endpoint secara langsung melalui antarmuka Swagger UI.

Project ini menggunakan framework **Elysia.js**, sehingga kita akan memanfaatkan plugin resmi yaitu `@elysiajs/swagger`.

## Target Implementator
Tugas ini ditujukan untuk **Junior Programmer** atau **AI Model Agent**. Silakan ikuti tahapan-tahapan di bawah ini secara berurutan dan teliti.

## ⚠️ Aturan Penting
- **WAJIB** tetap berada di branch `feature/documentation`. **Jangan** membuat branch baru atau berpindah ke branch lain.

---

## Tahapan Implementasi (Step-by-Step)

### 1. Instalasi Dependensi
Jalankan perintah berikut di terminal (di dalam direktori root proyek) untuk menginstal plugin Swagger untuk Elysia:
```bash
bun add @elysiajs/swagger
```

### 2. Integrasi Swagger di `src/index.ts`
Buka file `src/index.ts` dan tambahkan integrasi plugin Swagger.
- Import plugin di bagian atas file:
  ```typescript
  import { swagger } from "@elysiajs/swagger";
  ```
- Daftarkan plugin tersebut ke dalam instance Elysia menggunakan `.use()`. **Pastikan diletakkan di awal** sebelum rute-rute (seperti `usersRoute`) didaftarkan.
- Contoh implementasi:
  ```typescript
  const app = new Elysia()
    .use(swagger({
      documentation: {
        info: {
          title: 'Vibe Coding API',
          version: '1.0.0',
          description: 'API Documentation for Belajar Vibe Coding Project'
        }
      }
    }))
    .get("/", () => "OK")
    .use(usersRoute)
    // ... sisa kode lainnya
  ```

### 3. Anotasi Rute di `src/routes/users-route.ts`
Agar Swagger UI menampilkan rute dengan rapi dan informatif, kita perlu memberikan detail pada setiap rute di `src/routes/users-route.ts`.
- Tambahkan properti `detail` di dalam objek konfigurasi rute (parameter ke-3 pada setiap method HTTP).
- Kelompokkan semua rute terkait pengguna di bawah tag `Users`.
- Contoh untuk rute `/register`:
  ```typescript
  .post(
    "/register",
    async ({ body, set }) => { ... },
    {
      body: t.Object({ ... }),
      detail: {
        summary: 'Register User Baru',
        tags: ['Users']
      }
    }
  )
  ```
- Lakukan hal yang sama untuk rute `/login`, `/current`, dan `/logout`. Berikan `summary` yang deskriptif dan pastikan `tags: ['Users']` disematkan.

### 4. Pengujian Manual
- Jalankan server secara lokal:
  ```bash
  bun run dev
  ```
- Buka web browser dan akses URL berikut: `http://localhost:3000/swagger`
- Periksa apakah halaman antarmuka Swagger UI berhasil dimuat.
- Pastikan rute `/users/register`, `/users/login`, dll., muncul dan dikelompokkan dengan benar di bawah tag **Users**.

### 5. Verifikasi Otomatis dan Commit
- Hentikan server dev sementara, lalu jalankan seluruh *unit test* yang ada untuk memastikan integrasi Swagger tidak merusak fitur yang sudah ada:
  ```bash
  bun test
  ```
- Jika semua test *Pass* (hijau), lakukan commit perubahan:
  ```bash
  git add .
  git commit -m "feat: add swagger api documentation"
  ```
- Terakhir, lakukan push langsung ke branch saat ini:
  ```bash
  git push origin feature/documentation
  ```
