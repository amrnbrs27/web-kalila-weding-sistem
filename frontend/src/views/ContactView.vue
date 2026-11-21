<template>
  <div class="min-h-screen bg-[#161210] text-gray-200 font-sans selection:bg-[#C5A265] selection:text-black">
    <!-- Navbar -->
    <Navbar :show-konsultasi="false" :nav-capsule="false" />

    <!-- 1. HERO SECTION: CONNECT WITH US (Redesigned with Kalila Luxury Theme) -->
    <section class="relative w-full pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-16 lg:pb-20 overflow-hidden border-b border-[#C5A265]/20">
      <!-- Background Image with Dark Luxury Overlay -->
      <div class="absolute inset-0 z-0">
        <img
          :src="HeroFloralBg"
          alt="Contact Background"
          class="w-full h-full object-cover object-center scale-105"
        />
        <!-- Dark tint overlay -->
        <div class="absolute inset-0 bg-[#161210]/60"></div>
        <!-- Bottom fade into page bg -->
        <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#161210] to-transparent"></div>
      </div>

      <!-- Thin Golden Divider Line below Navbar -->
      <div class="absolute top-[72px] sm:top-[80px] md:top-[88px] left-0 right-0 h-[1px] bg-[#C5A265]/25 z-20 pointer-events-none"></div>

      <!-- Hero Header Content -->
      <div class="relative z-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <!-- Tagline Badge with Gold Flanking Lines -->
        <div class="inline-flex items-center justify-center gap-3 mb-2.5 sm:mb-3">
          <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
          <span class="text-[10px] sm:text-xs uppercase tracking-[0.28em] text-[#C5A265] font-semibold drop-shadow">
            CONTACT US
          </span>
          <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
        </div>

        <!-- Headline: Menggunakan "Connect With Us" dari desain lama -->
        <h1 class="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] text-white font-normal tracking-tight mb-3 sm:mb-4 leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
          Connect With Us
        </h1>

        <!-- Subtitle -->
        <p class="text-xs sm:text-sm md:text-[15px] text-stone-300 font-light leading-relaxed max-w-xl mx-auto drop-shadow">
          Konsultasikan konsep pernikahan impian Anda bersama tim Kalila Catering &amp; Dekorasi. Kami siap melayani dengan sepenuh hati.
        </p>
      </div>
    </section>

    <!-- 2. MAIN CONTENT: CONTACT CHANNELS & FORM SECTION -->
    <section class="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

        <!-- LEFT COLUMN (7 Cols): DIRECT CONTACT CHANNELS (From Old Design Elevated to Luxury) -->
        <div class="lg:col-span-7 space-y-6 sm:space-y-7">
          <div>
            <span class="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#C5A265] font-semibold block mb-1">
              LAYANAN RESPON CEPAT
            </span>
            <h2 class="font-serif text-2xl sm:text-3xl text-white font-normal">
              Saluran Kontak Resmi
            </h2>
            <p class="text-xs sm:text-sm text-stone-400 font-light mt-1">
              Hubungi admin khusus kami atau ikuti media sosial untuk update dokumentasi terbaru:
            </p>
          </div>

          <!-- 4 Main Contact Cards from Old Design -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">

            <!-- Card 1: Admin Catering (WhatsApp) -->
            <a
              :href="cateringWaUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="group relative rounded-2xl bg-[#1A1513] border border-[#2B211C] hover:border-[#C5A265]/70 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between"
            >
              <div>
                <div class="flex items-center justify-between mb-4">
                  <!-- WhatsApp Icon in Circle -->
                  <div class="w-12 h-12 rounded-full bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.158.572 4.183 1.571 5.928l-1.571 5.728 5.89-1.545c1.677.939 3.608 1.474 5.666 1.474 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  <span class="text-[10px] font-semibold uppercase tracking-wider text-[#C5A265] px-2.5 py-1 rounded-full bg-[#C5A265]/10 border border-[#C5A265]/20">
                    Catering
                  </span>
                </div>
                <h3 class="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">
                  Admin Catering
                </h3>
                <!-- Nomor dari desain lama -->
                <p class="font-serif text-xl sm:text-2xl text-white font-normal group-hover:text-[#F2E3CF] transition-colors">
                  0815-6870-982
                </p>
                <p class="text-xs text-stone-400 font-light mt-1.5 leading-relaxed">
                  Konsultasi menu prasmanan, gubukan, dan food tasting.
                </p>
              </div>

              <div class="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#C5A265] group-hover:text-white font-medium transition-colors">
                <span>Chat via WhatsApp</span>
                <span class="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </a>

            <!-- Card 2: Admin Decoration (WhatsApp) -->
            <a
              :href="dekorWaUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="group relative rounded-2xl bg-[#1A1513] border border-[#2B211C] hover:border-[#C5A265]/70 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between"
            >
              <div>
                <div class="flex items-center justify-between mb-4">
                  <!-- WhatsApp Icon in Circle -->
                  <div class="w-12 h-12 rounded-full bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.158.572 4.183 1.571 5.928l-1.571 5.728 5.89-1.545c1.677.939 3.608 1.474 5.666 1.474 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  <span class="text-[10px] font-semibold uppercase tracking-wider text-[#C5A265] px-2.5 py-1 rounded-full bg-[#C5A265]/10 border border-[#C5A265]/20">
                    Decoration
                  </span>
                </div>
                <h3 class="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">
                  Admin Decoration
                </h3>
                <!-- Nomor dari desain lama -->
                <p class="font-serif text-xl sm:text-2xl text-white font-normal group-hover:text-[#F2E3CF] transition-colors">
                  0815-6870-982
                </p>
                <p class="text-xs text-stone-400 font-light mt-1.5 leading-relaxed">
                  Konsultasi pelaminan, fresh flowers, &amp; konsep tema venue.
                </p>
              </div>

              <div class="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#C5A265] group-hover:text-white font-medium transition-colors">
                <span>Chat via WhatsApp</span>
                <span class="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </a>

            <!-- Card 3: Our Instagram -->
            <a
              href="https://instagram.com/kalilacateringdekorasi"
              target="_blank"
              rel="noopener noreferrer"
              class="group relative rounded-2xl bg-[#1A1513] border border-[#2B211C] hover:border-[#E1306C]/60 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between"
            >
              <div>
                <div class="flex items-center justify-between mb-4">
                  <!-- Instagram Icon in Circle -->
                  <div class="w-12 h-12 rounded-full bg-[#E1306C]/15 border border-[#E1306C]/30 text-[#E1306C] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <span class="text-[10px] font-semibold uppercase tracking-wider text-stone-300 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                    Instagram
                  </span>
                </div>
                <h3 class="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">
                  Our Instagram
                </h3>
                <!-- Username dari desain lama -->
                <p class="font-serif text-lg sm:text-xl text-white font-normal group-hover:text-[#F2E3CF] transition-colors break-all">
                  @kalilacateringdekorasi
                </p>
                <p class="text-xs text-stone-400 font-light mt-1.5 leading-relaxed">
                  Galeri portofolio dokumentasi foto &amp; reels live acara terbaru.
                </p>
              </div>

              <div class="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#E1306C] group-hover:text-white font-medium transition-colors">
                <span>Kunjungi Profil Instagram</span>
                <span class="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </a>

            <!-- Card 4: Our TikTok -->
            <a
              href="https://tiktok.com/@kalilacateringdekorasi"
              target="_blank"
              rel="noopener noreferrer"
              class="group relative rounded-2xl bg-[#1A1513] border border-[#2B211C] hover:border-white/50 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between"
            >
              <div>
                <div class="flex items-center justify-between mb-4">
                  <!-- TikTok Icon in Circle -->
                  <div class="w-12 h-12 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
                    </svg>
                  </div>
                  <span class="text-[10px] font-semibold uppercase tracking-wider text-stone-300 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                    TikTok
                  </span>
                </div>
                <h3 class="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">
                  Our TikTok
                </h3>
                <!-- Username dari desain lama -->
                <p class="font-serif text-lg sm:text-xl text-white font-normal group-hover:text-[#F2E3CF] transition-colors break-all">
                  @kalilacateringdekorasi
                </p>
                <p class="text-xs text-stone-400 font-light mt-1.5 leading-relaxed">
                  Video behind the scenes, room tour venue, &amp; inspirasi dekorasi.
                </p>
              </div>

              <div class="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/80 group-hover:text-white font-medium transition-colors">
                <span>Tonton di TikTok</span>
                <span class="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </a>
          </div>

          <!-- Office & Working Hours Card -->
          <div class="rounded-2xl bg-[#1A1513] border border-[#2B211C] p-6 sm:p-7 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <!-- Location Info -->
              <div class="flex items-start gap-3.5">
                <div class="w-10 h-10 rounded-full bg-[#C5A265]/15 border border-[#C5A265]/30 text-[#C5A265] flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div>
                  <h4 class="text-xs uppercase tracking-wider text-[#C5A265] font-semibold mb-1">Kantor &amp; Galeri</h4>
                  <p class="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
                    Jl. BLPP No.21, Wonocatur, Banguntapan, Kec. Banguntapan, Kabupaten Bantul, D.I. Yogyakarta
                  </p>
                </div>
              </div>

              <!-- Working Hours Info -->
              <div class="flex items-start gap-3.5">
                <div class="w-10 h-10 rounded-full bg-[#C5A265]/15 border border-[#C5A265]/30 text-[#C5A265] flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <h4 class="text-xs uppercase tracking-wider text-[#C5A265] font-semibold mb-1">Jam Operasional</h4>
                  <p class="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
                    Senin – Sabtu: 09:00 – 18:00 WIB<br />
                    Minggu: Konsultasi by appointment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN (5 Cols): INTERACTIVE CONSULTATION FORM -->
        <div class="lg:col-span-5">
          <div class="sticky top-28 rounded-3xl bg-[#1A1513] border border-[#C5A265]/30 p-6 sm:p-8 shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
            <!-- Form Header -->
            <div class="mb-6">
              <span class="text-[10px] uppercase tracking-[0.25em] text-[#C5A265] font-semibold block mb-1">
                KONSULTASI GRATIS
              </span>
              <h3 class="font-serif text-2xl text-white font-normal">
                Kirim Pesan Langsung
              </h3>
              <p class="text-xs text-stone-400 font-light mt-1">
                Isi form di bawah untuk otomatis terhubung dengan admin via WhatsApp:
              </p>
            </div>

            <!-- Form -->
            <form @submit.prevent="submitToWhatsApp" class="space-y-4">
              <!-- Name Input -->
              <div>
                <label for="name" class="block text-xs font-medium text-stone-300 mb-1.5">
                  Nama Lengkap <span class="text-[#A82438]">*</span>
                </label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  required
                  placeholder="Contoh: Sarah & Dimas"
                  class="w-full px-4 py-2.5 rounded-xl bg-[#120E0D] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- WhatsApp Number Input -->
              <div>
                <label for="phone" class="block text-xs font-medium text-stone-300 mb-1.5">
                  Nomor WhatsApp Anda <span class="text-[#A82438]">*</span>
                </label>
                <input
                  id="phone"
                  v-model="form.phone"
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  class="w-full px-4 py-2.5 rounded-xl bg-[#120E0D] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Service Type Select -->
              <div>
                <label for="service" class="block text-xs font-medium text-stone-300 mb-1.5">
                  Layanan yang Diminati
                </label>
                <select
                  id="service"
                  v-model="form.service"
                  class="w-full px-4 py-2.5 rounded-xl bg-[#120E0D] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                >
                  <option value="Paket Pernikahan Lengkap (Wedding)">Paket Pernikahan Lengkap (Wedding)</option>
                  <option value="Dekorasi Pernikahan">Dekorasi Pernikahan</option>
                  <option value="Layanan Catering">Layanan Catering</option>
                  <option value="Konsultasi Konsep Custom">Konsultasi Konsep Custom</option>
                </select>
              </div>

              <!-- Event Date Input -->
              <div>
                <label for="eventDate" class="block text-xs font-medium text-stone-300 mb-1.5">
                  Perkiraan Tanggal Acara
                </label>
                <input
                  id="eventDate"
                  v-model="form.eventDate"
                  type="date"
                  class="w-full px-4 py-2.5 rounded-xl bg-[#120E0D] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors"
                />
              </div>

              <!-- Notes / Message Input -->
              <div>
                <label for="notes" class="block text-xs font-medium text-stone-300 mb-1.5">
                  Catatan atau Konsep Impian
                </label>
                <textarea
                  id="notes"
                  v-model="form.notes"
                  rows="3"
                  placeholder="Tuliskan estimasi tamu, lokasi venue, atau konsep impian Anda..."
                  class="w-full px-4 py-2.5 rounded-xl bg-[#120E0D] border border-white/10 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-[#C5A265] transition-colors resize-none"
                ></textarea>
              </div>

              <!-- Target Admin Choice -->
              <div>
                <label class="block text-xs font-medium text-stone-300 mb-1.5">
                  Hubungi Admin:
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    @click="form.targetAdmin = 'catering'"
                    class="py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer"
                    :class="[
                      form.targetAdmin === 'catering'
                        ? 'bg-[#700B11] text-white border-[#8C1B25]'
                        : 'bg-black/20 text-stone-400 border-white/10 hover:border-[#C5A265]/40'
                    ]"
                  >
                    Admin Catering
                  </button>
                  <button
                    type="button"
                    @click="form.targetAdmin = 'dekor'"
                    class="py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer"
                    :class="[
                      form.targetAdmin === 'dekor'
                        ? 'bg-[#700B11] text-white border-[#8C1B25]'
                        : 'bg-black/20 text-stone-400 border-white/10 hover:border-[#C5A265]/40'
                    ]"
                  >
                    Admin Decoration
                  </button>
                </div>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                class="w-full mt-2 py-3 px-5 rounded-full bg-[#700B11] hover:bg-[#851019] text-white text-xs sm:text-sm font-semibold text-center transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer border border-[#941A29]/60"
              >
                <span>Kirim Konsultasi via WhatsApp</span>
                <span class="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. MAP LOCATION EMBED SECTION -->
    <section class="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
      <div class="rounded-3xl overflow-hidden border border-[#2B211C] shadow-2xl relative bg-stone-900">
        <div class="p-6 sm:p-7 bg-[#1A1513] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span class="text-[10px] uppercase tracking-[0.25em] text-[#C5A265] font-semibold block mb-1">PETA LOKASI</span>
            <h3 class="font-serif text-xl sm:text-2xl text-white font-normal">Kunjungi Galeri Kalila</h3>
          </div>
          <a
            href="https://maps.google.com/?q=Wonocatur+Banguntapan+Bantul+Yogyakarta"
            target="_blank"
            rel="noopener noreferrer"
            class="px-5 py-2.5 rounded-full border border-[#C5A265] text-[#C5A265] hover:bg-[#C5A265] hover:text-black text-xs font-medium transition-all inline-flex items-center gap-2"
          >
            <span>Buka di Google Maps</span>
            <span>↗</span>
          </a>
        </div>
        <!-- Embedded Google Maps -->
        <div class="w-full h-72 sm:h-80 md:h-96 filter contrast-105">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3952.883726585168!2d110.40464677575184!3d-7.798157177402685!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a5746b5a8e32d%3A0x7d6a5c1a8d0b8f72!2sWonocatur%2C%20Banguntapan%2C%20Bantul%20Regency%2C%20Special%20Region%20of%20Yogyakarta!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid"
            width="100%"
            height="100%"
            style="border:0;"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="Lokasi Kantor Kalila Catering & Dekorasi"
          ></iframe>
        </div>
      </div>
    </section>

    <!-- 4. FOOTER -->
    <Footer />
  </div>
</template>

<script setup>
import { reactive, computed } from "vue";
import Navbar from "../components/common/Navbar.vue";
import Footer from "../components/common/Footer.vue";

// Background Assets
import HeroFloralBg from "../assets/portofolio-bg.png";

// Nomor resmi dari desain lama
const phoneOfficial = "628156870982"; // 0815-6870-982

// Direct WhatsApp URLs
const cateringWaUrl = `https://wa.me/${phoneOfficial}?text=${encodeURIComponent("Halo Admin Catering Kalila, saya ingin berkonsultasi mengenai paket dan menu catering pernikahan.")}`;
const dekorWaUrl = `https://wa.me/${phoneOfficial}?text=${encodeURIComponent("Halo Admin Dekorasi Kalila, saya ingin berkonsultasi mengenai konsep dan dekorasi pernikahan.")}`;

// Form State
const form = reactive({
  name: "",
  phone: "",
  service: "Paket Pernikahan Lengkap (Wedding)",
  eventDate: "",
  notes: "",
  targetAdmin: "catering",
});

// Submit Form to WhatsApp
const submitToWhatsApp = () => {
  const adminName = form.targetAdmin === "catering" ? "Admin Catering" : "Admin Dekorasi";
  const dateText = form.eventDate ? form.eventDate : "Belum ditentukan";
  const notesText = form.notes ? form.notes : "-";

  const message = [
    `Halo ${adminName} Kalila Catering & Dekorasi,`,
    `Saya ingin berkonsultasi mengenai rencana acara kami:`,
    ``,
    `*Nama:* ${form.name}`,
    `*No. WhatsApp:* ${form.phone}`,
    `*Layanan yang Diminati:* ${form.service}`,
    `*Perkiraan Tanggal Acara:* ${dateText}`,
    `*Catatan/Konsep:* ${notesText}`,
    ``,
    `Mohon informasi ketersediaan tanggal dan saran paket terbaik. Terima kasih!`
  ].join("\n");

  const url = `https://wa.me/${phoneOfficial}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
};
</script>

<style scoped>
/* Responsive iframe fix */
iframe {
  filter: invert(90%) hue-rotate(180deg) contrast(90%);
}
</style>
