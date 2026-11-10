<template>
  <div class="min-h-screen bg-[#151314] text-gray-200 font-sans selection:bg-[#C5A265] selection:text-black">
    <!-- Navbar -->
    <Navbar />

    <!-- 1. HERO SECTION (Matching Figma Image Exactly) -->
    <section class="relative w-full min-h-[580px] sm:min-h-[620px] md:h-[50vw] lg:h-[48vw] md:min-h-[560px] md:max-h-[860px] flex flex-col justify-between pt-20 sm:pt-24 md:pt-28 overflow-hidden">
      <!-- Exact Hero Background Image (Clean 1736x906 export from Figma) -->
      <div class="absolute inset-0 z-0">
        <img
          :src="heroBg"
          alt="Kalila Wedding Dream Stage"
          fetchpriority="high"
          decoding="sync"
          width="1600"
          height="835"
          class="w-full h-full object-cover object-bottom"
        />
        <!-- Subtle Top vignette so Navbar and Headline are readable without obscuring stage -->
        <div class="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-transparent"></div>
      </div>

      <!-- Center Hero Content -->
      <div class="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center my-auto">
        <!-- Subtitle with lines -->
        <div class="inline-flex items-center justify-center gap-3 mb-2.5 sm:mb-3">
          <span class="w-8 md:w-10 h-[1.5px] bg-[#DFBA73]"></span>
          <span class="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] text-[#DFBA73] font-semibold drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            WEDDING PLANNER & DECORATION
          </span>
          <span class="w-8 md:w-10 h-[1.5px] bg-[#DFBA73]"></span>
        </div>

        <!-- Headline -->
        <h1 class="font-serif text-3xl sm:text-5xl md:text-5xl lg:text-[56px] text-white font-normal tracking-tight leading-[1.12] mb-3 sm:mb-4 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          Create Your Dream Wedding
        </h1>

        <!-- Subheading (2 lines exactly as in Figma) -->
        <p class="text-xs sm:text-sm md:text-[15px] text-white/95 max-w-xl mx-auto font-light leading-relaxed mb-6 sm:mb-7 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
          Wujudkan pernikahan impian Anda dengan dekorasi yang elegan<br class="hidden sm:inline" />
          dan layanan profesional dari Kalila Catering & Dekorasi.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-row items-center justify-center gap-3.5 sm:gap-4">
          <!-- Button 1: Warm Gold / Champagne -->
          <a
            :href="whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Konsultasi sekarang via WhatsApp"
            class="inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-[#D4AF6B] hover:bg-[#E2BE7A] text-[#111111] text-xs sm:text-[13px] font-semibold tracking-wide transition-all shadow-[0_4px_18px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95"
          >
            <span>Konsultasi Sekarang</span>
            <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>

          <!-- Button 2: Semi-Transparent Glass with White Border & Right Arrow -->
          <router-link
            to="/portofolio"
            aria-label="Lihat portofolio pernikahan Kalila"
            class="inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-black/35 hover:bg-black/55 text-white border border-white/70 hover:border-white text-xs sm:text-[13px] font-medium tracking-wide transition-all backdrop-blur-sm shadow-[0_4px_18px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95"
          >
            <span>Lihat Portofolio</span>
            <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </router-link>
        </div>
      </div>

      <!-- Hero Bottom: 3 Features Strip (Kotak panjang hitam transparan mengikuti panjang navbar) -->
      <div class="relative z-10 w-full mt-auto pb-6 sm:pb-8 lg:pb-10 pt-2">
        <div class="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div class="w-full rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 px-6 sm:px-10 lg:px-12 py-6 sm:py-7 lg:py-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-0">
              <!-- Feature 1: Dekorasi Elegan -->
              <div class="flex items-center gap-4 sm:gap-5 shrink-0">
                <img
                  :src="iconDekorasi"
                  alt="Dekorasi Elegan"
                  width="64"
                  height="64"
                  class="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 object-contain shrink-0 drop-shadow-[0_2px_12px_rgba(223,186,115,0.35)]"
                />
                <div class="leading-snug">
                  <p class="text-sm sm:text-base lg:text-[17px] font-bold text-white tracking-normal drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                    Dekorasi Elegan
                  </p>
                  <p class="text-[11px] sm:text-[13px] text-gray-300 font-normal mt-0.5 sm:mt-1">
                    Desain sesuai tema impian Anda
                  </p>
                </div>
              </div>

              <!-- Divider 1: Tepat 50% di tengah ruang antara Feature 1 dan Feature 2 -->
              <div class="hidden md:flex flex-1 items-center justify-center px-4">
                <div class="w-[1px] h-12 lg:h-14 bg-white/35"></div>
              </div>

              <!-- Feature 2: Tim Profesional -->
              <div class="flex items-center gap-4 sm:gap-5 shrink-0">
                <img
                  :src="iconTim"
                  alt="Tim Profesional"
                  width="64"
                  height="64"
                  class="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 object-contain shrink-0 drop-shadow-[0_2px_12px_rgba(223,186,115,0.35)]"
                />
                <div class="leading-snug">
                  <p class="text-sm sm:text-base lg:text-[17px] font-bold text-white tracking-normal drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                    Tim Profesional
                  </p>
                  <p class="text-[11px] sm:text-[13px] text-gray-300 font-normal mt-0.5 sm:mt-1">
                    Berpengalaman & terpercaya
                  </p>
                </div>
              </div>

              <!-- Divider 2: Tepat 50% di tengah ruang antara Feature 2 dan Feature 3 -->
              <div class="hidden md:flex flex-1 items-center justify-center px-4">
                <div class="w-[1px] h-12 lg:h-14 bg-white/35"></div>
              </div>

              <!-- Feature 3: Layanan Lengkap -->
              <div class="flex items-center gap-4 sm:gap-5 shrink-0">
                <img
                  :src="iconLayanan"
                  alt="Layanan Lengkap"
                  width="64"
                  height="64"
                  class="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 object-contain shrink-0 drop-shadow-[0_2px_12px_rgba(223,186,115,0.35)]"
                />
                <div class="leading-snug">
                  <p class="text-sm sm:text-base lg:text-[17px] font-bold text-white tracking-normal drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                    Layanan Lengkap
                  </p>
                  <p class="text-[11px] sm:text-[13px] text-gray-300 font-normal mt-0.5 sm:mt-1">
                    Catering, dekorasi, dokumentasi, dll.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. COUNTER / STATS BAR (Dark Card matching Figma with vertical dividers, no shadow) -->
    <section ref="statsRef" class="py-8 sm:py-10 bg-[#151314]">
      <div class="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-black rounded-2xl py-8 sm:py-9 px-6 sm:px-10">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 items-center">
            <!-- Metric 1: +298 Mitra Vendor -->
            <div class="text-center md:px-4">
              <p class="font-serif text-3xl sm:text-4xl lg:text-[40px] text-white font-normal tracking-tight"><span class="text-[#DFBA73]">+</span>{{ countVendor }}</p>
              <p class="text-xs sm:text-[13px] text-gray-400 mt-1 font-medium tracking-wide">Mitra Vendor</p>
            </div>

            <!-- Metric 2: +4080 Pelanggan -->
            <div class="text-center md:px-4 md:border-l md:border-white/10">
              <p class="font-serif text-3xl sm:text-4xl lg:text-[40px] text-white font-normal tracking-tight"><span class="text-[#DFBA73]">+</span>{{ countPelanggan }}</p>
              <p class="text-xs sm:text-[13px] text-gray-400 mt-1 font-medium tracking-wide">Pelanggan</p>
            </div>

            <!-- Metric 3: +3890 Acara Terselenggara -->
            <div class="text-center md:px-4 md:border-l md:border-white/10">
              <p class="font-serif text-3xl sm:text-4xl lg:text-[40px] text-white font-normal tracking-tight"><span class="text-[#DFBA73]">+</span>{{ countAcara }}</p>
              <p class="text-xs sm:text-[13px] text-gray-400 mt-1 font-medium tracking-wide">Acara Terselenggara</p>
            </div>

            <!-- Metric 4: 20+ Tahun Pengalaman -->
            <div class="text-center md:px-4 md:border-l md:border-white/10">
              <p class="font-serif text-3xl sm:text-4xl lg:text-[40px] text-white font-normal tracking-tight">{{ countPengalaman }}<span class="text-[#DFBA73]">+</span></p>
              <p class="text-xs sm:text-[13px] text-gray-400 mt-1 font-medium tracking-wide">Tahun Pengalaman</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. ABOUT US SECTION ("Kalila Catering & Dekorasi") -->
    <section class="pt-12 sm:pt-16 lg:pt-20 pb-10 sm:pb-12 lg:pb-12 bg-[#151314]">
      <div class="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          <!-- Text Left (Sejajar dengan gambar: atas rata dengan bagian atas foto, bawah rata dengan bagian bawah foto) -->
          <div class="lg:col-span-6 flex flex-col justify-between space-y-6 lg:space-y-0 py-0.5">
            <div>
              <h2 class="font-serif italic text-3xl sm:text-4xl lg:text-[42px] text-[#DFBA73] font-normal leading-[1.18] tracking-tight -mt-1 lg:-mt-1.5 mb-5 sm:mb-6">
                Kalila Catering & Dekorasi
              </h2>
              <div class="space-y-4 text-xs sm:text-sm md:text-[15px] text-gray-300 leading-relaxed font-light">
                <p>
                  Kalila Catering & Dekorasi didirikan pada tahun 2005, dengan pengalaman yang hampir 17 tahun, kami berkomitmen untuk memberikan pelayanan terbaik di setiap momen spesial Anda.
                </p>
                <p>
                  kami menyediakan layanan lengkap mulai dari catering, dekorasi, dokumentasi, hingga wedding organizer dengan tim profesional yang siap membantu mewujudkan pernikahan impian Anda.
                </p>
              </div>
            </div>

            <div class="pt-4 lg:pt-0">
              <router-link
                to="/kontak"
                class="inline-flex items-center gap-2.5 px-6 sm:px-7 py-3 rounded-full bg-[#D4AF6B] hover:bg-[#E2BE7A] text-[#111111] text-xs sm:text-[13px] font-semibold tracking-wide transition-all shadow-[0_4px_18px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95"
              >
                <span>Tentang Kami</span>
                <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </router-link>
            </div>
          </div>

          <!-- Image Right: Indonesian Traditional Wedding Couple (Exact from Figma) -->
          <div class="lg:col-span-6">
            <div class="w-full h-[320px] sm:h-[380px] lg:h-[390px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/5">
              <img
                :src="aboutWeddingImg"
                alt="Pengantin Tradisional Kalila Catering & Dekorasi"
                loading="lazy"
                decoding="async"
                width="594"
                height="688"
                class="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. WEDDING PACKAGE SECTION ("Paket Pernikahan") - Full Bleed Banner (Mentok Kiri Kanan) -->
    <section class="relative w-full mt-6 sm:mt-7 lg:mt-8 mb-0 overflow-hidden min-h-[380px] sm:min-h-[420px] lg:min-h-[450px] flex items-center bg-[#151314]">
      <!-- Background Image: Couple pouring wine on floral stage (Stretches edge-to-edge) -->
      <img
        :src="weddingPackageBg"
        alt="Paket Pernikahan Kalila Catering & Dekorasi"
        loading="lazy"
        decoding="async"
        width="1400"
        height="540"
        class="absolute inset-0 w-full h-full object-cover object-right md:object-[right_center] z-0"
      />

      <!-- Gradient overlay for text contrast across mobile & desktop -->
      <div class="absolute inset-0 bg-gradient-to-r from-black/95 via-black/85 md:via-black/50 to-transparent z-10 pointer-events-none"></div>

      <!-- Content overlay: Aligned with site layout container -->
      <div class="relative z-20 w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14">
        <div class="max-w-xl lg:max-w-2xl">
          <!-- Kicker / Tag -->
          <span class="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#DFBA73] font-semibold">
            WEDDING PACKAGE
          </span>

          <!-- Heading -->
          <h2 class="font-serif text-3xl sm:text-4xl lg:text-[44px] text-white font-normal mt-1.5 sm:mt-2 leading-tight tracking-tight">
            Paket Pernikahan
          </h2>

          <!-- Subtitle -->
          <p class="text-xs sm:text-sm text-gray-200/90 leading-relaxed font-light mt-3 sm:mt-3.5 max-w-md sm:max-w-lg">
            Kami menyediakan berbagai paket pernikahan yang bisa disesuaikan dengan kebutuhan dan anggaran Anda.
          </p>

          <!-- 2-Columns Checklist with Red Checkmark Badges (Exact from Figma) -->
          <div class="grid grid-cols-2 gap-y-3 sm:gap-y-3.5 gap-x-6 sm:gap-x-10 mt-6 sm:mt-7 text-xs sm:text-[13px]">
            <!-- Column 1 -->
            <div class="space-y-3 sm:space-y-3.5">
              <div class="flex items-center gap-2.5">
                <span class="w-4 h-4 rounded-full bg-[#8B1E2F] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <svg class="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span class="text-white font-normal tracking-wide">Wedding Organizer</span>
              </div>
              <div class="flex items-center gap-2.5">
                <span class="w-4 h-4 rounded-full bg-[#8B1E2F] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <svg class="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span class="text-white font-normal tracking-wide">Catering</span>
              </div>
              <div class="flex items-center gap-2.5">
                <span class="w-4 h-4 rounded-full bg-[#8B1E2F] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <svg class="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span class="text-white font-normal tracking-wide">Dekorasi</span>
              </div>
              <div class="flex items-center gap-2.5">
                <span class="w-4 h-4 rounded-full bg-[#8B1E2F] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <svg class="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span class="text-white font-normal tracking-wide">Make Up</span>
              </div>
            </div>

            <!-- Column 2 -->
            <div class="space-y-3 sm:space-y-3.5">
              <div class="flex items-center gap-2.5">
                <span class="w-4 h-4 rounded-full bg-[#8B1E2F] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <svg class="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span class="text-white font-normal tracking-wide">Entertaint</span>
              </div>
              <div class="flex items-center gap-2.5">
                <span class="w-4 h-4 rounded-full bg-[#8B1E2F] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <svg class="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span class="text-white font-normal tracking-wide">Dokumentasi</span>
              </div>
              <div class="flex items-center gap-2.5">
                <span class="w-4 h-4 rounded-full bg-[#8B1E2F] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <svg class="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span class="text-white font-normal tracking-wide">Master of Ceremony (MC)</span>
              </div>
              <div class="flex items-center gap-2.5">
                <span class="w-4 h-4 rounded-full bg-[#8B1E2F] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <svg class="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span class="text-white font-normal tracking-wide">Venue</span>
              </div>
            </div>
          </div>

          <!-- Button: Red Pill -->
          <div class="mt-8">
            <router-link
              to="/katalog/wedding"
              class="inline-flex items-center gap-2.5 px-6 sm:px-7 py-3 rounded-full bg-[#8B1E2F] hover:bg-[#A32438] text-white text-xs sm:text-[13px] font-semibold tracking-wide transition-all shadow-[0_4px_16px_rgba(139,30,47,0.45)] hover:scale-105 active:scale-95"
            >
              <span>Lihat Paket</span>
              <svg class="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. WHY CHOOSE US ("Kenapa Harus Kalila?") -->
    <section class="pt-8 sm:pt-10 lg:pt-12 pb-14 sm:pb-16 lg:pb-20 bg-[#151314]">
      <div class="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span class="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#DFBA73] font-semibold">
          ALASAN MEMILIH KAMI
        </span>
        <h2 class="font-serif text-3xl sm:text-4xl lg:text-[44px] text-white font-normal mt-1.5 mb-10 sm:mb-14 tracking-tight">
          Kenapa Harus Kalila?
        </h2>

        <!-- 3 Cards Grid (Matching Figma) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-center">
          <!-- Card 1: 20+ Tahun Pengalaman -->
          <div class="rounded-2xl sm:rounded-3xl overflow-hidden bg-white text-gray-800 shadow-2xl flex flex-col transition-transform duration-300 hover:-translate-y-1">
            <div class="h-56 sm:h-64 lg:h-72 overflow-hidden bg-black/10">
              <img
                :src="reason1Img"
                alt="20+ Tahun Pengalaman Kalila Catering & Dekorasi"
                loading="lazy"
                decoding="async"
                width="457"
                height="472"
                class="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div class="px-6 pb-8 pt-0 relative flex-1 flex flex-col items-center">
              <!-- Floating Red Circle Icon -->
              <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#8B1E2F] text-white flex items-center justify-center -mt-7 sm:-mt-8 mb-4 sm:mb-5 shadow-lg border-[3.5px] border-white">
                <svg class="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
              <h3 class="font-sans text-base sm:text-[18px] font-bold text-gray-900 mb-2">20+ Tahun Pengalaman</h3>
              <p class="text-xs sm:text-[13px] text-gray-600 leading-relaxed font-normal max-w-[280px]">
                Kami telah dipercaya menangani ribuan acara pernikahan sejak 2005.
              </p>
            </div>
          </div>

          <!-- Card 2: Free Konsultasi -->
          <div class="rounded-2xl sm:rounded-3xl overflow-hidden bg-white text-gray-800 shadow-2xl flex flex-col transition-transform duration-300 hover:-translate-y-1">
            <div class="h-56 sm:h-64 lg:h-72 overflow-hidden bg-black/10">
              <img
                :src="reason2Img"
                alt="Free Konsultasi Kalila Catering & Dekorasi"
                loading="lazy"
                decoding="async"
                width="456"
                height="472"
                class="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div class="px-6 pb-8 pt-0 relative flex-1 flex flex-col items-center">
              <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#8B1E2F] text-white flex items-center justify-center -mt-7 sm:-mt-8 mb-4 sm:mb-5 shadow-lg border-[3.5px] border-white">
                <svg class="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                </svg>
              </div>
              <h3 class="font-sans text-base sm:text-[18px] font-bold text-gray-900 mb-2">Free Konsultasi</h3>
              <p class="text-xs sm:text-[13px] text-gray-600 leading-relaxed font-normal max-w-[280px]">
                Dapatkan konsultasi gratis untuk mewujudkan konsep pernikahan sesuai impian Anda.
              </p>
            </div>
          </div>

          <!-- Card 3: Fleksibel Sesuai Budget -->
          <div class="rounded-2xl sm:rounded-3xl overflow-hidden bg-white text-gray-800 shadow-2xl flex flex-col transition-transform duration-300 hover:-translate-y-1">
            <div class="h-56 sm:h-64 lg:h-72 overflow-hidden bg-black/10">
              <img
                :src="reason3Img"
                alt="Fleksibel Sesuai Budget Kalila Catering & Dekorasi"
                loading="lazy"
                decoding="async"
                width="457"
                height="473"
                class="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div class="px-6 pb-8 pt-0 relative flex-1 flex flex-col items-center">
              <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#8B1E2F] text-white flex items-center justify-center -mt-7 sm:-mt-8 mb-4 sm:mb-5 shadow-lg border-[3.5px] border-white">
                <svg class="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              </div>
              <h3 class="font-sans text-base sm:text-[18px] font-bold text-gray-900 mb-2">Fleksibel Sesuai Budget</h3>
              <p class="text-xs sm:text-[13px] text-gray-600 leading-relaxed font-normal max-w-[280px]">
                Kami menawarkan paket yang bisa disesuaikan dengan kebutuhan dan anggaran Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. TESTIMONIALS SECTION ("Apa Kata Mereka?") -->
    <section class="py-10 sm:py-12 lg:py-14 relative overflow-hidden bg-[#151314]">
      <!-- Background Blurred Wedding Stage (Matching Figma with visible warm floral bokeh) -->
      <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          :src="aboutWeddingImg"
          alt=""
          loading="lazy"
          decoding="async"
          aria-hidden="true"
          class="w-full h-full object-cover object-center scale-110 filter blur-[18px] brightness-75 contrast-110"
        />
        <div class="absolute inset-0 bg-[#151314]/50"></div>
      </div>

      <div class="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <!-- Kicker -->
        <span class="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#DFBA73] font-semibold">
          TESTIMONIALS
        </span>

        <!-- Title -->
        <h2 class="font-serif text-2xl sm:text-3xl lg:text-4xl text-white font-normal mt-1 mb-2 sm:mb-3 tracking-tight">
          Apa Kata Mereka?
        </h2>

        <!-- Carousel Slider Track with Overflow Hidden (Cukup padding-top agar avatar bulat tidak terpotong) -->
        <div class="overflow-hidden w-full pt-8 sm:pt-10 pb-3">
          <div
            class="flex transition-transform duration-500 ease-out"
            :style="{ transform: `translateX(-${activeSlide * 100}%)` }"
          >
            <div
              v-for="(slide, sIdx) in testimonialSlides"
              :key="sIdx"
              class="w-full shrink-0"
            >
              <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-7 text-center">
                <div
                  v-for="(item, idx) in slide"
                  :key="idx"
                  class="bg-white rounded-2xl sm:rounded-3xl px-5 sm:px-6 pb-6 pt-0 shadow-2xl flex flex-col items-center justify-between transition-transform duration-300 hover:-translate-y-1 relative"
                >
                  <!-- Floating Circular Avatar on top edge -->
                  <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-4 border-white shadow-md -mt-6 sm:-mt-7 mb-2 bg-white shrink-0">
                    <img
                      :src="item.avatar"
                      :alt="item.name"
                      loading="lazy"
                      decoding="async"
                      width="56"
                      height="56"
                      class="w-full h-full object-cover"
                    />
                  </div>

                  <!-- 5 Gold Stars -->
                  <div class="flex items-center gap-1 text-[#DFBA73] text-xs sm:text-sm mb-2" aria-label="Rating 5 bintang">
                    <span v-for="i in 5" :key="i" aria-hidden="true">★</span>
                  </div>

                  <!-- Quote Text -->
                  <p class="text-xs sm:text-[13px] text-gray-700 leading-relaxed font-light text-center px-0.5 mb-4 flex-1 flex items-center justify-center">
                    "{{ item.quote }}"
                  </p>

                  <!-- Name & Subtitle -->
                  <div class="text-center mt-auto">
                    <h3 class="font-sans font-bold text-[13px] sm:text-sm text-gray-900 leading-snug">{{ item.name }}</h3>
                    <p class="text-[10px] sm:text-[11px] text-gray-600 font-normal mt-0.5 tracking-wide">{{ item.event }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Slider Pagination Bar (Matching Figma Gold Arrows & Dots) -->
        <div class="flex items-center justify-center gap-3.5 mt-6 sm:mt-8">
          <!-- Left Gold Button -->
          <button
            @click="prevSlide"
            class="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#DFBA73] text-[#DFBA73] hover:bg-[#DFBA73] hover:text-black active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            aria-label="Testimoni sebelumnya"
          >
            <svg class="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- 3 Dots -->
          <div class="flex items-center gap-1.5">
            <button
              v-for="(_, index) in testimonialSlides"
              :key="index"
              @click="activeSlide = index"
              :class="[
                'transition-all duration-300 cursor-pointer rounded-full h-1.5',
                activeSlide === index ? 'w-4 bg-[#DFBA73]' : 'w-1.5 bg-[#DFBA73]/40 hover:bg-[#DFBA73]/75'
              ]"
              :aria-label="`Pilih testimoni slide ${index + 1}`"
            ></button>
          </div>

          <!-- Right Gold Button -->
          <button
            @click="nextSlide"
            class="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#DFBA73] text-[#DFBA73] hover:bg-[#DFBA73] hover:text-black active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            aria-label="Testimoni selanjutnya"
          >
            <svg class="w-3.5 h-3.5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- 7. BLOG UPDATES ("ARTIKEL TERBARU") -->
    <section class="py-12 sm:py-16 lg:py-20 bg-[#151314]">
      <div class="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header: Title on Left, "Lihat Semua →" on Right -->
        <div class="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <span class="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#DFBA73] font-semibold">
              ARTIKEL TERBARU
            </span>
            <h2 class="font-serif text-3xl sm:text-4xl lg:text-[42px] text-white font-normal mt-1 leading-tight tracking-tight">
              Blog Updates
            </h2>
          </div>
          <router-link
            to="/blog"
            aria-label="Lihat semua artikel blog Kalila"
            class="text-xs sm:text-[13px] text-[#DFBA73] hover:text-[#f3d38e] font-semibold flex items-center gap-1.5 transition-colors group"
          >
            <span>Lihat Semua</span>
            <span class="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
          </router-link>
        </div>

        <!-- 3 Cards Grid (Matching Figma) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <!-- Blog 1 -->
          <div class="rounded-2xl bg-[#181617] border border-white/10 p-3.5 sm:p-4 flex flex-col shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#DFBA73]/30">
            <div class="w-full aspect-[16/9] rounded-xl overflow-hidden mb-4 bg-black/30">
              <img
                :src="blog1Img"
                alt="20 Tahun Kalila Catering & Dekorasi"
                loading="lazy"
                decoding="async"
                width="600"
                height="338"
                class="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div class="flex-1 flex flex-col justify-between px-1 pb-1">
              <div>
                <span class="text-[11px] sm:text-xs text-[#DFBA73] font-medium tracking-wide">27 Jul 2024</span>
                <h3 class="font-sans text-sm sm:text-base font-bold text-white mt-1.5 mb-2 leading-snug">
                  20 Tahun Kalila Catering & Dekorasi
                </h3>
                <p class="text-xs sm:text-[13px] text-gray-400 font-light leading-relaxed line-clamp-2">
                  Perjalanan kami dalam menghadirkan momen spesial untuk Anda.
                </p>
              </div>
              <div class="pt-4 mt-auto">
                <router-link
                  to="/blog"
                  aria-label="Baca selengkapnya artikel 20 Tahun Kalila Catering & Dekorasi"
                  class="inline-flex items-center gap-1.5 text-xs sm:text-[13px] text-[#DFBA73] hover:text-[#f3d38e] font-semibold transition-colors group"
                >
                  <span>Baca Selengkapnya</span>
                  <span class="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
                </router-link>
              </div>
            </div>
          </div>

          <!-- Blog 2 -->
          <div class="rounded-2xl bg-[#181617] border border-white/10 p-3.5 sm:p-4 flex flex-col shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#DFBA73]/30">
            <div class="w-full aspect-[16/9] rounded-xl overflow-hidden mb-4 bg-black/30">
              <img
                :src="blog2Img"
                alt="5 Tren Suasana Acara Pernikahan untuk Tahun Ini"
                loading="lazy"
                decoding="async"
                width="600"
                height="338"
                class="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div class="flex-1 flex flex-col justify-between px-1 pb-1">
              <div>
                <span class="text-[11px] sm:text-xs text-[#DFBA73] font-medium tracking-wide">17 Jul 2024</span>
                <h3 class="font-sans text-sm sm:text-base font-bold text-white mt-1.5 mb-2 leading-snug">
                  5 Tren Suasana Acara Pernikahan untuk Tahun Ini
                </h3>
                <p class="text-xs sm:text-[13px] text-gray-400 font-light leading-relaxed line-clamp-2">
                  Inspirasi tema dan dekorasi yang sedang populer di tahun ini.
                </p>
              </div>
              <div class="pt-4 mt-auto">
                <router-link
                  to="/blog"
                  aria-label="Baca selengkapnya artikel 5 Tren Suasana Acara Pernikahan untuk Tahun Ini"
                  class="inline-flex items-center gap-1.5 text-xs sm:text-[13px] text-[#DFBA73] hover:text-[#f3d38e] font-semibold transition-colors group"
                >
                  <span>Baca Selengkapnya</span>
                  <span class="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
                </router-link>
              </div>
            </div>
          </div>

          <!-- Blog 3 -->
          <div class="rounded-2xl bg-[#181617] border border-white/10 p-3.5 sm:p-4 flex flex-col shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#DFBA73]/30">
            <div class="w-full aspect-[16/9] rounded-xl overflow-hidden mb-4 bg-black/30">
              <img
                :src="blog3Img"
                alt="Tips Memilih Dekorasi Pernikahan Sesuai Budget"
                loading="lazy"
                decoding="async"
                width="600"
                height="338"
                class="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div class="flex-1 flex flex-col justify-between px-1 pb-1">
              <div>
                <span class="text-[11px] sm:text-xs text-[#DFBA73] font-medium tracking-wide">10 Jul 2024</span>
                <h3 class="font-sans text-sm sm:text-base font-bold text-white mt-1.5 mb-2 leading-snug">
                  Tips Memilih Dekorasi Pernikahan Sesuai Budget
                </h3>
                <p class="text-xs sm:text-[13px] text-gray-400 font-light leading-relaxed line-clamp-2">
                  Panduan praktis agar pernikahan tetap indah tanpa menguras biaya.
                </p>
              </div>
              <div class="pt-4 mt-auto">
                <router-link
                  to="/blog"
                  aria-label="Baca selengkapnya artikel Tips Memilih Dekorasi Pernikahan Sesuai Budget"
                  class="inline-flex items-center gap-1.5 text-xs sm:text-[13px] text-[#DFBA73] hover:text-[#f3d38e] font-semibold transition-colors group"
                >
                  <span>Baca Selengkapnya</span>
                  <span class="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import Navbar from "../components/common/Navbar.vue";
