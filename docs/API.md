# Dokumentasi API Kalila (Booking Dekor, Catering & Wedding)

Dokumentasi spesifikasi endpoint API backend Kalila.

---

## Informasi Umum

- **Base URL:** `http://localhost:5000/api`
- **Format Pertukaran Data:** JSON (`Content-Type: application/json`) atau Multipart Form Data (`multipart/form-data` untuk upload berkas).
- **Format Respons Standar:**
  - **Berhasil:**
    ```json
    {
      "success": true,
      "message": "Pesan sukses operasi",
      "data": { ... }
    }
    ```
  - **Gagal:**
    ```json
    {
      "success": false,
      "message": "Deskripsi kesalahan",
      "errors": [
        {
          "field": "nama_kolom",
          "message": "Pesan detail validasi"
        }
      ]
    }
    ```
- **Autentikasi:** Menggunakan JSON Web Token (JWT). Token dikirimkan pada header HTTP:
  ```http
  Authorization: Bearer <token_jwt>
  ```

---

## 1. Modul Autentikasi (`/api/auth`)

### 1.1 Registrasi Pelanggan

Mendaftarkan akun baru khusus untuk pelanggan. Role otomatis ditetapkan sebagai `customer`.

- **Endpoint:** `POST /api/auth/register`
- **Hak Akses:** Publik
- **Headers:** `Content-Type: application/json`

#### Request Body
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `name` | String | Ya | Nama lengkap pemesan (minimal 2 karakter) |
| `email` | String | Ya | Alamat email unik dan valid |
| `phone` | String | Ya | Nomor WhatsApp (minimal 9 digit) |
| `password` | String | Ya | Password (minimal 8 karakter) |

```json
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "phone": "081234567890",
  "password": "PasswordRahasia123!"
}
```

#### Respons Berhasil (`201 Created`)
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "672e12ab34cd56ef78901234",
      "name": "Budi Santoso",
      "email": "budi@example.com",
      "phone": "081234567890",
      "role": "customer"
    }
  }
}
```

#### Respons Gagal
- `400 Bad Request`: Validasi data gagal (misal email tidak valid, password kurang dari 8 karakter).
- `409 Conflict`: Email sudah terdaftar sebelumnya.

---

### 1.2 Login Pengguna

Masuk ke dalam sistem untuk pelanggan atau admin.

- **Endpoint:** `POST /api/auth/login`
- **Hak Akses:** Publik
- **Headers:** `Content-Type: application/json`

#### Request Body
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `email` | String | Ya | Alamat email terdaftar |
| `password` | String | Ya | Password akun |

```json
{
  "email": "budi@example.com",
  "password": "PasswordRahasia123!"
}
```

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "672e12ab34cd56ef78901234",
      "name": "Budi Santoso",
      "email": "budi@example.com",
      "phone": "081234567890",
      "role": "customer"
    }
  }
}
```

#### Respons Gagal
- `400 Bad Request`: Format input salah / tidak lengkap.
- `401 Unauthorized`: Email atau password salah, atau token lama yang dipakai setelah perubahan password.
- `403 Forbidden`: Akun dinonaktifkan oleh admin.
- `429 Too Many Requests`: Melebihi batas maksimal percobaan login yang gagal:
  - **Lapisan 1 (Per IP):** Maksimal `AUTH_LOGIN_IP_MAX` (default 50 kali) percobaan gagal per 15 menit untuk satu alamat IP.
  - **Lapisan 2 (Per IP + Email):** Maksimal `AUTH_LOGIN_MAX` (default 10 kali) percobaan gagal per 15 menit untuk kombinasi IP dan email yang sama.
  - *Catatan: Percobaan login yang berhasil tidak dihitung.*

> **Catatan Keamanan & Arsitektur Autentikasi:**
> 1. **Pembatalan Token (Token Invalidation):** Ketika password diubah atau direset, seluruh token JWT yang diterbitkan sebelum waktu perubahan password (`iat < floor(passwordChangedAt / 1000)`) otomatis dibatalkan dan ditolak dengan status `401 Unauthorized`.
> 2. **Dua Lapisan Rate Limiting Login:** Dilindungi pembatas frekuensi ganda (per IP dan per kombinasi IP + Email) dengan `skipSuccessfulRequests: true`.
> 3. **Konfigurasi Reverse Proxy (`trust proxy`):** Di lingkungan produksi di belakang proxy atau hosting (seperti Nginx, Cloudflare, Railway, dll.), pengembang wajib mengatur `app.set("trust proxy", ...)` sesuai jumlah proxy agar IP pengguna terbaca akurat.
> 4. **In-Memory Store:** Penyimpanan seluruh pembatas frekuensi berada di memori proses server. Hitungan akan tereset saat server restart dan tidak dibagi antar-instance.

---

### 1.3 Mendapatkan Profil Pengguna (`Me`)

Mengambil data profil pengguna yang saat ini sedang login berdasarkan token JWT.

- **Endpoint:** `GET /api/auth/me`
- **Hak Akses:** Pelanggan atau Admin yang sudah login
- **Headers:** `Authorization: Bearer <token>`

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "672e12ab34cd56ef78901234",
      "name": "Budi Santoso",
      "email": "budi@example.com",
      "phone": "081234567890",
      "role": "customer"
    }
  }
}
```

#### Respons Gagal
- `401 Unauthorized`: Token tidak disediakan, tidak valid, atau telah kedaluwarsa.

---

## 2. Modul Paket Layanan Publik (`/api/packages`)

Modul ini diakses oleh pengunjung umum (tanpa login). Hanya menampilkan paket yang aktif (`isActive: true`) dan menyembunyikan identifier internal Cloudinary (`publicId`).

### 2.1 Mendapatkan Daftar Paket Aktif

Mengambil katalog paket aktif dengan filter kategori, pencarian nama, sorting, dan pagination.

- **Endpoint:** `GET /api/packages`
- **Hak Akses:** Publik

#### Query Parameters
| Parameter | Tipe | Default | Keterangan |
|---|---|---|---|
| `category` | String | - | Filter kategori: `dekor`, `catering`, atau `wedding` |
| `q` | String | - | Pencarian nama paket (case-insensitive) |
| `page` | Integer | `1` | Nomor halaman data |
| `limit` | Integer | `12` | Jumlah item per halaman (maksimal 50) |
| `sort` | String | `terbaru` | Pilihan urutan: `terbaru`, `harga_asc`, `harga_desc` |

#### Contoh Request
```http
GET /api/packages?category=dekor&q=rustic&sort=harga_asc&page=1&limit=12
```

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Daftar paket berhasil diambil",
  "data": {
    "items": [
      {
        "_id": "672e19c045de67ab89012345",
        "name": "Paket Dekor Rustic Gold",
        "slug": "paket-dekor-rustic-gold",
        "category": "dekor",
        "price": 7500000,
        "description": "Dekorasi pelaminan rustic elegan dengan bunga segar.",
        "inclusions": [
          "Backdrop 6 meter",
          "Standing Flowers 4 pcs",
          "Mini Garden",
          "Karpet Panggung"
        ],
        "images": [
          {
            "_id": "672e19c045de67ab89012346",
            "url": "https://res.cloudinary.com/kalila/image/upload/v1234/sample.jpg"
          }
        ],
        "decorWidthCm": 600,
        "isActive": true,
        "createdAt": "2026-11-09T14:00:00.000Z",
        "updatedAt": "2026-11-09T14:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 2.2 Mendapatkan Detail Paket Aktif via Slug

Mengambil detail paket aktif berdasarkan slug URL yang unik.

- **Endpoint:** `GET /api/packages/:slug`
- **Hak Akses:** Publik

#### Path Parameters
- `slug` (String): Slug unik paket (misal: `paket-dekor-rustic-gold`).

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Detail paket berhasil diambil",
  "data": {
    "package": {
      "_id": "672e19c045de67ab89012345",
      "name": "Paket Dekor Rustic Gold",
      "slug": "paket-dekor-rustic-gold",
      "category": "dekor",
      "price": 7500000,
      "description": "Dekorasi pelaminan rustic elegan dengan bunga segar.",
      "inclusions": [
        "Backdrop 6 meter",
        "Standing Flowers 4 pcs",
        "Mini Garden",
        "Karpet Panggung"
      ],
      "images": [
        {
          "_id": "672e19c045de67ab89012346",
          "url": "https://res.cloudinary.com/kalila/image/upload/v1234/sample.jpg"
        }
      ],
      "decorWidthCm": 600,
      "isActive": true,
      "createdAt": "2026-11-09T14:00:00.000Z",
      "updatedAt": "2026-11-09T14:00:00.000Z"
    }
  }
}
```

#### Respons Gagal
- `404 Not Found`: Paket dengan slug tersebut tidak ditemukan atau berstatus tidak aktif.

---

## 3. Modul Paket Layanan Admin (`/api/admin/packages`)

Seluruh endpoint di bawah `/api/admin/packages` wajib menggunakan header autentikasi token admin (`authenticate` + `requireAdmin`).

### 3.1 Mendapatkan Semua Paket (Admin)

Mengambil seluruh paket (termasuk paket tidak aktif / draft) dengan filter lengkap.

