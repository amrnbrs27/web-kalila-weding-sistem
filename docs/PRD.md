# PRD: Website Booking Layanan Dekor dan Catering

| | |
|---|---|
| **Versi** | 1.0 (draft) |
| **Tanggal** | 6 November 2026 |
| **Tech stack** | Vue (frontend), Express.js (backend), MongoDB (database) |
| **Status** | Draft untuk ditinjau |

---

## 1. Latar Belakang dan Tujuan

Vendor dekorasi dan catering membutuhkan sistem online agar pelanggan dapat melihat paket, mengecek ketersediaan tanggal, memesan, dan membayar DP tanpa harus selalu menghubungi admin secara manual. Website ini juga menyediakan fitur **Self Design** agar pelanggan dapat menata dekorasi sendiri secara visual.

**Tujuan:**
1. Memudahkan pelanggan memesan layanan dekor, catering, dan wedding secara online.
2. Mengurangi pekerjaan manual admin dalam mengelola jadwal, pesanan, dan pembayaran DP.
3. Mencegah bentrok jadwal dan pesanan yang melebihi kapasitas.
4. Menyediakan data pesanan dan keuangan yang rapi untuk pengambilan keputusan.

**Di luar cakupan (versi ini):**
- Marketplace multi-vendor
- Pelunasan otomatis lewat sistem (pelunasan diatur admin lewat WhatsApp)
- Desain 3D pada Self Design
- Notifikasi WhatsApp otomatis (hanya email)
- Ulasan/rating, kode promo, dan manajemen data pelanggan oleh admin

---

## 2. Pengguna

| Peran | Deskripsi |
|---|---|
| **Pelanggan** | Pengunjung yang mendaftar, memesan paket, membayar DP, dan memakai Self Design (khusus dekor) |
| **Admin/Staf** | Mengelola seluruh konten, pesanan, kalender, dan keuangan. Semua akun admin memiliki hak akses yang sama |

---

## 3. Kategori Layanan

| Kategori | Isi | Catatan |
|---|---|---|
| **Dekor** | Paket dekorasi | Mendukung Self Design setelah DP dibayar |
| **Catering** | Paket catering tersedia dan **catering custom** | Custom diarahkan ke WhatsApp, admin yang menginput pesanan |
| **Wedding** | Dekorasi, catering, wedding organizer, makeup, MC, entertainment, dokumentasi | Tidak mendapat Self Design. Memengaruhi kalender dekor dan catering |

---

## 4. Fitur Pelanggan

### 4.1 Registrasi dan Login
- Pelanggan mendaftar dengan nama, email, nomor WhatsApp, dan password.
- Login, logout, dan reset password lewat email.
- Pemesanan dan akses riwayat pesanan memerlukan akun.

**Kriteria penerimaan**
- Email tidak boleh terdaftar dua kali.
- Pelanggan yang belum login diarahkan ke halaman login saat menekan tombol Pesan, lalu dikembalikan ke paket yang dipilih.

### 4.2 Katalog Layanan
Tiga katalog: Dekor, Catering, Wedding. Alur umum:

**Daftar paket → Detail paket (isi paket) → Tombol Pesan → Form booking**

**Alur Dekor**
1. Pelanggan memilih paket dekor.
2. Pelanggan boleh menghubungi admin lewat WhatsApp untuk diskusi desain sesuai harga paket.
3. Setelah yakin, pelanggan menekan Pesan dan mengisi form booking.
4. Setelah DP dibayar, pelanggan mendapat akses **Self Design**.

**Alur Catering**
1. Pelanggan memilih **paket catering yang tersedia** → detail paket → Pesan → form booking, atau
2. Memilih **catering custom** → langsung diarahkan ke WhatsApp admin. Admin kemudian menginput pesanan lewat fitur Buat Pesanan Manual.

**Alur Wedding**
1. Pelanggan memilih paket wedding → detail paket (rincian dekorasi, catering, WO, makeup, MC, entertainment, dokumentasi) → Pesan → form booking.
2. Tidak ada Self Design.

