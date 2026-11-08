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

## 2. Modul Paket Layanan (`/api/packages`)

Modul ini mengelola katalog paket untuk tiga kategori: `dekor`, `catering`, dan `wedding`.

### 2.1 Mendapatkan Daftar Paket

Mengambil katalog paket dengan dukungan pencarian teks, filter kategori, status aktif, urutan, dan pagination.

- **Endpoint:** `GET /api/packages`
- **Hak Akses:** Publik (Admin dapat menyertakan token untuk memfilter paket nonaktif)
- **Headers:** `Authorization: Bearer <token>` *(opsional)*

#### Query Parameters
| Parameter | Tipe | Default | Keterangan |
|---|---|---|---|
| `category` | String | - | Filter kategori: `dekor`, `catering`, atau `wedding` |
| `search` | String | - | Pencarian nama atau deskripsi paket |
| `isActive` | String | `true` | Untuk admin: `true`, `false`, atau `all`. Publik selalu `true` |
| `page` | Integer | `1` | Nomor halaman data |
| `limit` | Integer | `10` | Jumlah data per halaman (maksimal 100) |
| `sort` | String | `newest` | Urutan: `newest`, `oldest`, `cheapest`, `expensive`, `name_asc`, `name_desc` |

#### Contoh Request
```http
GET /api/packages?category=dekor&sort=cheapest&page=1&limit=10
```

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Daftar paket berhasil diambil",
  "data": {
    "packages": [
      {
        "_id": "672e19c045de67ab89012345",
        "name": "Paket Dekor Rustic Gold",
        "category": "dekor",
        "price": 7500000,
        "description": "Dekorasi panggung rustic modern elegan dengan bunga segar.",
        "packageItems": [
          "Backdrop 6x3m",
          "Standing Flowers 4 pcs",
          "Mini Garden",
          "Karpet Panggung"
        ],
        "images": [
          "https://res.cloudinary.com/kalila/image/upload/v1234/rustic-gold.jpg"
        ],
        "decorWidth": 6,
        "isActive": true,
        "createdAt": "2026-11-08T14:00:00.000Z",
        "updatedAt": "2026-11-08T14:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 12,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
}
```

---

### 2.2 Mendapatkan Detail Paket

Mengambil informasi rincian satu paket berdasarkan ID.

- **Endpoint:** `GET /api/packages/:id`
- **Hak Akses:** Publik (Admin dapat melihat paket nonaktif)
- **Headers:** `Authorization: Bearer <token>` *(opsional)*

#### Parameters
- **Path Parameter:** `id` (MongoDB ObjectId dari paket)

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Detail paket berhasil diambil",
  "data": {
    "package": {
      "_id": "672e19c045de67ab89012345",
      "name": "Paket Dekor Rustic Gold",
      "category": "dekor",
      "price": 7500000,
      "description": "Dekorasi panggung rustic modern elegan dengan bunga segar.",
      "packageItems": [
        "Backdrop 6x3m",
        "Standing Flowers 4 pcs",
        "Mini Garden",
        "Karpet Panggung"
      ],
      "images": [
        "https://res.cloudinary.com/kalila/image/upload/v1234/rustic-gold.jpg"
      ],
      "decorWidth": 6,
      "isActive": true,
      "createdAt": "2026-11-08T14:00:00.000Z",
      "updatedAt": "2026-11-08T14:00:00.000Z"
    }
  }
}
```

#### Respons Gagal
- `400 Bad Request`: Format ID MongoDB tidak valid.
- `404 Not Found`: Paket tidak ditemukan atau sudah dinonaktifkan.

---

### 2.3 Membuat Paket Baru

Menambahkan paket layanan baru ke dalam sistem.

- **Endpoint:** `POST /api/packages`
- **Hak Akses:** Khusus Admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <admin_token>`

#### Request Body
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `name` | String | Ya | Nama paket (min. 2 karakter) |
| `category` | String | Ya | Salah satu dari: `dekor`, `catering`, `wedding` |
| `price` | Number | Ya | Harga paket dalam Rupiah (>= 0) |
| `description` | String | Tidak | Deskripsi lengkap mengenai paket |
| `packageItems` | Array of String | Tidak | Rincian item yang didapat |
| `images` | Array of String | Tidak | Daftar URL foto paket |
| `decorWidth` | Number | **Khusus Dekor** | Lebar dekor (dalam meter) sebagai batas kanvas Self Design |
| `cateringDetails` | Object | Tidak | Informasi tambahan catering (`minOrder`, `menuType`, `notes`) |
| `weddingDetails` | Object | Tidak | Informasi tambahan wedding (`guestCapacity`, `includedServices`, `notes`) |
| `isActive` | Boolean | Tidak | Status ketersediaan paket (default: `true`) |

#### Contoh Request (Kategori Dekor)
```json
{
  "name": "Paket Dekor Rustic Gold",
  "category": "dekor",
  "price": 7500000,
  "description": "Dekorasi pelaminan elegan bertema rustic modern.",
  "packageItems": [
    "Backdrop pelaminan 6x3m",
    "Standing flower 4 buah",
    "Mini garden panggung",
    "Lighting set backdrop",
    "Karpet jalan & panggung"
  ],
  "decorWidth": 6,
  "images": []
}
```

#### Contoh Request (Kategori Catering)
```json
{
  "name": "Paket Buffet Nusantara Deluxe",
  "category": "catering",
  "price": 65000,
  "description": "Menu prasmanan lengkap masakan nusantara pilihan chef.",
  "packageItems": [
    "Nasi Putih",
    "Ayam Bakar Madu",
    "Daging Sapi Rendang",
    "Sup Kimlo",
    "Puding & Buah Segar"
  ],
  "cateringDetails": {
    "minOrder": 100,
    "menuType": "Buffet Prasmanan",
    "notes": "Termasuk alat makan dan staf servis"
  }
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
      "name": "Paket Dekor Rustic Gold",
      "category": "dekor",
      "price": 7500000,
      "description": "Dekorasi pelaminan elegan bertema rustic modern.",
      "packageItems": [
        "Backdrop pelaminan 6x3m",
        "Standing flower 4 buah",
        "Mini garden panggung"
      ],
      "decorWidth": 6,
      "images": [],
      "isActive": true,
      "createdAt": "2026-11-08T14:10:00.000Z",
      "updatedAt": "2026-11-08T14:10:00.000Z"
    }
  }
}
```

#### Respons Gagal
- `400 Bad Request`: Data tidak valid (misal `category: "dekor"` tanpa mengisi `decorWidth`).
- `401 Unauthorized`: Token tidak disediakan atau tidak valid.
- `403 Forbidden`: Akun bukan admin.

---

### 2.4 Memperbarui Paket

Memperbarui informasi paket yang sudah ada.

- **Endpoint:** `PUT /api/packages/:id`
- **Hak Akses:** Khusus Admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <admin_token>`

