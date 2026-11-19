<template>
  <div class="min-h-screen bg-[#161210] text-gray-200 font-sans selection:bg-[#C5A265] selection:text-black">
    <!-- Navbar -->
    <Navbar :show-konsultasi="false" :nav-capsule="false" />

    <!-- 1. HERO SECTION -->
    <section class="relative w-full pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-16 lg:pb-20 overflow-hidden border-b border-[#C5A265]/20">
      <!-- Background Image -->
      <div class="absolute inset-0 z-0">
        <img
          :src="HeroFloralBg"
          alt="Wedding Portfolio Background"
          class="w-full h-full object-cover object-center scale-105"
        />
        <!-- Light overlay so text stays readable, but image remains clearly visible -->
        <div class="absolute inset-0 bg-[#161210]/45"></div>
        <!-- Subtle bottom fade to transition into page bg -->
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
            OUR PORTFOLIO
          </span>
          <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
        </div>

        <!-- Headline: Selalu Wedding Portfolio -->
        <h1 class="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] text-white font-normal tracking-tight mb-3 sm:mb-4 leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
          Wedding Portfolio
        </h1>

        <!-- Subtitle -->
        <p class="text-xs sm:text-sm md:text-[15px] text-stone-300 font-light leading-relaxed max-w-xl mx-auto mb-7 sm:mb-8 drop-shadow">
          Dokumentasi momen sakral pernikahan dengan paket lengkap All-in-One persembahan Kalila Catering &amp; WO.
        </p>

        <!-- Category Filter Tabs (Pill Buttons) -->
        <div class="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            @click="activeFilterTab = tab.value"
            class="px-6 sm:px-7 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer"
            :class="[
              activeFilterTab === tab.value
                ? 'bg-[#700B11] text-white border border-[#8C1B25] shadow-[0_4px_16px_rgba(112,11,17,0.45)]'
                : 'bg-transparent text-stone-300 border border-white/20 hover:border-[#C5A265]/50 hover:text-white'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </section>

    <!-- 2. GALLERY GRID SECTION -->
    <section class="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <!-- When "Semua" is active: Render 3 top cards + 1 bottom wide card layout -->
      <div v-if="activeFilterTab === 'semua'" class="space-y-5 sm:space-y-6">
        <!-- Row 1: 3 Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <div
            v-for="item in row1Items"
            :key="item.id"
            @click="openLightbox(item)"
            class="relative rounded-2xl overflow-hidden group cursor-pointer border border-[#2B211C] hover:border-[#C5A265]/60 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.7)] hover:-translate-y-1 h-[280px] sm:h-[340px] md:h-[380px] bg-stone-900"
          >
            <img
              :src="item.image"
              :alt="item.title"
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-5 sm:p-6 transition-opacity duration-300">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <span class="text-[10px] text-[#C5A265] uppercase tracking-wider font-semibold block mb-0.5">{{ item.package }}</span>
                  <h3 class="font-serif text-lg sm:text-xl text-white font-normal group-hover:text-[#F2E3CF] transition-colors drop-shadow">
                    {{ item.title }}
                  </h3>
                </div>
                <button
                  type="button"
                  class="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/50 group-hover:border-[#C5A265] group-hover:bg-[#C5A265] group-hover:text-black text-white flex items-center justify-center transition-all duration-300 shadow-md shrink-0 cursor-pointer"
                  :aria-label="'Lihat ' + item.title"
                >
                  <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 2: 1 Full-width Wide Card -->
        <div
          v-if="row2Item"
          @click="openLightbox(row2Item)"
          class="relative rounded-2xl overflow-hidden group cursor-pointer border border-[#2B211C] hover:border-[#C5A265]/60 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.7)] hover:-translate-y-1 h-[280px] sm:h-[340px] md:h-[400px] bg-stone-900"
        >
          <img
            :src="row2Item.image"
            :alt="row2Item.title"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent flex flex-col justify-end p-5 sm:p-7">
            <div class="flex items-center justify-between gap-3">
              <div>
                <span class="text-[10px] text-[#C5A265] uppercase tracking-wider font-semibold block mb-0.5">{{ row2Item.package }}</span>
                <h3 class="font-serif text-xl sm:text-2xl text-white font-normal group-hover:text-[#F2E3CF] transition-colors drop-shadow">
                  {{ row2Item.title }}
                </h3>
              </div>
              <button
                type="button"
                class="w-10 h-10 rounded-full border border-white/50 group-hover:border-[#C5A265] group-hover:bg-[#C5A265] group-hover:text-black text-white flex items-center justify-center transition-all duration-300 shadow-md shrink-0 cursor-pointer"
                :aria-label="'Lihat ' + row2Item.title"
              >
                <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- When Filtered (Economy / Premium / Luxury / Custom): Responsive Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-fade-in">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          @click="openLightbox(item)"
          class="relative rounded-2xl overflow-hidden group cursor-pointer border border-[#2B211C] hover:border-[#C5A265]/60 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.7)] hover:-translate-y-1 h-[300px] sm:h-[360px] bg-stone-900"
        >
          <img
            :src="item.image"
            :alt="item.title"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-5 sm:p-6">
            <div class="flex items-center justify-between gap-3">
              <div>
                <span class="text-[10px] text-[#C5A265] uppercase tracking-wider font-semibold block mb-0.5">{{ item.package }}</span>
                <h3 class="font-serif text-lg sm:text-xl text-white font-normal group-hover:text-[#F2E3CF] transition-colors drop-shadow">
                  {{ item.title }}
                </h3>
              </div>
              <button
                type="button"
                class="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/50 group-hover:border-[#C5A265] group-hover:bg-[#C5A265] group-hover:text-black text-white flex items-center justify-center transition-all duration-300 shadow-md shrink-0 cursor-pointer"
                :aria-label="'Lihat ' + item.title"
              >
                <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state fallback -->
        <div
          v-if="filteredItems.length === 0"
          class="col-span-full flex flex-col items-center justify-center py-20 text-stone-500 gap-3"
        >
          <svg class="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <p class="text-sm">Belum ada portofolio untuk kategori ini.</p>
        </div>
      </div>
    </section>

    <!-- 3. LIGHTBOX MODAL -->
    <div
      v-if="selectedItem"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all"
      @click.self="selectedItem = null"
    >
      <div class="relative w-full max-w-3xl bg-[#1C1614] border border-[#C5A265]/40 rounded-2xl overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        <!-- Close Button -->
        <button
          @click="selectedItem = null"
          class="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-20 border border-white/10"
        >
          ✕
        </button>

        <!-- Big Image Display -->
        <div class="relative w-full h-64 sm:h-80 md:h-96 bg-stone-950 overflow-hidden">
          <img
            :src="selectedItem.image"
            :alt="selectedItem.title"
            class="w-full h-full object-cover object-center"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-[#1C1614] via-transparent to-transparent"></div>
        </div>

        <!-- Content Details -->
        <div class="p-6 sm:p-7 space-y-4 overflow-y-auto">
          <div class="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A265]">
                {{ selectedItem.package.toUpperCase() }} WEDDING
              </span>
              <h2 class="font-serif text-2xl sm:text-3xl text-white font-normal mt-1">
                {{ selectedItem.title }}
              </h2>
            </div>
            <!-- Tags -->
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(tag, tIdx) in selectedItem.tags"
                :key="tIdx"
                class="px-2.5 py-1 rounded-full text-[11px] bg-white/5 border border-white/10 text-stone-300"
              >
                #{{ tag }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 text-xs text-[#C5A265]/90 font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>{{ selectedItem.venue }}</span>
          </div>

          <p class="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
            {{ selectedItem.description }}
          </p>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-white/10">
            <a
              :href="getConsultUrl(selectedItem)"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full sm:flex-1 py-3 px-5 rounded-full bg-[#700B11] hover:bg-[#851019] text-white text-xs sm:text-sm font-medium text-center transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer border border-[#941A29]/60"
            >
              <span>Konsultasikan via WhatsApp</span>
              <span class="transition-transform group-hover:translate-x-1">→</span>
            </a>

            <router-link
              to="/katalog/wedding"
              class="w-full sm:w-auto py-3 px-6 rounded-full border border-[#C5A265] text-[#C5A265] hover:bg-[#C5A265]/10 text-xs sm:text-sm font-medium text-center transition-colors"
            >
              Lihat Paket Wedding
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. FOOTER -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import Navbar from "../components/common/Navbar.vue";
import Footer from "../components/common/Footer.vue";

// Background Assets
import HeroFloralBg from "../assets/portofolio-bg.png";

// Wedding Photos
import imgEconomy from "../assets/dekor/economy-wedding.png";
import imgPremium from "../assets/dekor/dahlia-wedding.png";
import imgLuxury from "../assets/dekor/amaryllis-wedding.png";
import imgCustom from "../assets/dekor/custom-package.png";

// Filter tabs for Wedding: 4 paket sesuai paket wedding
const tabs = [
  { value: "semua",   label: "Semua" },
  { value: "economy", label: "Economy" },
  { value: "premium", label: "Premium" },
  { value: "luxury",  label: "Luxury" },
  { value: "custom",  label: "Custom" },
];

const activeFilterTab = ref("semua");
const selectedItem = ref(null);
const whatsappNumber = "6281234567890";

// Wedding Portfolio Items
const weddingItems = [
  {
    id: 1,
    title: "Pernikahan Hangat & Praktis",
    package: "Economy Package",
    category: "economy",
    image: imgEconomy,
    venue: "Gedung Serbaguna & Rumah",
    description: "Dokumentasi paket Economy lengkap — dekorasi pelaminan anggun 6 meter, catering 300 porsi prasmanan lezat, rias busana sepasang pengantin, dan dokumentasi foto.",
    tags: ["Economy", "Hangat", "Praktis"]
  },
  {
    id: 2,
    title: "Pernikahan Elegan & Berkelas",
    package: "Premium Package",
    category: "premium",
    image: imgPremium,
    venue: "Grand Ballroom Hotel",
    description: "Dokumentasi paket Premium — dekorasi pelaminan modern 8-10 meter dengan fresh flowers, catering 500 pax dengan gubukan spesial, MC profesional, dan wedding organizer hari-H.",
    tags: ["Premium", "Ballroom", "WO Tim"]
  },
  {
    id: 3,
    title: "Pernikahan Megah & Eksklusif",
    package: "Luxury Package",
    category: "luxury",
    image: imgLuxury,
    venue: "Convention Hall & Luxury Hotel",
    description: "Dokumentasi paket Luxury — tata panggung megah 12+ meter bertabur ribuan mawar segar, live music akustik, fine dining buffet 800+ porsi, dan cinematic video shooting.",
    tags: ["Luxury", "Cinematic", "Megah"]
  },
  {
    id: 4,
    title: "Pernikahan Konsep Custom Impian",
    package: "Custom Package",
    category: "custom",
    image: imgCustom,
    venue: "Glasshouse & Outdoor Garden",
    description: "Pernikahan unik disesuaikan secara khusus dengan visi pengantin — dari konsep outdoor garden party, menu fusion internasional, hingga tata cahaya tematik yang memukau.",
    tags: ["Custom", "Outdoor", "Tematik"]
  }
];

// Row 1 (3 items) & Row 2 (1 item)
const row1Items = computed(() => weddingItems.slice(0, 3));
const row2Item = computed(() => weddingItems[3] ?? null);

// Filtered items when a specific tab is active
const filteredItems = computed(() => {
  if (activeFilterTab.value === "semua") return weddingItems;
  return weddingItems.filter(item => item.category === activeFilterTab.value);
});

const openLightbox = (item) => {
  selectedItem.value = item;
};

const getConsultUrl = (item) => {
  const msg = `Halo admin Kalila Catering & Dekorasi, saya tertarik berkonsultasi mengenai ${item.title} (${item.package}) untuk acara pernikahan kami.`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
};
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
