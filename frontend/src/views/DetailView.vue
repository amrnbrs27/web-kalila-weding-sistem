<template>
  <div class="min-h-screen bg-[#161210] text-gray-200 font-sans selection:bg-[#C5A265] selection:text-black">
    <!-- Navbar -->
    <Navbar :show-konsultasi="false" :nav-capsule="false" />

    <!-- 1. HERO & BREADCRUMB SECTION -->
    <section class="relative w-full pt-28 sm:pt-32 md:pt-36 pb-10 sm:pb-14 overflow-hidden border-b border-[#C5A265]/20">
      <!-- Background Image with Dark Romantic Overlays -->
      <div class="absolute inset-0 z-0">
        <img
          :src="HeroBg"
          alt="Package Detail Background"
          class="w-full h-full object-cover object-center scale-105"
        />
        <div class="absolute inset-0 bg-[#161210]/80 backdrop-blur-[2px]"></div>
        <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#161210] to-transparent"></div>
      </div>

      <!-- Thin Golden Divider Line below Navbar -->
      <div class="absolute top-[72px] sm:top-[80px] md:top-[88px] left-0 right-0 h-[1px] bg-[#C5A265]/25 z-20 pointer-events-none"></div>

      <!-- Breadcrumbs & Title Container -->
      <div class="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Breadcrumb Navigation -->
        <nav class="flex items-center gap-2 text-xs sm:text-[13px] text-stone-400 mb-4 sm:mb-6">
          <router-link to="/" class="hover:text-[#C5A265] transition-colors">Beranda</router-link>
          <span>/</span>
          <router-link :to="catalogBackUrl" class="hover:text-[#C5A265] transition-colors">
            {{ catalogBackTitle }}
          </router-link>
          <span>/</span>
          <span class="text-[#C5A265] font-medium truncate max-w-[200px] sm:max-w-none">
            {{ currentPackage.name }}
          </span>
        </nav>

        <!-- Kicker Tagline with Golden Lines -->
        <div class="inline-flex items-center gap-3 mb-2.5">
          <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
          <span class="text-[10px] sm:text-xs uppercase tracking-[0.28em] text-[#C5A265] font-semibold drop-shadow">
            {{ currentPackage.tagline || 'DETAIL PAKET' }}
          </span>
          <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
        </div>

        <!-- Headline -->
        <h1 class="font-serif text-3xl sm:text-4xl md:text-5xl text-white font-normal tracking-tight leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
          {{ currentPackage.name }}
        </h1>
      </div>
    </section>

    <!-- 2. MAIN DETAIL CONTENT (2 Columns: Left Image & Specs, Right Overview & Inclusions) -->
    <section class="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

        <!-- ================= LEFT COLUMN (5 Cols): IMAGE & TECHNICAL SPECS ================= -->
        <div class="lg:col-span-5 space-y-6">
          <!-- Main Showcase Image Card -->
          <div class="relative rounded-3xl overflow-hidden border border-[#2B231D] bg-[#0E131B] shadow-[0_12px_40px_rgba(0,0,0,0.6)] group">
            <div class="aspect-[4/3] w-full overflow-hidden bg-black/40 relative">
              <img
                :src="currentPackage.image"
                :alt="currentPackage.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <!-- Luxury Badge on Image -->
              <span
                v-if="currentPackage.badge"
                class="absolute top-4 right-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[#700B11]/90 text-white border border-[#941A29]/60 backdrop-blur-sm shadow-md"
              >
                {{ currentPackage.badge }}
              </span>
            </div>

            <!-- Mini Caption Below Image -->
            <div class="p-4 bg-[#141A24]/60 border-t border-white/5 flex items-center justify-between text-xs text-stone-400">
              <span class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Foto Asli Portofolio Kalila
              </span>
              <span class="text-[#C5A265] font-medium">Verified Design</span>
            </div>
          </div>

          <!-- Quick Specifications Grid (4 Cards) -->
          <div class="grid grid-cols-2 gap-3 sm:gap-4">
            <!-- Spec 1: Stage Width / Capacity -->
            <div class="p-4 rounded-2xl bg-[#0E131B]/90 border border-white/10 space-y-1 shadow-sm">
              <p class="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Dimensi / Lebar</p>
              <p class="text-sm font-semibold text-white flex items-center gap-1.5">
                <span class="text-[#C5A265]">📏</span>
                <span>{{ currentPackage.stageWidth || 'Fleksibel Venue' }}</span>
              </p>
            </div>

            <!-- Spec 2: Floral Concept -->
            <div class="p-4 rounded-2xl bg-[#0E131B]/90 border border-white/10 space-y-1 shadow-sm">
              <p class="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Komposisi Bunga</p>
              <p class="text-sm font-semibold text-white flex items-center gap-1.5">
                <span class="text-[#C5A265]">🌸</span>
                <span>Fresh &amp; Artificial</span>
              </p>
            </div>

            <!-- Spec 3: Lighting Ambiance -->
            <div class="p-4 rounded-2xl bg-[#0E131B]/90 border border-white/10 space-y-1 shadow-sm">
              <p class="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Pencahayaan</p>
              <p class="text-sm font-semibold text-white flex items-center gap-1.5">
                <span class="text-[#C5A265]">💡</span>
                <span>Full Spot &amp; Warm Ambiance</span>
              </p>
            </div>

            <!-- Spec 4: DP Flat Rule -->
            <div class="p-4 rounded-2xl bg-[#0E131B]/90 border border-white/10 space-y-1 shadow-sm">
              <p class="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Ketentuan DP</p>
              <p class="text-sm font-semibold text-[#DFBA73] flex items-center gap-1.5">
                <span>🏷️</span>
                <span>Flat Rp 1.000.000</span>
              </p>
            </div>
          </div>

          <!-- Special PRD Highlight: Self Design 2D Canvas (Only for Dekorasi Category) -->
          <div
            v-if="currentPackage.category === 'dekor'"
            class="p-5 rounded-2xl bg-gradient-to-br from-[#700B11]/25 to-[#1C1614] border border-[#C5A265]/40 shadow-md relative overflow-hidden"
          >
            <div class="flex items-start gap-3.5">
              <div class="w-9 h-9 rounded-xl bg-[#C5A265]/20 border border-[#C5A265]/50 flex items-center justify-center shrink-0 text-[#C5A265] text-lg">
                ✨
              </div>
              <div class="space-y-1">
                <h4 class="text-xs sm:text-sm font-semibold text-white">
                  Mendukung Fitur Self Design 2D
                </h4>
                <p class="text-xs text-stone-300 leading-relaxed font-light">
                  Setelah DP terverifikasi, Anda mendapatkan akses kanvas 2D untuk menata posisi backdrop, standing flowers, dan ornamen pelaminan sesuai lebar paket ini (<strong class="text-[#C5A265]">{{ currentPackage.stageWidth }}</strong>).
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= RIGHT COLUMN (7 Cols): OVERVIEW, INCLUSIONS & CTA ================= -->
        <div class="lg:col-span-7 space-y-6 sm:space-y-8">

          <!-- Price & DP Info Card -->
          <div class="p-6 sm:p-7 rounded-3xl bg-[#0E131B]/95 border border-white/10 shadow-xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-wider text-stone-400 font-medium mb-1">
                Total Biaya Paket
              </p>
              <p class="font-serif text-3xl sm:text-4xl font-bold text-[#DFBA73] tracking-tight">
                {{ formatPrice(currentPackage.price) }}
              </p>
              <p class="text-[11px] text-stone-400 mt-1">
                Sudah termasuk instalasi, transportasi area Yogyakarta, &amp; pembongkaran.
              </p>
            </div>

            <!-- Booking DP Pill Badge -->
            <div class="sm:text-right shrink-0">
              <span class="inline-block px-3.5 py-1.5 rounded-full bg-[#700B11]/80 border border-[#941A29] text-xs font-semibold text-white tracking-wide shadow-sm">
                DP Flat Rp 1.000.000
              </span>
              <p class="text-[11px] text-stone-400 mt-1.5">
                Batas unggah bukti 24 jam
              </p>
            </div>
          </div>

          <!-- Description Section -->
          <div class="space-y-2.5">
            <h2 class="font-serif text-xl sm:text-2xl text-white font-medium">
              Deskripsi Paket
            </h2>
            <p class="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
              {{ currentPackage.description }}
            </p>
          </div>

          <!-- Inclusions & Facility List (Grid Checklist) -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="font-serif text-xl sm:text-2xl text-white font-medium">
                Kelengkapan &amp; Fasilitas Paket
              </h2>
              <span class="text-xs text-[#C5A265] font-medium">
                {{ currentPackage.inclusions.length }} Item Termasuk
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                v-for="(item, idx) in currentPackage.inclusions"
                :key="idx"
                class="p-3.5 rounded-2xl bg-[#141A24]/70 border border-white/5 hover:border-[#C5A265]/40 transition-colors flex items-start gap-3 text-xs sm:text-[13px] text-stone-200"
              >
                <!-- Golden Checkmark -->
                <div class="w-5 h-5 rounded-full bg-[#DFBA73]/20 border border-[#DFBA73]/50 text-[#DFBA73] flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-3 h-3 fill-current" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span class="leading-relaxed">{{ item }}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons (Pesan Sekarang, Konsultasi WhatsApp, Kembali) -->
          <div class="pt-4 border-t border-white/10 space-y-3">
            <div class="flex flex-col sm:flex-row items-center gap-3.5">
              <!-- Primary CTA: Pesan Paket Ini -->
              <router-link
                :to="bookingUrl"
                class="w-full sm:flex-1 py-3.5 px-8 rounded-full bg-gradient-to-r from-[#700B11] to-[#8C1B25] hover:from-[#851019] hover:to-[#A31F2E] text-white font-semibold text-xs sm:text-sm tracking-wider uppercase text-center transition-all duration-300 shadow-[0_4px_24px_rgba(112,11,17,0.55)] hover:shadow-[0_8px_32px_rgba(112,11,17,0.7)] hover:scale-[1.02] active:scale-[0.98] border border-[#941A29]/70 flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Pesan Paket Ini Sekarang</span>
              </router-link>

              <!-- Secondary CTA: Konsultasi WhatsApp -->
              <a
                :href="whatsappConsultUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full sm:w-auto py-3.5 px-6 rounded-full border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.62C9.36 7.62 9.09 7.68 8.87 7.92C8.64 8.16 8.03 8.73 8.03 9.9C8.03 11.07 8.89 12.2 9.01 12.36C9.13 12.52 10.7 14.94 13.1 15.97C13.67 16.22 14.12 16.37 14.46 16.48C15.03 16.66 15.55 16.63 15.97 16.57C16.43 16.5 17.39 15.99 17.59 15.42C17.79 14.86 17.79 14.37 17.73 14.27C17.67 14.18 17.51 14.12 17.27 14C17.03 13.89 15.84 13.3 15.62 13.22C15.4 13.14 15.24 13.1 15.08 13.34C14.92 13.58 14.46 14.12 14.32 14.27C14.18 14.43 14.04 14.45 13.8 14.33C13.56 14.22 12.78 13.96 11.86 13.14C11.14 12.5 10.66 11.71 10.52 11.47C10.38 11.23 10.5 11.1 10.62 10.98C10.73 10.87 10.87 10.69 11 10.54C11.12 10.38 11.16 10.27 11.24 10.11C11.32 9.95 11.28 9.81 11.22 9.69C11.16 9.57 10.7 8.44 10.51 7.98C10.32 7.53 10.13 7.59 9.98 7.58C9.84 7.58 9.68 7.62 9.53 7.62Z"/>
                </svg>
                <span>Konsultasi</span>
              </a>
            </div>

            <!-- Back to Catalog Link -->
            <div class="text-center pt-2">
              <router-link
                :to="catalogBackUrl"
                class="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-[#C5A265] transition-colors"
              >
                <span>← Kembali ke Katalog {{ catalogBackTitle }}</span>
              </router-link>
            </div>
          </div>

        </div>

      </div>
    </section>

    <!-- 3. RELATED PACKAGES SECTION (Rekomendasi Paket Lainnya) -->
    <section class="relative w-full py-16 sm:py-20 border-t border-white/10 bg-[#120E0D]/60">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Section Header -->
        <div class="text-center mb-10 sm:mb-12">
          <div class="inline-flex items-center justify-center gap-3 mb-2.5">
            <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
            <span class="text-[10px] sm:text-xs uppercase tracking-[0.28em] text-[#C5A265] font-semibold drop-shadow">
              REKOMENDASI LAINNYA
            </span>
            <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
          </div>

          <h2 class="font-serif text-2xl sm:text-3xl md:text-4xl text-white font-normal">
            Pilihan Paket Menarik Lainnya
          </h2>
          <p class="text-xs sm:text-sm text-stone-400 font-light mt-2">
            Bandingkan dengan paket dekorasi lainnya untuk menemukan yang paling pas untuk hari bahagia Anda.
          </p>
        </div>

        <!-- 3 Related Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="relPkg in relatedPackages"
            :key="relPkg.slug"
            class="rounded-2xl overflow-hidden bg-[#0F0D0C] border border-[#2B231D] hover:border-[#C5A265]/50 transition-all duration-300 flex flex-col group shadow-lg hover:-translate-y-1"
          >
            <!-- Image Aspect 4:3 -->
            <div class="w-full aspect-[4/3] overflow-hidden relative bg-black/40">
              <img
                :src="relPkg.image"
                :alt="relPkg.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span class="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#700B11]/90 text-white border border-[#941A29]/60">
                {{ relPkg.stageWidth }}
              </span>
            </div>

            <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <p class="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C5A265] mb-1">
                  {{ relPkg.tagline }}
                </p>
                <h3 class="font-serif text-lg font-medium text-white group-hover:text-[#E6CA65] transition-colors">
                  {{ relPkg.name }}
                </h3>
                <p class="text-sm font-bold text-[#DFBA73] mt-1">
                  {{ formatPrice(relPkg.price) }}
                </p>
                <p class="text-xs text-stone-400 font-light mt-2 line-clamp-2">
                  {{ relPkg.description }}
                </p>
              </div>

              <div class="flex items-center gap-2 pt-2 border-t border-white/5">
                <router-link
                  :to="`/paket/${relPkg.slug}`"
                  class="flex-1 py-2 px-3 rounded-full border border-white/20 hover:border-[#C5A265] text-stone-200 hover:text-white text-xs font-medium text-center transition-all flex items-center justify-center gap-1"
                >
                  <span>Lihat Detail</span>
                  <span>→</span>
                </router-link>

                <router-link
                  :to="`/booking/${relPkg.slug}`"
                  class="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8C1826] to-[#700B11] hover:from-[#A82031] text-white flex items-center justify-center shadow-md hover:scale-105 transition-all"
                  title="Pesan Paket Ini"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. SERVICE VALUES SECTION (Mengapa Kalila?) -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Feature 1 -->
        <div class="p-6 rounded-2xl bg-[#0E131B]/90 border border-white/10 text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-[#700B11]/30 border border-[#C5A265]/40 text-[#C5A265] flex items-center justify-center mx-auto text-xl">
            🌸
          </div>
          <h3 class="font-serif text-lg text-white font-medium">Bunga Segar &amp; Ornamen Premium</h3>
          <p class="text-xs text-stone-400 font-light leading-relaxed">
            Kombinasi bunga segar berkualitas tinggi serta ornamen backdrop modern yang kokoh dan estetik.
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="p-6 rounded-2xl bg-[#0E131B]/90 border border-white/10 text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-[#700B11]/30 border border-[#C5A265]/40 text-[#C5A265] flex items-center justify-center mx-auto text-xl">
            ⏰
          </div>
          <h3 class="font-serif text-lg text-white font-medium">Ketepatan Waktu &amp; Tim Profesional</h3>
          <p class="text-xs text-stone-400 font-light leading-relaxed">
            Instalasi selesai tepat waktu sebelum acara dimulai dengan pengawasan ketat tim dekorasi ahli.
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="p-6 rounded-2xl bg-[#0E131B]/90 border border-white/10 text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-[#700B11]/30 border border-[#C5A265]/40 text-[#C5A265] flex items-center justify-center mx-auto text-xl">
            🎨
          </div>
          <h3 class="font-serif text-lg text-white font-medium">Fleksibilitas Konsep Adat &amp; Modern</h3>
          <p class="text-xs text-stone-400 font-light leading-relaxed">
            Bebas menyesuaikan warna bunga dan konsep adat (Jawa, Sunda, Minang) atau konsep modern minimalis.
          </p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import Navbar from "../components/common/Navbar.vue";