- **Endpoint:** `GET /api/admin/packages`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`

#### Query Parameters
| Parameter | Tipe | Default | Keterangan |
|---|---|---|---|
| `category` | String | - | Filter: `dekor`, `catering`, `wedding` |
| `isActive` | String | - | Filter status: `true`, `false`, atau `all` |
| `q` | String | - | Pencarian nama paket |
| `page` | Integer | `1` | Nomor halaman |
| `limit` | Integer | `12` | Jumlah item per halaman (maksimal 100) |
| `sort` | String | `terbaru` | `terbaru`, `terlama`, `harga_asc`, `harga_desc` |

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Daftar semua paket berhasil diambil",
  "data": {
    "items": [
      {
        "_id": "672e19c045de67ab89012345",
        "name": "Paket Dekor Rustic Gold",
        "slug": "paket-dekor-rustic-gold",
        "category": "dekor",
        "price": 7500000,
        "description": "Dekorasi pelaminan rustic elegan.",
        "inclusions": ["Backdrop 6 meter"],
        "images": [
          {
            "_id": "672e19c045de67ab89012346",
            "url": "https://res.cloudinary.com/kalila/image/upload/v1234/sample.jpg",
            "publicId": "kalila/packages/dekor/sample"
          }
        ],
        "decorWidthCm": 600,
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 3.2 Mendapatkan Detail Paket via ID (Admin)

- **Endpoint:** `GET /api/admin/packages/:id`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Detail paket berhasil diambil",
  "data": {
    "package": {
      "_id": "672e19c045de67ab89012345",
      "name": "Paket Dekor Rustic Gold",
      "slug": "paket-dekor-rustic-gold",
      "category": "dekor",
      "price": 7500000,
      "description": "Dekorasi pelaminan rustic elegan.",
      "inclusions": ["Backdrop 6 meter"],
      "images": [],
      "decorWidthCm": 600,
      "isActive": true
    }
  }
}
```

---

### 3.3 Membuat Paket Baru (Admin)

Menambahkan paket baru ke database (gambar diunggah melalui endpoint terpisah).

- **Endpoint:** `POST /api/admin/packages`
- **Hak Akses:** Khusus Admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <admin_token>`

#### Aturan Bisnis & Validasi:
- `category`: Enum `"dekor"` | `"catering"` | `"wedding"` (Wajib).
- `name`: String (Wajib, trim). Slug otomatis dibuat dan dipastikan unik.
- `price`: Integer >= 0 (Wajib).
- `inclusions`: Array of String.
- `decorWidthCm`:
  - **WAJIB** diisi angka > 0 jika `category === "dekor"`.
  - **TIDAK BOLEH** diisi untuk kategori selain `"dekor"`.
- `isActive`: Boolean (opsional, default `true`).

#### Contoh Body (Kategori Dekor)
```json
{
  "name": "Paket Dekor Modern Rustic",
  "category": "dekor",
  "price": 7500000,
  "description": "Dekorasi panggung 6 meter lengkap dengan pencahayaan dan bunga segar.",
  "inclusions": [
    "Backdrop 6 meter",
    "Standing Flowers 4 pcs",
    "Lighting Panggung",
    "Karpet Jalan"
  ],
  "decorWidthCm": 600,
  "isActive": true
}
```

#### Contoh Body (Kategori Catering)
```json
{
  "name": "Paket Prasmanan Deluxe 500 Pax",
  "category": "catering",
  "price": 35000000,
  "description": "Menu prasmanan lengkap 5 hidangan utama pilihan koki.",
  "inclusions": [
    "Nasi Putih",
    "Ayam Bakar Madu",
    "Daging Rendang",
    "Sup Kimlo",
    "Aneka Buah & Puding"
  ],
  "isActive": true
}
```

#### Respons Berhasil (`201 Created`)
```json
{
  "success": true,
  "message": "Paket berhasil dibuat",
  "data": {
    "package": {
      "_id": "672e19c045de67ab89012345",
      "name": "Paket Dekor Modern Rustic",
      "slug": "paket-dekor-modern-rustic",
      "category": "dekor",
      "price": 7500000,
      "description": "Dekorasi panggung 6 meter lengkap.",
      "inclusions": ["Backdrop 6 meter"],
      "images": [],
      "decorWidthCm": 600,
      "isActive": true,
      "createdAt": "2026-11-09T14:10:00.000Z",
      "updatedAt": "2026-11-09T14:10:00.000Z"
    }
  }
}
```

---

### 3.4 Memperbarui Paket (Admin)

- **Endpoint:** `PUT /api/admin/packages/:id`
- **Hak Akses:** Khusus Admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <admin_token>`

Jika field `name` diubah, slug akan otomatis dibuat ulang mengikuti nama baru.

#### Request Body
```json
{
  "name": "Paket Dekor Modern Rustic Premium",
  "price": 8500000
}
```

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Paket berhasil diperbarui",
  "data": {
    "package": {
      "_id": "672e19c045de67ab89012345",
      "name": "Paket Dekor Modern Rustic Premium",
      "slug": "paket-dekor-modern-rustic-premium",
      "category": "dekor",
      "price": 8500000,
      "decorWidthCm": 600,
      "isActive": true
    }
  }
}
```

---

### 3.5 Mengubah Status Aktif Paket (Admin)

- **Endpoint:** `PATCH /api/admin/packages/:id/status`
- **Hak Akses:** Khusus Admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <admin_token>`

#### Request Body
```json
{
  "isActive": false
}
```

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Status paket berhasil diubah menjadi tidak aktif",
  "data": {
    "package": {
      "_id": "672e19c045de67ab89012345",
      "name": "Paket Dekor Modern Rustic Premium",
      "isActive": false
    }
  }
}
```

---

### 3.6 Menghapus Paket & Seluruh Gambarnya (Admin)

Menghapus paket dari database dan menghapus semua aset gambarnya di Cloudinary.

- **Endpoint:** `DELETE /api/admin/packages/:id`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Paket beserta gambarnya berhasil dihapus"
}
```

---

### 3.7 Mengunggah Gambar ke Paket (Admin)

Mengunggah 1 sampai 5 gambar sekaligus ke paket menggunakan Multer Memory Storage dan Cloudinary `upload_stream`. Gambar pertama yang diunggah akan otomatis berfungsi sebagai gambar sampul. Total gambar dalam satu paket maksimal 10 gambar.

- **Endpoint:** `POST /api/admin/packages/:id/images`
- **Hak Akses:** Khusus Admin
- **Headers:**
  - `Content-Type: multipart/form-data`
  - `Authorization: Bearer <admin_token>`
- **Batasan:**
  - Field form-data bernama `images`.
  - Format didukung: JPG, PNG, WEBP (divalidasi dengan pemeriksaan isi file / magic bytes).
  - Ukuran file maksimal: 5 MB per file.
  - Rate limited (maks. 30 request per 15 menit per IP).

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Gambar berhasil diunggah ke paket",
  "data": {
    "package": {
      "_id": "672e19c045de67ab89012345",
      "name": "Paket Dekor Modern Rustic",
      "images": [
        {
          "_id": "672e19c045de67ab89012346",
          "url": "https://res.cloudinary.com/kalila/image/upload/v1234/kalila/packages/dekor/foto1.jpg",
          "publicId": "kalila/packages/dekor/foto1"
        }
      ]
    }
  }
}
```

#### Respons Gagal
- `400 Bad Request`: File bukan gambar asli (magic bytes gagal), file melebihi 5 MB, lebih dari 5 file dalam satu request, atau total gambar melebihi batas 10 gambar per paket.

---

### 3.8 Menghapus Satu Gambar dari Paket (Admin)

Menghapus subdokumen gambar berdasarkan `_id` gambar dan menghapus file fisiknya dari Cloudinary.

- **Endpoint:** `DELETE /api/admin/packages/:id/images/:imageId`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Gambar berhasil dihapus dari paket",
  "data": {
    "package": {
      "_id": "672e19c045de67ab89012345",
      "name": "Paket Dekor Modern Rustic",
      "images": []
    }
  }
}
```

---

## 4. Modul Pengaturan (Setting)

Dokumen pengaturan bersifat *singleton* (`key: "main"`) yang menyimpan profil usaha, kontak, info rekening, batas pembayaran, dan kuota acara harian.

### 4.1 Mengambil Pengaturan Publik

Mengembalikan informasi bisnis, kontak, dan nominal DP untuk pengunjung/klien umum. Informasi perbankan dan QRIS **tidak** disertakan demi alasan keamanan.

- **Endpoint:** `GET /api/settings`
- **Hak Akses:** Publik
- **Headers:** `Content-Type: application/json`

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Pengaturan publik berhasil diambil",
  "data": {
    "businessName": "Kalila Wedding, Dekor & Catering",
    "adminWhatsapp": "6281234567890",
    "dpAmount": 1000000,
    "paymentDeadlineHours": 24,
    "kontak": {
      "email": "kalila.official@gmail.com",
      "phone": "081234567890",
      "address": "Indonesia",
      "instagram": "@kalila.organizer",
      "facebook": "",
      "tiktok": "@kalila.organizer"
    }
  }
}
```

---

### 4.2 Mengambil Pengaturan Lengkap (Admin)

Mengembalikan konfigurasi lengkap sistem termasuk batas kuota acara harian, informasi rekening, dan URL gambar QRIS.

- **Endpoint:** `GET /api/admin/settings`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Pengaturan admin berhasil diambil",
  "data": {
    "businessName": "Kalila Wedding, Dekor & Catering",
    "adminWhatsapp": "6281234567890",
    "dpAmount": 1000000,
    "paymentDeadlineHours": 24,
    "maxProofAttempts": 3,
    "rejectionExtensionHours": 6,
    "maxEventsPerDay": {
      "dekor": 2,
      "catering": 2,
      "wedding": 1
    },
    "bankName": "Bank Central Asia (BCA)",
    "accountNumber": "1234567890",
    "accountHolder": "Kalila Wedding & Event",
    "qrisImage": {
      "url": "https://res.cloudinary.com/kalila/image/upload/v1234/kalila/settings/qris.png"
    },
    "kontak": {
      "email": "kalila.official@gmail.com",
      "phone": "081234567890",
      "address": "Indonesia",
      "instagram": "@kalila.organizer",
      "facebook": "",
      "tiktok": "@kalila.organizer"
    },
    "notificationRecipients": {
      "adminEmails": ["admin1@kalila.com", "admin2@kalila.com"],
      "ownerEmails": ["owner@kalila.com"]
    },
    "updatedAt": "2026-11-10T12:00:00.000Z"
  }
}
```

