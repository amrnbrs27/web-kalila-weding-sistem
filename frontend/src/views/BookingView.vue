<template>
  <div class="min-h-screen bg-[#161210] text-gray-200 font-sans selection:bg-[#C5A265] selection:text-black">
    <!-- Navbar -->
    <Navbar :show-konsultasi="false" :nav-capsule="false" />

    <!-- 1. HERO SECTION & FORM PEMESANAN (Matching User Mockup Exactly) -->
    <section class="relative w-full pt-28 sm:pt-32 md:pt-36 pb-16 sm:pb-24 lg:pb-28 overflow-hidden">
      <!-- Background Image with Dark Romantic Floral Overlay -->
      <div class="absolute inset-0 z-0">
        <img
          :src="HeroFloralBg"
          alt="Booking Form Background"
          class="w-full h-full object-cover object-center scale-105"
        />
        <!-- Dark tint overlay matching mockup atmosphere -->
        <div class="absolute inset-0 bg-[#161210]/65 backdrop-blur-[2px]"></div>
        <!-- Bottom gradient fade into page background -->
        <div class="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#161210] to-transparent"></div>
      </div>

      <!-- Thin Golden Divider Line below Navbar -->
      <div class="absolute top-[72px] sm:top-[80px] md:top-[88px] left-0 right-0 h-[1px] bg-[#C5A265]/25 z-20 pointer-events-none"></div>

      <!-- Content Container -->
      <div class="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header: Kicker, Title, Subtitle -->
        <div class="text-center mb-8 sm:mb-12">
          <!-- Tagline with Gold Flanking Lines -->
          <div class="inline-flex items-center justify-center gap-3 mb-2.5 sm:mb-3">
            <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
            <span class="text-[10px] sm:text-xs uppercase tracking-[0.28em] text-[#C5A265] font-semibold drop-shadow">
              FORM PEMESANAN
            </span>
            <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
          </div>

          <!-- Headline (Serif matching Mockup) -->
          <h1 class="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] text-white font-normal tracking-tight mb-3 sm:mb-4 leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
            Pesan Paket Sekarang
          </h1>

          <!-- Subtitle -->
          <p class="text-xs sm:text-sm md:text-[15px] text-stone-300 font-light leading-relaxed max-w-xl mx-auto drop-shadow">
            Lengkapi form di bawah ini untuk melakukan pemesanan paket catering dan dekorasi pernikahan Anda.
          </p>
        </div>

        <!-- MAIN CARD CONTAINER (Matching Mockup with Rounded Corners, Dark Slate Surface & Filigree Accents) -->
        <div class="relative rounded-[28px] sm:rounded-[36px] bg-[#0E131B]/95 border border-white/10 p-6 sm:p-10 lg:p-14 shadow-[0_16px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <!-- Decorative Floral Filigree Ornament - Bottom Left -->
          <div class="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 pointer-events-none opacity-20 text-[#C5A265]">
            <svg class="w-16 h-16 sm:w-24 sm:h-24" viewBox="0 0 100 100" fill="currentColor">
              <path d="M10,90 Q30,70 50,90 Q70,70 90,90 Q90,50 50,50 Q10,50 10,90 Z" opacity="0.4"/>
              <circle cx="20" cy="80" r="3"/>
              <circle cx="35" cy="65" r="2.5"/>
              <circle cx="25" cy="55" r="2"/>
            </svg>
          </div>

          <!-- Decorative Floral Filigree Ornament - Bottom Right -->
          <div class="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 pointer-events-none opacity-20 text-[#C5A265] rotate-90">
            <svg class="w-16 h-16 sm:w-24 sm:h-24" viewBox="0 0 100 100" fill="currentColor">
              <path d="M10,90 Q30,70 50,90 Q70,70 90,90 Q90,50 50,50 Q10,50 10,90 Z" opacity="0.4"/>
              <circle cx="20" cy="80" r="3"/>
              <circle cx="35" cy="65" r="2.5"/>
              <circle cx="25" cy="55" r="2"/>
            </svg>
          </div>

          <!-- 2-Column Responsive Form -->
          <form @submit.prevent="handleOrderSubmit" class="space-y-6 sm:space-y-7 relative z-10">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-5 sm:gap-y-6">

              <!-- ================= COLUMN 1 (LEFT): DETAIL DEKORASI ================= -->

              <!-- Row 1 Left: Paket Dekorasi * -->
              <div>
                <label for="packageSelect" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <!-- Arch / Flower Icon -->
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                  <span>Paket Dekorasi <span class="text-[#E63946]">*</span></span>
                </label>
                <div class="relative">
                  <select
                    id="packageSelect"
                    v-model="form.packageSlug"
                    @change="onPackageChange"
                    required
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors appearance-none pr-10 cursor-pointer"
                  >
                    <option value="" disabled>Pilih paket dekorasi</option>
                    <option v-for="pkg in decorPackages" :key="pkg.slug" :value="pkg.slug">
                      {{ pkg.name }} ({{ formatCurrency(pkg.price) }}) - Lebar: {{ pkg.stageWidth }}
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-stone-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Row 1 Right: Nama Mempelai / Pemesan * -->
              <div>
                <label for="clientName" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <!-- User Icon -->
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <span>Nama <span class="text-[#E63946]">*</span></span>
                </label>
                <input
                  id="clientName"
                  v-model="form.name"
                  type="text"
                  required
                  placeholder="Enter Your Name"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 2 Left: Nuansa / Tema Warna * -->
              <div>
                <label for="colorTheme" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <!-- Palette Icon -->
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 21a4 4 0 01-4-4 4 4 0 014-4h2a4 4 0 014 4 4 4 0 01-4 4H7zm0 0a4 4 0 004-4v-2m-4 6h10a4 4 0 004-4v-2a4 4 0 00-4-4h-2m-8 4v-2a4 4 0 014-4h2m-6 0a4 4 0 014-4V3"/>
                  </svg>
                  <span>Nuansa / Tema Warna <span class="text-[#E63946]">*</span></span>
                </label>
                <div class="relative">
                  <select
                    id="colorTheme"
                    v-model="form.theme"
                    required
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors appearance-none pr-10 cursor-pointer"
                  >
                    <option value="" disabled>Pilih konsep nuansa warna</option>
                    <option value="Pastel Soft & Romantic Florals">Pastel Soft &amp; Romantic Florals</option>
                    <option value="Pure White, Gold & Modern Glass">Pure White, Gold &amp; Modern Glass</option>
                    <option value="Bold Romantic Maroon & Burgundy">Bold Romantic Maroon &amp; Burgundy</option>
                    <option value="Tradisional Adat Jawa Klasik (Gebyok Jati)">Tradisional Adat Jawa Klasik (Gebyok Jati)</option>
                    <option value="Rustic Garden & Bohemian Chic">Rustic Garden &amp; Bohemian Chic</option>
                    <option value="Custom / Sesuai Moodboard Pribadi">Custom / Sesuai Moodboard Pribadi</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-stone-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Row 2 Right: No. WhatsApp * -->
              <div>
                <label for="clientPhone" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <!-- Phone / WhatsApp Icon -->
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  <span>No. WhatsApp <span class="text-[#E63946]">*</span></span>
                </label>
                <input
                  id="clientPhone"
                  v-model="form.phone"
                  type="tel"
                  required
                  placeholder="Contoh: 0812xxxxxxxx"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 3 Left: Tipe Venue * -->
              <div>
                <label for="venueType" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <!-- Building Icon -->
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                  <span>Tipe Venue <span class="text-[#E63946]">*</span></span>
                </label>
                <div class="relative">
                  <select
                    id="venueType"
                    v-model="form.venueType"
                    required
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors appearance-none pr-10 cursor-pointer"
                  >
                    <option value="" disabled>Pilih tipe lokasi venue</option>
                    <option value="Gedung / Ballroom">Gedung / Ballroom</option>
                    <option value="Rumah Pribadi">Rumah Pribadi</option>
                    <option value="Pendopo Adat / Joglo">Pendopo Adat / Joglo</option>
                    <option value="Outdoor / Garden / Glasshouse">Outdoor / Garden / Glasshouse</option>
                    <option value="Hotel & Convention Center">Hotel &amp; Convention Center</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-stone-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Row 3 Right: Venue (Nama / Alamat Gedung) * -->
              <div>
                <label for="venueAddress" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <!-- Location Pin Icon -->
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span>Venue <span class="text-[#E63946]">*</span></span>
                </label>
                <input
                  id="venueAddress"
                  v-model="form.venue"
                  type="text"
                  required
                  placeholder="Enter Your Venue (e.g. Gedung Wanitatama)"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 4 Left: Lebar Area Pelaminan (Meter Suffix) -->
              <div>
                <label for="stageWidth" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <!-- Dimension / Ruler Icon -->
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                  <span>Lebar Area Pelaminan</span>
                </label>
                <div class="relative">
                  <input
                    id="stageWidth"
                    v-model="form.stageWidth"
                    type="number"
                    min="4"
                    max="20"
                    placeholder="Contoh: 8"
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors pr-14"
                  />
                  <span class="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-medium text-stone-400 pointer-events-none">
                    Meter
                  </span>
                </div>
              </div>

              <!-- Row 4 Right: Tanggal Event (YYYY-MM-DD WIB) * -->
              <div>
                <label for="eventDate" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <!-- Calendar Icon -->
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span>Tanggal Event <span class="text-[#E63946]">*</span></span>
                </label>
                <div class="relative">
                  <input
                    id="eventDate"
                    v-model="form.eventDate"
                    :min="minDate"
                    type="date"
                    required
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors cursor-pointer"
                  />
                </div>
              </div>

              <!-- Row 5 Left: Catatan Khusus / Request -->
              <div>
                <label for="specialNotes" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <!-- Note Icon -->
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  <span>Catatan Khusus / Request</span>
                </label>
                <input
                  id="specialNotes"
                  v-model="form.notes"
                  type="text"
                  placeholder="Contoh: Request pergola masuk & backdrop photobooth"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 5 Right: Your Instagram (Opsional) -->
              <div>
                <label for="clientInstagram" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <!-- Instagram Icon -->
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162z"/>
                  </svg>
                  <span>Your Instagram</span>
                </label>
                <input
                  id="clientInstagram"
                  v-model="form.instagram"
                  type="text"
                  placeholder="Contoh: @username & @secondusername"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 6 Left: Metode Pembayaran DP * -->
              <div>
                <label for="paymentMethod" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <!-- Credit Card / Bank Icon -->
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  <span>Metode Pembayaran DP (Flat Rp 1.000.000) <span class="text-[#E63946]">*</span></span>
                </label>
                <div class="relative">
                  <select
                    id="paymentMethod"
                    v-model="form.paymentMethod"
                    required
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors appearance-none pr-10 cursor-pointer"
                  >
                    <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                    <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                    <option value="Transfer Bank BRI">Transfer Bank BRI</option>
                    <option value="QRIS Kalila">QRIS (GoPay / OVO / ShopeePay / All Bank)</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-stone-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Row 6 Right: Total Biaya Paket (Auto-Calculated) -->
              <div>
                <label for="totalPrice" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <!-- Money Icon -->
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Total Harga Paket</span>
                </label>
                <div class="relative">
                  <input
                    id="totalPrice"
                    :value="formatCurrency(selectedPackage ? selectedPackage.price : 0)"
                    type="text"
                    readonly
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#12161E] border border-white/10 text-[#C5A265] font-semibold text-xs sm:text-sm focus:outline-none cursor-default"
                  />
                  <span class="absolute inset-y-0 right-0 flex items-center pr-4 text-[11px] text-stone-400">
                    DP: Rp 1.000.000
                  </span>
                </div>
              </div>

            </div>

            <!-- SUBMIT BUTTON (Matching Mockup with Paper Airplane Icon) -->
            <div class="pt-6 sm:pt-8 text-center space-y-3">
              <button
                type="submit"
                class="inline-flex items-center justify-center gap-2.5 py-3.5 px-12 sm:px-16 rounded-full bg-gradient-to-r from-[#700B11] to-[#8C1B25] hover:from-[#851019] hover:to-[#A31F2E] text-white font-semibold text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 shadow-[0_4px_24px_rgba(112,11,17,0.55)] hover:shadow-[0_8px_32px_rgba(112,11,17,0.7)] hover:scale-[1.02] active:scale-[0.98] border border-[#941A29]/70 cursor-pointer"
              >
                <!-- Send / Airplane Icon matching mockup -->
                <svg class="w-4 h-4 -rotate-45 fill-current" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                </svg>
                <span>ORDER</span>
              </button>

              <!-- Sub-notice below Order Button -->
              <div class="flex items-center justify-center gap-2 text-[11px] sm:text-xs text-stone-400">
                <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>
                  Hubungi admin untuk ketersediaan tanggal &amp; verifikasi DP (Batas unggah bukti 24 jam).
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>

    <!-- 2. MODAL STEP 2: KONFIRMASI BOOKING & UNGGAH BUKTI TRANSFER DP (Sesuai PRD) -->
    <div
      v-if="showConfirmModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all"
    >
      <div class="relative w-full max-w-2xl bg-[#181412] border border-[#C5A265]/40 rounded-3xl overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[92vh]">
        <!-- Close Button -->
        <button
          @click="showConfirmModal = false"
          class="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-30 border border-white/10"
          aria-label="Tutup konfirmasi"
        >
          ✕
        </button>

        <!-- Header Modal -->
        <div class="p-6 sm:p-7 border-b border-white/10 bg-[#120E0D]">
          <span class="text-[10px] uppercase tracking-[0.25em] text-[#C5A265] font-semibold block mb-1">
            LANGKAH TERAKHIR
          </span>
          <h2 class="font-serif text-2xl sm:text-3xl text-white font-normal">
            Konfirmasi &amp; Pembayaran DP
          </h2>
          <p class="text-xs text-stone-400 font-light mt-1">
            Pesanan Anda telah dicatat. Silakan lakukan transfer DP Rp 1.000.000 dan unggah bukti transfer.
          </p>
        </div>

        <!-- Body Modal (Scrollable) -->
        <div class="p-6 sm:p-7 space-y-6 overflow-y-auto">
          <!-- Summary Box -->
          <div class="p-4 sm:p-5 rounded-2xl bg-[#221B18] border border-[#C5A265]/20 space-y-2 text-xs sm:text-sm">
            <div class="flex justify-between items-center text-stone-400">
              <span>Nomor Pesanan:</span>
              <span class="text-white font-mono font-bold">{{ orderCode }}</span>
            </div>
            <div class="flex justify-between items-center text-stone-400">
              <span>Paket Dekorasi:</span>
              <span class="text-white font-medium">{{ selectedPackage?.name }}</span>
            </div>
            <div class="flex justify-between items-center text-stone-400">
              <span>Tanggal Acara:</span>
              <span class="text-[#DFBA73] font-medium">{{ form.eventDate }} (WIB)</span>
            </div>
            <div class="flex justify-between items-center text-stone-400">
              <span>Lokasi Venue:</span>
              <span class="text-white">{{ form.venue }}</span>
            </div>
            <div class="pt-2 border-t border-white/10 flex justify-between items-center font-bold">
              <span class="text-stone-300">Nominal DP Flat:</span>
              <span class="text-lg text-[#E63946]">Rp 1.000.000</span>
            </div>
          </div>

          <!-- Bank Account / QRIS Details -->
          <div class="p-4 rounded-2xl bg-[#120E0D] border border-white/10 space-y-2.5">
            <h4 class="text-xs font-semibold uppercase tracking-wider text-[#C5A265]">
              Instruksi Transfer ({{ form.paymentMethod }})
            </h4>
            <div class="text-xs text-stone-300 space-y-1">
              <p v-if="form.paymentMethod.includes('BCA')">
                <span class="text-stone-400">Bank:</span> <strong>BCA</strong><br />
                <span class="text-stone-400">No. Rekening:</span> <strong class="font-mono text-white text-sm">8020-1928-3741</strong><br />
                <span class="text-stone-400">Atas Nama:</span> Kalila Catering &amp; Dekorasi
              </p>
              <p v-else-if="form.paymentMethod.includes('Mandiri')">
                <span class="text-stone-400">Bank:</span> <strong>Bank Mandiri</strong><br />
                <span class="text-stone-400">No. Rekening:</span> <strong class="font-mono text-white text-sm">137-00-9876543-2</strong><br />
                <span class="text-stone-400">Atas Nama:</span> Kalila Catering &amp; Dekorasi
              </p>
              <p v-else-if="form.paymentMethod.includes('BRI')">
                <span class="text-stone-400">Bank:</span> <strong>Bank BRI</strong><br />
                <span class="text-stone-400">No. Rekening:</span> <strong class="font-mono text-white text-sm">0123-01-098765-50-1</strong><br />
                <span class="text-stone-400">Atas Nama:</span> Kalila Catering &amp; Dekorasi
              </p>
              <p v-else>
                <span class="text-stone-400">Metode:</span> <strong>QRIS Nasional</strong><br />
                Buka aplikasi perbankan atau e-wallet Anda (BCA Mobile, Mandiri Livin, GoPay, OVO, ShopeePay) dan scan QRIS resmi Kalila.
              </p>
            </div>
            <p class="text-[11px] text-amber-400/90 italic pt-1 border-t border-white/5">
              ⚠️ Batas waktu transfer dan unggah bukti adalah 24 jam sebelum slot dilepas otomatis.
            </p>
          </div>

          <!-- Upload Proof Dropzone -->
          <div>
            <label class="block text-xs font-medium text-stone-300 mb-2">
              Unggah Bukti Transfer Pembayaran <span class="text-[#E63946]">*</span>
            </label>
            <div
              @click="$refs.fileInput.click()"
              class="border-2 border-dashed border-white/20 hover:border-[#C5A265] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#120E0D] hover:bg-black/30 group"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="hidden"
                @change="handleFileUpload"
              />

              <div v-if="!paymentProofPreview" class="space-y-2">
                <div class="w-12 h-12 rounded-full bg-[#C5A265]/10 text-[#C5A265] mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                </div>
                <p class="text-xs sm:text-sm text-stone-300">
                  <span class="font-semibold text-[#DFBA73]">Klik untuk unggah</span> atau drag and drop foto bukti transfer
                </p>
                <p class="text-[11px] text-stone-500">
                  Format JPG, PNG, atau WebP (Maksimal 5 MB)
                </p>
              </div>

              <!-- File Preview if uploaded -->
              <div v-else class="flex items-center justify-center gap-4">
                <img
                  :src="paymentProofPreview"
                  alt="Bukti Transfer Preview"
                  class="w-20 h-24 object-cover rounded-xl border border-white/20"
                />
                <div class="text-left">
                  <p class="text-xs text-white font-medium">{{ paymentProofFile?.name }}</p>
                  <p class="text-[11px] text-[#25D366] mt-0.5">✓ File terpilih dan siap diunggah</p>
                  <button
                    type="button"
                    @click.stop="clearFile"
                    class="text-[11px] text-red-400 hover:text-red-300 underline mt-2 cursor-pointer"
                  >
                    Ganti file bukti
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Submit Proof Button -->
          <div class="pt-2">
            <button
              type="button"
              @click="submitProofAndComplete"
              :disabled="isSubmitting"
              class="w-full py-3.5 px-6 rounded-full bg-[#700B11] hover:bg-[#851019] disabled:bg-stone-700 text-white text-xs sm:text-sm font-semibold text-center transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer border border-[#941A29]/60"
            >
              <span v-if="!isSubmitting">Kirim Bukti &amp; Selesaikan Pemesanan</span>
              <span v-else>Memproses Pemesanan...</span>
              <span v-if="!isSubmitting" class="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. MODAL SUKSES (Order Berhasil Dibuat) -->
    <div
      v-if="showSuccessModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all"
    >
      <div class="relative w-full max-w-md bg-[#1C1614] border border-[#C5A265]/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4 animate-fade-in">
        <div class="w-16 h-16 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] flex items-center justify-center mx-auto">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h3 class="font-serif text-2xl text-white font-normal">Pemesanan Berhasil!</h3>
        <p class="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
          Bukti transfer pembayaran DP sebesar <strong>Rp 1.000.000</strong> telah diterima dan status pesanan saat ini adalah <span class="text-[#E6CA65] font-medium">Menunggu Verifikasi</span>.
        </p>
        <p class="text-xs text-stone-400">
          Admin Kalila akan memverifikasi pesanan Anda di dashboard. Anda dapat melacak perkembangan pesanan melalui menu Progress.
        </p>
        <div class="pt-3">
          <router-link
            to="/progress"
            class="block w-full py-3 px-6 rounded-full bg-[#700B11] hover:bg-[#851019] text-white text-xs sm:text-sm font-semibold transition-all shadow-md border border-[#941A29]/60"
          >
            Lihat Status Pesanan di Progress →
          </router-link>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import Navbar from "../components/common/Navbar.vue";
