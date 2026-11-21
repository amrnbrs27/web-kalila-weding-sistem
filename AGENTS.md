# AGENTS.md

Aturan tetap untuk AI agent yang bekerja di project ini. Baca seluruh file ini sebelum mengerjakan tugas apa pun.

## Konteks Project

Website booking layanan **dekor, catering, dan wedding** untuk satu vendor (Kalila).
Pelanggan memilih paket, mengecek ketersediaan tanggal, memesan, membayar DP lewat transfer bank/QRIS
dengan mengunggah bukti transfer, lalu admin memverifikasi pembayaran di dashboard.

- Backend: Node.js + Express + MongoDB (Mongoose 9), **CommonJS** (`require`).
- Frontend: Vue + Vite + Pinia + Vue Router.
- Dokumen kebutuhan lengkap: `docs/PRD.md`. **Baca bagian yang relevan sebelum mengerjakan fitur
  dan ikuti aturan bisnis di dalamnya.** Jika kode dan PRD bertentangan, tanyakan, jangan menebak.
- Dokumentasi endpoint: `docs/API.md` (buat jika belum ada, perbarui setiap ada endpoint baru).

## Struktur Folder

```
/
├── AGENTS.md
├── docs/            # PRD.md, API.md
├── frontend/
└── backend/
    ├── src/
    │   ├── config/        # koneksi database, konfigurasi
    │   ├── models/
    │   ├── routes/
    │   ├── controllers/   # tipis: ambil input, panggil service, kirim respons
    │   ├── services/      # logika bisnis (kalender, booking, pembayaran)
    │   ├── middlewares/   # auth, validate, error handler
    │   ├── validators/    # skema Zod
    │   ├── jobs/          # tugas terjadwal (pembatalan otomatis)
    │   ├── utils/         # AppError, asyncHandler, dll.
    │   └── app.js
    ├── scripts/           # skrip sekali jalan (mis. createAdmin.js)
    └── server.js
```

Kecuali diminta lain, kerjakan hanya di folder yang disebut dalam tugas (umumnya `backend/`).

## Cara Bekerja

1. **Pelajari kode yang sudah ada dulu** (model, middleware, utils) sebelum menulis kode baru.
   Pakai ulang yang sudah ada, jangan membuat versi baru yang menggandakan fungsinya.
2. **Kerjakan hanya tugas yang diminta.** Jangan mengubah, menghapus, atau menimpa file yang tidak terkait.
3. Untuk tugas besar, buat rencana dulu dan tunggu persetujuan sebelum mengubah file.
4. Jika ada keputusan bisnis yang tidak jelas atau tidak ada di PRD, **berhenti dan tanyakan**.
5. Setelah selesai, jalankan dan uji hasilnya, lalu laporkan: apa yang dibuat/diubah, daftar file,
   hasil pengujian, dan hal yang belum terselesaikan atau diasumsikan.
6. Jangan menjalankan perintah destruktif (hapus data, `git reset --hard`, `git push --force`,
   menjatuhkan koleksi database) tanpa persetujuan eksplisit.
7. Sebelum menambah dependency npm baru, pastikan benar-benar dibutuhkan dan sebutkan alasannya di laporan.
8. Jangan menjalankan git add, git commit, atau git push kecuali diminta secara eksplisit dalam tugas.
## Konvensi Kode (Backend)

- Bahasa pesan respons API dan komentar: **Bahasa Indonesia**. Nama variabel, fungsi, dan field: Inggris.
- Format respons seragam:
  - Sukses: `{ success: true, message, data }`
  - Gagal: `{ success: false, message, errors? }`
- Gunakan utilitas yang sudah ada: `AppError`, `asyncHandler`, middleware `validate` (Zod),
  `authenticate`, `requireAdmin`. Error dilempar dengan `AppError`, bukan `res.status().json()` manual.
- **Mongoose 9:** hook `pre`/`post` ditulis sebagai fungsi `async` **tanpa parameter `next`**.
- Validasi semua input dengan Zod. Jangan memercayai data dari klien (termasuk harga, nominal DP, role).
- Registrasi publik **tidak boleh** menerima field `role`. Akun admin dibuat lewat skrip atau oleh admin.
- Semua endpoint baru wajib punya proteksi yang sesuai (publik, pelanggan login, atau admin).
- Logika bisnis ditaruh di `services/`, bukan di controller.
- Pagination untuk semua endpoint daftar.
- Jangan mengubah nama variabel `.env` yang sudah dipakai di kode yang ada.

## Aturan Bisnis Inti (ringkasan dari PRD, PRD yang berlaku jika ada perbedaan)

**Peran:** `customer` dan `admin`. Semua admin punya hak akses yang sama.

**Kategori:** `dekor`, `catering`, `wedding`. Wedding tidak punya Self Design dan memengaruhi
kalender dekor **dan** catering.

