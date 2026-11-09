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
- `401 Unauthorized`: Email atau password salah.
- `403 Forbidden`: Akun dinonaktifkan oleh admin.

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