---

### 4.3 Memperbarui Pengaturan (Admin)

Menerima pembaruan parsial (*partial update*) terhadap pengaturan. Field bersarang (`kontak`, `maxEventsPerDay`) yang tidak disebutkan dalam request body tidak akan tertimpa. Field yang tidak dikenal akan ditolak (`400 Bad Request`).

- **Endpoint:** `PUT /api/admin/settings`
- **Hak Akses:** Khusus Admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <admin_token>`

#### Request Body
```json
{
  "businessName": "Kalila Wedding & Event Organizer",
  "adminWhatsapp": "081234567890",
  "dpAmount": 1000000,
  "paymentDeadlineHours": 24,
  "maxProofAttempts": 3,
  "rejectionExtensionHours": 6,
  "maxEventsPerDay": {
    "dekor": 3,
    "catering": null
  },
  "bankName": "Bank Mandiri",
  "accountNumber": "9876543210",
  "accountHolder": "Kalila Organizer",
  "kontak": {
    "email": "kontak@kalila.com"
  }
}
```

*Catatan:* `adminWhatsapp` otomatis dinormalisasi dari format `08...` atau `+628...` menjadi `628...`.

#### Respons Berhasil (`200 OK`)
Mengembalikan objek pengaturan admin yang telah diperbarui.

---

### 4.4 Unggah Gambar QRIS (Admin)

Mengunggah satu gambar QRIS ke folder `kalila/settings` di Cloudinary. Jika sebelumnya sudah ada gambar QRIS, file lama di Cloudinary otomatis dihapus.

- **Endpoint:** `POST /api/admin/settings/qris`
- **Hak Akses:** Khusus Admin
- **Headers:**
  - `Content-Type: multipart/form-data`
  - `Authorization: Bearer <admin_token>`
- **Batasan:**
  - Nama field form-data: `image`.
  - Format didukung: JPG, PNG, WEBP (divalidasi magic bytes).
  - Maksimal ukuran: 5 MB.
  - Dilindungi *rate limiter*.

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Gambar QRIS berhasil diunggah",
  "data": {
    "url": "https://res.cloudinary.com/kalila/image/upload/v1234/kalila/settings/qris_new.png"
  }
}
```

---

### 4.5 Menghapus Gambar QRIS (Admin)

Menghapus file gambar QRIS dari Cloudinary dan mengosongkan URL gambar pada database.

- **Endpoint:** `DELETE /api/admin/settings/qris`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Gambar QRIS berhasil dihapus"
}
```

---

## 5. Modul Kalender Blokir Admin (`/api/admin/calendar`)

Digunakan oleh admin untuk memantau kalender bulanan dan memblokir tanggal acara per kategori.

### 5.1 Mengambil Kalender Admin Bulanan

Mengembalikan ringkasan setiap hari dalam satu bulan: status blokir (beserta alasan), jumlah acara aktif (booking `terkonfirmasi` dan `berlangsung`), serta ketersediaan.

- **Endpoint:** `GET /api/admin/calendar`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`
- **Query Parameters:**
  - `month` (wajib): Format `YYYY-MM`.
  - `category` (opsional): `"dekor"` | `"catering"` | `"wedding"`.

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Data kalender berhasil diambil",
  "data": [
    {
      "date": "2027-01-15",
      "isBlocked": true,
      "blocks": [
        {
          "id": "672e25d045de67ab89012399",
          "category": "dekor",
          "reason": "Maintenance gudang properti"
        }
      ],
      "effectiveEventCounts": {
        "dekor": 1,
        "catering": 0,
        "wedding": 0
      },
      "rawEventCounts": {
        "dekor": 1,
        "catering": 0,
        "wedding": 0
      },
      "availability": {
        "dekor": { "status": "diblokir", "available": false },
        "catering": { "status": "tersedia", "available": true },
        "wedding": { "status": "diblokir", "available": false }
      }
    }
  ]
}
```

---

### 5.2 Membuat Blokir Tanggal (Admin)

Memblokir tanggal tunggal (`date`) atau rentang tanggal (`dateFrom` dan `dateTo`, maks. 31 hari).
Operasi bersifat idempoten: jika suatu tanggal sudah diblokir, tanggal tersebut dilaporkan sebagai `skipped` tanpa membuat duplikasi ataupun menimbulkan error database.

- **Endpoint:** `POST /api/admin/calendar/blocks`
- **Hak Akses:** Khusus Admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <admin_token>`

#### Request Body (Tanggal Tunggal)
```json
{
  "category": "dekor",
  "date": "2027-02-14",
  "reason": "Acara internal vendor"
}
```

#### Request Body (Rentang Tanggal)
```json
{
  "category": "catering",
  "dateFrom": "2027-02-10",
  "dateTo": "2027-02-12",
  "reason": "Renovasi dapur sentral"
}
```

#### Respons Berhasil (`201 Created`)
```json
{
  "success": true,
  "message": "Proses pemblokiran kalender selesai",
  "data": {
    "created": [
      {
        "id": "672e26e045de67ab89012401",
        "date": "2027-02-10",
        "category": "catering",
        "reason": "Renovasi dapur sentral"
      }
    ],
    "skipped": [
      {
        "date": "2027-02-11",
        "reason": "Sudah diblokir sebelumnya"
      }
    ]
  }
}
```

#### Respons Gagal
- `400 Bad Request`: Tanggal di masa lalu, tanggal tidak valid kalender (mis. `2026-02-30`), atau rentang melebihi 31 hari.

---

### 5.3 Menghapus Blokir Tanggal (Admin)

Membuka kembali tanggal yang sebelumnya diblokir.

- **Endpoint:** `DELETE /api/admin/calendar/blocks/:id`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Blokir tanggal kalender berhasil dihapus"
}
```

---

## 6. Modul Ketersediaan Tanggal Publik (`/api/availability`)

Digunakan pada frontend oleh pelanggan saat memilih tanggal di katalog paket atau formulir pemesanan.

### 6.1 Mengambil Ketersediaan Tanggal Bulanan (Publik)

Mengembalikan ketersediaan tiap tanggal dalam satu bulan untuk kategori yang dipilih (`dekor`, `catering`, atau `wedding`).

- **Endpoint:** `GET /api/availability`
- **Hak Akses:** Publik
- **Query Parameters:**
  - `category` (wajib): `"dekor"` | `"catering"` | `"wedding"`.
  - `month` (wajib): Format `YYYY-MM` (maksimal 24 bulan ke depan dari bulan berjalan).

#### Aturan Bisnis Ketersediaan:
1. **Lewat:** Tanggal sebelum hari ini (WIB) berstatus `"lewat"` (`available: false`).
2. **Diblokir:** Tanggal yang terdapat blokir admin berstatus `"diblokir"` (`available: false`). Untuk kategori `wedding`, tanggal dianggap diblokir bila salah satu dari `wedding`, `dekor`, atau `catering` diblokir.
3. **Penuh:** Tanggal yang jumlah acara aktifnya mencapai `maxEventsPerDay[category]` berstatus `"penuh"` (`available: false`). Acara `wedding` memakan kuota 1 dekor dan 1 catering. Untuk kategori `wedding`, tanggal dianggap penuh bila kuota wedding, dekor, atau catering telah tercapai.
4. **Tersedia:** Tanggal yang tidak lewat, tidak diblokir, dan belum penuh berstatus `"tersedia"` (`available: true`).
5. **Slot Booking:** Pesanan berstatus `menunggu_dp` dan `menunggu_verifikasi` **tidak menahan slot**. Slot hanya dihitung saat pesanan berstatus `terkonfirmasi` atau `berlangsung`.

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Ketersediaan tanggal berhasil diambil",
  "data": [
    {
      "date": "2027-01-01",
      "status": "tersedia",
      "available": true
    },
    {
      "date": "2027-01-02",
      "status": "diblokir",
      "available": false
    },
    {
      "date": "2027-01-03",
      "status": "penuh",
      "available": false
    }
  ]
}
```

---

## 7. Modul Pemesanan Pelanggan (`/api/bookings`)

Modul ini digunakan oleh pelanggan terdaftar untuk membuat pemesanan layanan, melihat riwayat pemesanan miliknya, dan melihat detail pemesanan.

### 7.1 Membuat Pesanan Baru (Pelanggan)

