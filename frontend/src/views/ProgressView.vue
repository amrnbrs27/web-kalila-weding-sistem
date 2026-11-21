<template>
  <div class="min-h-screen bg-[#161210] text-gray-200 font-sans selection:bg-[#C5A265] selection:text-black flex flex-col justify-between">
    <!-- Navbar -->
    <Navbar :show-konsultasi="false" :nav-capsule="false" />

    <main class="relative z-10 pt-28 sm:pt-32 md:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full flex-1">
      <!-- Thin Golden Divider Line below Navbar -->
      <div class="absolute top-[72px] sm:top-[80px] md:top-[88px] left-0 right-0 h-[1px] bg-[#C5A265]/25 z-20 pointer-events-none"></div>

      <!-- Header & Breadcrumb -->
      <div class="mb-8 sm:mb-10">
        <div class="inline-flex items-center gap-3 mb-2.5">
          <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
          <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-[#C5A265] drop-shadow">
            CLIENT DASHBOARD
          </span>
          <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
        </div>

        <h1 class="font-serif text-3xl sm:text-4xl md:text-5xl text-white font-normal tracking-tight">
          Progress &amp; Pelacakan Pesanan
        </h1>
        <p class="text-stone-300 text-xs sm:text-sm font-light mt-2 max-w-2xl">
          Pantau status pemesanan, verifikasi transfer DP, jadwal acara, dan akses fitur Self Design kanvas 2D Anda secara real-time.
        </p>
      </div>

      <!-- User Profile Header Card -->
      <div class="bg-[#0E131B]/95 border border-white/10 rounded-3xl p-5 sm:p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
        <div class="flex items-center gap-4">
          <!-- Avatar with Gradient Ring -->
          <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-[#700B11] to-[#941A29] flex items-center justify-center text-white text-xl font-bold border border-[#C5A265]/40 shadow-md shrink-0">
            {{ userInitials }}
          </div>
          <div>
            <div class="flex items-center gap-2.5 flex-wrap">
              <h2 class="text-base sm:text-lg font-semibold text-white">
                {{ clientDisplayName }}
              </h2>
              <span class="inline-block text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#700B11]/50 border border-[#941A29] text-[#E6CA65]">
                Verified Client
              </span>
            </div>
            <p class="text-stone-400 text-xs mt-0.5">
              {{ clientEmail }} • {{ clientPhone }}
            </p>
          </div>
        </div>

        <!-- Logout Button -->
        <button
          v-if="authStore.isAuthenticated"
          @click="handleLogout"
          class="text-xs text-stone-400 hover:text-red-400 transition-colors flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Keluar</span>
        </button>
      </div>

      <!-- Navigation Tabs: Pesanan Aktif vs Riwayat -->
      <div class="flex items-center gap-3 mb-6 border-b border-white/10 pb-3">
        <button
          type="button"
          @click="activeTab = 'active'"
          class="px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2"
          :class="[
            activeTab === 'active'
              ? 'bg-[#700B11] text-white border border-[#941A29] shadow-md'
              : 'text-stone-400 hover:text-white bg-transparent'
          ]"
        >
          <span>📌 Pesanan Berjalan</span>
          <span class="px-2 py-0.5 text-[10px] rounded-full bg-black/40 text-[#DFBA73] font-bold">
            {{ activeBooking ? '1' : '0' }}
          </span>
        </button>

        <button
          type="button"
          @click="activeTab = 'history'"
          class="px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2"
          :class="[
            activeTab === 'history'
              ? 'bg-[#700B11] text-white border border-[#941A29] shadow-md'
              : 'text-stone-400 hover:text-white bg-transparent'
          ]"
        >
          <span>📜 Riwayat Pesanan Selesai</span>
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 1: ACTIVE ORDER CONTENT                                               -->
      <!-- ========================================================================= -->
      <div v-if="activeTab === 'active'">
        <!-- When Active Booking Exists -->
        <div v-if="activeBooking" class="space-y-6 sm:space-y-8 animate-fade-in">

          <!-- MAIN ORDER CARD -->
          <div class="rounded-3xl bg-[#0E131B]/95 border border-white/10 p-6 sm:p-8 lg:p-10 shadow-[0_16px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl relative overflow-hidden">

            <!-- Card Header: Order Code, Category, & Status Badge -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <div class="flex items-center gap-3">
                  <span class="text-xs uppercase tracking-wider text-stone-400 font-medium">Nomor Pesanan</span>
                  <span class="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#C5A265]/20 text-[#DFBA73] border border-[#C5A265]/40">
                    {{ activeBooking.categoryLabel || 'Dekorasi' }}
                  </span>
                </div>
                <div class="flex items-center gap-3 mt-1.5">
                  <span class="font-mono text-2xl sm:text-3xl font-bold text-white tracking-wide">
                    {{ activeBooking.orderCode }}
                  </span>
                  <!-- Copy Button -->
                  <button
                    @click="copyOrderCode"
                    class="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-stone-400 hover:text-white transition-colors"
                    title="Salin Nomor Pesanan"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Dynamic Status Pill with Pulse Indicator -->
              <div>
                <span
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border shadow-md"
                  :class="statusBadgeStyle.container"
                >
                  <span class="w-2 h-2 rounded-full animate-ping" :class="statusBadgeStyle.dot"></span>
                  <span>{{ statusBadgeStyle.label }}</span>
                </span>
              </div>
            </div>

            <!-- ================= STATUS NOTIFICATION BANNERS (PRD Rules) ================= -->

            <!-- 1. Menunggu Verifikasi Admin (Bukti sudah diunggah) -->
            <div
              v-if="activeBooking.orderStatus === 'menunggu_verifikasi'"
              class="mt-6 p-5 rounded-2xl bg-blue-950/40 border border-blue-500/40 text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div class="flex items-start gap-3.5">
                <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-xl">
                  ⏳
                </div>
                <div>
                  <h4 class="text-sm font-semibold text-white">
                    Bukti Transfer Telah Diterima — Menunggu Verifikasi Admin
                  </h4>
                  <p class="text-xs text-blue-200/90 leading-relaxed font-light mt-0.5">
                    Sesuai ketentuan, pesanan Anda <strong>tidak akan dibatalkan otomatis</strong> selama proses verifikasi. Admin Kalila sedang memeriksa mutasi rekening.
                  </p>
                  <p class="text-[11px] text-stone-400 mt-1">
                    Berkas: <span class="text-white font-mono">{{ activeBooking.proofFileName || 'bukti_transfer.jpg' }}</span>
                  </p>
                </div>
              </div>

              <a
                :href="whatsappAdminUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 shadow-md"
              >
                <span>Konfirmasi ke Admin</span>
                <span>→</span>
              </a>
            </div>

            <!-- 2. Terkonfirmasi (DP Lunas & Tanggal Terkunci) -->
            <div
              v-else-if="activeBooking.orderStatus === 'terkonfirmasi'"
              class="mt-6 p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div class="flex items-start gap-3.5">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xl">
                  🎉
                </div>
                <div>
                  <h4 class="text-sm font-semibold text-white">
                    Pembayaran DP Rp 1.000.000 Terverifikasi!
                  </h4>
                  <p class="text-xs text-emerald-200/90 leading-relaxed font-light mt-0.5">
                    Jadwal acara Anda pada <strong class="text-white">{{ activeBooking.eventDate }} (WIB)</strong> telah <strong>RESMI TERKUNCI</strong> di kalender operasional Kalila.
                  </p>
                </div>
              </div>

              <!-- Button Self Design (Active for Dekorasi) -->
              <div v-if="activeBooking.category === 'dekor'" class="shrink-0">
                <button
                  type="button"
                  @click="openSelfDesignModal = true"
                  class="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#DFBA73] to-[#C5A265] hover:from-[#cfab5a] hover:to-[#b3904e] text-black text-xs font-semibold tracking-wide transition-all shadow-[0_4px_16px_rgba(223,186,115,0.35)] flex items-center gap-2 cursor-pointer"
                >
                  <span>🎨</span>
                  <span>Buka Kanvas Self Design 2D</span>
                </button>
              </div>
            </div>

            <!-- 3. Bukti Ditolak (Rejection Notice & Re-Upload Form per PRD 6.1) -->
            <div
              v-else-if="activeBooking.orderStatus === 'ditolak'"
              class="mt-6 p-5 sm:p-6 rounded-2xl bg-red-950/40 border border-red-500/50 text-red-200 space-y-4"
            >
              <div class="flex items-start gap-3.5">
                <div class="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 text-xl">
                  ⚠️
                </div>
                <div class="flex-1">
                  <h4 class="text-sm font-semibold text-white">
                    Bukti Transfer Pembayaran Ditolak
                  </h4>
                  <p class="text-xs text-red-200/90 leading-relaxed mt-1">
                    Alasan: <strong class="text-white bg-red-900/40 px-2 py-0.5 rounded">{{ activeBooking.rejectionReason || 'Foto struk transfer tidak terbaca / nominal tidak sesuai' }}</strong>.
                  </p>
                  <p class="text-xs text-stone-300 mt-1">
                    Batas waktu unggah diperpanjang <strong>6 jam</strong>. Kesempatan unggah ulang tersisa: 
                    <strong class="text-[#DFBA73]">{{ 3 - (activeBooking.rejectionCount || 1) }} dari 3 kali</strong>.
                  </p>
                </div>
              </div>

              <!-- Inline Re-Upload Box -->
              <div class="pt-2 border-t border-red-500/20 flex flex-col sm:flex-row items-center gap-3">
                <input
                  ref="reuploadInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  class="hidden"
                  @change="handleReuploadFile"
                />
                <button
                  type="button"
                  @click="$refs.reuploadInput.click()"
                  class="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#DFBA73] text-[#DFBA73] hover:bg-[#DFBA73] hover:text-black text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Pilih File Bukti Baru</span>
                </button>
                <span v-if="reuploadFile" class="text-xs text-white truncate">
                  {{ reuploadFile.name }}
                </span>
                <button
                  v-if="reuploadFile"
                  type="button"
                  @click="submitReuploadProof"
                  class="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold transition-all cursor-pointer shadow-md"
                >
                  Kirim Bukti Baru
                </button>
              </div>
            </div>

            <!-- 4. Menunggu DP (Belum Upload Bukti / 24 Jam Countdown) -->
            <div
              v-else-if="activeBooking.orderStatus === 'menunggu_dp'"
              class="mt-6 p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div class="flex items-start gap-3.5">
                <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 text-xl">
                  ⏰
                </div>
                <div>
                  <h4 class="text-sm font-semibold text-white">
                    Selesaikan Pembayaran DP Flat Rp 1.000.000
                  </h4>
                  <p class="text-xs text-amber-200/90 leading-relaxed mt-0.5">
                    Silakan transfer ke <strong>{{ activeBooking.paymentMethod || 'Decoration BCA 8023002530' }}</strong> dan unggah bukti transfer sebelum batas waktu 24 jam habis.
                  </p>
                </div>
              </div>

              <router-link
                to="/booking"
                class="px-5 py-2.5 rounded-full bg-[#700B11] hover:bg-[#851019] text-white text-xs font-semibold transition-all shrink-0 shadow-md"
              >
                Unggah Bukti Sekarang →
              </router-link>
            </div>

            <!-- ================= 5-STAGE PROGRESS TIMELINE ================= -->
            <div class="mt-10 sm:mt-12 pt-8 border-t border-white/10">
              <h3 class="font-serif text-lg sm:text-xl text-white font-normal mb-6">
                Tahapan Progres Pesanan
              </h3>

              <!-- Timeline Bar -->
              <div class="grid grid-cols-2 md:grid-cols-5 gap-4 relative">
                <!-- Step 1: Pemesanan Dibuat -->
                <div class="flex flex-col items-center text-center space-y-2">
                  <div class="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500 flex items-center justify-center font-bold text-sm shadow-md">
                    ✓
                  </div>
                  <p class="text-xs font-semibold text-white">1. Form Dibuat</p>
                  <p class="text-[11px] text-stone-400 font-light">Data acara tercatat</p>
                </div>

                <!-- Step 2: Pembayaran DP -->
                <div class="flex flex-col items-center text-center space-y-2">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md"
                    :class="[
                      isStep2Done
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                        : activeBooking.orderStatus === 'menunggu_dp'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500 animate-pulse'
                          : 'bg-white/5 text-stone-500 border border-white/10'
                    ]"
                  >
                    <span v-if="isStep2Done">✓</span>
                    <span v-else>2</span>
                  </div>
                  <p class="text-xs font-semibold" :class="isStep2Done ? 'text-white' : 'text-stone-400'">
                    2. Transfer DP
                  </p>
                  <p class="text-[11px] text-stone-400 font-light">Flat Rp 1.000.000</p>
                </div>

                <!-- Step 3: Verifikasi Admin -->
                <div class="flex flex-col items-center text-center space-y-2">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md"
                    :class="[
                      isStep3Done
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                        : activeBooking.orderStatus === 'menunggu_verifikasi'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500 animate-pulse'
                          : 'bg-white/5 text-stone-500 border border-white/10'
                    ]"
                  >
                    <span v-if="isStep3Done">✓</span>
                    <span v-else>3</span>
                  </div>
                  <p class="text-xs font-semibold" :class="isStep3Done ? 'text-white' : 'text-stone-400'">
                    3. Verifikasi
                  </p>
                  <p class="text-[11px] text-stone-400 font-light">Kunci tanggal acara</p>
                </div>

                <!-- Step 4: Persiapan & Self Design -->
                <div class="flex flex-col items-center text-center space-y-2">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md"
                    :class="[
                      isStep4Done
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                        : isStep3Done
                          ? 'bg-[#C5A265]/20 text-[#DFBA73] border border-[#C5A265] animate-pulse'
                          : 'bg-white/5 text-stone-500 border border-white/10'
                    ]"
                  >
                    <span v-if="isStep4Done">✓</span>
                    <span v-else>4</span>
                  </div>
                  <p class="text-xs font-semibold" :class="isStep3Done ? 'text-white' : 'text-stone-400'">
                    4. Persiapan
                  </p>
                  <p class="text-[11px] text-stone-400 font-light">Self Design / Brief</p>
                </div>

                <!-- Step 5: Hari H Acara Selesai -->
                <div class="flex flex-col items-center text-center space-y-2">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md"
                    :class="[
                      activeBooking.orderStatus === 'selesai'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                        : 'bg-white/5 text-stone-500 border border-white/10'
                    ]"
                  >
                    <span v-if="activeBooking.orderStatus === 'selesai'">✓</span>
                    <span v-else>5</span>
                  </div>
                  <p class="text-xs font-semibold" :class="activeBooking.orderStatus === 'selesai' ? 'text-white' : 'text-stone-400'">
                    5. Pelaksanaan
                  </p>
                  <p class="text-[11px] text-stone-400 font-light">Hari H Sukses</p>
                </div>
              </div>
            </div>

            <!-- ================= ORDER DETAILS GRID ================= -->
            <div class="mt-10 sm:mt-12 pt-8 border-t border-white/10">
              <h3 class="font-serif text-lg sm:text-xl text-white font-normal mb-5">
                Rincian Informasi Pesanan
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm">
                <!-- Info 1: Paket -->
                <div class="p-4 rounded-2xl bg-[#141A24]/60 border border-white/5 space-y-1">
                  <p class="text-stone-400 text-xs">Pilihan Paket:</p>
                  <p class="text-white font-medium text-base">{{ activeBooking.packageName }}</p>
                </div>

                <!-- Info 2: Tanggal Acara -->
                <div class="p-4 rounded-2xl bg-[#141A24]/60 border border-white/5 space-y-1">
                  <p class="text-stone-400 text-xs">Tanggal Acara (WIB):</p>
                  <p class="text-[#DFBA73] font-medium text-base">{{ activeBooking.eventDate }}</p>
                </div>

                <!-- Info 3: Venue -->
                <div class="p-4 rounded-2xl bg-[#141A24]/60 border border-white/5 space-y-1">
                  <p class="text-stone-400 text-xs">Lokasi Venue:</p>
                  <p class="text-white font-medium">{{ activeBooking.venue || 'Belum Ditentukan' }}</p>
                </div>

                <!-- Info 4: Metode Pembayaran -->
                <div class="p-4 rounded-2xl bg-[#141A24]/60 border border-white/5 space-y-1">
                  <p class="text-stone-400 text-xs">Metode Transfer DP:</p>
                  <p class="text-white font-medium">{{ activeBooking.paymentMethod || 'Decoration BCA (8023002530)' }}</p>
                </div>

                <!-- Info 5: Total Biaya -->
                <div class="p-4 rounded-2xl bg-[#141A24]/60 border border-white/5 space-y-1">
                  <p class="text-stone-400 text-xs">Total Harga Paket:</p>
                  <p class="text-white font-bold text-base">{{ formatCurrency(activeBooking.totalPrice) }}</p>
                </div>

                <!-- Info 6: Sisa Tagihan Pelunasan -->
                <div class="p-4 rounded-2xl bg-[#141A24]/60 border border-white/5 space-y-1">
                  <p class="text-stone-400 text-xs">Sisa Pelunasan (Diatur via WhatsApp H-7):</p>
                  <p class="text-[#25D366] font-bold text-base">
                    {{ formatCurrency(Math.max(0, (activeBooking.totalPrice || 0) - 1000000)) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- ================= ACTION BUTTONS FOOTER ================= -->
            <div class="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <!-- WhatsApp Contact Button -->
              <a
                :href="whatsappAdminUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full sm:w-auto py-3 px-6 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.62C9.36 7.62 9.09 7.68 8.87 7.92C8.64 8.16 8.03 8.73 8.03 9.9C8.03 11.07 8.89 12.2 9.01 12.36C9.13 12.52 10.7 14.94 13.1 15.97C13.67 16.22 14.12 16.37 14.46 16.48C15.03 16.66 15.55 16.63 15.97 16.57C16.43 16.5 17.39 15.99 17.59 15.42C17.79 14.86 17.79 14.37 17.73 14.27C17.67 14.18 17.51 14.12 17.27 14C17.03 13.89 15.84 13.3 15.62 13.22C15.4 13.14 15.24 13.1 15.08 13.34C14.92 13.58 14.46 14.12 14.32 14.27C14.18 14.43 14.04 14.45 13.8 14.33C13.56 14.22 12.78 13.96 11.86 13.14C11.14 12.5 10.66 11.71 10.52 11.47C10.38 11.23 10.5 11.1 10.62 10.98C10.73 10.87 10.87 10.69 11 10.54C11.12 10.38 11.16 10.27 11.24 10.11C11.32 9.95 11.28 9.81 11.22 9.69C11.16 9.57 10.7 8.44 10.51 7.98C10.32 7.53 10.13 7.59 9.98 7.58C9.84 7.58 9.68 7.62 9.53 7.62Z"/>
                </svg>
                <span>Tanya Admin via WhatsApp</span>
              </a>

              <!-- Print / Download Summary -->
              <button
                @click="printSummary"
                class="w-full sm:w-auto py-3 px-6 rounded-full border border-white/20 hover:border-[#DFBA73] text-stone-300 hover:text-white text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Cetak / Simpan Bukti Booking</span>
              </button>
            </div>

          </div>

          <!-- ================= STATUS SIMULATOR PILL (FOR TESTING & DEMO) ================= -->
          <div class="p-4 rounded-2xl bg-[#0E131B]/70 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#DFBA73]"></span>
              <span>Uji Simulasi Status Pesanan (Preview):</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <button
                @click="setDemoStatus('menunggu_dp')"
                class="px-3 py-1 rounded-full border text-[11px] transition-colors"
                :class="activeBooking.orderStatus === 'menunggu_dp' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'border-white/10 text-stone-400'"
              >
                Menunggu DP
              </button>
              <button
                @click="setDemoStatus('menunggu_verifikasi')"
                class="px-3 py-1 rounded-full border text-[11px] transition-colors"
                :class="activeBooking.orderStatus === 'menunggu_verifikasi' ? 'bg-blue-500/20 border-blue-500 text-blue-300' : 'border-white/10 text-stone-400'"
              >
                Menunggu Verifikasi
              </button>
              <button
                @click="setDemoStatus('terkonfirmasi')"
                class="px-3 py-1 rounded-full border text-[11px] transition-colors"
                :class="activeBooking.orderStatus === 'terkonfirmasi' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'border-white/10 text-stone-400'"
              >
                Terkonfirmasi (DP Lunas)
              </button>
              <button
                @click="setDemoStatus('ditolak')"
                class="px-3 py-1 rounded-full border text-[11px] transition-colors"
                :class="activeBooking.orderStatus === 'ditolak' ? 'bg-red-500/20 border-red-500 text-red-300' : 'border-white/10 text-stone-400'"
              >
                Bukti Ditolak
              </button>
              <button
                @click="setDemoStatus('selesai')"
                class="px-3 py-1 rounded-full border text-[11px] transition-colors"
                :class="activeBooking.orderStatus === 'selesai' ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'border-white/10 text-stone-400'"
              >
                Selesai
              </button>
            </div>
          </div>

        </div>

        <!-- Empty State (When No Active Order) -->
        <div v-else class="bg-[#0E131B]/95 border border-white/10 rounded-3xl p-8 sm:p-14 text-center shadow-xl backdrop-blur-md">
          <div class="w-16 h-16 rounded-full bg-[#700B11]/20 border border-[#700B11]/50 text-[#C5A265] flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>

          <h3 class="font-serif text-xl sm:text-2xl text-white font-normal mb-2">
            Belum Ada Pesanan yang Berjalan
          </h3>
          <p class="text-stone-400 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed font-light">
            Pilih paket dekorasi, catering, atau wedding impian Anda di katalog Kalila untuk memulai pemesanan dan memantau statusnya di sini.
          </p>

          <div class="flex flex-wrap items-center justify-center gap-3">
            <router-link
              to="/katalog"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#700B11] to-[#941A29] text-white text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <span>Eksplorasi Paket Dekorasi</span>
              <span>→</span>
            </router-link>
            <router-link
              to="/katalog/catering"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 hover:border-[#DFBA73] text-stone-300 hover:text-white text-xs font-medium tracking-wide transition-all"
            >
              <span>Katalog Catering</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 2: ORDER HISTORY CONTENT                                              -->
      <!-- ========================================================================= -->
      <div v-else-if="activeTab === 'history'" class="animate-fade-in">
        <div class="bg-[#0E131B]/95 border border-white/10 rounded-3xl p-8 sm:p-14 text-center shadow-xl backdrop-blur-md">
          <div class="w-14 h-14 rounded-full bg-white/5 border border-white/10 text-stone-400 flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h3 class="font-serif text-xl sm:text-2xl text-white font-normal mb-2">
            Belum Ada Riwayat Pesanan Terdahulu
          </h3>
          <p class="text-stone-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-light">
            Pesanan yang telah selesai diselenggarakan atau dibatalkan akan tersimpan rapi pada tab ini sebagai arsip riwayat acara Anda.
          </p>
        </div>
      </div>

    </main>

    <!-- ================= MODAL SELF DESIGN 2D PREVIEW (PRD 4.7) ================= -->
    <div
      v-if="openSelfDesignModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div class="relative w-full max-w-2xl bg-[#1C1614] border border-[#C5A265]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
        <div class="flex items-center justify-between pb-4 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#DFBA73]/20 border border-[#DFBA73] text-[#DFBA73] flex items-center justify-center text-lg">
              🎨
            </div>
            <div>
              <h3 class="font-serif text-xl sm:text-2xl text-white font-normal">
                Kanvas Self Design 2D
              </h3>
              <p class="text-xs text-stone-400">
                Paket: {{ activeBooking?.packageName }}
              </p>
            </div>
          </div>
          <button
            @click="openSelfDesignModal = false"
            class="text-stone-400 hover:text-white p-2 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div class="p-6 rounded-2xl bg-[#0E131B] border border-dashed border-[#DFBA73]/40 text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-[#700B11]/20 border border-[#C5A265] text-[#DFBA73] flex items-center justify-center mx-auto text-2xl">
            📐
          </div>
          <h4 class="text-base font-semibold text-white">
            Kanvas Desain Aktif (Skala Pelaminan Panggung)
          </h4>
          <p class="text-xs text-stone-300 max-w-md mx-auto leading-relaxed font-light">
            Fitur kanvas 2D memungkinkan Anda mengatur posisi backdrop, standing flowers, mini garden, dan kursi pelaminan secara bebas. Desain akan disimpan sebagai JSON + PNG dan terkunci otomatis pada H-1 bulan sebelum tanggal acara.
          </p>
          <div class="p-3 rounded-xl bg-black/50 border border-white/5 text-[11px] text-stone-400 max-w-sm mx-auto">
            Dimensi Kanvas Terkalibrasi: <strong class="text-[#DFBA73]">800cm x 300cm</strong>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="openSelfDesignModal = false"
            class="px-6 py-2.5 rounded-full border border-white/20 text-stone-300 hover:text-white text-xs font-medium cursor-pointer"
          >
            Tutup
          </button>
          <a
            :href="whatsappAdminUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="px-6 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
          >
            <span>Konsultasikan Desain ke Admin</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import Navbar from "../components/common/Navbar.vue";
import Footer from "../components/common/Footer.vue";

const router = useRouter();
const authStore = useAuthStore();
const adminPhone = "628156870982";

// Active Tab: 'active' | 'history'
const activeTab = ref("active");
const openSelfDesignModal = ref(false);

// Active Booking State
const activeBooking = ref(null);
const reuploadFile = ref(null);

// Default sample booking if none in storage
const defaultSampleBooking = {
  orderCode: "KL-DK-20261122-482",
  category: "dekor",
  categoryLabel: "Dekorasi Pelaminan",
  packageName: "Dahlia Wedding (8 Meter)",
  eventDate: "2026-12-28",
  venue: "Grand Pacific Ballroom, Yogyakarta",
  totalPrice: 5500000,
  dpAmount: 1000000,
  paymentMethod: "Decoration BCA (8023002530)",
  orderStatus: "menunggu_verifikasi",
  paymentStatus: "menunggu_verifikasi",
  proofFileName: "bukti_transfer_bca_dp.jpg",
  rejectionReason: "",
  rejectionCount: 0,
  clientName: "Sarah & Reza",
};

onMounted(() => {
  // Load booking from localStorage (set by BookingView.vue)
  try {
    const saved = localStorage.getItem("kalila_current_booking");
    if (saved) {
      activeBooking.value = JSON.parse(saved);
    } else {
      activeBooking.value = defaultSampleBooking;
    }
  } catch (e) {
    activeBooking.value = defaultSampleBooking;
  }
});

// Client Profile Info
const clientDisplayName = computed(() => {
  return authStore.user?.name || activeBooking.value?.clientName || "Sarah & Reza";
});

const clientEmail = computed(() => {
  return authStore.user?.email || "sarah.reza@gmail.com";
});

const clientPhone = computed(() => {
  return authStore.user?.phone || "0812-3456-7890";
});

const userInitials = computed(() => {
  const name = clientDisplayName.value;
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
});

// Progress Timeline Step Completions
const isStep2Done = computed(() => {
  if (!activeBooking.value) return false;
  const st = activeBooking.value.orderStatus;
  return st === "menunggu_verifikasi" || st === "terkonfirmasi" || st === "berlangsung" || st === "selesai";
});

const isStep3Done = computed(() => {
  if (!activeBooking.value) return false;
  const st = activeBooking.value.orderStatus;
  return st === "terkonfirmasi" || st === "berlangsung" || st === "selesai";
});

const isStep4Done = computed(() => {
  if (!activeBooking.value) return false;
  const st = activeBooking.value.orderStatus;
  return st === "berlangsung" || st === "selesai";
});

// Status Badge Theme
const statusBadgeStyle = computed(() => {
  const status = activeBooking.value?.orderStatus;
  switch (status) {
    case "menunggu_dp":
      return {
        label: "Menunggu Pembayaran DP",
        container: "bg-amber-500/15 border-amber-500/40 text-amber-300",
        dot: "bg-amber-400",
      };
    case "menunggu_verifikasi":
      return {
        label: "Menunggu Verifikasi Admin",
        container: "bg-blue-500/15 border-blue-500/40 text-blue-300",
        dot: "bg-blue-400",
      };
    case "terkonfirmasi":
      return {
        label: "Terkonfirmasi • Jadwal Terkunci",
        container: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
        dot: "bg-emerald-400",
      };
    case "ditolak":
      return {
        label: "Bukti Ditolak • Unggah Ulang",
        container: "bg-red-500/15 border-red-500/40 text-red-300",
        dot: "bg-red-400",
      };
    case "selesai":
      return {
        label: "Pesanan Selesai",
        container: "bg-purple-500/15 border-purple-500/40 text-purple-300",
        dot: "bg-purple-400",
      };
    default:
      return {
        label: "Dalam Proses",
        container: "bg-stone-500/15 border-stone-500/40 text-stone-300",
        dot: "bg-stone-400",
      };
  }
});

// Format Currency
const formatCurrency = (val) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0);
};

// Copy Order Code
const copyOrderCode = () => {
  if (!activeBooking.value?.orderCode) return;
  navigator.clipboard.writeText(activeBooking.value.orderCode);
  alert("Nomor pesanan berhasil disalin: " + activeBooking.value.orderCode);
};

// WhatsApp Admin URL
const whatsappAdminUrl = computed(() => {
  const code = activeBooking.value?.orderCode || "Pesanan";
  const pkg = activeBooking.value?.packageName || "Paket Kalila";
  const msg = `Halo admin Kalila, saya ingin menanyakan progres pesanan saya dengan nomor *${code}* paket *${pkg}*.`;
  return `https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`;
});

// Handle Re-Upload File
const handleReuploadFile = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    alert("Ukuran file maksimal 5MB.");
    return;
  }
  reuploadFile.value = file;
};

// Submit Re-Uploaded Proof
const submitReuploadProof = () => {
  if (!reuploadFile.value || !activeBooking.value) return;
  activeBooking.value.proofFileName = reuploadFile.value.name;
  activeBooking.value.orderStatus = "menunggu_verifikasi";
  activeBooking.value.rejectionCount = (activeBooking.value.rejectionCount || 0) + 1;
  reuploadFile.value = null;

  try {
    localStorage.setItem("kalila_current_booking", JSON.stringify(activeBooking.value));
  } catch (e) {
    console.warn(e);
  }
  alert("Bukti transfer baru berhasil dikirimkan ke admin!");
};

// Simulation / Testing Setter
const setDemoStatus = (status) => {
  if (!activeBooking.value) return;
  activeBooking.value.orderStatus = status;
  if (status === "ditolak") {
    activeBooking.value.rejectionReason = "Foto struk transfer terpotong & nominal tidak jelas";
    activeBooking.value.rejectionCount = 1;
  }
  try {
    localStorage.setItem("kalila_current_booking", JSON.stringify(activeBooking.value));
  } catch (e) {
    console.warn(e);
  }
};

// Print / Save Summary
const printSummary = () => {
  window.print();
};

const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@media print {
  body {
    background: white !important;
    color: black !important;
  }
}
</style>