#### Request Body
Semua field bersifat opsional (mengikuti skema pembuatan paket).

```json
{
  "price": 8000000,
  "description": "Dekorasi pelaminan elegan dengan pembaruan karpet bulu tebal."
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
      "name": "Paket Dekor Rustic Gold",
      "category": "dekor",
      "price": 8000000,
      "description": "Dekorasi pelaminan elegan dengan pembaruan karpet bulu tebal.",
      "decorWidth": 6,
      "isActive": true,
      "updatedAt": "2026-11-08T14:15:00.000Z"
    }
  }
}
```

---

### 2.5 Menghapus / Menonaktifkan Paket

Secara default melakukan *soft delete* (mengubah `isActive: false`). Mendukung *permanent delete* jika parameter `permanent=true` dikirimkan.

- **Endpoint:** `DELETE /api/packages/:id`
- **Hak Akses:** Khusus Admin
- **Headers:** `Authorization: Bearer <admin_token>`

#### Query Parameters
- `permanent` (boolean, opsional): `true` untuk menghapus dokumen secara permanen dari database. Default `false`.

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Paket berhasil dinonaktifkan"
}
```

---

### 2.6 Mengunggah Foto ke Paket

Mengunggah hingga 5 file gambar sekaligus ke dalam galeri paket. Jika kredensial Cloudinary tersedia di `.env`, gambar akan otomatis diunggah ke Cloudinary; jika tidak, gambar disimpan di penyimpanan lokal (`/uploads/packages/`).

- **Endpoint:** `POST /api/packages/:id/images`
- **Hak Akses:** Khusus Admin
- **Headers:**
  - `Content-Type: multipart/form-data`
  - `Authorization: Bearer <admin_token>`
- **Batasan:** Maksimal 5 file, ukuran per file maksimal 5 MB, tipe file diperbolehkan: `.jpg`, `.jpeg`, `.png`, `.webp`.

#### Form Data
- `images`: File gambar (dapat dikirim lebih dari 1 file dengan nama field `images`).

#### Respons Berhasil (`201 Created`)
```json
{
  "success": true,
  "message": "Foto berhasil diunggah ke paket",
  "data": {
    "uploadedImages": [
      "https://res.cloudinary.com/kalila/image/upload/v1234/kalila/packages/foto1.jpg",
      "https://res.cloudinary.com/kalila/image/upload/v1234/kalila/packages/foto2.jpg"
    ],
    "package": {
      "_id": "672e19c045de67ab89012345",
      "name": "Paket Dekor Rustic Gold",
      "images": [
        "https://res.cloudinary.com/kalila/image/upload/v1234/kalila/packages/foto1.jpg",
        "https://res.cloudinary.com/kalila/image/upload/v1234/kalila/packages/foto2.jpg"
      ]
    }
  }
}
```

---

### 2.7 Menghapus Foto dari Galeri Paket

Menghapus salah satu URL foto dari daftar `images` pada paket.

- **Endpoint:** `DELETE /api/packages/:id/images`
- **Hak Akses:** Khusus Admin
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <admin_token>`

#### Request Body
```json
{
  "imageUrl": "https://res.cloudinary.com/kalila/image/upload/v1234/kalila/packages/foto1.jpg"
}
```

#### Respons Berhasil (`200 OK`)
```json
{
  "success": true,
  "message": "Foto berhasil dihapus dari paket",
  "data": {
    "package": {
      "_id": "672e19c045de67ab89012345",
      "images": [
        "https://res.cloudinary.com/kalila/image/upload/v1234/kalila/packages/foto2.jpg"
      ]
    }
  }
}
```

---

### 2.8 Mengunggah Satu Gambar Independen

Endpoint pembantu bagi admin untuk mengunggah satu foto dan memperoleh URL-nya.

- **Endpoint:** `POST /api/packages/upload`
- **Hak Akses:** Khusus Admin
- **Headers:**
  - `Content-Type: multipart/form-data`
  - `Authorization: Bearer <admin_token>`

#### Form Data
- `image`: 1 file gambar (maksimal 5 MB, JPG/PNG/WEBP).

#### Respons Berhasil (`201 Created`)
```json
{
  "success": true,
  "message": "Foto berhasil diunggah",
  "data": {
    "imageUrl": "https://res.cloudinary.com/kalila/image/upload/v1234/kalila/packages/foto-tunggal.jpg"
  }
}
```