import Footer from "../components/common/Footer.vue";

// Background Assets
import HeroFloralBg from "../assets/portofolio-bg.png";

const route = useRoute();

// 8 Decoration Packages from Catalog
const decorPackages = [
  { slug: "economy-wedding",   name: "Economy Wedding",   price: 3000000, stageWidth: "6 Meter" },
  { slug: "dahlia-wedding",    name: "Dahlia Wedding",    price: 5500000, stageWidth: "8 Meter" },
  { slug: "rose-wedding",      name: "Rose Wedding",      price: 6500000, stageWidth: "8 Meter" },
  { slug: "amaryllis-wedding", name: "Amaryllis Wedding", price: 7500000, stageWidth: "10 Meter" },
  { slug: "sunflower-wedding", name: "Sunflower Wedding", price: 8500000, stageWidth: "10 Meter" },
  { slug: "edelweiss-wedding", name: "Edelweiss Wedding", price: 9500000, stageWidth: "12 Meter" },
  { slug: "bougainvillea-wedding", name: "Bougainvillea Wedding", price: 11000000, stageWidth: "12 Meter" },
  { slug: "custom-package",    name: "Custom Package",    price: 15000000, stageWidth: "Custom" },
];

// Form state
const form = reactive({
  packageSlug: "dahlia-wedding",
  name: "",
  phone: "",
  theme: "Pastel Soft & Romantic Florals",
  venueType: "Gedung / Ballroom",
  venue: "",
  stageWidth: 8,
  eventDate: "",
  notes: "",
  instagram: "",
  paymentMethod: "Transfer Bank BCA",
});