Membuat booking baru oleh pelanggan. Status awal pesanan adalah `menunggu_dp` dengan status pembayaran `belum_dp`.
Pesanan pada status ini **belum menahan slot tanggal** sebelum pembayaran DP disetujui.

- **Endpoint:** `POST /api/bookings`
- **Hak Akses:** Pelanggan Terautentikasi (`customer` role)
- **Headers:** `Authorization: Bearer <customer_token>`, `Content-Type: application/json`
- **Rate Limit:** 10 permintaan per 15 menit per IP.

#### Request Body
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `packageId` | String | Ya | ID paket MongoDB yang valid dan aktif |
| `eventDate` | String | Ya | Format `YYYY-MM-DD` (tidak boleh tanggal lewat, diblokir, atau penuh) |
| `eventName` | String | Ya | Nama acara (3 - 120 karakter) |
| `location` | String | Ya | Alamat / lokasi acara (3 - 300 karakter) |
| `contactName` | String | Tidak | Nama kontak alternatif (default nama akun) |
| `contactPhone` | String | Tidak | Nomor WA kontak (dinormalisasi ke format `628...`) |
| `contactEmail` | String | Tidak | Email kontak alternatif |
| `guestCount` | Number | Kondisional | Wajib untuk kategori `catering` dan `wedding` (integer >= 1) |
| `notes` | String | Tidak | Catatan tambahan (maks 1000 karakter) |
| `formData` | Object | Tidak | Data kustom per kategori (Zod strict) |

##### Ketentuan `formData`:
- `dekor`: `{ themeColor?, customRequest? }`
- `catering`: `{ menuSelection?, dietaryRestrictions?, serviceType? }` (`serviceType`: `'buffet' \| 'box' \| 'stall' \| 'custom'`)
- `wedding`: `{ brideName?, groomName?, venueType? }` (`venueType`: `'indoor' \| 'outdoor' \| 'semi-outdoor'`)

```json
{
  "packageId": "672e12ab34cd56ef78905678",
  "eventDate": "2027-02-14",
  "eventName": "Akad & Resepsi Pernikahan",
  "location": "Gedung Serbaguna Kalila, Jakarta",
  "guestCount": 300,
  "notes": "Harap sediakan karpet merah di lorong utama",
  "formData": {
    "brideName": "Siti Nurhaliza",
    "groomName": "Ahmad Dani",
    "venueType": "indoor"
  }
}
```

#### Respons Berhasil (`201 Created`)
```json
{
  "success": true,
  "message": "Pesanan berhasil dibuat. Silakan lakukan pembayaran DP sebelum batas waktu.",
  "data": {
    "_id": "673012ab34cd56ef78909999",
    "bookingNumber": "KL20270214-A8K2",
    "status": "menunggu_dp",
    "paymentStatus": "belum_dp",
    "eventDate": "2027-02-14",
    "eventName": "Akad & Resepsi Pernikahan",
    "location": "Gedung Serbaguna Kalila, Jakarta",
    "category": "wedding",
    "guestCount": 300,
    "dpAmount": 1000000,
    "packageSnapshot": {
      "name": "Paket Wedding Ruby Luxury",
      "price": 45000000,
      "category": "wedding"
    },
    "expiresAt": "2026-11-12T02:00:00.000Z",
    "createdAt": "2026-11-11T02:00:00.000Z"
  }
}
```

#### Respons Gagal
- `400 Bad Request`: Format tidak valid, tanggal lampau, kategori catering/wedding tanpa guestCount, atau key formData asing.
- `401 Unauthorized`: Token tidak disertakan atau tidak valid.
- `403 Forbidden`: Pengguna memiliki role `admin`.
- `404 Not Found`: Paket tidak ditemukan atau nonaktif.
- `409 Conflict`: Tanggal sudah penuh/diblokir, atau pemesan sudah memiliki pesanan aktif untuk paket dan tanggal yang sama.

---

### 7.2 Daftar Riwayat Pesanan Saya (Pelanggan)

Mengambil daftar pesanan milik pelanggan yang sedang login. Data sensitif admin (seperti `refundNote` dan detail admin di `statusHistory`) otomatis disanitasi.

