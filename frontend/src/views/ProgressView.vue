<template>
  <div class="min-h-screen bg-[#0B0B0C] text-gray-200 font-sans flex flex-col justify-between">
    <Navbar />

    <main class="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full flex-1">
      <!-- Breadcrumb / Header -->
      <div class="mb-8">
        <p class="text-xs font-semibold tracking-[0.2em] text-[#C5A265] uppercase mb-2">
          CLIENT DASHBOARD
        </p>
        <h1 class="font-serif text-3xl sm:text-4xl text-white font-medium">
          Progress & Pesanan Anda
        </h1>
        <p class="text-stone-400 text-sm mt-1">
          Pantau status booking, verifikasi pembayaran DP, dan timeline acara Anda di sini.
        </p>
      </div>

      <!-- User Profile Card Summary -->
      <div class="bg-[#141518] border border-white/10 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-[#700B11] to-[#941A29] flex items-center justify-center text-white text-xl font-bold border border-[#C5A265]/40 shadow-md">
            {{ authStore.userInitials }}
          </div>
          <div>
            <h2 class="text-lg font-semibold text-white">
              {{ authStore.userName }}
            </h2>
            <p class="text-stone-400 text-xs">
              {{ authStore.userEmail }}
            </p>
            <span class="inline-block mt-1 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#700B11]/40 border border-[#700B11] text-[#E6CA65]">
              {{ authStore.userRole === 'admin' ? 'Administrator' : 'Verified Client' }}
            </span>
          </div>
        </div>

        <button
          @click="handleLogout"
          class="text-xs text-stone-400 hover:text-red-400 transition-colors flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Keluar (Logout)
        </button>
      </div>

      <!-- Orders / Progress Content -->
      <div class="bg-[#141518]/80 border border-white/10 rounded-2xl p-8 sm:p-12 text-center shadow-xl">
        <div class="w-16 h-16 rounded-full bg-[#700B11]/20 border border-[#700B11]/50 text-[#C5A265] flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>

        <h3 class="text-lg sm:text-xl font-medium text-white mb-2">
          Belum Ada Pesanan yang Berjalan
        </h3>
        <p class="text-stone-400 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
          Pilih paket dekorasi, catering, atau wedding impian Anda di katalog kami untuk memulai pemesanan dan memantau statusnya di sini.
        </p>

        <router-link
          to="/katalog"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#700B11] to-[#941A29] text-white text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <span>Eksplorasi Katalog Paket</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </router-link>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import Navbar from "../components/common/Navbar.vue";
import Footer from "../components/common/Footer.vue";

const router = useRouter();
const authStore = useAuthStore();

const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};
</script>
