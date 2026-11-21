<template>
  <div class="min-h-screen bg-[#161210] text-gray-200 font-sans selection:bg-[#C5A265] selection:text-black">
    <!-- Navbar -->
    <Navbar :show-konsultasi="false" :nav-capsule="false" />

    <!-- ========================================================================= -->
    <!-- STEP 1: FORM PEMESANAN ("Pesan Paket Sekarang")                           -->
    <!-- ========================================================================= -->
    <section
      v-if="currentStep === 1"
      class="relative w-full pt-28 sm:pt-32 md:pt-36 pb-16 sm:pb-24 lg:pb-28 overflow-hidden"
    >
      <!-- Background Image with Dark Romantic Floral Overlay -->
      <div class="absolute inset-0 z-0">
        <img
          :src="HeroFloralBg"
          alt="Booking Form Background"
          class="w-full h-full object-cover object-center scale-105"
        />
        <div class="absolute inset-0 bg-[#161210]/65 backdrop-blur-[2px]"></div>
        <div class="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#161210] to-transparent"></div>
      </div>

      <!-- Thin Golden Divider Line below Navbar -->
      <div class="absolute top-[72px] sm:top-[80px] md:top-[88px] left-0 right-0 h-[1px] bg-[#C5A265]/25 z-20 pointer-events-none"></div>

      <!-- Content Container -->
      <div class="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header: Kicker, Title, Subtitle -->
        <div class="text-center mb-8 sm:mb-12">
          <div class="inline-flex items-center justify-center gap-3 mb-2.5 sm:mb-3">
            <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
            <span class="text-[10px] sm:text-xs uppercase tracking-[0.28em] text-[#C5A265] font-semibold drop-shadow">
              FORM PEMESANAN
            </span>
            <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
          </div>

          <h1 class="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] text-white font-normal tracking-tight mb-3 sm:mb-4 leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
            Pesan Paket Sekarang
          </h1>

          <p class="text-xs sm:text-sm md:text-[15px] text-stone-300 font-light leading-relaxed max-w-xl mx-auto drop-shadow">
            Lengkapi form di bawah ini untuk melakukan pemesanan paket catering dan dekorasi pernikahan Anda.
          </p>
        </div>

        <!-- MAIN CARD CONTAINER -->
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
          <form @submit.prevent="goToPaymentStep" class="space-y-6 sm:space-y-7 relative z-10">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-5 sm:gap-y-6">

              <!-- Row 1 Left: Paket Dekorasi * -->
              <div>
                <label for="packageSelect" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
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
                    <option value="Pastel Soft &amp; Romantic Florals">Pastel Soft &amp; Romantic Florals</option>
                    <option value="Pure White, Gold &amp; Modern Glass">Pure White, Gold &amp; Modern Glass</option>
                    <option value="Bold Romantic Maroon &amp; Burgundy">Bold Romantic Maroon &amp; Burgundy</option>
                    <option value="Tradisional Adat Jawa Klasik (Gebyok Jati)">Tradisional Adat Jawa Klasik (Gebyok Jati)</option>
                    <option value="Rustic Garden &amp; Bohemian Chic">Rustic Garden &amp; Bohemian Chic</option>
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
                    <option value="Hotel &amp; Convention Center">Hotel &amp; Convention Center</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-stone-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Row 3 Right: Venue * -->
              <div>
                <label for="venueAddress" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
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
                  placeholder="Enter Your Venue"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 4 Left: Lebar Area Pelaminan -->
              <div>
                <label for="stageWidth" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
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

              <!-- Row 4 Right: Tanggal Event * -->
              <div>
                <label for="eventDate" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
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

              <!-- Row 5 Left: Email Pemesan (PRD 4.5) * -->
              <div>
                <label for="clientEmail" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <span>Email Pemesan <span class="text-[#E63946]">*</span></span>
                </label>
                <input
                  id="clientEmail"
                  v-model="form.email"
                  type="email"
                  required
                  placeholder="Contoh: sarah@gmail.com"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 5 Right: Your Instagram -->
              <div>
                <label for="clientInstagram" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162z"/>
                  </svg>
                  <span>Your Instagram</span>
                </label>
                <input
                  id="clientInstagram"
                  v-model="form.instagram"
                  type="text"
                  placeholder="Contoh: @username &amp; @secondusername"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 6 Left: Catatan Khusus -->
              <div>
                <label for="specialNotes" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  <span>Catatan Khusus / Request</span>
                </label>
                <input
                  id="specialNotes"
                  v-model="form.notes"
                  type="text"
                  placeholder="Contoh: Request pergola masuk &amp; backdrop photobooth"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 6 Right: Total Biaya Paket -->
              <div>
                <label for="totalPrice" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
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

            <!-- Submit Button (ORDER) -->
            <div class="pt-6 sm:pt-8 text-center space-y-3">
              <button
                type="submit"
                class="inline-flex items-center justify-center gap-2.5 py-3.5 px-12 sm:px-16 rounded-full bg-gradient-to-r from-[#700B11] to-[#8C1B25] hover:from-[#851019] hover:to-[#A31F2E] text-white font-semibold text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 shadow-[0_4px_24px_rgba(112,11,17,0.55)] hover:shadow-[0_8px_32px_rgba(112,11,17,0.7)] hover:scale-[1.02] active:scale-[0.98] border border-[#941A29]/70 cursor-pointer"
              >
                <svg class="w-4 h-4 -rotate-45 fill-current" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                </svg>
                <span>ORDER</span>
              </button>

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

    <!-- ========================================================================= -->
    <!-- STEP 2: BOOKING TANGGAL & PEMBAYARAN DP (Matching User Figma Mockup)       -->
    <!-- ========================================================================= -->
    <section
      v-else-if="currentStep === 2"
      class="relative w-full pt-28 sm:pt-32 md:pt-36 pb-16 sm:pb-24 lg:pb-28 overflow-hidden"
    >
      <!-- Background Image with Dark Romantic Floral Overlay -->
      <div class="absolute inset-0 z-0">
        <img
          :src="HeroFloralBg"
          alt="Payment Background"
          class="w-full h-full object-cover object-center scale-105"
        />
        <div class="absolute inset-0 bg-[#161210]/70 backdrop-blur-[2px]"></div>
        <div class="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#161210] to-transparent"></div>
      </div>

      <!-- Thin Golden Divider Line below Navbar -->
      <div class="absolute top-[72px] sm:top-[80px] md:top-[88px] left-0 right-0 h-[1px] bg-[#C5A265]/25 z-20 pointer-events-none"></div>

      <!-- Content Container -->
      <div class="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Back Button to Step 1 -->
        <button
          type="button"
          @click="currentStep = 1"
          class="inline-flex items-center gap-2 text-xs sm:text-sm text-[#DFBA73] hover:text-white mb-6 transition-colors cursor-pointer"
        >
          <span>← Kembali ke Form Pemesanan</span>
        </button>

        <!-- Header: BOOKING - Booking Tanggal matching Figma -->
        <div class="text-center mb-8 sm:mb-12">
          <div class="inline-flex items-center justify-center gap-3 mb-2 sm:mb-2.5">
            <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
            <span class="text-[10px] sm:text-xs uppercase tracking-[0.28em] text-[#C5A265] font-semibold drop-shadow">
              BOOKING
            </span>
            <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
          </div>

          <h1 class="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] text-white font-normal tracking-tight mb-3 sm:mb-3.5 leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
            Booking Tanggal
          </h1>

          <p class="text-xs sm:text-sm md:text-[15px] text-stone-300 font-light leading-relaxed max-w-xl mx-auto mb-4 drop-shadow">
            Pilih metode pembayaran dan unggah bukti transfer untuk menyelesaikan pemesanan.
          </p>

          <!-- Golden Lotus Emblem with Horizontal Line Divider matching Figma -->
          <div class="flex items-center justify-center gap-3 max-w-xs mx-auto text-[#C5A265]">
            <span class="flex-1 h-[1px] bg-[#C5A265]/40"></span>
            <!-- Lotus Emblem SVG -->
            <svg class="w-6 h-6 text-[#DFBA73] fill-current" viewBox="0 0 24 24">
              <path d="M12 3c-1.5 2.5-3.5 5.5-3.5 8 0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5c0-2.5-2-5.5-3.5-8zm-5 6c-.8 1.8-1.5 3.8-1.5 5.5 0 2.8 2.2 4.5 4.5 4.5.7 0 1.4-.2 2-.5-1.5-1.2-2.5-3.2-2.5-5.5 0-1.6.4-3.1 1-4.4-1.4.1-2.5.4-3.5.4zm10 0c-1 0-2.1-.3-3.5-.4.6 1.3 1 2.8 1 4.4 0 2.3-1 4.3-2.5 5.5.6.3 1.3.5 2 .5 2.3 0 4.5-1.7 4.5-4.5 0-1.7-.7-3.7-1.5-5.5zm-5 13c-4.4 0-8-1.8-8-4 0-.4.1-.7.4-1 1 1.5 4.2 2.5 7.6 2.5s6.6-1 7.6-2.5c.3.3.4.6.4 1 0 2.2-3.6 4-8 4z"/>
            </svg>
            <span class="flex-1 h-[1px] bg-[#C5A265]/40"></span>
          </div>
        </div>

        <!-- MAIN CARD (Matching Figma with 2-Column Split: Payment Method & Upload Proof) -->
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

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10 items-stretch">

            <!-- LEFT COLUMN (6 Cols): METODE PEMBAYARAN -->
            <div class="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div>
                <!-- Section Header -->
                <div class="flex items-center gap-3 mb-6">
                  <!-- Golden Credit Card Icon matching Figma -->
                  <div class="w-8 h-8 rounded-lg border border-[#DFBA73] text-[#DFBA73] flex items-center justify-center shrink-0">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="2" y="5" width="20" height="14" rx="2" stroke-width="1.8"/>
                      <line x1="2" y1="10" x2="22" y2="10" stroke-width="1.8"/>
                      <line x1="6" y1="15" x2="10" y2="15" stroke-width="1.8"/>
                    </svg>
                  </div>
                  <h2 class="font-serif text-2xl sm:text-[26px] text-white font-normal">
                    Metode Pembayaran
                  </h2>
                </div>

                <!-- Payment Options Radio List matching Figma -->
                <div class="space-y-4">
                  <!-- Option 1: Decoration BCA -->
                  <div
                    @click="selectedPaymentMethod = 'bca'"
                    class="rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-200 border flex items-center gap-4 sm:gap-5"
                    :class="[
                      selectedPaymentMethod === 'bca'
                        ? 'bg-[#18202C] border-[#DFBA73] shadow-[0_4px_20px_rgba(223,186,115,0.15)]'
                        : 'bg-[#141A24] border-white/10 hover:border-white/30'
                    ]"
                  >
                    <!-- Custom Gold Radio Button -->
                    <div
                      class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                      :class="selectedPaymentMethod === 'bca' ? 'border-[#DFBA73]' : 'border-white/30'"
                    >
                      <div v-if="selectedPaymentMethod === 'bca'" class="w-2.5 h-2.5 rounded-full bg-[#DFBA73]"></div>
                    </div>

                    <!-- BCA Logo Badge -->
                    <div class="w-16 sm:w-20 h-10 bg-white rounded-lg flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                      <span class="font-sans font-black text-base sm:text-lg text-[#00529C] tracking-tighter">BCA</span>
                    </div>

                    <!-- Label & Account Number -->
                    <div class="flex-1">
                      <p class="text-xs text-stone-400 font-light">Decoration BCA</p>
                      <p class="font-mono text-lg sm:text-xl font-bold text-white tracking-wide mt-0.5">
                        8023002530
                      </p>
                    </div>
                  </div>

                  <!-- Option 2: Catering Mandiri -->
                  <div
                    @click="selectedPaymentMethod = 'mandiri'"
                    class="rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-200 border flex items-center gap-4 sm:gap-5"
                    :class="[
                      selectedPaymentMethod === 'mandiri'
                        ? 'bg-[#18202C] border-[#DFBA73] shadow-[0_4px_20px_rgba(223,186,115,0.15)]'
                        : 'bg-[#141A24] border-white/10 hover:border-white/30'
                    ]"
                  >
                    <!-- Custom Gold Radio Button -->
                    <div
                      class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                      :class="selectedPaymentMethod === 'mandiri' ? 'border-[#DFBA73]' : 'border-white/30'"
                    >
                      <div v-if="selectedPaymentMethod === 'mandiri'" class="w-2.5 h-2.5 rounded-full bg-[#DFBA73]"></div>
                    </div>

                    <!-- Mandiri Logo Badge -->
                    <div class="w-16 sm:w-20 h-10 bg-white rounded-lg flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                      <span class="font-sans font-bold text-xs sm:text-sm text-[#002D62] leading-none">
                        mandirı
                      </span>
                    </div>

                    <!-- Label & Account Number -->
                    <div class="flex-1">
                      <p class="text-xs text-stone-400 font-light">Catering Mandiri</p>
                      <p class="font-mono text-lg sm:text-xl font-bold text-white tracking-wide mt-0.5">
                        8023002530
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Order Summary Info Box -->
              <div class="p-4 rounded-xl bg-[#141A24] border border-white/10 space-y-1.5 text-xs text-stone-300">
                <div class="flex justify-between items-center">
                  <span class="text-stone-400">Nomor Pesanan:</span>
                  <span class="text-white font-mono font-bold">{{ orderCode }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-stone-400">Paket:</span>
                  <span class="text-white">{{ selectedPackage?.name }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-stone-400">Tanggal Acara:</span>
                  <span class="text-[#DFBA73]">{{ form.eventDate }} (WIB)</span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-white/10 font-semibold">
                  <span class="text-stone-300">Nominal Transfer DP:</span>
                  <span class="text-base text-[#DFBA73]">Rp 1.000.000</span>
                </div>
              </div>
            </div>

            <!-- RIGHT COLUMN (6 Cols): UPLOAD BUKTI TRANSFER -->
            <div class="lg:col-span-6 flex flex-col">
              <!-- Golden Dashed Container matching Figma -->
              <div
                @click="$refs.fileInput.click()"
                class="flex-1 rounded-2xl border-2 border-dashed border-[#DFBA73]/50 hover:border-[#DFBA73] bg-[#141A24]/40 hover:bg-[#18202C]/60 p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  class="hidden"
                  @change="handleFileUpload"
                />

                <!-- Empty State before Upload -->
                <div v-if="!paymentProofPreview" class="flex flex-col items-center">
                  <!-- Large Golden Picture & Arrow Down Icon matching Figma -->
                  <div class="mb-5 text-[#DFBA73] group-hover:scale-105 transition-transform duration-300">
                    <svg class="w-20 h-20 sm:w-24 sm:h-24" fill="none" stroke="currentColor" stroke-width="1.3" viewBox="0 0 80 80">
                      <!-- Picture Frame with rounded corners -->
                      <rect x="10" y="10" width="55" height="55" rx="12" stroke="currentColor"/>
                      <!-- Mountains inside -->
                      <path d="M12 50l12-16a4 4 0 016 0l16 21" stroke="currentColor" stroke-linecap="round"/>
                      <!-- Small Sun/Dot inside -->
                      <circle cx="26" cy="26" r="3.5" fill="currentColor"/>
                      <!-- Arrow Down on top right -->
                      <path d="M60 18v22m0 0l-7-7m7 7l7-7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
                    </svg>
                  </div>

                  <!-- Title -->
                  <h3 class="font-serif text-xl sm:text-2xl text-white font-normal mb-5">
                    Upload Bukti Transfer
                  </h3>

                  <!-- Select File Pill Button matching Figma -->
                  <button
                    type="button"
                    class="py-2.5 px-7 rounded-full border border-[#DFBA73] text-[#DFBA73] group-hover:bg-[#DFBA73] group-hover:text-black transition-all flex items-center gap-2 text-xs sm:text-sm font-medium tracking-wide shadow-sm"
                  >
                    <!-- Cloud Upload Icon -->
                    <svg class="w-4 h-4 fill-none stroke-current" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    <span>Select File</span>
                  </button>

                  <!-- Disclaimer format matching Figma -->
                  <p class="text-[11px] sm:text-xs text-stone-400 font-light mt-5">
                    Format: JPG, PNG, PDF • Maks. 5MB
                  </p>
                </div>

                <!-- Preview State after Upload -->
                <div v-else class="flex flex-col items-center space-y-4">
                  <div class="relative w-36 h-44 rounded-xl overflow-hidden border border-[#DFBA73] shadow-lg bg-black/40">
                    <img
                      v-if="!isPdf"
                      :src="paymentProofPreview"
                      alt="Preview Bukti Transfer"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex flex-col items-center justify-center text-red-400 p-2 text-center">
                      <svg class="w-12 h-12 mb-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
                      </svg>
                      <span class="text-xs font-mono font-bold">DOKUMEN PDF</span>
                    </div>
                  </div>

                  <div>
                    <p class="text-xs text-white font-medium truncate max-w-[220px]">
                      {{ paymentProofFile?.name }}
                    </p>
                    <p class="text-[11px] text-[#25D366] mt-0.5">✓ File berhasil dipilih</p>
                    <button
                      type="button"
                      @click.stop="clearFile"
                      class="text-[11px] text-red-400 hover:text-red-300 underline mt-2 block mx-auto cursor-pointer"
                    >
                      Ganti file bukti
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Order Sekarang Gold Button matching Figma -->
        <div class="mt-8 sm:mt-10 text-center space-y-3">
          <button
            type="button"
            @click="submitProofAndComplete"
            :disabled="isSubmitting"
            class="inline-flex items-center justify-center gap-2.5 py-3.5 px-10 sm:px-12 rounded-full bg-[#DFBA73] hover:bg-[#cfab5a] text-black font-semibold text-xs sm:text-sm tracking-wide transition-all duration-300 shadow-[0_4px_24px_rgba(223,186,115,0.35)] hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <span v-if="!isSubmitting">Order Sekarang</span>
            <span v-else>Memproses Pesanan...</span>
            <span v-if="!isSubmitting">→</span>
          </button>

          <!-- Disclaimer below button matching Figma -->
          <div class="flex items-center justify-center gap-2 text-[11px] sm:text-xs text-stone-400">
            <svg class="w-4 h-4 text-[#DFBA73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Hubungi admin untuk ketersediaan tanggal</span>
          </div>
        </div>

      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- STEP 3: MODAL SUKSES (PRD 4.6 Poin 3: Tombol WhatsApp dengan Pesan Terformat) -->
    <!-- ========================================================================= -->
    <div
      v-if="showSuccessModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all"
    >
      <div class="relative w-full max-w-lg bg-[#1C1614] border border-[#C5A265]/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-fade-in">
        <!-- Success Icon -->
        <div class="w-16 h-16 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] flex items-center justify-center mx-auto">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>

        <h3 class="font-serif text-2xl sm:text-3xl text-white font-normal">Pemesanan Berhasil!</h3>

        <div class="p-4 rounded-2xl bg-[#120E0D] border border-white/10 text-xs text-left space-y-1.5 text-stone-300">
          <p><span class="text-stone-400">Nomor Pesanan:</span> <strong class="font-mono text-white text-sm">{{ orderCode }}</strong></p>
          <p><span class="text-stone-400">Paket:</span> {{ selectedPackage?.name }}</p>
          <p><span class="text-stone-400">Tanggal Acara:</span> {{ form.eventDate }}</p>
          <p><span class="text-stone-400">Status:</span> <span class="text-[#E6CA65] font-semibold">Menunggu Verifikasi Admin</span></p>
        </div>

        <p class="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
          Bukti transfer DP <strong>Rp 1.000.000</strong> telah diterima. Sesuai PRD, silakan klik tombol di bawah untuk konfirmasi cepat ke WhatsApp admin:
        </p>

        <!-- Action Buttons matching PRD 4.6 Poin 3 -->
        <div class="space-y-3 pt-2">
          <!-- WhatsApp Button with Pre-filled Message -->
          <a
            :href="whatsappConfirmationUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full py-3.5 px-6 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2"
          >
            <!-- WhatsApp Icon -->
            <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.62C9.36 7.62 9.09 7.68 8.87 7.92C8.64 8.16 8.03 8.73 8.03 9.9C8.03 11.07 8.89 12.2 9.01 12.36C9.13 12.52 10.7 14.94 13.1 15.97C13.67 16.22 14.12 16.37 14.46 16.48C15.03 16.66 15.55 16.63 15.97 16.57C16.43 16.5 17.39 15.99 17.59 15.42C17.79 14.86 17.79 14.37 17.73 14.27C17.67 14.18 17.51 14.12 17.27 14C17.03 13.89 15.84 13.3 15.62 13.22C15.4 13.14 15.24 13.1 15.08 13.34C14.92 13.58 14.46 14.12 14.32 14.27C14.18 14.43 14.04 14.45 13.8 14.33C13.56 14.22 12.78 13.96 11.86 13.14C11.14 12.5 10.66 11.71 10.52 11.47C10.38 11.23 10.5 11.1 10.62 10.98C10.73 10.87 10.87 10.69 11 10.54C11.12 10.38 11.16 10.27 11.24 10.11C11.32 9.95 11.28 9.81 11.22 9.69C11.16 9.57 10.7 8.44 10.51 7.98C10.32 7.53 10.13 7.59 9.98 7.58C9.84 7.58 9.68 7.62 9.53 7.62Z"/>
            </svg>
            <span>Hubungi Admin via WhatsApp</span>
          </a>

          <!-- Progress / Dashboard Link -->
          <router-link
            to="/progress"
            class="block w-full py-3 px-6 rounded-full border border-white/20 text-stone-300 hover:text-white hover:border-[#DFBA73] text-xs sm:text-sm font-medium transition-all"
          >
            Lihat Status Pesanan di Menu Progress →
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

// Step state: 1 = Form Pemesanan, 2 = Booking Tanggal & Pembayaran (Matching Figma)
const currentStep = ref(1);

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
  email: "",
  theme: "Pastel Soft & Romantic Florals",
  venueType: "Gedung / Ballroom",
  venue: "",
  stageWidth: 8,
  eventDate: "",
  notes: "",
  instagram: "",
});

// Payment method selection matching Figma: 'bca' or 'mandiri'
const selectedPaymentMethod = ref("bca");

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

// Modal and upload states
const showSuccessModal = ref(false);
const isSubmitting = ref(false);
const orderCode = ref("");
const paymentProofFile = ref(null);
const paymentProofPreview = ref("");
const isPdf = ref(false);

const adminPhone = "628156870982";

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

// Step 1 -> Step 2 (Transition to "Booking Tanggal" page)
const goToPaymentStep = () => {
  if (!form.name || !form.phone || !form.email || !form.eventDate || !form.venue) {
    alert("Harap lengkapi semua data wajib (*).");
    return;
  }

  // Generate order code
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  orderCode.value = `KL-DK-${dateStr}-${randomSuffix}`;

  // Switch to Step 2 (Booking Tanggal page)
  currentStep.value = 2;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Step 2: Handle File Upload
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("Ukuran file maksimal adalah 5 MB");
    return;
  }

  paymentProofFile.value = file;
  isPdf.value = file.type === "application/pdf";
  paymentProofPreview.value = URL.createObjectURL(file);
};

const clearFile = () => {
  paymentProofFile.value = null;
  paymentProofPreview.value = "";
  isPdf.value = false;
};

// Step 2 -> Submit: "Order Sekarang" button
const submitProofAndComplete = () => {
  if (!paymentProofFile.value) {
    alert("Harap pilih dan unggah file bukti transfer terlebih dahulu.");
    return;
  }

  isSubmitting.value = true;
  setTimeout(() => {
    isSubmitting.value = false;
    showSuccessModal.value = true;
  }, 1000);
};

// WhatsApp Confirmation URL according to PRD 4.6 Poin 3
const whatsappConfirmationUrl = computed(() => {
  const pkgName = selectedPackage.value ? selectedPackage.value.name : "Dekorasi";
  const msg = `Halo admin, saya sudah mengunggah bukti transfer DP untuk pesanan *${orderCode.value}* paket *${pkgName}*.`;
  return `https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`;
});
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
