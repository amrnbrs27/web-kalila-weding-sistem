<template>
  <div class="min-h-screen bg-[#161210] text-gray-200 font-sans selection:bg-[#C5A265] selection:text-black">
    <!-- Navbar (Seamless transparent header matching Figma) -->
    <Navbar :show-konsultasi="false" :nav-capsule="false" />

    <!-- 1. HERO SECTION: DECORATION PORTFOLIO (Matching Figma Design Exactly) -->
    <section class="relative w-full pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-16 lg:pb-20 overflow-hidden border-b border-[#C5A265]/20">
      <!-- Background Image -->
      <div class="absolute inset-0 z-0">
        <img
          :src="HeroFloralBg"
          alt="Decoration Portfolio Background"
          class="w-full h-full object-cover object-center scale-105"
        />
        <!-- Light overlay so text stays readable, but image remains clearly visible -->
        <div class="absolute inset-0 bg-[#161210]/45"></div>
        <!-- Subtle bottom fade to transition into page bg -->
        <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#161210] to-transparent"></div>
      </div>

      <!-- Thin Golden Divider Line below Navbar -->
      <div class="absolute top-[72px] sm:top-[80px] md:top-[88px] left-0 right-0 h-[1px] bg-[#C5A265]/25 z-20 pointer-events-none"></div>

      <!-- Hero Header Content (Centered matching Figma) -->
      <div class="relative z-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <!-- Tagline Badge with Gold Flanking Lines -->
        <div class="inline-flex items-center justify-center gap-3 mb-2.5 sm:mb-3">
          <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
          <span class="text-[10px] sm:text-xs uppercase tracking-[0.28em] text-[#C5A265] font-semibold drop-shadow">
            OUR PORTFOLIO
          </span>
          <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
        </div>

        <!-- Headline (Serif Font matching Figma) -->
        <h1 class="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] text-white font-normal tracking-tight mb-3 sm:mb-4 leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
          {{ heroTitle }}
        </h1>

        <!-- Subtitle -->
        <p class="text-xs sm:text-sm md:text-[15px] text-stone-300 font-light leading-relaxed max-w-xl mx-auto mb-7 sm:mb-8 drop-shadow">
          {{ heroSubtitle }}
        </p>

        <!-- Category Filter Tabs (Pill Buttons) -->
        <div class="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
          <button
            v-for="tab in currentTabs"
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

    <!-- 2. GALLERY GRID SECTION (Matching Figma Layout Exactly) -->
    <section class="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <!-- When "Semua" is active on Dekorasi: Render the exact 3 + 2 staggered layout from Figma -->
      <div v-if="pageCategory === 'dekor' && activeFilterTab === 'semua'" class="space-y-5 sm:space-y-6">
        <!-- Row 1: 3 Cards (Dekorasi Modern, Dekorasi Elegan, Dekorasi Tradisional) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <div
            v-for="item in row1Items"
            :key="item.id"
            @click="openLightbox(item)"
            class="relative rounded-2xl overflow-hidden group cursor-pointer border border-[#2B211C] hover:border-[#C5A265]/60 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.7)] hover:-translate-y-1 h-[280px] sm:h-[340px] md:h-[380px] bg-stone-900"
          >
            <!-- Photo with Zoom on Hover -->
            <img
              :src="item.image"
              :alt="item.title"
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />

            <!-- Dark Gradient Overlay from bottom -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-5 sm:p-6 transition-opacity duration-300">
              <div class="flex items-center justify-between gap-3">
                <h3 class="font-serif text-lg sm:text-xl text-white font-normal group-hover:text-[#F2E3CF] transition-colors drop-shadow">
                  {{ item.title }}
                </h3>

                <!-- Circular Arrow Button matching Figma -->
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

        <!-- Row 2: 2 Wider Cards (Dekorasi Minimalis, Dekorasi Outdoor) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div
            v-for="item in row2Items"
            :key="item.id"
            @click="openLightbox(item)"
            class="relative rounded-2xl overflow-hidden group cursor-pointer border border-[#2B211C] hover:border-[#C5A265]/60 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.7)] hover:-translate-y-1 h-[270px] sm:h-[340px] md:h-[390px] bg-stone-900"
          >
            <!-- Photo with Zoom on Hover -->
            <img
              :src="item.image"
              :alt="item.title"
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />

            <!-- Dark Gradient Overlay from bottom -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-5 sm:p-6 transition-opacity duration-300">
              <div class="flex items-center justify-between gap-3">
                <h3 class="font-serif text-lg sm:text-xl text-white font-normal group-hover:text-[#F2E3CF] transition-colors drop-shadow">
                  {{ item.title }}
                </h3>

                <!-- Circular Arrow Button matching Figma -->
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
      </div>

      <!-- When Filtered (Modern / Traditional / Minimalis) or Wedding Category: Responsive Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-fade-in">
        <div
          v-for="item in displayedItems"
          :key="item.id"
          @click="openLightbox(item)"
          class="relative rounded-2xl overflow-hidden group cursor-pointer border border-[#2B211C] hover:border-[#C5A265]/60 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.7)] hover:-translate-y-1 h-[300px] sm:h-[360px] bg-stone-900"
        >
          <!-- Photo -->
          <img
            :src="item.image"
            :alt="item.title"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          <!-- Dark Gradient Overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-5 sm:p-6">
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-serif text-lg sm:text-xl text-white font-normal group-hover:text-[#F2E3CF] transition-colors drop-shadow">
                {{ item.title }}
              </h3>

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

        <!-- Empty state fallback if none match -->
        <div
          v-if="displayedItems.length === 0"
          class="col-span-full flex flex-col items-center justify-center py-20 text-stone-500 gap-3"
        >
          <svg class="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <p class="text-sm">Belum ada portofolio untuk kategori ini.</p>
        </div>
      </div>
    </section>

    <!-- 3. LIGHTBOX MODAL (Opens when clicking any portfolio card) -->
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
                {{ selectedItem.category.toUpperCase() }} VENUE
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
              <span>Konsultasikan Konsep Ini via WhatsApp</span>
              <span class="transition-transform group-hover:translate-x-1">→</span>
            </a>

            <router-link
              :to="getCatalogLink(selectedItem)"
              class="w-full sm:w-auto py-3 px-6 rounded-full border border-[#C5A265] text-[#C5A265] hover:bg-[#C5A265]/10 text-xs sm:text-sm font-medium text-center transition-colors"
            >
              Lihat Paket Terkait
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. FOOTER (Shared Component matching Home, Catering, and Wedding) -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Navbar from "../components/common/Navbar.vue";
import Footer from "../components/common/Footer.vue";

// Background Assets
import HeroFloralBg from "../assets/portofolio-bg.png";

// Dekorasi Photos
import imgModern from "../assets/dekor/economy-wedding.png";
import imgElegan from "../assets/dekor/dahlia-wedding.png";
import imgTradisional from "../assets/dekor/amaryllis-wedding.png";
import imgMinimalis from "../assets/dekor/sunflower-wedding.png";
import imgOutdoor from "../assets/dekor/custom-package.png";

// Catering & Wedding Photos (placeholder)
import imgCatering1 from "../assets/dekor/rose-wedding.png";
import imgCatering2 from "../assets/dekor/bougainvillea-wedding.png";
import imgCatering3 from "../assets/dekor/edelweiss-wedding.png";
import imgWedding1 from "../assets/dekor/dahlia-wedding.png";
import imgWedding2 from "../assets/dekor/amaryllis-wedding.png";

const route = useRoute();
const router = useRouter();

// Page category determines the portfolio page: 'dekor' | 'wedding'
const pageCategory = ref("dekor");

// Filter tab within the page: 'semua' | 'modern' | 'traditional' | 'minimalis'
const activeFilterTab = ref("semua");
const selectedItem = ref(null);

// Tabs for Dekorasi
const dekorTabs = [
  { value: "semua",       label: "Semua" },
  { value: "modern",      label: "Modern" },
  { value: "traditional", label: "Traditional" },
  { value: "minimalis",   label: "Minimalis" },
];

// Tabs for Wedding
const weddingTabs = [
  { value: "semua", label: "Semua" },
  { value: "wedding", label: "Paket Lengkap" },
];

const currentTabs = computed(() => {
  if (pageCategory.value === "wedding") return weddingTabs;
  return dekorTabs;
});

// Dynamic hero title strictly based on pageCategory (never reverts when clicking style tabs)
const heroTitle = computed(() => {
  if (pageCategory.value === "wedding") return "Wedding Portfolio";
  return "Decoration Portfolio";
});

const heroSubtitle = computed(() => {
  if (pageCategory.value === "wedding") {
    return "Paket pernikahan lengkap Kalila — dari dekorasi megah hingga sajian lezat dalam satu konsep harmonis.";
  }
  return "Lihat berbagai hasil dekorasi pernikahan elegan dan berkelas yang telah kami wujudkan.";
});

const whatsappNumber = "6281234567890";

// All Portfolio Items
const portfolioItems = [
  // ── DEKORASI (5 Items exactly matching Figma design) ──
  {
    id: 1,
    title: "Dekorasi Modern",
    category: "modern",
    type: "dekor",
    image: imgModern,
    venue: "Ballroom & Gedung Pernikahan",
    description: "Dekorasi pelaminan modern dengan perpaduan arch minimalis putih, rangkaian bunga pastel segar, dan pencahayaan warm ambient yang anggun dan romantis.",
    tags: ["Modern", "Arch Flower", "Pastel Soft"]
  },
  {
    id: 2,
    title: "Dekorasi Elegan",
    category: "modern",
    type: "dekor",
    image: imgElegan,
    venue: "Indoor Hall & Convention Center",
    description: "Tata panggung pelaminan 3-panel mewah dengan instalasi bunga segar beraneka warna, sofa pengantin premium, dan pendar lampu sorot dramatis bernuansa hangat.",
    tags: ["Elegan", "Triple Arch", "Warm Light"]
  },
  {
    id: 3,
    title: "Dekorasi Tradisional",
    category: "traditional",
    type: "dekor",
    image: imgTradisional,
    venue: "Pendopo & Ballroom Budaya",
    description: "Nuansa agung tradisional Jawa berpadu sentuhan modern dengan gebyok ukir jati klasik, bunga mawar merah segar berlimpah, dan hanging fairy lights yang magis.",
    tags: ["Tradisional", "Gebyok Jawa", "Klasik Megah"]
  },
  {
    id: 4,
    title: "Dekorasi Minimalis",
    category: "minimalis",
    type: "dekor",
    image: imgMinimalis,
    venue: "Grand Aisle & Function Hall",
    description: "Lorong pernikahan megah berkonsep minimalis modern dengan pilar-pilar bunga gantung melimpah dan lantai selasar berkilau yang memberikan kesan luas dan bersih.",
    tags: ["Minimalis", "Aisle Florals", "Clean Design"]
  },
  {
    id: 5,
    title: "Dekorasi Outdoor",
    category: "modern",
    type: "dekor",
    image: imgOutdoor,
    venue: "Glasshouse & Garden Venue",
    description: "Struktur paviliun kaca modern berselimut rangkaian bunga warna-warni ceria dengan latar pemandangan alam terbuka yang spektakuler dan eksotis.",
    tags: ["Outdoor", "Glasshouse", "Full Colors"]
  },

  // ── WEDDING ──
  {
    id: 9,
    title: "Wedding Paket Lengkap",
    category: "wedding",
    type: "wedding",
    image: imgWedding1,
    venue: "Grand Ballroom & Convention Center",
    description: "Paket pernikahan all-in-one mencakup dekorasi pelaminan megah, catering 500 pax, dokumentasi profesional, MC bilingual, dan koordinasi hari-H oleh tim Kalila.",
    tags: ["All Inclusive", "Grand Wedding", "Turnkey"]
  },
  {
    id: 10,
    title: "Wedding Intimate Premium",
    category: "wedding",
    type: "wedding",
    image: imgWedding2,
    venue: "Boutique Venue & Garden",
    description: "Pernikahan intim berkelas untuk 50–150 tamu dengan dekorasi mewah personal, fine dining catering, dan sentuhan detail yang sangat diperhatikan oleh tim kreatif Kalila.",
    tags: ["Intimate", "Premium Detail", "Boutique"]
  }
];

// Dekorasi specific items
const dekorItems = computed(() => portfolioItems.filter(item => item.type === "dekor"));

// Row 1 (3 items) & Row 2 (2 items) for the exact Figma 3+2 layout when on "Semua" tab
const row1Items = computed(() => dekorItems.value.slice(0, 3));
const row2Items = computed(() => dekorItems.value.slice(3, 5));

// Displayed items when filtered or for wedding
const displayedItems = computed(() => {
  if (pageCategory.value === "wedding") {
    if (activeFilterTab.value === "wedding") {
      return portfolioItems.filter(item => item.type === "wedding");
    }
    return portfolioItems.filter(item => item.type === "wedding");
  }

  // Page category === 'dekor'
  if (activeFilterTab.value === "semua") {
    return dekorItems.value;
  }
  return dekorItems.value.filter(item => item.category === activeFilterTab.value);
});

const openLightbox = (item) => {
  selectedItem.value = item;
};

const getConsultUrl = (item) => {
  const msg = `Halo admin Kalila Catering & Dekorasi, saya tertarik berkonsultasi mengenai konsep ${item.title} untuk acara pernikahan saya.`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
};

const getCatalogLink = (item) => {
  if (item.type === "wedding") return "/katalog/wedding";
  return "/katalog/dekor";
};

// Sync state with URL query parameter (e.g. /portofolio?kategori=dekor)
const syncCategoryFromQuery = () => {
  const q = route.query.kategori ? route.query.kategori.toLowerCase() : "";

  // If user opens ?kategori=catering, redirect directly to dedicated catering portfolio
  if (q === "catering") {
    router.replace("/portofolio/catering");
    return;
  }

  if (q === "wedding") {
    pageCategory.value = "wedding";
    activeFilterTab.value = "semua";
  } else if (["modern", "traditional", "minimalis"].includes(q)) {
    pageCategory.value = "dekor";
    activeFilterTab.value = q;
  } else {
    // Default or ?kategori=dekor
    pageCategory.value = "dekor";
    activeFilterTab.value = "semua";
  }
};

onMounted(() => {
  syncCategoryFromQuery();
});

watch(
  () => route.query.kategori,
  () => {
    syncCategoryFromQuery();
  }
);
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
