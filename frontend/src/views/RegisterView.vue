<template>
  <div
    class="min-h-screen w-full flex flex-col md:flex-row overflow-x-hidden font-sans select-none"
    style="background-color: #F7F5E8; color: #22272B;"
  >
    <!-- LEFT PANEL: BANQUET VISUAL & BRANDING (Visible on md & lg screens) -->
    <div
      class="hidden md:flex md:flex-1 relative min-h-screen overflow-hidden flex-col justify-between p-8 lg:p-12 xl:p-14 bg-cover bg-center bg-no-repeat shadow-2xl"
      :style="{ backgroundImage: `url(${bannerImg})` }"
    >
      <!-- Subtle dark gradient overlay to ensure contrast and luxury mood -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none"></div>

      <!-- Top decorative quote -->
      <div class="relative z-10 flex justify-start">
        <div class="text-left italic font-serif text-sm tracking-wider text-[#D8C49A] flex items-center gap-2 drop-shadow">
          <span class="w-8 h-[1px] bg-[#D8C49A] inline-block opacity-80"></span>
          <span>Create Your Special Moment</span>
        </div>
      </div>

      <!-- Center: Logo, Divider Line & Slogan (Elevated into Clear Upper Space) -->
      <div class="relative z-10 my-auto -translate-y-8 sm:-translate-y-12 lg:-translate-y-16 text-center px-4 py-4 w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto flex flex-col justify-center items-center">
        <!-- Logo from assets/logo-login.png -->
        <img
          :src="logoLoginImg"
          alt="Kalila Catering & Dekorasi"
          class="w-64 sm:w-72 md:w-80 lg:w-[350px] max-w-full h-auto object-contain filter drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]"
        />

        <!-- Thin Gold Horizontal Line -->
        <div class="w-14 sm:w-16 h-[1.5px] bg-[#C5A265] mx-auto my-3 sm:my-3.5 opacity-90 shadow-sm"></div>

        <!-- Italic Serif Slogan -->
        <p class="font-serif italic text-sm sm:text-base lg:text-lg text-[#F2E8D8] tracking-wide leading-relaxed text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
          Kualitas Rasa, Keindahan dalam<br />Setiap Momen Spesial
        </p>
      </div>

      <!-- Bottom Address & Copyright Row -->
      <div class="relative z-10 flex items-end justify-between">
        <!-- Location Badge on left bottom -->
        <div class="bg-[#2D060B]/85 backdrop-blur-md rounded-2xl py-3 px-4 border border-[#8C2835]/40 text-stone-200 flex items-start gap-2.5 max-w-xs shadow-2xl">
          <svg class="w-4 h-4 text-[#D8C49A] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div class="text-[11px] leading-relaxed text-stone-300">
            Jl. BLPP No. 21, Wonocatur, Banguntapan, Kab. Bantul, D.I. Yogyakarta
          </div>
        </div>

        <!-- Copyright text on right bottom -->
        <span class="text-[11px] text-white/50 tracking-wide">
          © 2025 Kalila Catering & Dekorasi Dev
        </span>
      </div>
    </div>

    <!-- RIGHT PANEL: REGISTRATION FORM -->
    <div
      class="relative w-full md:w-[50%] lg:w-[48%] xl:w-[46%] min-h-screen flex flex-col justify-between px-6 sm:px-10 md:px-8 lg:px-14 xl:px-16 py-6 md:py-8 lg:py-10 z-10"
      style="background-color: #F7F5E8;"
    >
      <!-- S-CURVE WAVE DIVIDER WITH GOLD STROKE (Visible on md & lg screens, sticking out to the left) -->
      <div class="hidden md:block absolute top-0 -left-12 lg:-left-16 w-12 lg:w-16 h-full pointer-events-none z-20">
        <svg class="h-full w-full" viewBox="0 0 100 1000" preserveAspectRatio="none">
          <!-- Fill continuing the cream background (#F7F5E8) into the wave protruding left -->
          <path d="M 100,0 L 48,0 C 12,100 14,220 46,340 C 78,460 80,560 52,700 C 28,820 32,920 52,1000 L 100,1000 Z" fill="#F7F5E8" />
          <!-- Golden accent stroke along the wavy edge -->
          <path d="M 48,0 C 12,100 14,220 46,340 C 78,460 80,560 52,700 C 28,820 32,920 52,1000" stroke="#C9A86A" stroke-width="2.5" fill="none" />
        </svg>
      </div>

      <!-- TOP BRAND LOGO (Centered) -->
      <div class="relative z-10 w-full flex justify-center py-1 sm:py-2">
        <router-link to="/" class="inline-block group focus:outline-none" title="Kembali ke Beranda">
          <img
            :src="logoImg"
            alt="Kalila Catering & Dekorasi"
            class="h-10 sm:h-12 md:h-13 w-auto object-contain filter drop-shadow-sm brightness-90 hover:brightness-100 transition-all mx-auto"
            width="160"
            height="55"
          />
        </router-link>
      </div>

      <!-- MAIN FORM CONTENT WRAPPER -->
      <div class="relative z-10 my-auto py-3 sm:py-5 max-w-sm sm:max-w-md w-full mx-auto">
        <!-- Header Text (Centered) -->
        <div class="text-center mb-5 sm:mb-6">
          <!-- Badge Tagline -->
          <p
            class="text-xs font-semibold tracking-[0.24em] uppercase mb-1.5"
            style="color: #B5965A;"
          >
            PENDAFTARAN AKUN
          </p>

          <!-- Main Title -->
          <h1
            class="font-serif text-3xl sm:text-4xl font-medium tracking-tight mb-2"
            style="color: #22272B;"
          >
            Buat Akun Baru
          </h1>

          <!-- Subtitle -->
          <p class="text-stone-500 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
            Daftar untuk mulai mewujudkan pernikahan impian Anda bersama Kalila.
          </p>
        </div>

        <!-- Feedback Alert Message -->
        <div
          v-if="feedback.message"
          :class="[
            'p-3.5 rounded-xl text-xs sm:text-sm mb-4 flex items-start gap-2.5 transition-all',
            feedback.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          ]"
        >
          <svg v-if="feedback.type === 'error'" class="w-4 h-4 mt-0.5 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else class="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ feedback.message }}</span>
        </div>

        <!-- FORM -->
        <form @submit.prevent="handleRegister" class="space-y-3 sm:space-y-3.5">
          <!-- 1. Nama Lengkap -->
          <div>
            <label
              for="name"
              class="block text-[11px] font-bold tracking-wider uppercase mb-1"
              style="color: #3D4247;"
            >
              NAMA LENGKAP
            </label>
            <div class="relative flex items-center">
              <span class="absolute left-4 pointer-events-none text-stone-400 flex items-center z-10">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                autocomplete="name"
                placeholder="Masukkan nama lengkap Anda"
                class="w-full rounded-xl sm:rounded-2xl py-3 text-sm placeholder-stone-400 focus:outline-none focus:bg-white transition-all shadow-sm"
                style="background-color: #F7F5E8; border: 1px solid #E3DDD2; color: #22272B; padding-left: 2.85rem; padding-right: 1rem;"
              />
            </div>
          </div>

          <!-- 2. Email Field -->
          <div>
            <label
              for="email"
              class="block text-[11px] font-bold tracking-wider uppercase mb-1"
              style="color: #3D4247;"
            >
              E-MAIL ADDRESS
            </label>
            <div class="relative flex items-center">
              <span class="absolute left-4 pointer-events-none text-stone-400 flex items-center z-10">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                autocomplete="email"
                placeholder="Masukkan alamat email Anda"
                class="w-full rounded-xl sm:rounded-2xl py-3 text-sm placeholder-stone-400 focus:outline-none focus:bg-white transition-all shadow-sm"
                style="background-color: #F7F5E8; border: 1px solid #E3DDD2; color: #22272B; padding-left: 2.85rem; padding-right: 1rem;"
              />
            </div>
          </div>

          <!-- 3. Nomor WhatsApp -->
          <div>
            <label
              for="phone"
              class="block text-[11px] font-bold tracking-wider uppercase mb-1"
              style="color: #3D4247;"
            >
              NOMOR WHATSAPP
            </label>
            <div class="relative flex items-center">
              <span class="absolute left-4 pointer-events-none text-stone-400 flex items-center z-10">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                required
                autocomplete="tel"
                placeholder="Contoh: 081234567890"
                class="w-full rounded-xl sm:rounded-2xl py-3 text-sm placeholder-stone-400 focus:outline-none focus:bg-white transition-all shadow-sm"
                style="background-color: #F7F5E8; border: 1px solid #E3DDD2; color: #22272B; padding-left: 2.85rem; padding-right: 1rem;"
              />
            </div>
          </div>

          <!-- 4. Password Field -->
          <div>
            <label
              for="password"
              class="block text-[11px] font-bold tracking-wider uppercase mb-1"
              style="color: #3D4247;"
            >
              PASSWORD
            </label>
            <div class="relative flex items-center">
              <span class="absolute left-4 pointer-events-none text-stone-400 flex items-center z-10">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                placeholder="Minimal 8 karakter"
                class="w-full rounded-xl sm:rounded-2xl py-3 text-sm placeholder-stone-400 focus:outline-none focus:bg-white transition-all shadow-sm"
                style="background-color: #F7F5E8; border: 1px solid #E3DDD2; color: #22272B; padding-left: 2.85rem; padding-right: 2.85rem;"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3.5 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none z-10 p-1 cursor-pointer"
                tabindex="-1"
                :aria-label="showPassword ? 'Sembunyikan password' : 'Lihat password'"
              >
                <!-- Eye Open -->
                <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <!-- Eye Crossed -->
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 5. Konfirmasi Password -->
          <div>
            <label
              for="confirmPassword"
              class="block text-[11px] font-bold tracking-wider uppercase mb-1"
              style="color: #3D4247;"
            >
              KONFIRMASI PASSWORD
            </label>
            <div class="relative flex items-center">
              <span class="absolute left-4 pointer-events-none text-stone-400 flex items-center z-10">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                placeholder="Ulangi password Anda"
                class="w-full rounded-xl sm:rounded-2xl py-3 text-sm placeholder-stone-400 focus:outline-none focus:bg-white transition-all shadow-sm"
                style="background-color: #F7F5E8; border: 1px solid #E3DDD2; color: #22272B; padding-left: 2.85rem; padding-right: 2.85rem;"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3.5 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none z-10 p-1 cursor-pointer"
                tabindex="-1"
                :aria-label="showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Lihat konfirmasi password'"
              >
                <!-- Eye Open -->
                <svg v-if="!showConfirmPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <!-- Eye Crossed -->
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Buttons Group -->
          <div class="pt-2 space-y-2.5 sm:space-y-3">
            <!-- BUAT AKUN BUTTON -->
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full font-medium text-xs sm:text-sm tracking-wider uppercase py-3.5 px-6 rounded-full transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed active:scale-[0.99]"
              style="background-color: #700B11; color: #FFFFFF;"
            >
              <span>{{ isLoading ? 'MEMPROSES...' : 'BUAT AKUN' }}</span>
              <svg v-if="!isLoading" class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            </button>

            <!-- SUDAH PUNYA AKUN? LOGIN BUTTON -->
            <router-link
              to="/login"
              class="w-full font-medium text-xs sm:text-sm tracking-wider uppercase py-3.5 px-6 rounded-full transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] hover:bg-stone-100"
              style="border: 1.5px solid #700B11; color: #700B11; background-color: transparent;"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>SUDAH PUNYA AKUN? LOGIN</span>
            </router-link>
          </div>
        </form>
      </div>

      <!-- FOOTER NOTE / BACK LINK -->
      <div class="relative z-10 flex items-center justify-between text-xs text-stone-400 pt-3">
        <router-link
          to="/"
          class="hidden sm:inline-flex items-center gap-1.5 text-stone-500 hover:text-[#700B11] transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Beranda
        </router-link>
        <span class="text-[11px] text-stone-400/80 mx-auto sm:mx-0">
          © 2025 Kalila Catering & Dekorasi Dev
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { authApi } from "../api/auth";
import logoImg from "../assets/logo.png";
import logoLoginImg from "../assets/logo-login.png";
import bannerImg from "../assets/login-banner.jpg";