### 4.3 Tombol WhatsApp dengan Pesan Otomatis
Setiap halaman detail paket memiliki tombol WhatsApp yang membuka chat ke nomor admin dengan pesan terisi otomatis, memuat **nama paket** dan kategorinya.

Contoh pesan:
> Halo admin, saya tertarik dengan paket *[Nama Paket]* (kategori *[Dekor/Catering/Wedding]*). Boleh saya berdiskusi lebih lanjut?

Tombol catering custom memakai pesan: "Halo admin, saya ingin memesan catering custom."

Nomor WhatsApp admin diambil dari Settings.

### 4.4 Cek Ketersediaan Tanggal
- Dapat diakses di halaman daftar/detail paket dekor dan catering, serta di form booking.
- Kalender hanya menampilkan ketersediaan **sesuai kategori** (kalender dekor untuk paket dekor, kalender catering untuk paket catering).
- Untuk wedding, tanggal dianggap tersedia hanya jika dekor **dan** catering sama-sama tersedia pada tanggal tersebut.
- Tanggal yang diblokir admin atau sudah penuh tampil tidak dapat dipilih.

### 4.5 Form Booking
Satu form per kategori. Kolom umum:

- Paket yang dipilih (terisi otomatis)
- Tanggal acara (dari kalender ketersediaan)
- Nama acara dan lokasi acara
- Nama, nomor WhatsApp, dan email pemesan
- Catatan khusus

Kolom tambahan:
- **Dekor:** ukuran/area dekor jika diperlukan
- **Catering:** jumlah tamu atau porsi, waktu penyajian
- **Wedding:** jumlah tamu, kebutuhan layanan tambahan

Setelah form dikirim, pesanan dibuat dengan status **Menunggu Pembayaran DP** dan pelanggan diarahkan ke halaman pembayaran.

### 4.6 Pembayaran DP
- DP **flat Rp1.000.000** untuk semua paket.
- Batas waktu pembayaran **24 jam** sejak pesanan dibuat.
- Jika DP tidak dibayar dalam 24 jam, pesanan **batal otomatis**.
- Metode pembayaran melalui payment gateway (Midtrans atau Xendit, ditentukan saat implementasi).
- Setelah DP berhasil muncul **pop-up sukses** dengan tombol **Contact Us** yang membuka WhatsApp admin (pesan otomatis memuat nama paket dan nomor pesanan).
- Pelunasan **tidak dilakukan di website**. Pelanggan menghubungi admin langsung, dan admin mencatat pelunasan di dashboard.

### 4.7 Riwayat Pesanan dan Status Booking
- Daftar semua pesanan pelanggan beserta detailnya.
- Status yang terlihat pelanggan:

| Status pesanan | Arti |
|---|---|
| Menunggu Pembayaran DP | Pesanan dibuat, DP belum dibayar (ada hitung mundur 24 jam) |
| Terkonfirmasi | DP sudah dibayar, tanggal terkunci untuk pelanggan |
| Berlangsung | Acara sedang/sudah masuk hari pelaksanaan |
| Selesai | Acara selesai |
| Dibatalkan | Dibatalkan otomatis (DP tidak dibayar) atau oleh admin |

- Status pembayaran tampil terpisah: **Belum DP**, **DP Dibayar**, **Lunas**.
- Untuk pesanan dekor yang terkonfirmasi, tersedia tombol menuju Self Design.

### 4.8 Self Design (khusus Dekor)

**Syarat akses:** pesanan dekor berstatus Terkonfirmasi (DP sudah dibayar). Paket wedding tidak mendapat fitur ini.

