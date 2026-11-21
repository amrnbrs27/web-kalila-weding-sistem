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

      <!-- Main Content Container -->
      <div class="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header: Kicker, Title, Subtitle -->
        <div class="text-center mb-8 sm:mb-10">
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

          <p class="text-xs sm:text-sm md:text-[15px] text-stone-300 font-light leading-relaxed max-w-xl mx-auto drop-shadow mb-6">
            Lengkapi form di bawah ini untuk melakukan pemesanan paket catering, dekorasi, atau wedding pernikahan Anda.
          </p>

          <!-- CATEGORY SWITCHER TABS (Dekorasi, Catering, Wedding) -->
          <div class="inline-flex items-center p-1.5 rounded-full bg-[#0E131B]/90 border border-white/15 backdrop-blur-md shadow-xl gap-1 sm:gap-2">
            <button
              type="button"
              @click="switchCategory('dekor')"
              class="px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
              :class="[
                activeCategory === 'dekor'
                  ? 'bg-gradient-to-r from-[#700B11] to-[#8C1B25] text-white shadow-[0_4px_16px_rgba(112,11,17,0.5)] border border-[#941A29]/70 font-semibold'
                  : 'text-stone-300 hover:text-white hover:bg-white/5'
              ]"
            >
              <span>🌸</span>
              <span>Dekorasi</span>
            </button>

            <button
              type="button"
              @click="switchCategory('catering')"
              class="px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
              :class="[
                activeCategory === 'catering'
                  ? 'bg-gradient-to-r from-[#700B11] to-[#8C1B25] text-white shadow-[0_4px_16px_rgba(112,11,17,0.5)] border border-[#941A29]/70 font-semibold'
                  : 'text-stone-300 hover:text-white hover:bg-white/5'
              ]"
            >
              <span>🍽️</span>
              <span>Catering</span>
            </button>

            <button
              type="button"
              @click="switchCategory('wedding')"
              class="px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
              :class="[
                activeCategory === 'wedding'
                  ? 'bg-gradient-to-r from-[#700B11] to-[#8C1B25] text-white shadow-[0_4px_16px_rgba(112,11,17,0.5)] border border-[#941A29]/70 font-semibold'
                  : 'text-stone-300 hover:text-white hover:bg-white/5'
              ]"
            >
              <span>💍</span>
              <span>Wedding</span>
            </button>
          </div>
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

          <!-- ========================================================================= -->
          <!-- A. FORM DEKORASI (Pelaminan, Tema, Lebar Panggung, dsb.)                   -->
          <!-- ========================================================================= -->
          <form
            v-if="activeCategory === 'dekor'"
            @submit.prevent="goToPaymentStep"
            class="space-y-6 sm:space-y-7 relative z-10"
          >
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
                    v-model="formDecor.packageSlug"
                    @change="onDecorPackageChange"
                    required
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors appearance-none cursor-pointer"
                  >
                    <option v-for="pkg in decorPackages" :key="pkg.slug" :value="pkg.slug" class="bg-[#18202C] text-white">
                      {{ pkg.name }} — {{ formatCurrency(pkg.price) }} ({{ pkg.stageWidth }})
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C5A265]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Row 1 Right: Nama Mempelai / Pemesan * -->
              <div>
                <label for="clientNameDecor" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <span>Nama Mempelai / Pemesan <span class="text-[#E63946]">*</span></span>
                </label>
                <input
                  id="clientNameDecor"
                  v-model="formDecor.name"
                  type="text"
                  required
                  placeholder="Enter Your Name"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 2 Left: Pilihan Konsep / Tema * -->
              <div>
                <label for="themeSelectDecor" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                  </svg>
                  <span>Konsep / Tema Dekorasi <span class="text-[#E63946]">*</span></span>
                </label>
                <div class="relative">
                  <select
                    id="themeSelectDecor"
                    v-model="formDecor.theme"
                    required
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="Pastel Soft &amp; Romantic Florals" class="bg-[#18202C]">Pastel Soft &amp; Romantic Florals</option>
                    <option value="Traditional Jawa Modern (Geber Kayu &amp; Melati)" class="bg-[#18202C]">Traditional Jawa Modern (Geber Kayu &amp; Melati)</option>
                    <option value="Sunda Siger White Elegance" class="bg-[#18202C]">Sunda Siger White Elegance</option>
                    <option value="Modern Rustic Bohemian Dried Flowers" class="bg-[#18202C]">Modern Rustic Bohemian Dried Flowers</option>
                    <option value="Grand Royal Glamour Gold &amp; Maroon" class="bg-[#18202C]">Grand Royal Glamour Gold &amp; Maroon</option>
                    <option value="Minimalist Botanical Greenery" class="bg-[#18202C]">Minimalist Botanical Greenery</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C5A265]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Row 2 Right: No. WhatsApp * -->
              <div>
                <label for="clientPhoneDecor" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  <span>No. WhatsApp <span class="text-[#E63946]">*</span></span>
                </label>
                <input
                  id="clientPhoneDecor"
                  v-model="formDecor.phone"
                  type="tel"
                  required
                  placeholder="Contoh: 0812xxxxxxxx"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 3 Left: Tipe Venue * -->
              <div>
                <label for="venueTypeDecor" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                  <span>Tipe Venue <span class="text-[#E63946]">*</span></span>
                </label>
                <div class="relative">
                  <select
                    id="venueTypeDecor"
                    v-model="formDecor.venueType"
                    required
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="Gedung / Ballroom" class="bg-[#18202C]">Gedung / Ballroom</option>
                    <option value="Hotel Bintang" class="bg-[#18202C]">Hotel Bintang</option>
                    <option value="Outdoor / Garden Party" class="bg-[#18202C]">Outdoor / Garden Party</option>
                    <option value="Kediaman Pribadi / Rumah" class="bg-[#18202C]">Kediaman Pribadi / Rumah</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C5A265]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Row 3 Right: Venue * -->
              <div>
                <label for="venueAddressDecor" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span>Venue <span class="text-[#E63946]">*</span></span>
                </label>
                <input
                  id="venueAddressDecor"
                  v-model="formDecor.venue"
                  type="text"
                  required
                  placeholder="Enter Your Venue"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 4 Left: Lebar Area Pelaminan -->
              <div>
                <label for="stageWidthDecor" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                  <span>Lebar Area Pelaminan</span>
                </label>
                <div class="relative">
                  <input
                    id="stageWidthDecor"
                    v-model="formDecor.stageWidth"
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
                <label for="eventDateDecor" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span>Tanggal Event <span class="text-[#E63946]">*</span></span>
                </label>
                <div class="relative">
                  <input
                    id="eventDateDecor"
                    v-model="formDecor.eventDate"
                    :min="minDate"
                    type="date"
                    required
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors cursor-pointer"
                  />
                </div>
              </div>

              <!-- Row 5 Left: Email Pemesan (PRD 4.5) * -->
              <div>
                <label for="clientEmailDecor" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <span>Email Pemesan <span class="text-[#E63946]">*</span></span>
                </label>
                <input
                  id="clientEmailDecor"
                  v-model="formDecor.email"
                  type="email"
                  required
                  placeholder="Contoh: sarah@gmail.com"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 5 Right: Your Instagram -->
              <div>
                <label for="clientInstagramDecor" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162z"/>
                  </svg>
                  <span>Your Instagram</span>
                </label>
                <input
                  id="clientInstagramDecor"
                  v-model="formDecor.instagram"
                  type="text"
                  placeholder="Contoh: @username &amp; @secondusername"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 6 Left: Catatan Khusus -->
              <div>
                <label for="specialNotesDecor" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  <span>Catatan Khusus / Request</span>
                </label>
                <input
                  id="specialNotesDecor"
                  v-model="formDecor.notes"
                  type="text"
                  placeholder="Contoh: Request pergola masuk &amp; backdrop photobooth"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 6 Right: Total Biaya Paket -->
              <div>
                <label for="totalPriceDecor" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Total Harga Paket</span>
                </label>
                <div class="relative">
                  <input
                    id="totalPriceDecor"
                    :value="formatCurrency(selectedDecorPackage ? selectedDecorPackage.price : 0)"
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

          <!-- ========================================================================= -->
          <!-- B. FORM CATERING (Exact Match to User Mockup media_1795264352817_6b9f8ba0) -->
          <!-- ========================================================================= -->
          <form
            v-else-if="activeCategory === 'catering'"
            @submit.prevent="goToPaymentStep"
            class="space-y-6 sm:space-y-7 relative z-10"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-5 sm:gap-y-6">

              <!-- ================= LEFT COLUMN: CATERING PACKAGES & PORTIONS ================= -->

              <!-- Row 1 Left: Paket Prasmanan * (With Cloche / Food Icon) -->
              <div>
                <label for="cateringPrasmanan" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Paket Prasmanan <span class="text-[#E63946]">*</span></span>
                </label>
                <div class="relative">
                  <select
                    id="cateringPrasmanan"
                    v-model="formCatering.prasmananSlug"
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="none" class="bg-[#18202C]">-- Tanpa Paket Prasmanan --</option>
                    <option
                      v-for="pkg in prasmananOptions"
                      :key="pkg.slug"
                      :value="pkg.slug"
                      class="bg-[#18202C] text-white"
                    >
                      {{ pkg.name }} — {{ formatCurrency(pkg.price) }} / pax
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C5A265]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Row 1 Right: Nama * (User Icon) -->
              <div>
                <label for="clientNameCatering" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <span>Nama <span class="text-[#E63946]">*</span></span>
                </label>
                <input
                  id="clientNameCatering"
                  v-model="formCatering.name"
                  type="text"
                  required
                  placeholder="Enter Your Name"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 2 Left: Paket Stall * (Storefront Icon) -->
              <div>
                <label for="cateringStall" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <span>Paket Stall <span class="text-[#E63946]">*</span></span>
                </label>
                <div class="relative">
                  <select
                    id="cateringStall"
                    v-model="formCatering.stallSlug"
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="none" class="bg-[#18202C]">-- Tanpa Paket Stall --</option>
                    <option
                      v-for="pkg in stallOptions"
                      :key="pkg.slug"
                      :value="pkg.slug"
                      class="bg-[#18202C] text-white"
                    >
                      {{ pkg.name }} — {{ formatCurrency(pkg.price) }} / porsi
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C5A265]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Row 2 Right: No. WhatsApp * (WhatsApp Icon) -->
              <div>
                <label for="clientPhoneCatering" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  <span>No. WhatsApp <span class="text-[#E63946]">*</span></span>
                </label>
                <input
                  id="clientPhoneCatering"
                  v-model="formCatering.phone"
                  type="tel"
                  required
                  placeholder="Contoh: 0812xxxxxxxx"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 3 Left: Paket Nasi Box * (Box Icon) -->
              <div>
                <label for="cateringNasiBox" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                  <span>Paket Nasi Box <span class="text-[#E63946]">*</span></span>
                </label>
                <div class="relative">
                  <select
                    id="cateringNasiBox"
                    v-model="formCatering.nasiBoxSlug"
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="none" class="bg-[#18202C]">-- Tanpa Paket Nasi Box --</option>
                    <option
                      v-for="pkg in nasiBoxOptions"
                      :key="pkg.slug"
                      :value="pkg.slug"
                      class="bg-[#18202C] text-white"
                    >
                      {{ pkg.name }} — {{ formatCurrency(pkg.price) }} / box
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C5A265]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Row 3 Right: Venue * (Map Pin Icon) -->
              <div>
                <label for="cateringVenue" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span>Venue <span class="text-[#E63946]">*</span></span>
                </label>
                <input
                  id="cateringVenue"
                  v-model="formCatering.venue"
                  type="text"
                  required
                  placeholder="Enter Your Venue"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 4 Left: Jumlah Porsi Stall (People Icon + Pax) -->
              <div>
                <label for="stallPaxInput" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <span>Jumlah Porsi Stall</span>
                </label>
                <div class="relative">
                  <input
                    id="stallPaxInput"
                    v-model.number="formCatering.stallPax"
                    type="number"
                    min="0"
                    step="50"
                    placeholder="Contoh: 500"
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors pr-14"
                  />
                  <span class="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-medium text-stone-400 pointer-events-none">
                    Pax
                  </span>
                </div>
              </div>

              <!-- Row 4 Right: Tanggal Event * (Calendar Icon) -->
              <div>
                <label for="eventDateCatering" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span>Tanggal Event <span class="text-[#E63946]">*</span></span>
                </label>
                <div class="relative">
                  <input
                    id="eventDateCatering"
                    v-model="formCatering.eventDate"
                    :min="minDate"
                    type="date"
                    required
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors cursor-pointer"
                  />
                </div>
              </div>

              <!-- Row 5 Left: Jumlah Porsi Prasmanan (People Icon + Pax) -->
              <div>
                <label for="prasmananPaxInput" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <span>Jumlah Porsi Prasmanan</span>
                </label>
                <div class="relative">
                  <input
                    id="prasmananPaxInput"
                    v-model.number="formCatering.prasmananPax"
                    type="number"
                    min="0"
                    step="50"
                    placeholder="Contoh: 500"
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors pr-14"
                  />
                  <span class="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-medium text-stone-400 pointer-events-none">
                    Pax
                  </span>
                </div>
              </div>

              <!-- Row 5 Right: Your Instagram (Instagram Icon) -->
              <div>
                <label for="clientInstagramCatering" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162z"/>
                  </svg>
                  <span>Your Instagram</span>
                </label>
                <input
                  id="clientInstagramCatering"
                  v-model="formCatering.instagram"
                  type="text"
                  placeholder="Contoh: @username &amp; @secondusername"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 6 Left: Jumlah Porsi Nasi Box (Box Icon + Pax) -->
              <div>
                <label for="nasiBoxPaxInput" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                  <span>Jumlah Porsi Nasi Box</span>
                </label>
                <div class="relative">
                  <input
                    id="nasiBoxPaxInput"
                    v-model.number="formCatering.nasiBoxPax"
                    type="number"
                    min="0"
                    step="25"
                    placeholder="Contoh: 500"
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors pr-14"
                  />
                  <span class="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-medium text-stone-400 pointer-events-none">
                    Pax
                  </span>
                </div>
              </div>

              <!-- Row 6 Right: Total (Currency Icon) -->
              <div>
                <label for="totalPriceCatering" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Total</span>
                </label>
                <div class="relative">
                  <input
                    id="totalPriceCatering"
                    :value="formatCurrency(cateringTotal)"
                    type="text"
                    readonly
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#12161E] border border-white/10 text-[#C5A265] font-bold text-xs sm:text-sm focus:outline-none cursor-default"
                  />
                  <span class="absolute inset-y-0 right-0 flex items-center pr-4 text-[11px] text-stone-400">
                    DP Flat: Rp 1.000.000
                  </span>
                </div>
              </div>

              <!-- Extra Row: Email Pemesan (Required per PRD for Notifications) -->
              <div class="md:col-span-2">
                <label for="clientEmailCatering" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <span>Email Pemesan (Untuk Notifikasi Booking) <span class="text-[#E63946]">*</span></span>
                </label>
                <input
                  id="clientEmailCatering"
                  v-model="formCatering.email"
                  type="email"
                  required
                  placeholder="Contoh: sarah@gmail.com"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
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
                  Hubungi admin untuk ketersediaan tanggal
                </span>
              </div>
            </div>
          </form>

          <!-- ========================================================================= -->
          <!-- C. FORM WEDDING (Paket Lengkap All-in-One: Dekor, Catering, MUA, dsb.)    -->
          <!-- ========================================================================= -->
          <form
            v-else-if="activeCategory === 'wedding'"
            @submit.prevent="goToPaymentStep"
            class="space-y-6 sm:space-y-7 relative z-10"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-5 sm:gap-y-6">

              <!-- Row 1 Left: Paket Wedding All-in-One * -->
              <div>
                <label for="packageSelectWedding" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span>Paket Wedding All-in-One <span class="text-[#E63946]">*</span></span>
                </label>
                <div class="relative">
                  <select
                    id="packageSelectWedding"
                    v-model="formWedding.packageSlug"
                    required
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors appearance-none cursor-pointer"
                  >
                    <option v-for="pkg in weddingPackages" :key="pkg.slug" :value="pkg.slug" class="bg-[#18202C] text-white">
                      {{ pkg.name }} — {{ formatCurrency(pkg.price) }} ({{ pkg.guestPill }})
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C5A265]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Row 1 Right: Nama Mempelai / Pemesan * -->
              <div>
                <label for="clientNameWedding" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <span>Nama Mempelai / Pemesan <span class="text-[#E63946]">*</span></span>
                </label>
                <input
                  id="clientNameWedding"
                  v-model="formWedding.name"
                  type="text"
                  required
                  placeholder="Contoh: Sarah &amp; Reza"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 2 Left: Konsep Pernikahan * -->
              <div>
                <label for="themeSelectWedding" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                  </svg>
                  <span>Konsep &amp; Tema Pernikahan <span class="text-[#E63946]">*</span></span>
                </label>
                <div class="relative">
                  <select
                    id="themeSelectWedding"
                    v-model="formWedding.theme"
                    required
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="Modern Romantic Elegance" class="bg-[#18202C]">Modern Romantic Elegance (Floral Arch)</option>
                    <option value="Tradisional Jawa Paes Ageng &amp; Gebyok" class="bg-[#18202C]">Tradisional Jawa Paes Ageng &amp; Gebyok</option>
                    <option value="Tradisional Sunda Siger &amp; Jasmine" class="bg-[#18202C]">Tradisional Sunda Siger &amp; Jasmine</option>
                    <option value="Intimate Rustic Botanical Garden" class="bg-[#18202C]">Intimate Rustic Botanical Garden</option>
                    <option value="Luxury Royal Maroon &amp; Champagne Gold" class="bg-[#18202C]">Luxury Royal Maroon &amp; Champagne Gold</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C5A265]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Row 2 Right: No. WhatsApp * -->
              <div>
                <label for="clientPhoneWedding" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  <span>No. WhatsApp <span class="text-[#E63946]">*</span></span>
                </label>
                <input
                  id="clientPhoneWedding"
                  v-model="formWedding.phone"
                  type="tel"
                  required
                  placeholder="Contoh: 0812xxxxxxxx"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 3 Left: Tipe Venue * -->
              <div>
                <label for="venueTypeWedding" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                  <span>Tipe Venue <span class="text-[#E63946]">*</span></span>
                </label>
                <div class="relative">
                  <select
                    id="venueTypeWedding"
                    v-model="formWedding.venueType"
                    required
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="Gedung / Ballroom" class="bg-[#18202C]">Gedung / Ballroom</option>
                    <option value="Hotel Bintang" class="bg-[#18202C]">Hotel Bintang</option>
                    <option value="Outdoor Garden / Villa" class="bg-[#18202C]">Outdoor Garden / Villa</option>
                    <option value="Kediaman Pribadi / Rumah" class="bg-[#18202C]">Kediaman Pribadi / Rumah</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C5A265]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Row 3 Right: Venue * -->
              <div>
                <label for="venueAddressWedding" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span>Venue <span class="text-[#E63946]">*</span></span>
                </label>
                <input
                  id="venueAddressWedding"
                  v-model="formWedding.venue"
                  type="text"
                  required
                  placeholder="Enter Your Venue"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 4 Left: Estimasi Jumlah Tamu -->
              <div>
                <label for="guestCountWedding" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <span>Estimasi Tamu Undangan</span>
                </label>
                <div class="relative">
                  <input
                    id="guestCountWedding"
                    v-model.number="formWedding.guestCount"
                    type="number"
                    min="50"
                    step="50"
                    placeholder="Contoh: 300"
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors pr-14"
                  />
                  <span class="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-medium text-stone-400 pointer-events-none">
                    Pax
                  </span>
                </div>
              </div>

              <!-- Row 4 Right: Tanggal Event * -->
              <div>
                <label for="eventDateWedding" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span>Tanggal Event <span class="text-[#E63946]">*</span></span>
                </label>
                <div class="relative">
                  <input
                    id="eventDateWedding"
                    v-model="formWedding.eventDate"
                    :min="minDate"
                    type="date"
                    required
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors cursor-pointer"
                  />
                </div>
              </div>

              <!-- Row 5 Left: Email Pemesan * -->
              <div>
                <label for="clientEmailWedding" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <span>Email Pemesan <span class="text-[#E63946]">*</span></span>
                </label>
                <input
                  id="clientEmailWedding"
                  v-model="formWedding.email"
                  type="email"
                  required
                  placeholder="Contoh: sarah@gmail.com"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 5 Right: Your Instagram -->
              <div>
                <label for="clientInstagramWedding" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162z"/>
                  </svg>
                  <span>Your Instagram</span>
                </label>
                <input
                  id="clientInstagramWedding"
                  v-model="formWedding.instagram"
                  type="text"
                  placeholder="Contoh: @username &amp; @secondusername"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 6 Left: Catatan Khusus -->
              <div>
                <label for="specialNotesWedding" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  <span>Catatan Khusus / Request Tambahan</span>
                </label>
                <input
                  id="specialNotesWedding"
                  v-model="formWedding.notes"
                  type="text"
                  placeholder="Contoh: Request MUA adat Jawa &amp; tambahan 2 menu stall"
                  class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#18202C] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Row 6 Right: Total Biaya Paket Wedding -->
              <div>
                <label for="totalPriceWedding" class="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-stone-300 mb-2">
                  <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Total Harga Paket Wedding</span>
                </label>
                <div class="relative">
                  <input
                    id="totalPriceWedding"
                    :value="formatCurrency(selectedWeddingPackage ? selectedWeddingPackage.price : 0)"
                    type="text"
                    readonly
                    class="w-full px-4 py-3 rounded-xl sm:rounded-2xl bg-[#12161E] border border-white/10 text-[#C5A265] font-semibold text-xs sm:text-sm focus:outline-none cursor-default"
                  />
                  <span class="absolute inset-y-0 right-0 flex items-center pr-4 text-[11px] text-stone-400">
                    DP Flat: Rp 1.000.000
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
              <div class="p-4 rounded-xl bg-[#141A24] border border-white/10 space-y-2 text-xs text-stone-300">
                <div class="flex justify-between items-center">
                  <span class="text-stone-400">Nomor Pesanan:</span>
                  <span class="text-white font-mono font-bold">{{ orderCode }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-stone-400">Kategori:</span>
                  <span class="text-white uppercase font-medium">{{ currentOrderSummary.categoryLabel }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-stone-400">Paket:</span>
                  <span class="text-white font-medium text-right max-w-[240px] truncate">{{ currentOrderSummary.packageName }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-stone-400">Tanggal Acara:</span>
                  <span class="text-[#DFBA73]">{{ currentOrderSummary.eventDate }} (WIB)</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-stone-400">Lokasi Venue:</span>
                  <span class="text-stone-200">{{ currentOrderSummary.venue }}</span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-white/10">
                  <span class="text-stone-400">Total Harga:</span>
                  <span class="text-sm font-semibold text-white">{{ formatCurrency(currentOrderSummary.totalPrice) }}</span>
                </div>
                <div class="flex justify-between items-center pt-1 font-semibold">
                  <span class="text-stone-300">Nominal Transfer DP Flat:</span>
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
                      <rect x="10" y="10" width="55" height="55" rx="12" stroke="currentColor"/>
                      <path d="M12 50l12-16a4 4 0 016 0l16 21" stroke="currentColor" stroke-linecap="round"/>
                      <circle cx="26" cy="26" r="3.5" fill="currentColor"/>
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
          <p><span class="text-stone-400">Kategori:</span> {{ currentOrderSummary.categoryLabel }}</p>
          <p><span class="text-stone-400">Paket:</span> {{ currentOrderSummary.packageName }}</p>
          <p><span class="text-stone-400">Tanggal Acara:</span> {{ currentOrderSummary.eventDate }}</p>
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
import { useAuthStore } from "../stores/auth.js";
import Navbar from "../components/common/Navbar.vue";
import Footer from "../components/common/Footer.vue";

// Background Assets
import HeroFloralBg from "../assets/portofolio-bg.png";

const route = useRoute();
const authStore = useAuthStore();

// Step state: 1 = Form Pemesanan, 2 = Booking Tanggal & Pembayaran (Matching Figma)
const currentStep = ref(1);

// Active category: 'dekor' | 'catering' | 'wedding'
const activeCategory = ref("dekor");

const switchCategory = (cat) => {
  activeCategory.value = cat;
};

// =========================================================================
// 1. DATA PAKET DEKORASI
// =========================================================================
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

const formDecor = reactive({
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

const selectedDecorPackage = computed(() => {
  return decorPackages.find(p => p.slug === formDecor.packageSlug) || decorPackages[0];
});

const onDecorPackageChange = () => {
  if (selectedDecorPackage.value) {
    const match = selectedDecorPackage.value.stageWidth.match(/\d+/);
    if (match) {
      formDecor.stageWidth = parseInt(match[0], 10);
    }
  }
};

// =========================================================================
// 2. DATA PAKET CATERING (Prasmanan, Stall, Nasi Box)
// =========================================================================
const prasmananOptions = [
  { slug: "prasmanan-silver", name: "Paket Prasmanan Silver", price: 21000 },
  { slug: "prasmanan-gold",   name: "Paket Prasmanan Gold",   price: 27000 },
  { slug: "prasmanan-deluxe", name: "Paket Prasmanan Deluxe", price: 35000 },
];

const stallOptions = [
  { slug: "stall-sate-ayam",      name: "Stall Sate Ayam Madura", price: 15000 },
  { slug: "stall-zuppa-soup",     name: "Stall Zuppa Soup",     price: 16000 },
  { slug: "stall-kambing-guling", name: "Stall Kambing Guling", price: 25000 },
];

const nasiBoxOptions = [
  { slug: "nasi-box-silver", name: "Nasi Box Silver", price: 22000 },
  { slug: "nasi-box-gold",   name: "Nasi Box Gold",   price: 28000 },
  { slug: "nasi-box-deluxe", name: "Nasi Box Deluxe", price: 35000 },
];

const formCatering = reactive({
  prasmananSlug: "prasmanan-silver",
  stallSlug: "stall-sate-ayam",
  nasiBoxSlug: "none",
  prasmananPax: 500,
  stallPax: 200,
  nasiBoxPax: 0,
  name: "",
  phone: "",
  email: "",
  venue: "",
  eventDate: "",
  instagram: "",
  notes: "",
});

const selectedPrasmanan = computed(() => {
  return prasmananOptions.find(p => p.slug === formCatering.prasmananSlug);
});

const selectedStall = computed(() => {
  return stallOptions.find(s => s.slug === formCatering.stallSlug);
});

const selectedNasiBox = computed(() => {
  return nasiBoxOptions.find(n => n.slug === formCatering.nasiBoxSlug);
});

// Real-time calculation for Catering Total
const cateringTotal = computed(() => {
  const pPrice = selectedPrasmanan.value ? selectedPrasmanan.value.price : 0;
  const sPrice = selectedStall.value ? selectedStall.value.price : 0;
  const nPrice = selectedNasiBox.value ? selectedNasiBox.value.price : 0;

  const pTotal = formCatering.prasmananSlug !== "none" ? pPrice * (formCatering.prasmananPax || 0) : 0;
  const sTotal = formCatering.stallSlug !== "none" ? sPrice * (formCatering.stallPax || 0) : 0;
  const nTotal = formCatering.nasiBoxSlug !== "none" ? nPrice * (formCatering.nasiBoxPax || 0) : 0;

  return pTotal + sTotal + nTotal;
});

// =========================================================================
// 3. DATA PAKET WEDDING (All-in-One: Dekorasi + Catering + MUA + WO)
// =========================================================================
const weddingPackages = [
  {
    slug: "economy-wedding-package",
    name: "Economy Package",
    price: 28500000,
    guestPill: "200 Pax",
    guestCount: 200
  },
  {
    slug: "premium-wedding-package",
    name: "Premium Package",
    price: 45000000,
    guestPill: "400 Pax",
    guestCount: 400
  },
  {
    slug: "luxury-wedding-package",
    name: "Luxury Package",
    price: 68000000,
    guestPill: "600 Pax",
    guestCount: 600
  },
  {
    slug: "custom-wedding-package",
    name: "Custom Package",
    price: 85000000,
    guestPill: "Custom Tailored",
    guestCount: 500
  },
];

const formWedding = reactive({
  packageSlug: "economy-wedding-package",
  name: "",
  phone: "",
  email: "",
  theme: "Modern Romantic Elegance",
  venueType: "Gedung / Ballroom",
  venue: "",
  guestCount: 200,
  eventDate: "",
  instagram: "",
  notes: "",
});

const selectedWeddingPackage = computed(() => {
  return weddingPackages.find(w => w.slug === formWedding.packageSlug) || weddingPackages[0];
});

// =========================================================================
// STEP 2: SUMMARY & PAYMENT STATE
// =========================================================================
const selectedPaymentMethod = ref("bca");

// Minimum date is tomorrow (no past dates, per business rule)
const minDate = computed(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
});

// Unified Order Summary across all 3 categories
const currentOrderSummary = computed(() => {
  if (activeCategory.value === "catering") {
    const parts = [];
    if (selectedPrasmanan.value && formCatering.prasmananSlug !== "none") {
      parts.push(`${selectedPrasmanan.value.name} (${formCatering.prasmananPax} Pax)`);
    }
    if (selectedStall.value && formCatering.stallSlug !== "none") {
      parts.push(`${selectedStall.value.name} (${formCatering.stallPax} Pax)`);
    }
    if (selectedNasiBox.value && formCatering.nasiBoxSlug !== "none") {
      parts.push(`${selectedNasiBox.value.name} (${formCatering.nasiBoxPax} Box)`);
    }
    return {
      categoryLabel: "Catering Pernikahan",
      packageName: parts.length > 0 ? parts.join(" + ") : "Custom Catering",
      eventDate: formCatering.eventDate,
      venue: formCatering.venue,
      name: formCatering.name,
      totalPrice: cateringTotal.value,
    };
  } else if (activeCategory.value === "wedding") {
    return {
      categoryLabel: "Paket Wedding All-in-One",
      packageName: selectedWeddingPackage.value?.name || "Wedding Package",
      eventDate: formWedding.eventDate,
      venue: formWedding.venue,
      name: formWedding.name,
      totalPrice: selectedWeddingPackage.value?.price || 0,
    };
  } else {
    // Dekor
    return {
      categoryLabel: "Dekorasi Pelaminan",
      packageName: selectedDecorPackage.value?.name || "Dekorasi",
      eventDate: formDecor.eventDate,
      venue: formDecor.venue,
      name: formDecor.name,
      totalPrice: selectedDecorPackage.value?.price || 0,
    };
  }
});

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

// Step 1 -> Step 2 (Transition to "Booking Tanggal" page)
const goToPaymentStep = () => {
  const summary = currentOrderSummary.value;

  if (activeCategory.value === "catering") {
    if (!formCatering.name || !formCatering.phone || !formCatering.email || !formCatering.eventDate || !formCatering.venue) {
      alert("Harap lengkapi semua kolom wajib (*) untuk pemesanan catering.");
      return;
    }
    if (cateringTotal.value <= 0) {
      alert("Harap pilih minimal satu menu prasmanan, stall, atau nasi box.");
      return;
    }
  } else if (activeCategory.value === "wedding") {
    if (!formWedding.name || !formWedding.phone || !formWedding.email || !formWedding.eventDate || !formWedding.venue) {
      alert("Harap lengkapi semua kolom wajib (*) untuk pemesanan wedding.");
      return;
    }
  } else {
    // Dekor
    if (!formDecor.name || !formDecor.phone || !formDecor.email || !formDecor.eventDate || !formDecor.venue) {
      alert("Harap lengkapi semua kolom wajib (*) untuk pemesanan dekorasi.");
      return;
    }
  }

  // Generate category-specific order code
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const prefix = activeCategory.value === "catering" ? "KL-CT" : activeCategory.value === "wedding" ? "KL-WD" : "KL-DK";
  orderCode.value = `${prefix}-${dateStr}-${randomSuffix}`;

  // Switch to Step 2 (Booking Tanggal page)
  currentStep.value = 2;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Step 2: Handle File Upload
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("Ukuran file maksimal adalah 5MB.");
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
  const pkgName = currentOrderSummary.value.packageName;
  const msg = `Halo admin, saya sudah mengunggah bukti transfer DP untuk pesanan *${orderCode.value}* paket *${pkgName}*.`;
  return `https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`;
});

// Auto-fill logged-in user profile & pre-fill package parameter from URL
onMounted(() => {
  // Pre-fill user data if logged in
  if (authStore.user) {
    const uName = authStore.user.name || "";
    const uPhone = authStore.user.phone || "";
    const uEmail = authStore.user.email || "";

    formDecor.name = uName;
    formDecor.phone = uPhone;
    formDecor.email = uEmail;

    formCatering.name = uName;
    formCatering.phone = uPhone;
    formCatering.email = uEmail;

    formWedding.name = uName;
    formWedding.phone = uPhone;
    formWedding.email = uEmail;
  }

  // Pre-fill from route parameters or queries
  const pkgParam = route.params.packageId || route.query.paket || route.query.package;
  const catParam = route.query.category;

  if (catParam === "catering") {
    activeCategory.value = "catering";
  } else if (catParam === "wedding") {
    activeCategory.value = "wedding";
  } else if (catParam === "dekor") {
    activeCategory.value = "dekor";
  }

  if (pkgParam) {
    // Check if it matches catering packages
    const foundPrasmanan = prasmananOptions.find(p => p.slug === pkgParam || p.slug.includes(pkgParam));
    const foundStall = stallOptions.find(s => s.slug === pkgParam || s.slug.includes(pkgParam));
    const foundNasiBox = nasiBoxOptions.find(n => n.slug === pkgParam || n.slug.includes(pkgParam));

    if (foundPrasmanan || foundStall || foundNasiBox) {
      activeCategory.value = "catering";
      if (foundPrasmanan) formCatering.prasmananSlug = foundPrasmanan.slug;
      if (foundStall) formCatering.stallSlug = foundStall.slug;
      if (foundNasiBox) formCatering.nasiBoxSlug = foundNasiBox.slug;
      return;
    }

    // Check if it matches wedding packages
    const foundWedding = weddingPackages.find(w => w.slug === pkgParam || w.slug.includes(pkgParam));
    if (foundWedding) {
      activeCategory.value = "wedding";
      formWedding.packageSlug = foundWedding.slug;
      formWedding.guestCount = foundWedding.guestCount;
      return;
    }

    // Check if it matches decor packages
    const foundDecor = decorPackages.find(p => p.slug === pkgParam || p.slug.includes(pkgParam));
    if (foundDecor) {
      activeCategory.value = "dekor";
      formDecor.packageSlug = foundDecor.slug;
      onDecorPackageChange();
      return;
    }
  }
});
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(0.8) sepia(50%) saturate(1000%) hue-rotate(5deg);
  cursor: pointer;
}
</style>