const router = useRouter();

const form = reactive({
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
});

const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);
const feedback = reactive({
  type: "",
  message: "",
});

const handleRegister = async () => {
  feedback.type = "";
  feedback.message = "";

  // Validasi Form
  if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) {
    feedback.type = "error";
    feedback.message = "Harap lengkapi semua kolom formulir.";
    return;
  }

  if (form.phone.trim().length < 9) {
    feedback.type = "error";
    feedback.message = "Nomor WhatsApp minimal terdiri dari 9 digit.";
    return;
  }

  if (form.password.length < 8) {
    feedback.type = "error";
    feedback.message = "Password minimal terdiri dari 8 karakter.";
    return;
  }

  if (form.password !== form.confirmPassword) {
    feedback.type = "error";
    feedback.message = "Konfirmasi password tidak cocok.";
    return;
  }

  isLoading.value = true;

  try {
    const res = await authApi.register({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
    });

    feedback.type = "success";
    feedback.message = res.message || "Akun berhasil dibuat! Mengalihkan ke halaman Login...";

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  } catch (err) {
    feedback.type = "error";
    feedback.message =
      err?.response?.data?.message ||
      err?.response?.data?.errors?.[0]?.message ||
      err?.message ||
      "Terjadi kesalahan saat pendaftaran. Silakan coba lagi.";
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
input:focus {
  border-color: #700b11 !important;
  box-shadow: 0 0 0 1px #700b11, 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

button:hover {
  filter: brightness(1.05);
}
</style>
