<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="[
      isScrolled
        ? 'bg-[#0A0A0C]/95 backdrop-blur-md border-b border-white/5 py-3 shadow-2xl'
        : 'bg-transparent py-4 sm:py-6'
    ]"
  >
    <div class="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between">
        <!-- 1. EXACT LOGO (Imported directly from user's Figma export) -->
        <router-link to="/" class="flex items-center shrink-0 group" aria-label="Kalila Catering & Dekorasi Beranda">
          <img
            :src="logoImg"
            alt="Kalila Catering & Dekorasi"
            width="180"
            height="48"
            class="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_2px_12px_rgba(212,175,55,0.3)] transition-transform duration-200 group-hover:scale-105"
          />
        </router-link>

        <!-- 2. CENTER NAVIGATION PILL (Floating Capsule matching Figma exactly) -->
        <nav
          class="hidden md:flex items-center px-6 lg:px-7 py-2 rounded-full bg-black/60 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md space-x-6 lg:space-x-8 text-[11px] lg:text-[12px] font-medium tracking-[0.14em]"
        >
          <!-- HOME -->
          <router-link
            to="/"
            class="transition-colors hover:text-[#D4AF37]"
            :class="$route.path === '/' ? 'text-white font-bold' : 'text-gray-300'"
          >
            HOME
          </router-link>

          <!-- PORTOFOLIO Dropdown -->
          <div class="relative" @click.stop>
            <button
              type="button"
              @click="toggleDropdown('portfolio')"
              class="flex items-center gap-1.5 transition-colors hover:text-[#D4AF37] uppercase text-gray-300 cursor-pointer"
              :class="$route.path.startsWith('/portofolio') || portfolioOpen ? 'text-white font-bold' : ''"
              aria-haspopup="true"
              :aria-expanded="portfolioOpen"
              aria-label="Menu Portofolio"
            >
              <span>PORTOFOLIO</span>
              <svg
                class="w-3 h-3 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': portfolioOpen }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown Popover -->
            <div
              v-show="portfolioOpen"
              @click="closeAllDropdowns"
              class="absolute left-1/2 -translate-x-1/2 mt-3 w-48 rounded-2xl bg-[#101115]/95 border border-white/10 shadow-2xl py-2 z-50 backdrop-blur-xl"
            >
              <router-link
                to="/portofolio"
                class="block px-4 py-2 text-xs text-gray-300 hover:bg-[#1E2026] hover:text-[#D4AF37] transition-colors"
              >
                Semua Portofolio
              </router-link>
              <router-link
                to="/portofolio?kategori=dekor"
                class="block px-4 py-2 text-xs text-gray-300 hover:bg-[#1E2026] hover:text-[#D4AF37] transition-colors"
              >
                Dekorasi
              </router-link>
              <router-link
                to="/portofolio?kategori=wedding"
                class="block px-4 py-2 text-xs text-gray-300 hover:bg-[#1E2026] hover:text-[#D4AF37] transition-colors"
              >
                Wedding
              </router-link>
            </div>
          </div>

          <!-- PACKAGE Dropdown -->
          <div class="relative" @click.stop>
            <button
              type="button"
              @click="toggleDropdown('package')"
              class="flex items-center gap-1.5 transition-colors hover:text-[#D4AF37] uppercase text-gray-300 cursor-pointer"
              :class="$route.path.startsWith('/katalog') || packageOpen ? 'text-white font-bold' : ''"
              aria-haspopup="true"
              :aria-expanded="packageOpen"
              aria-label="Menu Paket Pernikahan"
            >
              <span>PACKAGE</span>
              <svg
                class="w-3 h-3 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': packageOpen }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              v-show="packageOpen"
              @click="closeAllDropdowns"
              class="absolute left-1/2 -translate-x-1/2 mt-3 w-52 rounded-2xl bg-[#101115]/95 border border-white/10 shadow-2xl py-2 z-50 backdrop-blur-xl"
            >
              <router-link
                to="/katalog/dekor"
                class="block px-4 py-2 text-xs text-gray-300 hover:bg-[#1E2026] hover:text-[#D4AF37] transition-colors"
              >
                Paket Dekorasi
              </router-link>
              <router-link
                to="/katalog/catering"
                class="block px-4 py-2 text-xs text-gray-300 hover:bg-[#1E2026] hover:text-[#D4AF37] transition-colors"
              >
                Paket Catering
              </router-link>
              <router-link
                to="/katalog/wedding"
                class="block px-4 py-2 text-xs text-gray-300 hover:bg-[#1E2026] hover:text-[#D4AF37] transition-colors"
              >
                Paket Wedding Lengkap
              </router-link>
            </div>
          </div>

          <!-- BLOG -->
          <router-link
            to="/blog"
            class="transition-colors hover:text-[#D4AF37]"
            :class="$route.path.startsWith('/blog') ? 'text-white font-bold' : 'text-gray-300'"
          >
            BLOG
          </router-link>

          <!-- CONTACT US -->
          <router-link
            to="/kontak"
            class="transition-colors hover:text-[#D4AF37]"
            :class="$route.path.startsWith('/kontak') ? 'text-white font-bold' : 'text-gray-300'"
          >
            CONTACT US
          </router-link>
        </nav>

        <!-- 3. RIGHT CTA BUTTONS (Konsultasi Sekarang + Profile/Login) -->
        <div class="hidden sm:flex items-center gap-3 shrink-0">
          <a
            :href="whatsappUrl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Konsultasi sekarang via WhatsApp"
            class="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full bg-gradient-to-b from-[#941A29] to-[#7B1320] hover:from-[#A82031] hover:to-[#8E1726] text-white text-[12px] font-semibold tracking-wide transition-all duration-300 shadow-[0_4px_16px_rgba(148,26,41,0.5)] hover:scale-105 active:scale-95"
          >
            <span>Konsultasi Sekarang</span>
            <!-- WhatsApp Outline Speech Bubble Icon matching Figma -->
            <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.62C9.36 7.62 9.09 7.68 8.87 7.92C8.64 8.16 8.03 8.73 8.03 9.9C8.03 11.07 8.89 12.2 9.01 12.36C9.13 12.52 10.7 14.94 13.1 15.97C13.67 16.22 14.12 16.37 14.46 16.48C15.03 16.66 15.55 16.63 15.97 16.57C16.43 16.5 17.39 15.99 17.59 15.42C17.79 14.86 17.79 14.37 17.73 14.27C17.67 14.18 17.51 14.12 17.27 14C17.03 13.89 15.84 13.3 15.62 13.22C15.4 13.14 15.24 13.1 15.08 13.34C14.92 13.58 14.46 14.12 14.32 14.27C14.18 14.43 14.04 14.45 13.8 14.33C13.56 14.22 12.78 13.96 11.86 13.14C11.14 12.5 10.66 11.71 10.52 11.47C10.38 11.23 10.5 11.1 10.62 10.98C10.73 10.87 10.87 10.69 11 10.54C11.12 10.38 11.16 10.27 11.24 10.11C11.32 9.95 11.28 9.81 11.22 9.69C11.16 9.57 10.7 8.44 10.51 7.98C10.32 7.53 10.13 7.59 9.98 7.58C9.84 7.58 9.68 7.62 9.53 7.62Z"/>
            </svg>
          </a>

          <!-- When Logged In: Client Profile with Dropdown -->
          <div v-if="authStore.isAuthenticated" class="relative">
            <button
              type="button"
              @click.stop="portfolioOpen = false; packageOpen = false; profileDropdownOpen = !profileDropdownOpen"
              class="flex items-center gap-2.5 py-1.5 pl-2 pr-3.5 rounded-full bg-[#18191E]/90 hover:bg-[#20222A] text-stone-200 border border-white/10 hover:border-[#C5A265]/40 transition-all shadow-md cursor-pointer group"
              :aria-expanded="profileDropdownOpen"
              aria-haspopup="true"
            >
              <!-- Avatar Circle with Initials -->
              <span class="w-7 h-7 rounded-full bg-gradient-to-tr from-[#700B11] to-[#941A29] border border-[#C5A265]/50 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                {{ authStore.userInitials }}
              </span>
              <span class="text-[12px] font-medium tracking-wide max-w-[110px] truncate text-stone-200 group-hover:text-white">
                {{ authStore.userName }}
              </span>
              <!-- Chevron Icon -->
              <svg
                class="w-3.5 h-3.5 text-stone-400 group-hover:text-white transition-transform duration-200"
                :class="{ 'rotate-180': profileDropdownOpen }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="transform scale-95 opacity-0 translate-y-1"
              enter-to-class="transform scale-100 opacity-100 translate-y-0"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="transform scale-100 opacity-100 translate-y-0"
              leave-to-class="transform scale-95 opacity-0 translate-y-1"
            >
              <div
                v-if="profileDropdownOpen"
                @click.stop
                class="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#141518]/98 backdrop-blur-xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.7)] py-2 z-50 overflow-hidden"
              >
                <!-- User Header -->
                <div class="px-4 py-2.5 border-b border-white/10">
                  <p class="text-xs font-semibold text-white truncate">
                    {{ authStore.userName }}
                  </p>
                  <p class="text-[11px] text-stone-400 truncate mt-0.5">
                    {{ authStore.userEmail }}
                  </p>
                  <span class="inline-block mt-1 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#700B11]/50 border border-[#700B11] text-[#E6CA65]">
                    {{ authStore.userRole === 'admin' ? 'ADMINISTRATOR' : 'CLIENT' }}
                  </span>
                </div>

                <!-- Menu Item: Progress -->
                <router-link
                  to="/progress"
                  @click="profileDropdownOpen = false"
                  class="flex items-center gap-2.5 px-4 py-2.5 text-xs text-stone-300 hover:text-white hover:bg-white/5 transition-colors group"
                >
                  <svg class="w-4 h-4 text-[#C5A265] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Progress & Pesanan</span>
                </router-link>

                <div class="border-t border-white/10 my-1"></div>

                <!-- Menu Item: Logout -->
                <button
                  type="button"
                  @click="handleLogout"
                  class="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors group cursor-pointer text-left"
                >
                  <svg class="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </transition>
          </div>

          <!-- When NOT Logged In: Login Button -->
          <router-link
            v-else
            to="/login"
            aria-label="Masuk ke akun Kalila"
            class="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-gradient-to-b from-[#941A29] to-[#7B1320] hover:from-[#A82031] hover:to-[#8E1726] text-white text-[12px] font-semibold tracking-wide transition-all duration-300 shadow-[0_4px_16px_rgba(148,26,41,0.5)] hover:scale-105 active:scale-95 text-center"
          >
            <span>Login</span>
          </router-link>
        </div>

        <!-- Mobile Hamburger Toggle -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden p-2 text-gray-300 hover:text-white"
          aria-label="Buka menu navigasi"
          :aria-expanded="mobileMenuOpen"
        >
          <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Mobile Menu Dropdown -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden mt-4 p-5 bg-[#0F1014]/98 border border-white/10 rounded-2xl space-y-3 text-xs text-gray-200 backdrop-blur-xl shadow-2xl"
      >
        <router-link to="/" @click="mobileMenuOpen = false" class="block py-1.5 hover:text-[#D4AF37]">HOME</router-link>
        <router-link to="/portofolio" @click="mobileMenuOpen = false" class="block py-1.5 hover:text-[#D4AF37]">PORTOFOLIO</router-link>
        <router-link to="/katalog/dekor" @click="mobileMenuOpen = false" class="block py-1.5 hover:text-[#D4AF37]">PAKET DEKORASI</router-link>
        <router-link to="/katalog/catering" @click="mobileMenuOpen = false" class="block py-1.5 hover:text-[#D4AF37]">PAKET CATERING</router-link>
        <router-link to="/katalog/wedding" @click="mobileMenuOpen = false" class="block py-1.5 hover:text-[#D4AF37]">PAKET WEDDING</router-link>
        <router-link to="/blog" @click="mobileMenuOpen = false" class="block py-1.5 hover:text-[#D4AF37]">BLOG</router-link>
        <router-link to="/kontak" @click="mobileMenuOpen = false" class="block py-1.5 hover:text-[#D4AF37]">CONTACT US</router-link>
        <div class="pt-2 flex flex-col gap-2">
          <a
            :href="whatsappUrl"
            target="_blank"
            class="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-[#8C1826] text-white text-xs font-semibold shadow-md"
          >
            <span>Konsultasi Sekarang</span>
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.62C9.36 7.62 9.09 7.68 8.87 7.92C8.64 8.16 8.03 8.73 8.03 9.9C8.03 11.07 8.89 12.2 9.01 12.36C9.13 12.52 10.7 14.94 13.1 15.97C13.67 16.22 14.12 16.37 14.46 16.48C15.03 16.66 15.55 16.63 15.97 16.57C16.43 16.5 17.39 15.99 17.59 15.42C17.79 14.86 17.79 14.37 17.73 14.27C17.67 14.18 17.51 14.12 17.27 14C17.03 13.89 15.84 13.3 15.62 13.22C15.4 13.14 15.24 13.1 15.08 13.34C14.92 13.58 14.46 14.12 14.32 14.27C14.18 14.43 14.04 14.45 13.8 14.33C13.56 14.22 12.78 13.96 11.86 13.14C11.14 12.5 10.66 11.71 10.52 11.47C10.38 11.23 10.5 11.1 10.62 10.98C10.73 10.87 10.87 10.69 11 10.54C11.12 10.38 11.16 10.27 11.24 10.11C11.32 9.95 11.28 9.81 11.22 9.69C11.16 9.57 10.7 8.44 10.51 7.98C10.32 7.53 10.13 7.59 9.98 7.58C9.84 7.58 9.68 7.62 9.53 7.62Z"/>
            </svg>
          </a>
          <!-- When Logged In: Mobile User Info + Progress + Logout -->
          <div v-if="authStore.isAuthenticated" class="space-y-2 pt-2 border-t border-white/10">
            <div class="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-white/5">
              <span class="w-8 h-8 rounded-full bg-gradient-to-tr from-[#700B11] to-[#941A29] border border-[#C5A265]/50 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                {{ authStore.userInitials }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold text-white truncate">{{ authStore.userName }}</p>
                <p class="text-[10px] text-stone-400 truncate">{{ authStore.userEmail }}</p>
              </div>
              <span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#700B11]/50 border border-[#700B11] text-[#E6CA65] shrink-0">
                {{ authStore.userRole === 'admin' ? 'ADMIN' : 'CLIENT' }}
              </span>
            </div>

            <router-link
              to="/progress"
              @click="mobileMenuOpen = false"
              class="flex items-center justify-between w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 text-xs font-medium transition-colors"
            >
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-[#C5A265]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Progress & Pesanan
              </span>
              <span class="text-stone-400">→</span>
            </router-link>

            <button
              type="button"
              @click="handleMobileLogout"
              class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium cursor-pointer transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>

          <!-- When NOT Logged In: Mobile Login Button -->
          <router-link
            v-else
            to="/login"
            @click="mobileMenuOpen = false"
            class="flex items-center justify-center w-full py-2.5 rounded-full bg-[#8C1826] hover:bg-[#A82031] text-white text-xs font-semibold shadow-md transition-all active:scale-95 text-center"
          >
            <span>Login</span>
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { useToastStore } from "../../stores/toast";
import logoImg from "../../assets/logo.png";

const router = useRouter();
const authStore = useAuthStore();
const toast = useToastStore();

const isScrolled = ref(false);
const portfolioOpen = ref(false);
const packageOpen = ref(false);
const mobileMenuOpen = ref(false);
const profileDropdownOpen = ref(false);

const whatsappNumber = "6281234567890";
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
  "Halo admin Kalila Catering & Dekorasi, saya ingin berkonsultasi mengenai paket pernikahan."
)}`;

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

const closeAllDropdowns = () => {
  portfolioOpen.value = false;
  packageOpen.value = false;
  profileDropdownOpen.value = false;
};

const toggleDropdown = (name) => {
  const nextPortfolio = name === "portfolio" ? !portfolioOpen.value : false;
  const nextPackage = name === "package" ? !packageOpen.value : false;
  closeAllDropdowns();
  portfolioOpen.value = nextPortfolio;
  packageOpen.value = nextPackage;
};

const handleLogout = () => {
  profileDropdownOpen.value = false;
  const name = authStore.userName;
  authStore.logout();
  toast.showInfo("Logout Berhasil", `Sampai jumpa kembali, ${name}.`);
  router.push("/");
};

const handleMobileLogout = () => {
  mobileMenuOpen.value = false;
  const name = authStore.userName;
  authStore.logout();
  toast.showInfo("Logout Berhasil", `Sampai jumpa kembali, ${name}.`);
  router.push("/");
};

const syncStorage = () => {
  authStore.syncAuth();
};

onMounted(() => {
  authStore.syncAuth();
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("click", closeAllDropdowns);
  window.addEventListener("storage", syncStorage);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("click", closeAllDropdowns);
  window.removeEventListener("storage", syncStorage);
});
</script>