- **Endpoint:** `GET /api/bookings/me`
- **Hak Akses:** Pelanggan Terautentikasi
- **Headers:** `Authorization: Bearer <customer_token>`
- **Query Parameters:**
  - `status` (opsional): Filter status (`menunggu_dp`, `menunggu_verifikasi`, `terkonfirmasi`, `berlangsung`, `selesai`, `dibatalkan`).
  - `page` (opsional, default 1): Halaman data.
  - `limit` (opsional, default 10, maks 50): Jumlah item per halaman.

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Daftar pesanan berhasil diambil",
  "data": {
    "items": [
      {
        "_id": "673012ab34cd56ef78909999",
        "bookingNumber": "KL20270214-A8K2",
        "category": "wedding",
        "eventDate": "2027-02-14",
        "eventName": "Akad & Resepsi Pernikahan",
        "location": "Gedung Serbaguna Kalila, Jakarta",
        "status": "menunggu_dp",
        "paymentStatus": "belum_dp",
        "dpAmount": 1000000,
        "packageSnapshot": {
          "name": "Paket Wedding Ruby Luxury",
          "price": 45000000,
          "category": "wedding"
        },
        "expiresAt": "2026-11-12T02:00:00.000Z",
        "createdAt": "2026-11-11T02:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 7.3 Detail Pesanan Saya (Pelanggan)

Mengambil detail lengkap satu pesanan milik pelanggan yang sedang login.

- **Endpoint:** `GET /api/bookings/:id`
- **Hak Akses:** Pelanggan Terautentikasi (khusus pemilik pesanan)
- **Headers:** `Authorization: Bearer <customer_token>`

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Detail pesanan berhasil diambil",
  "data": {
    "_id": "673012ab34cd56ef78909999",
    "bookingNumber": "KL20270214-A8K2",
    "category": "wedding",
    "eventDate": "2027-02-14",
    "eventName": "Akad & Resepsi Pernikahan",
    "location": "Gedung Serbaguna Kalila, Jakarta",
    "status": "menunggu_dp",
    "paymentStatus": "belum_dp",
    "dpAmount": 1000000,
    "packageSnapshot": {
      "name": "Paket Wedding Ruby Luxury",
      "price": 45000000,
      "category": "wedding"
    },
    "guestCount": 300,
    "formData": {
      "brideName": "Siti Nurhaliza",
      "groomName": "Ahmad Dani",
      "venueType": "indoor"
    },
    "statusHistory": [
      {
        "status": "menunggu_dp",
        "at": "2026-11-11T02:00:00.000Z",
        "note": "Pesanan dibuat oleh pelanggan"
      }
    ],
    "expiresAt": "2026-11-12T02:00:00.000Z",
    "createdAt": "2026-11-11T02:00:00.000Z"
  }
}
```

#### Respons Gagal
- `404 Not Found`: Pesanan tidak ditemukan atau milik pelanggan lain (akses dicegah).

---

## 8. Modul Manajemen Pesanan Admin (`/api/admin/bookings`)

Modul ini digunakan oleh admin untuk mengelola semua pesanan, membuat pesanan manual/offline, memperbarui status pesanan, dan mencatat pelunasan pembayaran.

### 8.1 Daftar Pesanan (Admin)

Mengambil seluruh daftar pesanan dengan filter fleksibel, pencarian aman, dan pengurutan.

- **Endpoint:** `GET /api/admin/bookings`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`
- **Query Parameters:**
  - `category` (opsional): Filter kategori (`dekor`, `catering`, `wedding`).
  - `status` (opsional): Filter status pesanan.
  - `paymentStatus` (opsional): Filter status pembayaran.
  - `source` (opsional): `website` atau `manual`.
  - `dateFrom` & `dateTo` (opsional): Rentang tanggal acara `YYYY-MM-DD`.
  - `q` (opsional): Pencarian teks bebas (nomor booking, nama acara, nama pelanggan, no telepon pelanggan; aman dari regex injection).
  - `sort` (opsional, default `terbaru`): `terbaru`, `terlama`, `tanggal_acara_asc`, `tanggal_acara_desc`.
  - `page` (opsional, default 1) & `limit` (opsional, default 10, maks 100).

---

### 8.2 Detail Lengkap Pesanan (Admin)

Mengambil data pesanan secara utuh, termasuk data pelanggan, riwayat status, dan seluruh riwayat pembayaran (`Payment`).

- **Endpoint:** `GET /api/admin/bookings/:id`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`

---

### 8.3 Pembaruan Status Pesanan (Admin)

Memperbarui status operasional pesanan berdasarkan aturan transisi status yang ketat. Dilakukan secara atomik dengan proteksi konflik konkuren.

- **Endpoint:** `PATCH /api/admin/bookings/:id/status`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`, `Content-Type: application/json`

#### Aturan Transisi Status yang Diizinkan:
- `menunggu_dp` -> `dibatalkan`
- `menunggu_verifikasi` -> `dibatalkan`
- `terkonfirmasi` -> `berlangsung` atau `dibatalkan`
- `berlangsung` -> `selesai` atau `dibatalkan`
- *Catatan:* Transisi `menunggu_dp`/`menunggu_verifikasi` -> `terkonfirmasi` HANYA dapat dilakukan melalui verifikasi pembayaran DP atau pembuatan pesanan manual dengan `dpPaid: true`.

#### Request Body
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `status` | String | Ya | Status tujuan yang valid |
| `reason` | String | Kondisional | Wajib jika status tujuan adalah `dibatalkan` (minimal 5 karakter) |
| `refundNote` | String | Tidak | Catatan pengembalian dana manual jika dibatalkan setelah DP dibayar |

```json
{
  "status": "berlangsung"
}
```

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Status pesanan berhasil diubah menjadi berlangsung",
  "data": { ... }
}
```

#### Respons Gagal
- `400 Bad Request`: Transisi status tidak diizinkan, atau pembatalan tanpa alasan (`reason`).
- `409 Conflict`: Status pesanan telah diubah bersamaan oleh admin lain.

---

### 8.4 Pembuatan Pesanan Manual / Offline (Admin)

Digunakan admin untuk mencatat pesanan yang datang via WhatsApp, telepon, atau langsung ke kantor.

- **Endpoint:** `POST /api/admin/bookings/manual`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`, `Content-Type: application/json`

#### Opsi Pembayaran DP (`dpPaid`):
1. **`dpPaid: false`**: Pesanan disimpan dengan status `menunggu_dp` dan `paymentStatus: belum_dp`. Tidak mengunci slot tanggal. Pelanggan dapat membayar lewat transfer/QRIS dalam batas waktu.
2. **`dpPaid: true`**: Dijalankan di dalam MongoDB Transaction dengan **SlotLock**. Mengunci slot tanggal secara atomik. Jika kuota penuh atau diblokir, transaksi di-rollback dan mengembalikan `409 Conflict`. Jika berhasil, status langsung `terkonfirmasi`, `paymentStatus: dp_dibayar`, dan record `Payment` approved langsung dibuat otomatis.

#### Fitur Khusus Catering Custom:
Admin dapat membuat pesanan catering tanpa `packageId` dengan menentukan nama dan estimasi harga manual pada `packageSnapshot`. Untuk kategori `dekor` dan `wedding`, wajib memilih paket aktif yang terdaftar.

#### Request Body Contoh (dpPaid = true):
```json
{
  "customer": {
    "name": "Bapak Irwan Santoso",
    "phone": "081234567890",
    "email": "irwan@example.com"
  },
  "packageId": "672e12ab34cd56ef78905678",
  "eventDate": "2027-03-20",
  "eventName": "Resepsi Pernikahan Irwan & Maya",
  "location": "Hotel Grand Kalila Ballroom",
  "guestCount": 500,
  "dpPaid": true,
  "dpMethod": "transfer",
  "dpNote": "DP ditransfer ke rekening BCA Kalila"
}
```

---

### 8.5 Pencatatan Pelunasan Pembayaran (Admin)

Mencatat pelunasan sisa pembayaran setelah DP terbayar (biasanya dilakukan sebelum atau sesudah acara selesai).

- **Endpoint:** `PATCH /api/admin/bookings/:id/settlement`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`, `Content-Type: application/json`

#### Syarat Pencatatan:
- Pesanan harus memiliki `paymentStatus: 'dp_dibayar'`.
- Status operasional pesanan harus `terkonfirmasi`, `berlangsung`, atau `selesai`.
- Idempoten: Pesanan yang sudah `lunas` akan ditolak dengan `409 Conflict`.

#### Request Body
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `amount` | Number | Ya | Nominal pelunasan (integer >= 0) |
| `method` | String | Ya | `"transfer"` \| `"qris"` \| `"tunai"` \| `"lainnya"` |
| `paidAt` | String / Date | Tidak | Tanggal & waktu pembayaran (default waktu saat ini) |
| `note` | String | Tidak | Catatan pelunasan |

```json
{
  "amount": 44000000,
  "method": "transfer",
  "note": "Pelunasan via transfer bank Mandiri"
}
```

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Pelunasan pesanan berhasil dicatat",
  "data": {
    "booking": {
      "_id": "673012ab34cd56ef78909999",
      "paymentStatus": "lunas"
    },
    "payment": {
      "_id": "673012ab34cd56ef78908888",
      "type": "pelunasan",
      "amount": 44000000,
      "method": "transfer",
      "status": "approved",
      "source": "manual"
    }
  }
}
```

---

### 8.6 Mengubah Total Harga Pesanan (Admin)

Memperbarui total harga pesanan sebelum lunas (misal ada penambahan request dekorasi atau menu).

- **Endpoint:** `PATCH /api/admin/bookings/:id/total`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`, `Content-Type: application/json`

#### Request Body
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `totalPrice` | Number | Ya | Total harga baru (integer >= dpAmount pesanan) |
| `reason` | String | Tidak | Alasan perubahan harga |

```json
{
  "totalPrice": 47000000,
  "reason": "Penambahan dekor lorong karpet merah"
}
```

---

### 8.7 Mencatat Pengembalian Dana / Refund (Admin)

Mencatat pengembalian dana manual untuk pesanan yang telah dibatalkan.

- **Endpoint:** `POST /api/admin/bookings/:id/refund`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`, `Content-Type: application/json`

#### Request Body
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `amount` | Number | Ya | Nominal pengembalian (integer > 0, tidak boleh melebihi sisa dana masuk) |
| `method` | String | Ya | `"transfer"` \| `"qris"` \| `"tunai"` \| `"lainnya"` |
| `paidAt` | String / Date | Tidak | Waktu pengembalian dana |
| `note` | String | Tidak | Catatan transfer pengembalian |

```json
{
  "amount": 1000000,
  "method": "transfer",
  "note": "Refund transfer BCA customer"
}
```

---

## 9. Modul Pembayaran Pelanggan (`/api/bookings/:id/payment-*` & `/api/payments`)

### 9.1 Informasi Pembayaran DP (Pelanggan)

Mengambil rekening bank dan QRIS aktif untuk membayar DP pesanan yang sedang menunggu pembayaran.

- **Endpoint:** `GET /api/bookings/:id/payment-info`
- **Hak Akses:** Pelanggan Terautentikasi (khusus pemilik pesanan)
- **Headers:** `Authorization: Bearer <customer_token>`

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Informasi pembayaran berhasil diambil",
  "data": {
    "bookingNumber": "KL20270214-A8K2",
    "dpAmount": 1000000,
    "expiresAt": "2026-11-12T02:00:00.000Z",
    "bankName": "BCA",
    "accountNumber": "1234567890",
    "accountHolder": "Kalila Wedding Organizer",
    "qrisImage": "https://res.cloudinary.com/kalila/image/upload/settings/qris.jpg",
    "remainingAttempts": 3,
    "lastRejectionReason": null
  }
}
```

---

### 9.2 Mengunggah Bukti Transfer DP (Pelanggan)

Mengunggah foto bukti transfer ke penyimpanan privat Cloudinary (`type: authenticated`). URL Cloudinary tidak pernah diberikan ke publik.

- **Endpoint:** `POST /api/bookings/:id/payment-proof`
- **Hak Akses:** Pelanggan Terautentikasi (khusus pemilik pesanan)
- **Headers:** `Authorization: Bearer <customer_token>`, `Content-Type: multipart/form-data`
- **Body:** Form-data dengan key `proof` (satu file gambar JPG, PNG, atau WEBP, maks 5 MB).
- **Rate Limit:** 30 permintaan per 15 menit per IP.

#### Respons Berhasil (`201 Created`)
```json
{
  "success": true,
  "message": "Bukti transfer berhasil diunggah. Menunggu verifikasi admin.",
  "data": {
    "booking": {
      "_id": "673012ab34cd56ef78909999",
      "bookingNumber": "KL20270214-A8K2",
      "status": "menunggu_verifikasi",
      "paymentStatus": "menunggu_verifikasi",
      "proofAttempts": 1
    },
    "payment": {
      "_id": "673012ab34cd56ef78908888",
      "type": "dp",
      "amount": 1000000,
      "status": "pending",
      "attempt": 1,
      "createdAt": "2026-11-11T03:00:00.000Z"
    },
    "whatsapp": {
      "adminWhatsapp": "6281234567890",
      "message": "Halo Kalila Organizer, saya telah mengunggah bukti pembayaran DP untuk pesanan KL20270214-A8K2 (Paket Wedding Ruby Luxury). Mohon untuk diverifikasi."
    }
  }
}
```

---

### 9.3 Mengambil / Streaming Bukti Transfer Privat

Mengambil byte gambar bukti transfer secara aman. Server membaca gambar dari Cloudinary menggunakan URL bertanda tangan berumur pendek dan mem-pipe stream ke klien.

- **Endpoint:** `GET /api/payments/:id/proof`
- **Hak Akses:** Admin atau Pemilik Pesanan Terautentikasi
- **Headers:** `Authorization: Bearer <token>`
- **HTTP Response Headers:**
  - `Content-Type: image/jpeg` (atau png/webp sesuai isi file)
  - `Cache-Control: private, no-store`
  - `X-Content-Type-Options: nosniff`

---

## 10. Modul Verifikasi & Kelola Pembayaran Admin (`/api/admin/payments`)

### 10.1 Daftar Pembayaran Masuk (Admin)

Melihat seluruh pembayaran DP dan pelunasan dengan kalkulasi ketersediaan slot tanggal real-time pada antrean pending.

- **Endpoint:** `GET /api/admin/payments`
- **Hak Akses:** Khusus Admin
- **Query Parameters:**
  - `status`: `"pending"` \| `"approved"` \| `"rejected"` \| `"void"`
  - `type`: `"dp"` \| `"pelunasan"` \| `"pengembalian"`
  - `source`: `"customer"` \| `"manual"`
  - `dateFrom` & `dateTo`: Rentang tanggal `YYYY-MM-DD`
  - `q`: Pencarian teks (nomor pesanan, nama/telepon pelanggan)
  - `sort`: `"terlama"` \| `"terbaru"` (default `"terlama"` untuk status pending agar antrean diproses adil)
  - `page` & `limit`

---

### 10.2 Detail Pembayaran Admin

Melihat detail satu pembayaran, ringkasan pesanan, serta riwayat percobaan unggah bukti sebelumnya.

- **Endpoint:** `GET /api/admin/payments/:id`
- **Hak Akses:** Khusus Admin

---

### 10.3 Menyetujui Pembayaran DP (Admin Approve)

Menyetujui pembayaran DP yang menunggu verifikasi. Sistem menjalankan penguncian slot tanggal atomik (`withSlotLock`). Bila kuota penuh atau tanggal diblokir, persetujuan ditolak (`409 Conflict`) dan status pembayaran tetap `pending`.

- **Endpoint:** `PATCH /api/admin/payments/:id/approve`
- **Hak Akses:** Khusus Admin

---

### 10.4 Menolak Bukti Pembayaran DP (Admin Reject)

Menolak bukti transfer karena alasan tidak valid (misal gambar buram atau palsu). Sistem memperpanjang batas waktu pembayaran di Settings. Bila penolakan mencapai batas maksimal percobaan (`Setting.maxProofAttempts`), pesanan otomatis dibatalkan.

- **Endpoint:** `PATCH /api/admin/payments/:id/reject`
- **Hak Akses:** Khusus Admin
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "reason": "Foto bukti transfer buram dan nominal tidak terlihat"
}
```