**Fungsi**
- Kanvas **2D (flat)** dengan **drag and drop** komponen.
- Pelanggan bebas memilih komponen yang tersedia, lalu menata posisi, ukuran, dan urutan lapisan (layer).
- **Pembatas utama: lebar dekor.** Lebar kanvas mengikuti ukuran lebar dekor pada paket yang dipilih, dan komponen tidak boleh keluar dari area kanvas.
- Komponen yang dipakai **tidak memengaruhi harga**. Desain hanya sebagai referensi.
- Tombol **Simpan** mengirim desain ke admin.

**Format data desain: JSON sebagai data utama, PNG sebagai pelengkap**
- **JSON** adalah format yang disimpan dan dianggap sumber data. Alasannya: desain dapat dibuka dan diedit kembali oleh pelanggan, dapat diperbarui, dan ukurannya kecil.
- **PNG** dibuat otomatis dari kanvas saat tombol Simpan ditekan, supaya admin dapat langsung melihat dan mengunduh hasil tanpa membuka editor.
- Jadi yang tersimpan: satu data JSON (untuk edit ulang) dan satu gambar PNG (untuk dilihat admin).

**Batas waktu**
- Pelanggan dapat mengubah dan menyimpan ulang desain sampai **H-1 bulan** sebelum tanggal acara.
- Setelah batas itu, desain **terkunci otomatis** dan tidak dapat diubah. Perubahan setelahnya melalui diskusi langsung dengan admin.
- Jika tanggal acara kurang dari 1 bulan saat DP dibayar, aturan penguncian perlu ditentukan (lihat bagian 12).

**Status desain:** Belum Dibuat, Tersimpan, Terkunci.

**Kriteria penerimaan**
- Komponen tidak dapat dipindahkan melewati batas lebar kanvas.
- Admin dapat melihat PNG dan mengunduhnya dari halaman detail pesanan.
- Simpan ulang sebelum batas waktu menggantikan desain sebelumnya.

### 4.9 Portofolio
Menampilkan portofolio perusahaan, dikelompokkan per kategori (Dekor, Catering, Wedding), berisi foto dan keterangan singkat.

### 4.10 Blog
Daftar artikel dan halaman detail artikel (judul, gambar sampul, isi, tanggal terbit).

---

## 5. Fitur Dashboard Admin

Struktur sidebar:

1. Dashboard Pesanan
2. Dashboard Keuangan
3. Kelola Pesanan
4. Kelola Kalender
5. Kelola Paket dan Galeri
6. Kelola Komponen Self Design
7. Kelola Portofolio
8. Kelola Blog
9. Kelola User (Admin/Staf)
10. Settings

### 5.1 Dashboard Pesanan
- Chart pesanan masuk dari tiga kategori (Dekor, Catering, Wedding), dengan filter periode.
- **Pesanan baru** yang masuk.
- **Jadwal terdekat**.
- **Pembayaran masuk** (ringkasan DP terbaru).

### 5.2 Dashboard Keuangan
- Chart pemasukan (per periode dan per kategori).
- Tabel **data pembayaran masuk** (DP lewat gateway dan pelunasan yang dicatat admin).
- **Laporan pendapatan** dan **rekap bulanan/tahunan**.
- **Ekspor ke PDF dan Excel**.

### 5.3 Kelola Pesanan
- Daftar pesanan dengan filter kategori, status, dan tanggal acara.
- Detail pesanan: data pelanggan, paket, tanggal, status, riwayat pembayaran, dan desain pelanggan (PNG, dengan opsi unduh).
- Ubah status pesanan, batalkan pesanan.
- **Catat pelunasan** (nominal, tanggal, metode) dan ubah status pembayaran menjadi Lunas.
- **Buat Pesanan Manual** (lihat 5.3.1).

#### 5.3.1 Buat Pesanan Manual
- Tersedia untuk **ketiga kategori** (Dekor, Catering, Wedding).
- Admin memakai **form yang sama dengan form booking pelanggan**.
- Dipakai terutama untuk **catering custom** dari WhatsApp dan pesanan dari luar website.
- Admin dapat memilih pelanggan yang sudah terdaftar atau mengisi data pelanggan baru (nama, WhatsApp, email).
- Cek ketersediaan tanggal tetap berlaku, termasuk blokir tanggal.
- Admin dapat mengirim link pembayaran DP atau mencatat DP yang sudah dibayar di luar sistem.