import Footer from "../components/common/Footer.vue";
import heroBg from "../assets/hero-bg.jpg";
import iconDekorasi from "../assets/icon-dekorasi.png";
import iconTim from "../assets/icon-tim.png";
import iconLayanan from "../assets/icon-layanan.png";
import aboutWeddingImg from "../assets/about-wedding.jpg";
import weddingPackageBg from "../assets/wedding-package-bg.jpg";
import reason1Img from "../assets/reason-1.jpg";
import reason2Img from "../assets/reason-2.jpg";
import reason3Img from "../assets/reason-3.jpg";
import avatar1 from "../assets/avatar-1.png";
import avatar2 from "../assets/avatar-2.png";
import avatar3 from "../assets/avatar-3.png";
import blog1Img from "../assets/blog-1.jpg";
import blog2Img from "../assets/blog-2.jpg";
import blog3Img from "../assets/blog-3.jpg";

const whatsappNumber = "6281234567890";
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
  "Halo admin Kalila Catering & Dekorasi, saya tertarik untuk konsultasi acara pernikahan."
)}`;

// Counter / Stats Count-Up Animation (from 0 to target)
const statsRef = ref(null);
const countVendor = ref(0);
const countPelanggan = ref(0);
const countAcara = ref(0);
const countPengalaman = ref(0);
const hasAnimated = ref(false);

const startCountAnimation = () => {
  if (hasAnimated.value) return;
  hasAnimated.value = true;

  const duration = 2000; // 2 seconds
  const startTime = performance.now();

  const targets = {
    vendor: 298,
    pelanggan: 4080,
    acara: 3890,
    pengalaman: 20,
  };

  // Smooth ease-out cubic curve: fast start, soft and graceful finish
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const step = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeOutCubic(progress);

    countVendor.value = Math.floor(easeProgress * targets.vendor);
    countPelanggan.value = Math.floor(easeProgress * targets.pelanggan);
    countAcara.value = Math.floor(easeProgress * targets.acara);
    countPengalaman.value = Math.floor(easeProgress * targets.pengalaman);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      countVendor.value = targets.vendor;
      countPelanggan.value = targets.pelanggan;
      countAcara.value = targets.acara;
      countPengalaman.value = targets.pengalaman;
    }
  };

  requestAnimationFrame(step);
};

let observer = null;
onMounted(() => {
  if (statsRef.value && typeof IntersectionObserver !== "undefined") {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          startCountAnimation();
          if (observer) {
            observer.disconnect();
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(statsRef.value);
  } else {
    startCountAnimation();
  }
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});

// Testimonials Carousel State & Functions
const activeSlide = ref(0);

const testimonialSlides = [
  [
    {
      name: "Rina & Dika",
      event: "Pernikahan, 12 Mei 2024",
      avatar: avatar1,
      quote:
        "Pelayanan Kalila sangat memuaskan, dari awal konsultasi sampai hari H semuanya berjalan lancar. Dekorasinya juga sesuai dengan yang kami mau.",
    },
    {
      name: "Sari & Fajar",
      event: "Pernikahan, 3 Agustus 2024",
      avatar: avatar2,
      quote:
        "Timnya profesional, komunikatif, dan sangat membantu. Hasil dekorasi melebihi ekspektasi kami. Terima kasih Kalila!",
    },
    {
      name: "Dewi & Ardi",
      event: "Pernikahan, 21 September 2024",
      avatar: avatar3,
      quote:
        "Makanannya enak, dekorasinya elegan, dan semua berjalan sesuai rencana. Sangat direkomendasikan untuk yang cari vendor pernikahan!",
    },
  ],
  [
    {
      name: "Maya & Rizky",
      event: "Pernikahan, 18 Oktober 2024",
      avatar: avatar1,
      quote:
        "Sangat bersyukur mempercayakan pernikahan kami pada Kalila WO. Konsep impian kami terealisasi dengan sempurna tanpa rasa cemas.",
    },
    {
      name: "Putri & Dimas",
      event: "Pernikahan, 5 November 2024",
      avatar: avatar2,
      quote:
        "Keluarga besar kami sangat memuji cita rasa catering dan kerapihan tim WO di lapangan. Sangat responsif dan sigap!",
    },
    {
      name: "Nadia & Bayu",
      event: "Pernikahan, 14 Desember 2024",
      avatar: avatar3,
      quote:
        "Dari dekorasi pelaminan sampai susunan rundown acara semuanya tepat waktu dan teratur rapi. Terima kasih banyak untuk tim Kalila!",
    },
  ],
  [
    {
      name: "Citra & Kevin",
      event: "Pernikahan, 15 Januari 2025",
      avatar: avatar1,
      quote:
        "Dekorasi akad dan resepsinya beneran bikin takjub semua tamu undangan. Tim dokumentasinya juga sangat ramah dan profesional!",
    },
    {
      name: "Bella & Adit",
      event: "Pernikahan, 2 Februari 2025",
      avatar: avatar2,
      quote:
        "Konsultasi konsep sangat detail dan transparan dari awal. Paket pernikahan yang kami pilih benar-benar fleksibel sesuai budget kami.",
    },
    {
      name: "Anisa & Farhan",
      event: "Pernikahan, 20 Maret 2025",
      avatar: avatar3,
      quote:
        "Momen sekali seumur hidup yang tak terlupakan. Kalila Catering & Dekorasi memberikan pelayanan bintang lima dari awal hingga selesai.",
    },
  ],
];

const nextSlide = () => {
  activeSlide.value = (activeSlide.value + 1) % testimonialSlides.length;
};

const prevSlide = () => {
  activeSlide.value =
    (activeSlide.value - 1 + testimonialSlides.length) %
    testimonialSlides.length;
};
</script>