---

### 10.5 Void Pembayaran Manual (Admin Void)

Membatalkan (void) pencatatan pembayaran manual bertipe `pelunasan` atau `pengembalian` jika terjadi kesalahan administrasi.

- **Endpoint:** `PATCH /api/admin/payments/:id/void`
- **Hak Akses:** Khusus Admin
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "reason": "Koreksi salah input nominal pelunasan"
}
```

---

## 11. Modul Dashboard Pesanan Admin (`/api/admin/dashboard`)

Modul ini menyediakan ringkasan data operasional pesanan dan grafik pesanan masuk untuk dashboard admin (PRD 5.1). Seluruh perhitungan waktu mengacu pada zona waktu **Asia/Jakarta (WIB, UTC+7)**.

### 11.1 Overview Pesanan (Admin)

Mengambil ringkasan metrik pesanan, antrean verifikasi pembayaran DP, 10 pesanan terbaru, acara terdekat, dan 5 antrean pembayaran terlama dalam satu panggilan efisien.

- **Endpoint:** `GET /api/admin/dashboard/orders-overview`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`
- **Query Parameters:**
  - `recentLimit` (opsional, default 10, min 1, max 20): Jumlah pesanan terbaru yang diambil.
  - `upcomingDays` (opsional, default 30, min 1, max 90): Jangkauan hari ke depan untuk acara terdekat.
  - `upcomingLimit` (opsional, default 10, min 1, max 20): Jumlah acara terdekat yang diambil.

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Overview pesanan dashboard berhasil diambil",
  "data": {
    "summary": {
      "newToday": 3,
      "new7Days": 12,
      "byStatus": {
        "menunggu_dp": 2,
        "menunggu_verifikasi": 3,
        "terkonfirmasi": 8,
        "berlangsung": 1,
        "selesai": 15,
        "dibatalkan": 4
      },
      "upcoming7Days": 4,
      "pendingVerification": {
        "count": 3,
        "oldestWaitingSince": "2026-11-10T14:20:00.000Z"
      }
    },
    "recentOrders": [
      {
        "id": "673012ab34cd56ef78909999",
        "bookingNumber": "KL20270214-A8K2",
        "createdAt": "2026-11-11T03:00:00.000Z",
        "status": "menunggu_dp",
        "paymentStatus": "belum_dp",
        "category": "wedding",
        "packageName": "Paket Wedding Ruby Luxury",
        "customerName": "Budi Santoso",
        "eventDate": "2027-02-14",
        "eventName": "Akad & Resepsi Pernikahan",
        "source": "website"
      }
    ],
    "upcomingEvents": [
      {
        "id": "673012ab34cd56ef78909999",
        "bookingNumber": "KL20270214-A8K2",
        "category": "wedding",
        "packageName": "Paket Wedding Ruby Luxury",
        "customerName": "Budi Santoso",
        "customerPhone": "081234567890",
        "eventDate": "2027-02-14",
        "eventName": "Akad & Resepsi Pernikahan",
        "location": "Gedung Serbaguna Kalila, Jakarta",
        "paymentStatus": "dp_dibayar",
        "daysUntil": 3
      }
    ],
    "pendingPayments": [
      {
        "paymentId": "673012ab34cd56ef78908888",
        "bookingNumber": "KL20270214-A8K2",
        "customerName": "Budi Santoso",
        "category": "wedding",
        "eventDate": "2027-02-14",
        "amount": 1000000,
        "createdAt": "2026-11-10T14:20:00.000Z",
        "attempt": 1
      }
    ]
  }
}
```

---

### 11.2 Grafik Pesanan Masuk (Admin)

Menghasilkan data time-series pesanan masuk per kategori (`dekor`, `catering`, `wedding`) yang dihitung berdasarkan waktu pembuatan (`createdAt`, WIB).

- **Endpoint:** `GET /api/admin/dashboard/orders-chart`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`
- **Query Parameters:**
  - `from` (opsional, format `YYYY-MM-DD`): Tanggal awal (default 30 hari yang lalu).
  - `to` (opsional, format `YYYY-MM-DD`): Tanggal akhir (default hari ini WIB, tidak boleh di masa depan).
  - `groupBy` (opsional, `"day"` \| `"week"` \| `"month"`, default `"day"`): Pengelompokan data (`week` mengelompokkan ke hari Senin awal minggu).
  - `includeCancelled` (opsional, boolean, default `true`): Apakah pesanan berstatus dibatalkan disertakan dalam grafik.

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Data grafik pesanan berhasil diambil",
  "data": {
    "from": "2026-10-12",
    "to": "2026-11-11",
    "groupBy": "day",
    "labels": [
      "2026-10-12",
      "2026-10-13",
      "..."
    ],
    "series": [
      {
        "category": "dekor",
        "data": [1, 0, 2]
      },
      {
        "category": "catering",
        "data": [0, 1, 1]
      },
      {
        "category": "wedding",
        "data": [2, 1, 0]
      }
    ],
    "totals": {
      "dekor": 3,
      "catering": 2,
      "wedding": 3,
      "all": 8
    }
  }
}
```

---

## 12. Modul Portofolio (`/api/portfolios` & `/api/admin/portfolios`)

Modul untuk mengelola portofolio hasil karya Kalila (kategori dekor, catering, dan wedding).

### 12.1 Daftar Portofolio Publik
Mengambil daftar portofolio yang telah dipublikasikan (`isPublished = true`).
- **Endpoint:** `GET /api/portfolios`
- **Hak Akses:** Publik
- **Query Parameters:**
  - `category` (opsional): `"dekor"` | `"catering"` | `"wedding"`
  - `featured` (opsional): `"true"` | `"false"`
  - `q` (opsional): Pencarian teks pada judul atau deskripsi (aman dari regex injection)
  - `page` (opsional, default `1`): Nomor halaman
  - `limit` (opsional, default `12`, maks `50`): Jumlah data per halaman
  - `sort` (opsional, default `"terbaru"`): Whitelist `"terbaru"` | `"terlama"`

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Daftar portofolio berhasil diambil",
  "data": [
    {
      "id": "672e12ab34cd56ef78901234",
      "slug": "pernikahan-megah-rustic-grand",
      "title": "Pernikahan Megah Rustic Grand",
      "category": "dekor",
      "description": "Dekorasi rustic megah di ballroom...",
      "eventDate": "2025-10-15",
      "location": "Grand Ballroom Hotel Mulia",
      "cover": "https://res.cloudinary.com/demo/image/upload/v1/kalila/portfolios/img1.jpg",
      "imageCount": 3,
      "isFeatured": true,
      "createdAt": "2026-11-11T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 1,
    "totalPages": 1
  }
}
```
*Catatan: Respons publik tidak pernah memuat `publicId` Cloudinary.*

---