### 5.4 Kelola Kalender
Menu tersendiri di sidebar.
- Tampilan kalender per kategori (Dekor, Catering, Wedding) menampilkan jumlah acara per tanggal.
- **Blokir tanggal** per kategori (misalnya karena acara besar), dengan alasan opsional.
- Buka kembali tanggal yang diblokir.
- Tanggal yang diblokir tidak dapat dipilih pelanggan maupun dipakai pesanan baru.

### 5.5 Kelola Paket dan Galeri
CRUD paket untuk Dekor, Catering, dan Wedding: nama, harga, isi paket, foto, status aktif, dan (khusus dekor) **lebar dekor** yang dipakai sebagai batas kanvas Self Design. Pengelolaan galeri foto tiap kategori.

### 5.6 Kelola Komponen Self Design
- CRUD komponen: nama, kategori komponen, gambar (PNG transparan), ukuran bawaan, dan status aktif/nonaktif.
- Hanya komponen aktif yang muncul di editor pelanggan.

### 5.7 Kelola Portofolio dan Blog
- Portofolio: tambah, ubah, hapus; pilih kategori; unggah foto.
- Blog: tambah, ubah, hapus, status draft/terbit.

### 5.8 Kelola User (Admin/Staf)
- Tambah, ubah, nonaktifkan akun admin/staf.
- **Seluruh akun memiliki hak akses yang sama** (tanpa pembagian peran).
- Tidak mencakup pengelolaan data pelanggan.

### 5.9 Settings
- Nomor WhatsApp admin (dipakai semua tombol WhatsApp)
- Nominal DP (default Rp1.000.000) dan batas waktu pembayaran (default 24 jam)
- Batas maksimal acara per tanggal per kategori (pengaman, opsional)
- Info kontak dan media sosial
- Profil usaha (nama, logo)

---

## 6. Aturan Sistem

### 6.1 Aturan Pembayaran
1. DP **Rp1.000.000 flat** untuk semua paket.
2. Batas waktu bayar **24 jam** sejak pesanan dibuat.
3. Tidak dibayar dalam 24 jam → pesanan **batal otomatis** (dijalankan penjadwal otomatis/cron job dan masa kedaluwarsa pembayaran di gateway).
4. Pelunasan diatur admin lewat WhatsApp dan dicatat manual di dashboard.

### 6.2 Aturan Tanggal dan Slot
1. Satu tanggal **dapat dipakai lebih dari satu acara**, tergantung besar kecilnya acara.
2. Untuk acara besar, admin **memblokir tanggal** di Kelola Kalender sehingga tidak bisa dipesan.
3. **Tanggal tidak ditahan.** Berlaku asas **siapa cepat dia dapat**, yaitu **siapa yang DP-nya berhasil dibayar lebih dulu yang mendapat slot**, bukan siapa yang membuat pesanan lebih dulu.
4. Beberapa pelanggan dapat membuat pesanan pada tanggal yang sama dengan status Menunggu Pembayaran DP.
5. Jika tanggal sudah diblokir admin atau mencapai batas maksimal acara (bila diaktifkan di Settings) pada saat pesanan dibuat atau DP dibayar, sistem menolak pesanan tersebut.
6. Penentuan pemenang slot dilakukan secara atomik di database saat pembayaran DP berhasil dikonfirmasi (webhook), sehingga dua pembayaran yang masuk hampir bersamaan tidak lolos keduanya melebihi batas.
7. Kalender wedding memeriksa ketersediaan dekor dan catering sekaligus. Setelah DP dibayar, pesanan wedding dihitung pada kedua kategori tersebut.