**Tanggal:**
- Simpan tanggal acara sebagai string `"YYYY-MM-DD"` (zona waktu WIB), bukan `Date`, agar bebas masalah zona waktu.
- Satu tanggal boleh untuk lebih dari satu acara. Admin dapat memblokir tanggal per kategori.
- Pesanan yang menunggu pembayaran/verifikasi **tidak menahan slot**. Slot terisi saat admin
  menyetujui pembayaran. Jumlah acara pada tanggal = booking berstatus `terkonfirmasi`/`berlangsung`.
- Penyetujuan memeriksa blokir dan kuota **di dalam satu transaction MongoDB** (atomik dan idempoten).
  Jika slot sudah tidak tersedia, persetujuan ditolak dengan error yang jelas.
- Tanggal yang sudah lewat tidak boleh dipesan.

**Pembayaran (TIDAK ADA payment gateway):**
- DP flat Rp1.000.000 (nilai dari Settings, bukan hardcode), lewat transfer bank atau QRIS.
- Pelanggan mengunggah bukti transfer; admin memverifikasi manual di dashboard.
- Batas 24 jam hanya untuk **mengunggah bukti**. Setelah bukti diunggah, status `menunggu_verifikasi`
  dan **tidak boleh dibatalkan otomatis**.
- Bukti ditolak: pesanan kembali ke `menunggu_dp`, batas waktu diperpanjang (default 6 jam, dari Settings),
  pelanggan boleh unggah ulang maksimal 3 kali (dari Settings). Penolakan ketiga membatalkan pesanan.
- Pembatalan otomatis (cron) hanya untuk booking `menunggu_dp` yang `expiresAt`-nya lewat.
- Pengembalian DP dilakukan manual oleh admin; sistem hanya menyimpan catatannya.
- Pelunasan diatur admin lewat WhatsApp dan dicatat manual (bukan lewat website).

**Status:**
- Pesanan: `menunggu_dp`, `menunggu_verifikasi`, `terkonfirmasi`, `berlangsung`, `selesai`, `dibatalkan`.
- Pembayaran pada pesanan: `belum_dp`, `menunggu_verifikasi`, `dp_dibayar`, `ditolak`, `lunas`.
- Hanya transisi status yang valid yang diizinkan; catat siapa dan kapan.

**Self Design:** khusus dekor, aktif setelah pesanan `terkonfirmasi`, kanvas 2D dibatasi lebar dekor
pada paket, tidak memengaruhi harga, desain disimpan sebagai JSON + PNG, terkunci pada H-1 bulan
sebelum tanggal acara.

**Notifikasi:** email saja (tidak ada notifikasi WhatsApp otomatis). Tombol WhatsApp di frontend
memakai pesan otomatis yang memuat nama paket atau nomor pesanan.

## Keamanan

- **Jangan pernah menulis rahasia ke kode atau commit:** password, API key, connection string, secret JWT.
  Semuanya lewat `.env`. Tambahkan nama variabelnya (tanpa nilai) ke `.env.example`. Pastikan `.env` ada di `.gitignore`.
- Jangan mencetak isi `.env` atau data sensitif ke log, respons, atau laporan.
- Password di-hash dengan bcrypt. Field password memakai `select: false`.
- **Bukti transfer memuat data pribadi dan rekening: simpan privat**, bukan URL publik. Tampilkan lewat
  URL bertanda tangan berumur pendek, dan hanya untuk admin dan pemilik pesanan.
- Upload file: batasi jenis (jpg, png, webp) dan ukuran (maks 5 MB), validasi isi file (bukan hanya ekstensi),
  dan pasang rate limiting pada endpoint unggah.
- Pelanggan hanya boleh mengakses data miliknya sendiri (cek kepemilikan di setiap endpoint `:id`).
- Hindari NoSQL injection: validasi tipe input dengan Zod sebelum dipakai dalam query.

## Git

- Satu tugas, satu commit (atau beberapa commit kecil). Pesan commit bermakna, contoh `feat: endpoint verifikasi pembayaran`.
- Branch utama kerja: `development`. Jangan push langsung ke `main`.
- Jangan meng-commit `node_modules/`, `.env`, `dist/`, dan file `docs/PRD.md` jika repo bersifat public
  (ikuti `.gitignore` yang ada).
- Jangan mengubah riwayat Git (rebase, amend commit yang sudah di-push, force push) tanpa diminta.

## Pengujian

- Uji endpoint yang dibuat (curl, skrip, atau test otomatis) dan laporkan hasilnya.
- Untuk logika penting (ketersediaan tanggal, persetujuan pembayaran, pembatalan otomatis),
  uji kasus tepi: tanggal diblokir, kuota penuh, persetujuan dua kali, bukti kedaluwarsa, penolakan ketiga.