// Minimum date is tomorrow (no past dates, per business rule)
const minDate = computed(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
});

// Currently selected package
const selectedPackage = computed(() => {
  return decorPackages.find(p => p.slug === form.packageSlug) || decorPackages[0];
});

// Synchronize stage width when package changes
const onPackageChange = () => {
  if (selectedPackage.value) {
    const match = selectedPackage.value.stageWidth.match(/\d+/);
    if (match) {
      form.stageWidth = parseInt(match[0], 10);
    }
  }
};

// Currency formatter
const formatCurrency = (val) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0);
};

// Modal states
const showConfirmModal = ref(false);
const showSuccessModal = ref(false);
const isSubmitting = ref(false);
const orderCode = ref("");
const paymentProofFile = ref(null);
const paymentProofPreview = ref("");

// Pre-fill package if routed with package parameter
onMounted(() => {
  const pkgParam = route.params.packageId || route.query.paket;
  if (pkgParam) {
    const found = decorPackages.find(p => p.slug === pkgParam || p.slug.includes(pkgParam));
    if (found) {
      form.packageSlug = found.slug;
      onPackageChange();
    }
  }
});

// Step 1: Handle Order Click
const handleOrderSubmit = () => {
  // Generate readable order code
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  orderCode.value = `KL-DK-${dateStr}-${randomSuffix}`;

  // Open modal
  showConfirmModal.value = true;
};

// Step 2: Handle Upload Proof
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("Ukuran file maksimal adalah 5 MB");
    return;
  }

  paymentProofFile.value = file;
  paymentProofPreview.value = URL.createObjectURL(file);
};

const clearFile = () => {
  paymentProofFile.value = null;
  paymentProofPreview.value = "";
};

// Step 3: Complete Booking
const submitProofAndComplete = () => {
  if (!paymentProofFile.value) {
    alert("Harap pilih foto bukti transfer terlebih dahulu.");
    return;
  }

  isSubmitting.value = true;
  setTimeout(() => {
    isSubmitting.value = false;
    showConfirmModal.value = false;
    showSuccessModal.value = true;
  }, 1000);
};
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