import Footer from "../components/common/Footer.vue";

// Background Assets
import HeroBg from "../assets/dekor-package-bg.png";

// Real Images for 8 Decoration Packages
import imgEconomy from "../assets/dekor/economy-wedding.png";
import imgDahlia from "../assets/dekor/dahlia-wedding.png";
import imgRose from "../assets/dekor/rose-wedding.png";
import imgAmaryllis from "../assets/dekor/amaryllis-wedding.png";
import imgSunflower from "../assets/dekor/sunflower-wedding.png";
import imgEdelweiss from "../assets/dekor/edelweiss-wedding.png";
import imgBougainvillea from "../assets/dekor/bougainvillea-wedding.png";
import imgCustom from "../assets/dekor/custom-package.png";

// Catering & Wedding Banner Images
import HeroCateringBg from "../assets/catering/catering-hero-clean.png";
import WeddingHeroBg from "../assets/wedding-hero-clean.png";

const route = useRoute();
const adminPhone = "628156870982";

// Comprehensive Catalog Data
const allPackages = [
  // ================= 1. DEKORASI PACKAGES =================
  {
    category: "dekor",
    id: 1,
    tagline: "DEKORASI HEMAT",
    name: "Economy Wedding",
    slug: "economy-wedding",
    price: 3000000,
    stageWidth: "6 Meter",
    badge: "Hemat Budget",
    image: imgEconomy,
    description: "Dekorasi pelaminan minimalis modern yang anggun dan hemat budget, dirancang khusus untuk konsep intimate wedding yang hangat dan khidmat.",
    inclusions: [
      "Backdrop Pelaminan 6 Meter (Pilihan Warna Soft / Putih)",
      "Standing Flowers 2 Titik Fresh Florals",
      "Mini Garden Pelaminan Depan Segar",
      "Karpet Panggung & Karpet Jalan",
      "Lighting Sorot Panggung Warm White 4 Titik",
      "1 Pasang Kursi Mempelai & 2 Pasang Kursi Orang Tua",
      "Meja Akad Nikah + Bunga Meja Segar",
      "Kotak Angpao 2 Buah + Gembok",
    ]
  },
  {
    category: "dekor",
    id: 2,
    tagline: "FAVORITE CHOICE",
    name: "Dahlia Wedding",
    slug: "dahlia-wedding",
    price: 5500000,
    stageWidth: "8 Meter",
    badge: "Paling Diminati",
    image: imgDahlia,
    description: "Konsep pelaminan modern romantis dengan kombinasi bunga segar pilihan dan tata ruang yang elegan untuk momen sakral yang tak terlupakan.",
    inclusions: [
      "Backdrop Pelaminan 8 Meter Konsep Minimalis Modern",
      "Standing Flowers 4 Titik Full Fresh Florals",
      "Mini Garden Rimbun dengan Rumput & Bunga Segar Pilihan",
      "Gazebo / Pergola Pintu Masuk Elegan",
      "Karpet Jalan Rose Petal Sepanjang Pintu Masuk",
      "Lighting Warm White Ambience & Spotlight Panggung",
      "Set Kursi Pelaminan Eksklusif Ukir Modern",
      "Meja Akad Nikah Lengkap dengan Bunga Segar",
      "Kotak Angpao Eksklusif 2 Buah",
      "Stand Foto Prewedding 2 Titik",
    ]
  },
  {
    category: "dekor",
    id: 3,
    tagline: "ROMANTIC FLORAL",
    name: "Rose Wedding",
    slug: "rose-wedding",
    price: 6500000,
    stageWidth: "8 Meter",
    badge: "Romantic Rose",
    image: imgRose,
    description: "Dekorasi bertema nuansa bunga mawar pastel yang lembut dan mewah, menciptakan atmosfer romantis, hangat, dan sangat berkesan bagi para tamu.",
    inclusions: [
      "Backdrop Pelaminan 8 Meter Rose Floral Concept",
      "Flower Arch Lengkung Bunga Mawar Segar Pilihan",
      "Standing Flowers 6 Titik di Area Panggung",
      "Mini Garden 2 Trap Mewah Bertingkat",
      "Photobooth Backdrop 3x2.5 Meter + Lighting Studio",
      "Kotak Angpao Eksklusif 2 Buah + Gembok",
      "Karpet Panggung Velvet Premium",
      "Full Warm White Lighting & Hidden LED Strips",
      "Set Meja & Kursi Akad Nikah VIP",
      "Standing Welcome Signage Custom Nama Mempelai",
    ]
  },
  {
    category: "dekor",
    id: 4,
    tagline: "ELEGANT CONTEMPORARY",
    name: "Amaryllis Wedding",
    slug: "amaryllis-wedding",
    price: 7500000,
    stageWidth: "10 Meter",
    badge: "Megah 10M",
    image: imgAmaryllis,
    description: "Desain megah kontemporer berpadu dengan aksen lengkungan modern dan bunga segar melimpah, sangat cocok untuk gedung pertemuan dan ballroom luas.",
    inclusions: [
      "Backdrop Pelaminan 10 Meter Konsep Modern Luxury",
      "Standing Flowers 6 Titik Bunga Segar Premium",
      "Mini Garden 3 Trap Bunga Segar & Tanaman Hias Hijau",
      "Gate / Pergola Masuk Mewah dengan Lampu Gantung Kristal",
      "Backdrop Photobooth Custom 3D dengan Nama Mempelai",
      "Meja & Kursi Akad Nikah VIP Lengkap",
      "Kotak Uang 2 Unit dengan Gembok Pengaman",
      "Lighting Par LED & Moving Beam Panggung",
      "Gate Lorong Masuk Pengantin (Entrance Arch)",
      "Welcome Board Akrilik Eksklusif dengan Bunga Meja",
    ]
  },
  {
    category: "dekor",
    id: 5,
    tagline: "WARM & JOYFUL",
    name: "Sunflower Wedding",
    slug: "sunflower-wedding",
    price: 8500000,
    stageWidth: "10 Meter",
    badge: "Gold Ambiance",
    image: imgSunflower,
    description: "Atmosfer pesta pernikahan ceria dan hangat dengan sentuhan warna keemasan dan bunga segar premium yang memikat setiap pandangan.",
    inclusions: [
      "Backdrop Pelaminan 10 Meter Nuansa Gold Champagne & Fresh Florals",
      "Standing Flowers 8 Titik Bunga Segar Pilihan",
      "Taman Panggung Depan 3 Trap Bertingkat Ekstra Rimbun",
      "Tunnel / Lorong Masuk Bunga Lampu Gantung Elegan",
      "Photobooth 3D Tematik Eksklusif dengan Properti Foto",
      "Set Meja Penerima Tamu VIP & 2 Kotak Angpao",
      "Lighting Lengkap (Moving Head, Par LED, Spotlight)",
      "Set Kursi Pelaminan Klasik Modern",
      "Karpet Jalan Sepanjang 15 Meter",
      "Dekorasi Meja Akad Nikah + Kursi Tiffany",
    ]
  },
  {
    category: "dekor",
    id: 6,
    tagline: "TIMELESS PURITY",
    name: "Edelweiss Wedding",
    slug: "edelweiss-wedding",
    price: 9500000,
    stageWidth: "12 Meter",
    badge: "Grand White",
    image: imgEdelweiss,
    description: "Kemewahan abadi bernuansa putih salju dan kristal, memberikan kesan sakral, anggun, dan sangat megah untuk panggung gedung besar.",
    inclusions: [
      "Backdrop Pelaminan 12 Meter Megah White & Crystal Concept",
      "Hanging Crystal Chandeliers & Glass Ornaments Mewah",
      "Standing Flowers 8 Titik Full Imported & Local Fresh Florals",
      "Mini Garden Rimbun Extra Luas Depan Panggung",
      "Lorong Bunga (Flower Tunnel) 6 Meter di Area Masuk",
      "Backdrop Photobooth VIP + Aksesoris Properti Foto",
      "Area Meja Akad Nikah Luxury + Karpet Bulu Tebal",
      "Tata Lampu Teater & Efek Kabut Asap (Dry Ice)",
      "Set Kursi Pelaminan Grand King & Queen",
      "Kotak Uang Eksklusif 3 Unit",
    ]
  },
  {
    category: "dekor",
    id: 7,
    tagline: "ROYAL LUXURY",
    name: "Bougainvillea Wedding",
    slug: "bougainvillea-wedding",
    price: 11000000,
    stageWidth: "12 Meter",
    badge: "Royal Luxury",
    image: imgBougainvillea,
    description: "Paket dekorasi pelaminan termewah untuk gedung besar dan ballroom dengan bunga segar impor melimpah serta arsitektur backdrop kerajaan.",
    inclusions: [
      "Backdrop Pelaminan 12-14 Meter Grand Ballroom Luxury",
      "Full Fresh Flower Installation (Bunga Segar Lokal & Impor Pilihan)",
      "Standing Flowers 10 Titik di Seluruh Area Panggung & Karpet Jalan",
      "Pergola Masuk Grand Dome dengan Lampu Kristal Mewah",
      "Photobooth 3D Grand Visual & Lighting Studio",
      "Dekorasi Area Penerima Tamu & Buku Tamu VIP",
      "Dekorasi Meja Akad Nikah Klasik Eropa / Adat Pilihan",
      "Lighting Show Lengkap oleh Lighting Engineer Khusus",
      "Dry Ice Effect untuk Momen Kirab Pengantin",
      "Set Meja & Kursi VIP Keluarga",
    ]
  },
  {
    category: "dekor",
    id: 8,
    tagline: "TAILORED MASTERPIECE",
    name: "Custom Package",
    slug: "custom-package",
    price: 15000000,
    stageWidth: "Custom Sesuka Anda",
    badge: "Custom Tailored",
    image: imgCustom,
    description: "Desain dekorasi pernikahan yang sepenuhnya dirancang khusus (tailor-made) sesuai visi, konsep budaya, dan impian Anda bersama tim desainer Kalila.",
    inclusions: [
      "Konsultasi 3D Desain & Mockup Visual dari Desainer Kalila",
      "Ukuran Panggung Bebas Disesuaikan Dimensi Venue (Indoor / Outdoor)",
      "Bebas Memilih Jenis Bunga Segar, Palet Warna, & Ornamen Kustom",
      "Backdrop Photobooth & Gate Masuk Dirancang Khusus",
      "Tata Cahaya & Lighting Engineer Khusus Selama Acara",
      "Pendampingan Tim Kreatif Kalila dari Konsep hingga Hari H",
      "Dekorasi Lengkap Meja Akad, Buku Tamu, & Meja VIP",
      "Efek Panggung Spesial (Dry Ice, Cold Fireworks)",
    ]
  },

  // ================= 2. WEDDING PACKAGES =================
  {
    category: "wedding",
    id: 9,
    tagline: "ALL-IN-ONE WEDDING",
    name: "Economy Wedding Package",
    slug: "economy-wedding-package",
    price: 28500000,
    stageWidth: "6-8 Meter",
    badge: "Hemat & Lengkap",
    image: WeddingHeroBg,
    description: "Paket pernikahan all-in-one praktis dan terjangkau, mencakup dekorasi pelaminan, catering prasmanan 200 porsi, rias pengantin, dokumentasi, hingga MC.",
    inclusions: [
      "Dekorasi Pelaminan Minimalis Modern (6-8 Meter) + Bunga Segar",
      "Dekorasi Meja Akad Nikah + Karpet Jalan",
      "Catering Prasmanan 200 Porsi (Menu Lengkap Ayam, Daging, Sayur, Dessert)",
      "Rias Pengantin Akad & Resepsi (MUA Profesional)",
      "Busana Pengantin Lengkap Akad & Resepsi (2 Kali Ganti)",
      "Rias & Busana 2 Pasang Orang Tua (Ibu & Bapak)",
      "Dokumentasi Foto & Video Liputan Hari H",
      "1 Flashdisk Eksklusif Semua File + Cetak Foto Kolase 20 Halaman",
      "Sound System Standar Resepsi + 2 Mic Wireless",
      "Master of Ceremony (MC) Akad & Resepsi",
    ]
  },
  {
    category: "wedding",
    id: 10,
    tagline: "ALL-IN-ONE WEDDING",
    name: "Premium Wedding Package",
    slug: "premium-wedding-package",
    price: 45000000,
    stageWidth: "8-10 Meter",
    badge: "Paling Populer",
    image: WeddingHeroBg,
    description: "Paket wedding lengkap dengan catering prasmanan 400 porsi, menu stall istimewa, tim wedding organizer profesional, dan dokumentasi sinematik.",
    inclusions: [
      "Dekorasi Pelaminan Modern Romantic 8-10 Meter + Photobooth",
      "Catering Prasmanan 400 Porsi + 2 Menu Stall Pilihan (200 Porsi)",
      "Rias Pengantin MUA Top + Busana 3 Kali Ganti",
      "Rias & Busana Orang Tua serta 4 Pagar Ayu / Pagar Bagus",
      "Dokumentasi Foto, Video Teaser Sinematik, & Drone Aerial",
      "Tim Wedding Organizer (WO) 6 Personil On the Day",
      "Live Acoustic Band / Mini Entertainment + Sound System 3000W",
      "Master of Ceremony (MC) Profesional Akad & Resepsi",
      "Dry Ice Effect saat Wedding Entrance",
    ]
  },

  // ================= 3. CATERING PACKAGES =================
  {
    category: "catering",
    id: 11,
    tagline: "CATERING PRASMANAN",
    name: "Paket Prasmanan Silver",
    slug: "prasmanan-silver",
    price: 21000,
    stageWidth: "Prasmanan / Pax",
    badge: "Hemat Lezat",
    image: HeroCateringBg,
    description: "Pilihan menu prasmanan lengkap dan higienis dengan olahan ayam pilihan, aneka sayur segar, sup istimewa, puding buah, dan kerupuk udang.",
    inclusions: [
      "Nasi Putih Premium Harum",
      "Olahan Ayam (Ayam Goreng Lengkuas / Rica / Asam Manis)",
      "Sayur Pilihan (Capcay Goreng / Cah Brokoli Bakso)",
      "Sup Segar (Sup Kimlo / Sup Mutiara / Sup Jagung)",
      "Sambal Goreng Kentang Krecek",
      "Kerupuk Udang Gurih",
      "Buah Potong Segar (Semangka & Melon)",
      "Puding Cocktail + Vla Vanilla",
      "Air Mineral Cup",
    ]
  },
  {
    category: "catering",
    id: 12,
    tagline: "CATERING PRASMANAN",
    name: "Paket Prasmanan Gold",
    slug: "prasmanan-gold",
    price: 27000,
    stageWidth: "Prasmanan / Pax",
    badge: "Best Value",
    image: HeroCateringBg,
    description: "Menu prasmanan favorit dengan tambahan hidangan utama daging sapi empuk, olahan ayam istimewa, sup buntut segar, dan aneka es buah manis.",
    inclusions: [
      "Nasi Putih Premium & Nasi Goreng Spesial",
      "Olahan Daging Sapi (Rendang / Daging Balado / Rolade Daging)",
      "Olahan Ayam (Ayam Bakar Madu / Ayam Suwir Pedas Manis)",
      "Sup Spesial (Sup Buntut / Sup Merah Sosis)",
      "Sayur Pilihan (Cah Kailan Daging Cincang / Capcay Seafood)",
      "Sambal Goreng Ati Ampela Kapri",
      "Kerupuk Udang Super",
      "Buah Potong Segar 3 Macam",
      "Puding Coklat & Aneka Buah + Vla",
      "Es Buah Segar & Air Mineral Cup",
    ]
  },
  {
    category: "catering",
    id: 13,
    tagline: "CATERING PRASMANAN",
    name: "Paket Prasmanan Deluxe",
    slug: "prasmanan-deluxe",
    price: 35000,
    stageWidth: "Prasmanan / Pax",
    badge: "Premium VIP",
    image: HeroCateringBg,
    description: "Pengalaman bersantap VIP terbaik dengan olahan daging sapi lada hitam, seafood istimewa, zuppa soup hangat, dan dessert corner eksklusif.",
    inclusions: [
      "Nasi Putih Organik & Nasi Liwet / Nasi Kebuli Berempah",
      "Menu Utama Sapi (Beef Black Pepper / Teriyaki / Empal Gentong)",
      "Menu Utama Ikan/Seafood (Fillet Gurame Asam Manis / Udang Crispy)",
      "Menu Olahan Ayam (Chicken Cordon Bleu / Ayam Panggang Kalila)",
      "Sup Signature (Zuppa Soup / Tom Yum Seafood)",
      "Sayur Eksklusif (Baby Corn Jamur Shiitake / Asparagus Kepiting)",
      "Sweet Corner & Aneka Puding Mini Cup",
      "Buah Potong Eksklusif & Infused Water / Es Sarang Burung",
      "Peralatan Chafing Dish Roll Top Mewah + Waiter Standby",
    ]
  }
];

