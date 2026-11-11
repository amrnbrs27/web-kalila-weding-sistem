<template>
  <div class="min-h-screen bg-[#161210] text-gray-200 font-sans selection:bg-[#C5A265] selection:text-black">
    <!-- Navbar (Seamless transparent header matching Figma) -->
    <Navbar :show-konsultasi="false" :nav-capsule="false" />

    <!-- 1. HERO SECTION: DECORATION PACKAGE (Matching Figma Design Exactly) -->
    <section class="relative w-full pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-16 lg:pb-20 overflow-hidden">
      <!-- Background Image with Strategic Luxury Gradient Overlays -->
      <div class="absolute inset-0 z-0">
        <img
          :src="DecorPackageBg"
          alt="Decoration Package Background"
          class="w-full h-full object-cover object-right md:object-center"
        />
        <!-- Top vignette so Navbar links stay perfectly crisp -->
        <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent h-32"></div>

        <!-- Left side dark gradient matching page background #161210 -->
        <div class="absolute inset-0 bg-gradient-to-r from-[#161210]/95 via-[#161210]/65 md:via-[#161210]/40 to-transparent"></div>

        <!-- Subtle ambient tint -->
        <div class="absolute inset-0 bg-black/15"></div>
      </div>

      <!-- Thin Golden Divider Line below Navbar -->
      <div class="absolute top-[72px] sm:top-[80px] md:top-[88px] left-0 right-0 h-[1px] bg-[#C5A265]/25 z-20 pointer-events-none"></div>

      <!-- Thin Golden Divider Line at Bottom of Hero Banner -->
      <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-[#C5A265]/30 z-20 pointer-events-none"></div>

      <!-- Bottom-Left Botanical Line Art Ornament (Figma Gold Leaves) -->
      <svg
        class="absolute bottom-0 left-0 w-36 sm:w-56 md:w-72 lg:w-80 h-auto pointer-events-none select-none z-10 opacity-70"
        viewBox="0 0 320 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="#C5A265" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <!-- Main Stems -->
          <path d="M-10 250 C 40 220, 90 180, 150 130 C 190 95, 230 65, 270 50" opacity="0.8" />
          <path d="M-10 250 C 60 210, 110 140, 140 70 C 155 35, 170 10, 190 -10" opacity="0.6" />
          <path d="M-10 250 C 70 240, 160 225, 240 200 C 290 185, 330 165, 360 140" opacity="0.7" />

          <!-- Leaves & Veins -->
          <path d="M110 165 C 130 145, 160 140, 185 150 C 170 170, 145 180, 110 165 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M110 165 C 135 155, 165 150, 185 150" opacity="0.5" />
          <path d="M135 160 C 145 152, 155 152, 165 155" opacity="0.4" />

          <path d="M125 110 C 130 85, 145 65, 165 55 C 165 80, 150 100, 125 110 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M125 110 C 140 90, 155 75, 165 55" opacity="0.5" />

          <path d="M70 180 C 75 150, 95 130, 120 125 C 115 150, 95 170, 70 180 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M70 180 C 90 160, 105 145, 120 125" opacity="0.5" />

          <path d="M180 175 C 210 170, 235 180, 255 195 C 230 205, 205 200, 180 175 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M180 175 C 210 180, 235 188, 255 195" opacity="0.5" />

          <!-- Radiating Floral Petals in Corner -->
          <path d="M20 220 C 35 185, 55 165, 75 160 C 70 185, 50 210, 20 220 Z" fill="#C5A265" fill-opacity="0.06" />
          <path d="M20 220 C 45 190, 60 180, 75 160" opacity="0.6" />

          <path d="M30 235 C 60 215, 85 205, 110 210 C 95 230, 70 240, 30 235 Z" fill="#C5A265" fill-opacity="0.06" />
          <path d="M30 235 C 65 220, 85 215, 110 210" opacity="0.6" />

          <path d="M15 200 C 10 165, 25 140, 45 130 C 50 155, 40 185, 15 200 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M15 200 C 25 170, 35 150, 45 130" opacity="0.6" />

          <!-- Tip Leaves -->
          <path d="M220 75 C 240 60, 260 55, 280 55 C 265 70, 245 80, 220 75 Z" opacity="0.7" />
          <path d="M165 40 C 180 25, 195 20, 210 20 C 200 35, 185 45, 165 40 Z" opacity="0.7" />
        </g>
      </svg>

      <!-- Bottom-Right Botanical Line Art Ornament (Mirrored) -->
      <svg
        class="absolute bottom-0 right-0 w-36 sm:w-56 md:w-72 lg:w-80 h-auto pointer-events-none select-none z-10 opacity-70 transform -scale-x-100"
        viewBox="0 0 320 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="#C5A265" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <!-- Main Stems -->
          <path d="M-10 250 C 40 220, 90 180, 150 130 C 190 95, 230 65, 270 50" opacity="0.8" />
          <path d="M-10 250 C 60 210, 110 140, 140 70 C 155 35, 170 10, 190 -10" opacity="0.6" />
          <path d="M-10 250 C 70 240, 160 225, 240 200 C 290 185, 330 165, 360 140" opacity="0.7" />

          <!-- Leaves & Veins -->
          <path d="M110 165 C 130 145, 160 140, 185 150 C 170 170, 145 180, 110 165 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M110 165 C 135 155, 165 150, 185 150" opacity="0.5" />
          <path d="M135 160 C 145 152, 155 152, 165 155" opacity="0.4" />

          <path d="M125 110 C 130 85, 145 65, 165 55 C 165 80, 150 100, 125 110 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M125 110 C 140 90, 155 75, 165 55" opacity="0.5" />

          <path d="M70 180 C 75 150, 95 130, 120 125 C 115 150, 95 170, 70 180 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M70 180 C 90 160, 105 145, 120 125" opacity="0.5" />

          <path d="M180 175 C 210 170, 235 180, 255 195 C 230 205, 205 200, 180 175 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M180 175 C 210 180, 235 188, 255 195" opacity="0.5" />

          <!-- Radiating Floral Petals in Corner -->
          <path d="M20 220 C 35 185, 55 165, 75 160 C 70 185, 50 210, 20 220 Z" fill="#C5A265" fill-opacity="0.06" />
          <path d="M20 220 C 45 190, 60 180, 75 160" opacity="0.6" />

          <path d="M30 235 C 60 215, 85 205, 110 210 C 95 230, 70 240, 30 235 Z" fill="#C5A265" fill-opacity="0.06" />
          <path d="M30 235 C 65 220, 85 215, 110 210" opacity="0.6" />

          <path d="M15 200 C 10 165, 25 140, 45 130 C 50 155, 40 185, 15 200 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M15 200 C 25 170, 35 150, 45 130" opacity="0.6" />

          <!-- Tip Leaves -->
          <path d="M220 75 C 240 60, 260 55, 280 55 C 265 70, 245 80, 220 75 Z" opacity="0.7" />
          <path d="M165 40 C 180 25, 195 20, 210 20 C 200 35, 185 45, 165 40 Z" opacity="0.7" />
        </g>
      </svg>

      <!-- Hero Header Content: Left-Aligned matching Figma -->
      <div class="relative z-20 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 text-left">
        <!-- Badge with Gold Lines -->
        <div class="inline-flex items-center gap-3 mb-3 sm:mb-4">
          <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
          <span class="text-[11px] sm:text-xs uppercase tracking-[0.28em] text-[#C5A265] font-semibold drop-shadow">
            PAKET DEKORASI
          </span>
          <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
        </div>

        <!-- Headline -->
        <h1 class="font-serif text-3xl sm:text-5xl lg:text-[56px] text-white font-normal tracking-tight leading-[1.12] mb-3 sm:mb-4 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          Decoration Package
        </h1>

        <!-- Subtitle -->
        <p class="text-xs sm:text-sm md:text-[15px] text-stone-300 max-w-xl font-light leading-relaxed drop-shadow">
          Pilih paket dekorasi yang sesuai dengan konsep pernikahan impian Anda.<br class="hidden sm:inline" />
          Kami siap membantu mewujudkannya dengan sentuhan yang elegan dan profesional.
        </p>
      </div>
    </section>

    <!-- 2. GRID OF PACKAGES (4 Columns matching Figma Design) -->
    <section class="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-20 sm:pb-24">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        <div
          v-for="pkg in packages"
          :key="pkg.id"
          class="rounded-2xl overflow-hidden bg-[#0F0D0C] border border-[#2B231D] hover:border-[#C5A265]/50 transition-all duration-300 flex flex-col group shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.7)] hover:-translate-y-1"
        >
          <!-- Image Container -->
          <div class="w-full aspect-[4/3] overflow-hidden relative bg-black/40">
            <img
              :src="pkg.image"
              :alt="pkg.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>

          <!-- Card Content -->
          <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between">
            <div>
              <!-- Tagline -->
              <p class="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C5A265] mb-1">
                {{ pkg.tagline }}
              </p>

              <!-- Package Name -->
              <h2 class="font-serif text-base sm:text-lg font-medium text-white group-hover:text-[#E6CA65] transition-colors mb-1.5">
                {{ pkg.name }}
              </h2>

              <!-- Price -->
              <p class="text-sm sm:text-base font-bold text-[#A82438] mb-2.5 tracking-tight">
                {{ formatPrice(pkg.price) }}
              </p>

              <!-- Description -->
              <p class="text-[11px] sm:text-xs text-stone-400 font-light leading-relaxed line-clamp-3 mb-5">
                {{ pkg.description }}
              </p>
            </div>

            <!-- Actions Row: "Lihat Detail ->" and Shopping Cart Red Button -->
            <div class="flex items-center gap-2.5 pt-2">
              <!-- Lihat Detail Pill Button -->
              <router-link
                :to="`/paket/${pkg.slug}`"
                class="flex-1 py-2 px-3 rounded-full border border-white/20 hover:border-[#C5A265] bg-transparent hover:bg-white/5 text-stone-200 hover:text-white text-[11px] sm:text-xs font-medium tracking-wide text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Lihat Detail</span>
                <span class="transition-transform group-hover:translate-x-0.5">→</span>
              </router-link>

              <!-- Red Cart Button -->
              <router-link
                :to="`/booking/${pkg.slug}`"
                class="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-[#8C1826] to-[#700B11] hover:from-[#A82031] hover:to-[#8E1726] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                :title="`Pesan ${pkg.name}`"
                aria-label="Pesan paket ini"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. BOTTOM CTA SECTION ("SIAP MEWUJUDKAN Pernikahan Impian Anda?") - Matching Figma Exactly -->
    <section class="relative w-full py-14 sm:py-16 md:py-20 lg:py-24 overflow-hidden border-t border-b border-[#C5A265]/35">
      <!-- Background Banner with Real Figma Asset (dekor-package-bg-2.png) -->
      <div class="absolute inset-0 z-0">
        <img
          :src="DecorPackageBg2"
          alt="Kalila Wedding Banner"
          class="w-full h-full object-cover object-center filter brightness-95"
        />
        <!-- Center Vignette Dark Overlay to keep text crisp while allowing floral edges to shine -->
        <div class="absolute inset-0 bg-gradient-to-r from-black/55 via-black/75 to-black/55"></div>
        <div class="absolute inset-0 bg-[#161210]/35"></div>
      </div>

      <!-- Top and Bottom Thin Golden Divider Lines -->
      <div class="absolute top-0 left-0 right-0 h-[1px] bg-[#C5A265]/40 z-20 pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 right-0 h-[1px] bg-[#C5A265]/40 z-20 pointer-events-none"></div>

      <!-- Bottom-Left Botanical Ornament (Figma Gold Leaves) -->
      <svg
        class="absolute bottom-0 left-0 w-32 sm:w-48 md:w-56 lg:w-64 h-auto pointer-events-none select-none z-10 opacity-75"
        viewBox="0 0 280 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="#C5A265" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <!-- Main Stems -->
          <path d="M-10 210 C 30 180, 70 150, 120 110 C 150 85, 180 60, 210 45" opacity="0.8" />
          <path d="M-10 210 C 50 170, 90 120, 115 60 C 130 30, 140 10, 160 -10" opacity="0.6" />
          <path d="M-10 210 C 60 200, 130 190, 190 170 C 230 155, 260 140, 280 120" opacity="0.7" />

          <!-- Leaves & Petals with Veins -->
          <path d="M90 140 C 105 120, 130 115, 150 125 C 140 140, 120 150, 90 140 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M90 140 C 110 130, 135 125, 150 125" opacity="0.5" />

          <path d="M100 95 C 105 75, 120 60, 135 50 C 135 70, 120 85, 100 95 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M100 95 C 112 80, 125 65, 135 50" opacity="0.5" />

          <path d="M55 155 C 60 130, 75 115, 95 110 C 90 130, 75 145, 55 155 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M55 155 C 70 140, 85 125, 95 110" opacity="0.5" />

          <!-- Radiating Blossom in Corner -->
          <path d="M15 185 C 30 155, 45 140, 60 135 C 55 155, 40 175, 15 185 Z" fill="#C5A265" fill-opacity="0.06" />
          <path d="M15 185 C 35 160, 48 150, 60 135" opacity="0.6" />

          <path d="M25 195 C 50 180, 70 170, 90 175 C 78 190, 60 200, 25 195 Z" fill="#C5A265" fill-opacity="0.06" />
          <path d="M25 195 C 55 183, 70 180, 90 175" opacity="0.6" />

          <path d="M10 168 C 8 140, 20 120, 36 112 C 40 132, 32 155, 10 168 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M10 168 C 18 145, 26 130, 36 112" opacity="0.6" />

          <!-- Tip Leaves -->
          <path d="M175 60 C 190 50, 205 45, 220 45 C 210 58, 195 65, 175 60 Z" opacity="0.7" />
          <path d="M135 32 C 145 20, 158 15, 170 15 C 162 26, 150 35, 135 32 Z" opacity="0.7" />
        </g>
      </svg>

      <!-- Bottom-Right Botanical Ornament (Floral Branch matching Figma) -->
      <svg
        class="absolute bottom-0 right-0 w-32 sm:w-48 md:w-56 lg:w-64 h-auto pointer-events-none select-none z-10 opacity-75"
        viewBox="0 0 280 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="#C5A265" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <!-- Main Stems curving left -->
          <path d="M290 210 C 250 180, 210 150, 160 110 C 130 85, 100 60, 70 45" opacity="0.8" />
          <path d="M290 210 C 230 170, 190 120, 165 60 C 150 30, 140 10, 120 -10" opacity="0.6" />
          <path d="M290 210 C 220 200, 150 190, 90 170 C 50 155, 20 140, 0 120" opacity="0.7" />

          <!-- Leaves & Branching Buds -->
          <path d="M190 140 C 175 120, 150 115, 130 125 C 140 140, 160 150, 190 140 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M190 140 C 170 130, 145 125, 130 125" opacity="0.5" />

          <path d="M180 95 C 175 75, 160 60, 145 50 C 145 70, 160 85, 180 95 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M180 95 C 168 80, 155 65, 145 50" opacity="0.5" />

          <path d="M225 155 C 220 130, 205 115, 185 110 C 190 130, 205 145, 225 155 Z" fill="#C5A265" fill-opacity="0.05" />
          <path d="M225 155 C 210 140, 195 125, 185 110" opacity="0.5" />

          <!-- Blossom Detail in Corner -->
          <path d="M250 140 C 242 135, 238 142, 232 138 C 228 135, 230 128, 235 125 C 242 122, 248 126, 252 132 Z" fill="#C5A265" fill-opacity="0.08" />
          <path d="M246 134 C 240 130, 235 133, 236 138" opacity="0.7" />
          <path d="M255 145 C 265 140, 270 130, 265 120 C 255 125, 252 135, 255 145 Z" fill="#C5A265" fill-opacity="0.05" />

          <!-- Tip Leaves -->
          <path d="M105 60 C 90 50, 75 45, 60 45 C 70 58, 85 65, 105 60 Z" opacity="0.7" />
          <path d="M145 32 C 135 20, 122 15, 110 15 C 118 26, 130 35, 145 32 Z" opacity="0.7" />
        </g>
      </svg>

      <!-- CTA Content -->
      <div class="relative z-20 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <!-- Small Gold Tagline with Horizontal Lines -->
        <div class="inline-flex items-center justify-center gap-3 mb-2.5 sm:mb-3">
          <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
          <span class="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#C5A265] font-semibold drop-shadow">
            SIAP MEWUJUDKAN
          </span>
          <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
        </div>

        <!-- Main Title -->
        <h2 class="font-serif text-3xl sm:text-4xl md:text-[42px] text-white font-normal tracking-tight mb-2.5 sm:mb-3 leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          Pernikahan Impian Anda?
        </h2>

        <!-- Subtitle -->
        <p class="text-xs sm:text-sm text-stone-300 font-light max-w-lg mx-auto mb-6 sm:mb-7 leading-relaxed drop-shadow">
          Konsultasikan kebutuhan dekorasi dan catering bersama tim profesional kami.
        </p>

        <!-- WhatsApp Button matching Figma exactly -->
        <a
          :href="whatsappUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2.5 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-[#700B11] hover:bg-[#851019] text-white border border-[#941A29]/60 text-xs sm:text-[13px] font-medium tracking-wide transition-all shadow-[0_4px_20px_rgba(112,11,17,0.45)] hover:scale-105 active:scale-95 group cursor-pointer"
        >
          <!-- WhatsApp Icon -->
          <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.62C9.36 7.62 9.09 7.68 8.87 7.92C8.64 8.16 8.03 8.73 8.03 9.9C8.03 11.07 8.89 12.2 9.01 12.36C9.13 12.52 10.7 14.94 13.1 15.97C13.67 16.22 14.12 16.37 14.46 16.48C15.03 16.66 15.55 16.63 15.97 16.57C16.43 16.5 17.39 15.99 17.59 15.42C17.79 14.86 17.79 14.37 17.73 14.27C17.67 14.18 17.51 14.12 17.27 14C17.03 13.89 15.84 13.3 15.62 13.22C15.4 13.14 15.24 13.1 15.08 13.34C14.92 13.58 14.46 14.12 14.32 14.27C14.18 14.43 14.04 14.45 13.8 14.33C13.56 14.22 12.78 13.96 11.86 13.14C11.14 12.5 10.66 11.71 10.52 11.47C10.38 11.23 10.5 11.1 10.62 10.98C10.73 10.87 10.87 10.69 11 10.54C11.12 10.38 11.16 10.27 11.24 10.11C11.32 9.95 11.28 9.81 11.22 9.69C11.16 9.57 10.7 8.44 10.51 7.98C10.32 7.53 10.13 7.59 9.98 7.58C9.84 7.58 9.68 7.62 9.53 7.62Z"/>
          </svg>
          <span>Hubungi Kami</span>
          <span class="transition-transform group-hover:translate-x-0.5">→</span>
        </a>
      </div>
    </section>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup>
import { ref } from "vue";
import Navbar from "../components/common/Navbar.vue";
import Footer from "../components/common/Footer.vue";
import DecorPackageBg from "../assets/dekor-package-bg.png";
import DecorPackageBg2 from "../assets/dekor-package-bg-2.png";

// Real Figma Images for 8 Decoration Packages
import imgEconomy from "../assets/dekor/economy-wedding.png";
import imgDahlia from "../assets/dekor/dahlia-wedding.png";
import imgRose from "../assets/dekor/rose-wedding.png";
import imgAmaryllis from "../assets/dekor/amaryllis-wedding.png";
import imgSunflower from "../assets/dekor/sunflower-wedding.png";
import imgEdelweiss from "../assets/dekor/edelweiss-wedding.png";
import imgBougainvillea from "../assets/dekor/bougainvillea-wedding.png";
import imgCustom from "../assets/dekor/custom-package.png";

const whatsappNumber = "6281234567890";
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
  "Halo admin Kalila Catering & Dekorasi, saya ingin berkonsultasi mengenai paket dekorasi pernikahan."
)}`;

// 8 Decoration Packages matching the Figma Design exactly
const packages = ref([
  {
    id: 1,
    tagline: "ECONOMY WEDDING",
    name: "Economy Wedding",
    slug: "economy-wedding",
    price: 3000000,
    description: "Dekorasi simpel namun tetap memberikan kesan elegan dan romantis untuk hari istimewa Anda.",
    image: imgEconomy,
  },
  {
    id: 2,
    tagline: "DAHLIA WEDDING",
    name: "Dahlia Wedding",
    slug: "dahlia-wedding",
    price: 5500000,
    description: "Dekorasi dengan sentuhan bunga pilihan dan tata ruang yang elegan untuk momen yang tak terlupakan.",
    image: imgDahlia,
  },
  {
    id: 3,
    tagline: "ROSE WEDDING",
    name: "Rose Wedding",
    slug: "rose-wedding",
    price: 6500000,
    description: "Konsep dekorasi romantis dengan kombinasi bunga segar dan ornamen modern.",
    image: imgRose,
  },
  {
    id: 4,
    tagline: "AMARYLLIS WEDDING",
    name: "Amaryllis Wedding",
    slug: "amaryllis-wedding",
    price: 7500000,
    description: "Dekorasi yang megah dengan nuansa tradisional dan sentuhan modern yang elegan.",
    image: imgAmaryllis,
  },
  {
    id: 5,
    tagline: "SUNFLOWER WEDDING",
    name: "Sunflower Wedding",
    slug: "sunflower-wedding",
    price: 8300000,
    description: "Dekorasi penuh warna dengan bunga matahari yang cerah dan menambah kesan hangat.",
    image: imgSunflower,
  },
  {
    id: 6,
    tagline: "EDELWEISS WEDDING",
    name: "Edelweiss Wedding",
    slug: "edelweiss-wedding",
    price: 9500000,
    description: "Tampilan yang anggun dan elegan dengan dominasi warna putih serta aksen bunga edelweiss.",
    image: imgEdelweiss,
  },
  {
    id: 7,
    tagline: "BOUGAINVILLEA WEDDING",
    name: "Bougainvillea Wedding",
    slug: "bougainvillea-wedding",
    price: 11000000,
    description: "Dekorasi dengan nuansa tropis yang eksotis dan penuh warna, cocok untuk acara spesial Anda.",
    image: imgBougainvillea,
  },
  {
    id: 8,
    tagline: "CUSTOM PACKAGE",
    name: "Custom Package",
    slug: "custom-package",
    price: 0,
    description: "Hubungi kami untuk konsultasi dan penawaran paket sesuai kebutuhan Anda.",
    image: imgCustom,
  },
]);

const formatPrice = (val) => {
  if (val === 0) return "Rp 0.000.000";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
};
</script>