### 12.2 Detail Portofolio Publik
Mengambil detail portofolio beserta seluruh galeri gambarnya berdasarkan `slug`.
- **Endpoint:** `GET /api/portfolios/:slug`
- **Hak Akses:** Publik

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Detail portofolio berhasil diambil",
  "data": {
    "id": "672e12ab34cd56ef78901234",
    "slug": "pernikahan-megah-rustic-grand",
    "title": "Pernikahan Megah Rustic Grand",
    "category": "dekor",
    "description": "Dekorasi rustic megah di ballroom...",
    "eventDate": "2025-10-15",
    "location": "Grand Ballroom Hotel Mulia",
    "isFeatured": true,
    "images": [
      {
        "_id": "672e12ab34cd56ef78901235",
        "url": "https://res.cloudinary.com/demo/image/upload/v1/kalila/portfolios/img1.jpg"
      }
    ],
    "createdAt": "2026-11-11T08:00:00.000Z",
    "updatedAt": "2026-11-11T08:00:00.000Z"
  }
}
```

---

### 12.3 Daftar Portofolio Admin
Mengambil seluruh portofolio (status draft/published).
- **Endpoint:** `GET /api/admin/portfolios`
- **Hak Akses:** Admin
- **Headers:** `Authorization: Bearer <admin_token>`
- **Query Parameters:** `category`, `isPublished` (`true`/`false`), `isFeatured` (`true`/`false`), `q`, `page` (default 1), `limit` (default 10, maks 100), `sort` (`"terbaru"` | `"terlama"` | `"title_asc"` | `"title_desc"`).

---

### 12.4 Detail Portofolio Admin
- **Endpoint:** `GET /api/admin/portfolios/:id`
- **Hak Akses:** Admin
- **Headers:** `Authorization: Bearer <admin_token>`

---

### 12.5 Buat Portofolio Baru (Admin)
Membuat metadata portofolio baru. Gambar diunggah terpisah via endpoint upload images.
- **Endpoint:** `POST /api/admin/portfolios`
- **Hak Akses:** Admin
- **Headers:** `Authorization: Bearer <admin_token>`, `Content-Type: application/json`

#### Request Body
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `category` | String | Ya | `"dekor"` \| `"catering"` \| `"wedding"` |
| `title` | String | Ya | Judul (3 - 120 karakter) |
| `description` | String | Tidak | Deskripsi (maks 2000 karakter) |
| `eventDate` | String | Tidak | Tanggal acara (`YYYY-MM-DD` kalender valid) |
| `location` | String | Tidak | Lokasi acara (maks 200 karakter) |
| `isPublished` | Boolean | Tidak | Default `true` |
| `isFeatured` | Boolean | Tidak | Default `false` |

---

### 12.6 Ubah Portofolio (Admin)
- **Endpoint:** `PUT /api/admin/portfolios/:id`
- **Hak Akses:** Admin
- **Keterangan:** Jika `title` diubah, slug akan otomatis dibuat ulang. Kategori bebas diubah kapan saja.

---

### 12.7 Ubah Status Publikasi / Featured (Admin)
- **Endpoint:** `PATCH /api/admin/portfolios/:id/status`
- **Hak Akses:** Admin
- **Request Body:** `{ "isPublished"?: boolean, "isFeatured"?: boolean }` (minimal salah satu harus ada).

---

### 12.8 Hapus Portofolio (Admin)
Menghapus dokumen portofolio dan secara otomatis menghapus seluruh gambar terkait di Cloudinary.
- **Endpoint:** `DELETE /api/admin/portfolios/:id`
- **Hak Akses:** Admin

---

### 12.9 Unggah Gambar Portofolio (Admin)
Mengunggah 1 sampai 5 gambar sekaligus ke folder Cloudinary `kalila/portfolios`. Total gambar per portofolio maksimal 12.
- **Endpoint:** `POST /api/admin/portfolios/:id/images`
- **Hak Akses:** Admin
- **Headers:** `Content-Type: multipart/form-data`
- **Body:** Field `images` (1 - 5 file gambar format JPG, PNG, atau WEBP, maks 5 MB per gambar, divalidasi via magic bytes).
- **Aturan:** Jika penyimpanan database gagal, seluruh aset yang baru diunggah di Cloudinary otomatis di-rollback (dihapus).

---

### 12.10 Hapus Satu Gambar Portofolio (Admin)
Menghapus satu gambar dari portofolio dan menghapus asetnya dari Cloudinary.
- **Endpoint:** `DELETE /api/admin/portfolios/:id/images/:imageId`
- **Hak Akses:** Admin

---

### 12.11 Jadikan Sampul Portofolio (Admin)
Memindahkan gambar terpilih menjadi urutan pertama (indeks 0).
- **Endpoint:** `PATCH /api/admin/portfolios/:id/images/:imageId/cover`
- **Hak Akses:** Admin

---

## 13. Modul Kelola User Admin (`/api/admin/users`)

Modul untuk mengelola akun admin/staf Kalila. Semua admin memiliki hak akses yang setara. Data pelanggan tidak dikelola di sini.

> **Kebijakan Password Admin:**
> - Panjang minimal 8 karakter dan maksimal **72 byte UTF-8** (`Buffer.byteLength(password, 'utf8') <= 72`, batas teknis algoritma bcrypt).
> - Minimal 1 huruf (`[a-zA-Z]`) dan minimal 1 angka (`[0-9]`).
> - Tidak boleh sama persis dengan alamat email.
> 
> **Pembatas Konfirmasi Password Admin (In-Memory):**
> Pada endpoint yang memeriksa password admin yang sedang login (`PATCH /api/admin/users/me/password`, `POST /api/admin/users`, `POST /api/admin/users/:id/reset-password`), sistem membatasi percobaan konfirmasi password yang gagal dengan kunci ID admin login. Batas diambil dari `AUTH_CONFIRM_MAX` (default 5 kali) per jendela 15 menit. Melebihi batas menghasilkan `429 Too Many Requests`. Percobaan yang berhasil tidak dihitung. Penyimpanan berbasis in-memory server.

### 13.1 Daftar Akun Admin
Mengambil seluruh akun role `admin`. Akun customer tidak pernah dimuat di endpoint ini.
- **Endpoint:** `GET /api/admin/users`
- **Hak Akses:** Admin
- **Query Parameters:** `isActive` (`true`/`false`), `q` (nama/email), `page` (default 1), `limit` (default 10, maks 100), `sort` (`"terbaru"` | `"terlama"` | `"nama"`).

---

### 13.2 Detail Akun Admin
- **Endpoint:** `GET /api/admin/users/:id`
- **Hak Akses:** Admin
- **Keterangan:** Jika ID adalah milik customer atau tidak ditemukan, menghasilkan `404 Not Found`.

---

### 13.3 Tambah Admin Baru
- **Endpoint:** `POST /api/admin/users`
- **Hak Akses:** Admin
- **Headers:** `Content-Type: application/json`

#### Request Body
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `name` | String | Ya | Nama lengkap admin (2 - 100 karakter) |
| `email` | String | Ya | Email unik (case-insensitive, duplikat `409`) |
| `phone` | String | Tidak | Nomor telepon (dinormalisasi format 628...) |
| `password` | String | Ya | Password memenuhi kebijakan |
| `confirmPassword` | String | Ya | Password admin yang sedang login (salah `403`) |

*Catatan: Field `role` tidak diizinkan dikirim dari klien dan ditolak `400 Bad Request`.*

---

### 13.4 Ubah Data Admin
Mengubah profil `name`, `email`, atau `phone` admin.
- **Endpoint:** `PUT /api/admin/users/:id`
- **Hak Akses:** Admin
- **Keterangan:** Field `role`, `password`, dan `isActive` dilarang dikirim melalui endpoint ini (`400 Bad Request`).

---

### 13.5 Ubah Status Aktif/Nonaktif Admin
- **Endpoint:** `PATCH /api/admin/users/:id/status`
- **Hak Akses:** Admin
- **Request Body:** `{ "isActive": boolean }`
- **Aturan Bisnis & Keamanan:**
  - Admin dilarang menonaktifkan akun miliknya sendiri (`400 Bad Request`).
  - Sistem wajib memiliki minimal 1 admin aktif; menonaktifkan admin aktif terakhir ditolak (`409 Conflict`).
  - Dilindungi serialisasi transaksi MongoDB (`AdminLock`) sehingga aman dari race condition ketika dua admin saling menonaktifkan bersamaan.
  - Akun yang dinonaktifkan ditolak login (`403 Forbidden`) dan seluruh token yang beredar langsung tidak dapat digunakan (`401 Unauthorized`).

---

### 13.6 Ganti Password Akun Sendiri
- **Endpoint:** `PATCH /api/admin/users/me/password`
- **Hak Akses:** Admin
- **Request Body:**
  ```json
  {
    "currentPassword": "PasswordLama123!",
    "newPassword": "PasswordBaru123!"
  }
  ```
- **Keterangan:** Seluruh token lama langsung tidak berlaku setelah password berhasil diubah (`401 Unauthorized`).

---

### 13.7 Reset Password Admin Lain
- **Endpoint:** `POST /api/admin/users/:id/reset-password`
- **Hak Akses:** Admin
- **Request Body:**
  ```json
  {
    "newPassword": "PasswordBaruAdminTarget123!",
    "confirmPassword": "PasswordAdminYangSedangLogin!"
  }
  ```
- **Keterangan:** Tidak dapat digunakan untuk mereset akun sendiri (gunakan `/me/password`) atau akun customer (`404`). Seluruh token lama admin target otomatis dibatalkan.

---

## 14. Modul Notifikasi Email & Outbox (`/api/admin/emails`)

Mengelola antrean email transaksional keluar (*Transactional Email Outbox*) dengan proteksi idempotensi, retry backoff exponential, klaim atomik, serta pembersihan berkas otomatis (TTL). Seluruh endpoint pada modul ini membutuhkan token JWT dengan role `admin`.

### 14.1 Daftar Antrean Email (Outbox)
- **Endpoint:** `GET /api/admin/emails`
- **Hak Akses:** Admin
- **Query Parameters:**
  - `status`: `pending` | `sending` | `sent` | `failed` | `skipped` (opsional)
  - `type`: `booking_created_admin` | `booking_created_owner` | `payment_proof_admin` | `booking_confirmed_customer` (opsional)
  - `q`: Pencarian teks pada alamat penerima, subject, atau nomor pesanan (opsional, dilindungi sanitasi regex)
  - `page`: Nomor halaman (default: `1`)
  - `limit`: Jumlah per halaman (default: `10`, maksimal: `100`)
  - `sort`: `terbaru` | `terlama` (default: `terbaru`)
- **Keamanan:** Konten HTML tidak disertakan pada respons daftar; alamat email disamarkan sebagian (*masked*).
- **Respons Berhasil (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Daftar antrean email berhasil diambil",
    "data": {
      "items": [
        {
          "_id": "672f00000000000000000001",
          "type": "booking_created_admin",
          "to": "a***1@kalila.com",
          "originalTo": null,
          "subject": "Pesanan baru KLA-20261112-001 - Dekor - 12 Nov 2026",
          "status": "sent",
          "attempts": 1,
          "lastError": null,
          "provider": "resend",
          "sentAt": "2026-11-12T08:00:05.000Z",
          "purgeAt": "2026-12-12T08:00:05.000Z",
          "createdAt": "2026-11-12T08:00:00.000Z",
          "booking": {
            "_id": "672f000000000000000000aa",
            "bookingNumber": "KLA-20261112-001"
          }
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "totalPages": 1
      }
    }
  }
  ```