### 6.3 Notifikasi Otomatis (Email)
| Kejadian | Penerima |
|---|---|
| Pesanan dibuat (berisi batas waktu bayar) | Pelanggan |
| Pengingat sebelum batas bayar habis | Pelanggan |
| DP diterima / pesanan terkonfirmasi | Pelanggan dan admin |
| Pesanan batal otomatis | Pelanggan |
| Pesanan baru masuk | Admin |
| Pengingat batas akhir Self Design | Pelanggan |

Seluruh notifikasi lewat **email saja**. Komunikasi lewat WhatsApp dilakukan manual lewat tombol WhatsApp.

---

## 7. Alur Utama

**Alur booking (Dekor/Catering/Wedding)**
1. Pelanggan membuka katalog → detail paket → cek tanggal.
2. (Opsional) Diskusi lewat tombol WhatsApp.
3. Pelanggan menekan Pesan → login → isi form booking.
4. Sistem membuat pesanan *Menunggu Pembayaran DP* (24 jam).
5. Pelanggan membayar DP.
6. Sistem memeriksa slot secara atomik → pesanan *Terkonfirmasi* → pop-up sukses dan tombol Contact Us.
7. Jika tidak dibayar dalam 24 jam → *Dibatalkan*.
8. Admin menghubungi pelanggan untuk pelunasan dan mencatatnya di dashboard.

**Alur Self Design**
1. Pesanan dekor terkonfirmasi → tombol Self Design aktif.
2. Pelanggan menata komponen di kanvas (dibatasi lebar dekor).
3. Pelanggan menekan Simpan → JSON dan PNG tersimpan, admin dapat melihat.
4. Pelanggan boleh mengubah dan menyimpan ulang sampai H-1 bulan, lalu desain terkunci.

**Alur catering custom**
1. Pelanggan memilih catering custom → diarahkan ke WhatsApp.
2. Admin berdiskusi, lalu menginput lewat Buat Pesanan Manual.
3. Admin mengirim link DP atau mencatat DP, dan status pesanan berlanjut seperti biasa.

---

## 8. Model Data (garis besar, MongoDB)

| Koleksi | Isi utama |
|---|---|
| `users` | Akun pelanggan (nama, email, WhatsApp, password hash) |
| `admins` | Akun admin/staf |
| `packages` | Kategori, nama, harga, isi paket, foto, lebar dekor (dekor), status aktif |
| `bookings` | Pelanggan, paket, kategori, tanggal acara, data form, status pesanan, status pembayaran, sumber (website/manual), waktu kedaluwarsa |
| `payments` | Booking, jenis (DP/pelunasan), nominal, metode, status, id transaksi gateway |
| `calendar_blocks` | Tanggal, kategori, alasan |
| `designs` | Booking, data JSON, URL PNG, status (tersimpan/terkunci), waktu pembaruan |
| `design_components` | Nama, kategori, gambar, ukuran bawaan, status aktif |
| `portfolios` | Kategori, judul, foto, deskripsi |
| `posts` | Judul, isi, gambar sampul, status, tanggal terbit |
| `settings` | Nomor WhatsApp, DP, batas waktu, info kontak |

---

## 9. Kebutuhan Non-Fungsional
- **Responsif:** nyaman di ponsel (sebagian besar pelanggan akan mengakses dari HP). Editor Self Design tetap dapat dipakai di layar sentuh.
- **Keamanan:** autentikasi JWT, password di-hash, validasi input, rate limiting, verifikasi tanda tangan webhook pembayaran.
- **Performa:** gambar dioptimalkan dan disimpan di penyimpanan eksternal (misalnya Cloudinary).
- **SEO:** halaman katalog, portofolio, dan blog sebaiknya dapat ditemukan di Google (pertimbangkan Nuxt bila SEO penting).
- **Keandalan:** pembatalan otomatis berjalan terjadwal dan aman dijalankan berulang.

---

## 10. Teknologi