// Determine Current Package from Route Params
const currentPackage = computed(() => {
  const param = route.params.id;
  if (!param) return allPackages[1]; // Default Dahlia Wedding

  // Try exact slug or id match
  const found = allPackages.find(p => p.slug === param || String(p.id) === String(param));
  if (found) return found;

  // Try partial slug match
  const partial = allPackages.find(p => p.slug.includes(param) || param.includes(p.slug));
  if (partial) return partial;

  // Default fallback
  return allPackages[1];
});

// Related packages in the same category (excluding current)
const relatedPackages = computed(() => {
  return allPackages
    .filter(p => p.category === currentPackage.value.category && p.slug !== currentPackage.value.slug)
    .slice(0, 3);
});

// Currency Formatter
const formatPrice = (val) => {
  if (!val || val === 0) return "Rp 0.000.000 (Konsultasi)";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

// Booking URL with auto-selected package
const bookingUrl = computed(() => {
  return `/booking/${currentPackage.value.slug}?category=${currentPackage.value.category}`;
});

// WhatsApp Consultation URL with pre-filled message
const whatsappConsultUrl = computed(() => {
  const priceStr = currentPackage.value.price > 0 ? ` (${formatPrice(currentPackage.value.price)})` : "";
  const msg = `Halo admin Kalila Catering & Dekorasi, saya ingin berkonsultasi mengenai ${currentPackage.value.name}${priceStr}.`;
  return `https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`;
});

// Breadcrumb back links
const catalogBackUrl = computed(() => {
  if (currentPackage.value.category === "catering") return "/katalog/catering";
  if (currentPackage.value.category === "wedding") return "/katalog/wedding";
  return "/katalog";
});

const catalogBackTitle = computed(() => {
  if (currentPackage.value.category === "catering") return "Paket Catering";
  if (currentPackage.value.category === "wedding") return "Paket Wedding";
  return "Paket Dekorasi";
});
</script>

<style scoped>
/* Scoped styles */
</style>