---

### 14.2 Detail Email Outbox
- **Endpoint:** `GET /api/admin/emails/:id`
- **Hak Akses:** Admin
- **Keamanan:** Mengembalikan metadata lengkap dan versi teks polos (`text`); konten HTML dihilangkan dari payload respons demi keamanan.
- **Respons Berhasil (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Detail email outbox berhasil diambil",
    "data": {
      "_id": "672f00000000000000000001",
      "type": "booking_created_admin",
      "dedupeKey": "booking-created:672f000000000000000000aa:admin1@kalila.com",
      "to": "a***1@kalila.com",
      "originalTo": null,
      "subject": "Pesanan baru KLA-20261112-001 - Dekor - 12 Nov 2026",
      "text": "PESANAN BARU MASUK DARI WEBSITE...",
      "replyTo": "kontak@kalila.com",
      "status": "sent",
      "attempts": 1,
      "nextAttemptAt": "2026-11-12T08:00:00.000Z",
      "lastError": null,
      "provider": "resend",
      "providerMessageId": "msg_abc123",
      "sentAt": "2026-11-12T08:00:05.000Z",
      "purgeAt": "2026-12-12T08:00:05.000Z",
      "createdAt": "2026-11-12T08:00:00.000Z",
      "updatedAt": "2026-11-12T08:00:05.000Z",
      "booking": { ... }
    }
  }
  ```

---

### 14.3 Coba Ulang Email Gagal (Retry)
- **Endpoint:** `POST /api/admin/emails/:id/retry`
- **Hak Akses:** Admin
- **Aturan:** Hanya item berstatus `failed` yang diizinkan untuk di-retry. Status diubah kembali menjadi `pending`, hitungan `attempts` di-reset ke 0, dan `nextAttemptAt` diatur ke waktu sekarang. Jika email belum berstatus `failed`, endpoint mengembalikan `409 Conflict`.
- **Respons Berhasil (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Email berhasil dijadwalkan ulang untuk dikirim",
    "data": {
      "_id": "672f00000000000000000001",
      "status": "pending",
      "attempts": 0,
      "nextAttemptAt": "2026-11-12T09:30:00.000Z"
    }
  }
  ```

---

### 14.4 Status Konfigurasi & Kuota Email
- **Endpoint:** `GET /api/admin/emails/status`
- **Hak Akses:** Admin
- **Keamanan:** Tidak pernah membocorkan rahasia (`RESEND_API_KEY`) atau alamat email target redirect.
- **Respons Berhasil (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Status konfigurasi email berhasil diambil",
    "data": {
      "provider": "resend",
      "mode": "sandbox",
      "ready": true,
      "reason": null,
      "emailFromDomain": "resend.dev",
      "isRedirectActive": true,
      "sentLast24Hours": 14,
      "dailyLimit": 90,
      "pendingCount": 2,
      "failedCount": 0
    }
  }
  ```

---

### 14.5 Kirim Email Pengujian
- **Endpoint:** `POST /api/admin/emails/test`
- **Hak Akses:** Admin (Dilindungi rate limiter: maksimal 5 kali pengiriman per jam per admin).
- **Aturan:**
  - Email pengujian **hanya** dikirim ke alamat email akun admin yang sedang login (`req.user.email`). Body request tidak menerima input alamat email untuk mencegah penyalahgunaan relay.
  - Mematuhi aturan `EMAIL_REDIRECT_TO` bila aktif.
  - Pada mode sandbox (domain `resend.dev`), respons mengingatkan bahwa pengujian hanya akan sampai ke email akun pemilik Resend.
- **Respons Berhasil (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Email pengujian berhasil dikirim.",
    "data": {
      "provider": "resend",
      "to": "a***n@kalila.com",
      "messageId": "msg_test_12345",
      "mode": "production"
    }
  }
  ```

---

## 15. Variabel Lingkungan & Panduan Setup Resend

### 15.1 Variabel Lingkungan Email
Konfigurasikan variabel berikut pada file `.env` di backend:

| Variabel | Tipe / Nilai | Keterangan |
|---|---|---|
| `EMAIL_PROVIDER` | `resend` \| `log` \| `memory` | Provider pengiriman. Default: `log`. Pada `NODE_ENV=production`, hanya `resend` yang diizinkan. |
| `RESEND_API_KEY` | String (contoh: `re_123...`) | API Key dari dashboard Resend. Jangan pernah dicetak di log. |
| `EMAIL_FROM` | String | Format nama dan email pengirim, misal: `Kalila Organizer <noreply@domain.com>` |
| `EMAIL_REPLY_TO` | String (opsional) | Alamat balasan default bila pelanggan menekan reply. |
| `EMAIL_REDIRECT_TO` | String (opsional) | Alamat pengalihan semua email keluar (hanya untuk mode uji/pengembangan). Bila diisi, subject otomatis diawali `[UJI]`. |
| `EMAIL_DAILY_LIMIT` | Number (default: `90`) | Batas maksimal email terkirim dalam 24 jam terakhir (paket gratis Resend: 100/hari). |
| `EMAIL_BATCH_PER_TICK`| Number (default: `5`) | Jumlah maksimal antrean pending yang diproses per menit oleh job cron. |
| `APP_PUBLIC_URL` | URL | URL dasar web publik pelanggan (contoh: `https://kalilaorganizer.com`). |
| `APP_ADMIN_URL` | URL | URL dasar web admin (contoh: `https://kalilaorganizer.com/admin`). |

> [!NOTE]
> **Catatan Penyelarasan Frontend:**
> Pola URL tautan email yang dikonfigurasi pada `src/config/emailLinks.js` (`/orders/:id`, `/payments`) adalah asumsi awal dan wajib diselaraskan dengan struktur rute aplikasi Frontend Vue saat integrasi tampilan email dilakukan.

---

### 15.2 Panduan Dua Fase Setup Resend

#### Fase A: Sebelum Domain Kalila Ada (Pengembangan & Uji Coba)
1. **Opsi 1 (Disarankan untuk dev lokal):** Atur `EMAIL_PROVIDER=log`. Semua notifikasi email outbox diproses secara instan dan dicatat ringkasannya ke konsol server tanpa memakan kuota Resend.
2. **Opsi 2 (Uji coba kirim nyata Resend):**
   - Buat akun gratis di [resend.com](https://resend.com) dan buat API Key.
   - Atur `.env`:
     ```env
     EMAIL_PROVIDER=resend
     RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
     EMAIL_FROM=Kalila Organizer <onboarding@resend.dev>
     EMAIL_REDIRECT_TO=email_akun_resend_anda@gmail.com
     ```
   - *Penting:* Pada mode sandbox (`resend.dev`), Resend **hanya** mengizinkan pengiriman ke alamat email akun terdaftar Anda. Pengalihan via `EMAIL_REDIRECT_TO` menjamin tidak ada error 403 saat simulasi pengiriman ke pelanggan/admin lain.

#### Fase B: Setelah Domain Kalila Ada (Produksi)
1. Buka dashboard Resend > **Domains** > **Add Domain** (masukkan domain Kalila, misal `kalilaorganizer.com`).
2. Masuk ke DNS Manager domain Anda (Cloudflare, cPanel, dll.) dan salin catatan DNS yang diberikan oleh Resend:
   - Catatan **SPF** (TXT)
   - Catatan **DKIM** (CNAME / TXT)
3. Tekan **Verify** di dashboard Resend hingga status domain berubah menjadi **Verified**.
4. Perbarui variabel `.env` di server produksi:
   ```env
   NODE_ENV=production
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=Kalila Wedding & Organizer <noreply@kalilaorganizer.com>
   EMAIL_REPLY_TO=kontak@kalilaorganizer.com
   EMAIL_REDIRECT_TO=
   ```
   *(Pastikan `EMAIL_REDIRECT_TO` dihapus/dikosongkan agar email benar-benar terkirim ke masing-masing pelanggan, admin, dan owner).*
5. Buka dashboard admin dan uji coba koneksi melalui tombol uji di menu pengaturan email atau `POST /api/admin/emails/test`.






