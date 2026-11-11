<template>
  <footer class="bg-[#120E0D] border-t border-[#C5A265]/20 text-gray-300 pt-10 sm:pt-12 pb-8">
    <div class="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 lg:gap-6 items-start pb-8">
        <!-- 1. Logo -->
        <div class="sm:col-span-2 md:col-span-3 flex items-center sm:items-start pt-1">
          <router-link to="/" class="inline-block group">
            <img
              :src="logoImg"
              alt="Kalila Catering & Dekorasi"
              class="h-11 sm:h-12 w-auto object-contain drop-shadow-[0_2px_12px_rgba(212,175,55,0.25)] transition-transform duration-200 group-hover:scale-105"
            />
          </router-link>
        </div>

        <!-- 2. Hubungi Kami -->
        <div class="md:col-span-4 space-y-2.5">
          <h3 class="text-xs sm:text-[13px] font-semibold text-[#DFBA73] tracking-wide">
            Hubungi Kami
          </h3>
          <ul class="space-y-2 text-xs text-gray-300 font-light">
            <li class="flex items-start gap-2.5">
              <svg class="w-4 h-4 text-[#DFBA73] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="leading-relaxed">Jl. Melati No. 21, Wonosari, Sleman, Yogyakarta</span>
            </li>
            <li class="flex items-center gap-2.5">
              <svg class="w-4 h-4 text-[#DFBA73] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>0812 3456 7890</span>
            </li>
            <li class="flex items-center gap-2.5">
              <svg class="w-4 h-4 text-[#DFBA73] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>info@kalila.co.id</span>
            </li>
          </ul>
        </div>

        <!-- 3. Navigasi (with vertical divider on left) -->
        <div class="md:col-span-2 md:border-l md:border-white/10 md:pl-6 lg:pl-8 space-y-2.5">
          <h3 class="text-xs sm:text-[13px] font-semibold text-[#DFBA73] tracking-wide">
            Navigasi
          </h3>
          <ul class="space-y-1.5 text-xs text-gray-300 font-light">
            <li><router-link to="/" class="hover:text-[#DFBA73] transition-colors">Home</router-link></li>
            <li><router-link to="/portofolio" class="hover:text-[#DFBA73] transition-colors">Portofolio</router-link></li>
            <li><router-link to="/katalog" class="hover:text-[#DFBA73] transition-colors">Package</router-link></li>
            <li><router-link to="/blog" class="hover:text-[#DFBA73] transition-colors">Blog</router-link></li>
            <li><router-link to="/kontak" class="hover:text-[#DFBA73] transition-colors">Contact Us</router-link></li>
          </ul>
        </div>

        <!-- 4. Ikuti Kami (with vertical divider on left) -->
        <div class="md:col-span-3 md:border-l md:border-white/10 md:pl-6 lg:pl-8 space-y-3.5">
          <h3 class="text-xs sm:text-[13px] font-semibold text-[#DFBA73] tracking-wide">
            Ikuti Kami
          </h3>
          <div class="flex items-center gap-2.5">
            <!-- Instagram -->
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              class="w-7 h-7 rounded-full border border-[#DFBA73]/60 text-[#DFBA73] hover:border-[#DFBA73] hover:bg-[#DFBA73] hover:text-black flex items-center justify-center transition-all active:scale-95"
              aria-label="Kunjungi Instagram Kalila"
            >
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            <!-- TikTok -->
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              class="w-7 h-7 rounded-full border border-[#DFBA73]/60 text-[#DFBA73] hover:border-[#DFBA73] hover:bg-[#DFBA73] hover:text-black flex items-center justify-center transition-all active:scale-95"
              aria-label="Kunjungi TikTok Kalila"
            >
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>

            <!-- YouTube -->
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              class="w-7 h-7 rounded-full border border-[#DFBA73]/60 text-[#DFBA73] hover:border-[#DFBA73] hover:bg-[#DFBA73] hover:text-black flex items-center justify-center transition-all active:scale-95"
              aria-label="Kunjungi YouTube Kalila"
            >
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>

            <!-- Facebook -->
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              class="w-7 h-7 rounded-full border border-[#DFBA73]/60 text-[#DFBA73] hover:border-[#DFBA73] hover:bg-[#DFBA73] hover:text-black flex items-center justify-center transition-all active:scale-95"
              aria-label="Kunjungi Facebook Kalila"
            >
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.6 5H18V0h-3.808C10.595 0 9 1.583 9 4.615V8z"/>
              </svg>
            </a>
          </div>

          <!-- Red CTA Button with WhatsApp Icon -->
          <div class="pt-1">
            <a
              :href="whatsappUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8B1E2F] hover:bg-[#A32438] text-white text-xs font-semibold tracking-wide transition-all shadow-[0_4px_16px_rgba(139,30,47,0.35)] hover:scale-105 active:scale-95"
              aria-label="Konsultasi sekarang via WhatsApp"
            >
              <span>Konsultasi Sekarang</span>
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <!-- Copyright -->
      <div class="pt-6 sm:pt-8 text-center text-xs text-gray-400 font-light tracking-wide border-t border-white/5">
        <p>&copy; 2024 Kalila Catering & Dekorasi. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import logoImg from "../../assets/logo.png";

const whatsappNumber = "6281234567890";
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
  "Halo admin Kalila Catering & Dekorasi, saya tertarik untuk konsultasi acara pernikahan."
)}`;
</script>
