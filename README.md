# Contre Store Backend

Backend REST API untuk aplikasi manajemen toko alat tulis **Contre Store** (mobile/Flutter). Dibangun dengan Node.js + Express.js + MySQL.

## 1. Teknologi

- Node.js, Express.js
- MySQL (mysql2/promise)
- JWT (jsonwebtoken)
- bcryptjs
- dotenv, cors
- Multer + Cloudinary
- express-validator

## 2. Instalasi

```bash
# 1. Masuk ke folder project
cd "uji level UMKM beckend"

# 2. Install dependencies
npm install

# 3. Salin konfigurasi environment
copy .env.example .env
# (Linux/Mac: cp .env.example .env)

# 4. Edit .env sesuai konfigurasi Anda

# 5. Jalankan server
npm run dev
```

Server berjalan di `http://localhost:5000`.

## 3. Konfigurasi Database

Database MySQL sudah tersedia dengan nama `contre_store`. **Jangan membuat database baru.**

Isi `.env`:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=contre_store
```

Pastikan MySQL (misalnya via Laragon/XAMPP) sudah berjalan. Cek koneksi:

```
GET http://localhost:5000/api/test-db
```

## 4. Konfigurasi Cloudinary

Isi variabel berikut di `.env` setelah memiliki akun Cloudinary:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=contre_store/products
```

Jika belum diisi, endpoint upload akan mengembalikan pesan bahwa Cloudinary belum dikonfigurasi.

## 5. Membuat Akun Admin

```bash
npm run create-admin -- --name "Admin Contre" --email "admin@contre.com" --password "admin123"
```

Atau jalankan tanpa argumen untuk input interaktif:

```bash
npm run create-admin
```

Password akan di-hash dengan bcrypt sebelum disimpan.

## 6. Akun Pengujian

- Admin: `admin@contre.com` / `admin123`
- User: `user@contre.com` / `user123` (daftar via endpoint register atau buat manual)

> Jangan gunakan password ini di production.

## 7. Menjalankan

- Development: `npm run dev`
- Production: `npm start`

## 8. Autentikasi

Kirim JWT melalui header:

```
Authorization: Bearer <token>
```

Token diperoleh dari `POST /api/auth/login`.

## 9. Daftar Endpoint

### AUTH
- `POST /api/auth/register` — registrasi (role otomatis `user`)
- `POST /api/auth/login` — login, mengembalikan token
- `GET /api/auth/me` — profil user login (butuh token)

### CATEGORIES
- `GET /api/categories` — list (login)
- `GET /api/categories/:id` — detail (login)
- `POST /api/categories` — tambah (admin)
- `PUT /api/categories/:id` — edit (admin)
- `DELETE /api/categories/:id` — hapus (admin, gagal jika masih dipakai produk)

### PRODUCTS
- `GET /api/products` — list + nama kategori (login)
- `GET /api/products/:id` — detail (login)
- `POST /api/products` — tambah (admin, multipart/form-data atau JSON)
- `PUT /api/products/:id` — edit (admin)
- `DELETE /api/products/:id` — hapus (admin, hapus gambar Cloudinary)

### UPLOAD
- `POST /api/upload` — upload gambar (admin, multipart/form-data field `image`)

### SYSTEM
- `GET /` — info API
- `GET /api/test-db` — cek koneksi database

## 10. Contoh Request & Response

### Register
Request:
```json
POST /api/auth/register
{
  "name": "Budi",
  "email": "budi@mail.com",
  "password": "rahasia123"
}
```
Response:
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": { "id": 3, "name": "Budi", "email": "budi@mail.com", "role": "user" }
}
```

### Login
Request:
```json
POST /api/auth/login
{
  "email": "admin@contre.com",
  "password": "admin123"
}
```
Response:
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOi...",
    "user": { "id": 1, "name": "Admin Contre", "email": "admin@contre.com", "role": "admin" }
  }
}
```

### Create Product (multipart)
```
POST /api/products
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
Fields: name, category_id, price, stock, description, image (file)
```

### Upload terpisah
```
POST /api/upload
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data
Field: image (file)
```
Response:
```json
{
  "success": true,
  "message": "Upload berhasil",
  "data": { "url": "https://res.cloudinary.com/.../image.jpg", "public_id": "contre_store/products/..." }
}
```

## 11. Uji dengan Postman

1. Buat environment dengan variable `base_url = http://localhost:5000` dan `token`.
2. Login admin → simpan token ke variable `token`.
3. Untuk endpoint privat, tambahkan header `Authorization: Bearer {{token}}`.
4. Untuk upload, gunakan body type `form-data`, key `image` type File.

## 12. Integrasi Flutter

- Base URL development (emulator Android): `http://10.0.2.2:5000`
- HP fisik (satu jaringan WiFi): `http://<IP-LAPTOP>:5000` (cari IP dengan `ipconfig`).
- Semua endpoint JSON kecuali upload (multipart/form-data).
- URL gambar Cloudinary (`secure_url`) dapat langsung ditampilkan di Flutter (`Image.network`).

## 13. Struktur Folder

```
backend/
├── config/
├── controllers/
├── middleware/
├── routes/
├── validators/
├── scripts/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## 14. Catatan Keamanan

- Jangan commit `.env` (sudah di `.gitignore`).
- Ganti `JWT_SECRET` dengan string acak kuat di production.
- Password di-hash dengan bcrypt; hash tidak pernah dikirim ke client.
- Hak akses diperiksa di backend melalui middleware role.