| Lapisan | Pilihan |
|---|---|
| Frontend | Vue (opsional Nuxt untuk SEO), Pinia, Vue Router |
| Kanvas Self Design | Konva (vue-konva) |
| Backend | Express.js, Mongoose, JWT, Zod/Joi |
| Database | MongoDB (disarankan MongoDB Atlas) |
| Pembayaran | Midtrans atau Xendit (dengan webhook) |
| Email | Layanan email transaksional (misalnya Resend, SendGrid, atau SMTP) |
| Penyimpanan gambar | Cloudinary atau S3-compatible |
| Penjadwal | node-cron atau job queue |
| Ekspor laporan | PDF dan Excel (misalnya pdfkit dan exceljs) |

---

## 11. Usulan Tahapan Pengerjaan

| Tahap | Cakupan |
|---|---|
| **MVP** | Autentikasi, katalog tiga kategori, detail paket, tombol WhatsApp otomatis, cek tanggal, form booking, pembayaran DP + pembatalan otomatis, riwayat pesanan, notifikasi email, dashboard pesanan, kelola paket/pesanan/kalender, buat pesanan manual, kelola user, settings, portofolio |
| **Tahap 2** | Self Design (editor + kelola komponen), dashboard keuangan + ekspor PDF/Excel, blog |
| **Tahap 3** | Penyempurnaan: pengingat tambahan, optimasi, fitur tambahan sesuai masukan |

Self Design adalah fitur terberat, sehingga menundanya ke tahap 2 tidak mengganggu alur booking utama.

---

## 12. Hal yang Masih Perlu Diputuskan

1. **Pembayaran DP yang masuk setelah slot penuh.** Karena berlaku siapa cepat bayar dia dapat, ada kemungkinan pelanggan membayar DP pada tanggal yang sudah terisi/diblokir saat itu. Perlu ditentukan: DP dikembalikan (refund) otomatis atau diproses admin, serta pesan yang ditampilkan ke pelanggan.
2. **Batas maksimal acara per tanggal.** Apakah hanya mengandalkan blokir manual admin, atau juga ada angka batas per kategori sebagai pengaman? (Sudah disiapkan opsional di Settings.)
3. **Kebijakan pembatalan oleh pelanggan** setelah DP: apakah DP hangus atau dapat dikembalikan, dan apakah pelanggan bisa membatalkan sendiri di website atau lewat admin.
4. **Perubahan tanggal acara (reschedule)** setelah DP: lewat admin saja atau mandiri.
5. **Acara kurang dari 1 bulan.** Jika tanggal acara kurang dari 1 bulan saat DP dibayar, apakah Self Design tetap dibuka dengan batas waktu lain (misalnya beberapa hari), atau tidak tersedia.
6. **Pelunasan dan DP:** apakah DP Rp1.000.000 dihitung sebagai bagian dari total harga (dipotong saat pelunasan). Ini memengaruhi laporan keuangan.
7. **Status "Berlangsung" dan "Selesai":** diubah manual oleh admin atau otomatis berdasarkan tanggal acara.
8. **Catering berbasis jumlah tamu:** apakah harga paket catering tetap atau mengikuti jumlah porsi (memengaruhi total yang dilunasi, bukan DP).
9. **Pilihan payment gateway** (Midtrans atau Xendit) dan layanan email.

---

## 13. Ringkasan Fitur

| Area | Fitur |
|---|---|
| Pelanggan | Registrasi/login, katalog (dekor, catering, wedding), tombol WhatsApp otomatis, cek tanggal, form booking, DP, riwayat + status, Self Design (dekor), portofolio, blog |
| Admin | Dashboard pesanan, dashboard keuangan (ekspor PDF/Excel), kelola pesanan + pesanan manual, kelola kalender, kelola paket dan galeri, kelola komponen, kelola portofolio dan blog, kelola user admin, settings |
| Sistem | DP flat Rp1 juta, batas bayar 24 jam, batal otomatis, siapa cepat bayar dapat slot, blokir tanggal, notifikasi email |
