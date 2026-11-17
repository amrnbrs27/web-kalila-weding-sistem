<template>
  <div class="min-h-screen bg-[#161210] text-gray-200 font-sans selection:bg-[#C5A265] selection:text-black">
    <!-- Navbar (Seamless transparent header matching Figma) -->
    <Navbar :show-konsultasi="false" :nav-capsule="false" />

    <!-- 1. HERO SECTION: CATERING PACKAGE (Matching Figma Design Exactly) -->
    <section class="relative w-full pt-28 sm:pt-32 md:pt-36 pb-14 sm:pb-20 lg:pb-24 overflow-hidden border-b border-[#C5A265]/20">
      <!-- Background Image with Seamless Dark Fade on Left & Chafing Dishes on Right -->
      <div class="absolute inset-0 z-0">
        <img
          :src="HeroCleanBg"
          alt="Kalila Catering Package Banner"
          class="w-full h-full object-cover object-right md:object-center"
        />
        <!-- Top vignette so Navbar text remains super clear -->
        <div class="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-transparent h-32"></div>

        <!-- Left gradient blend matching #161210 -->
        <div class="absolute inset-0 bg-gradient-to-r from-[#161210] via-[#161210]/90 md:via-[#161210]/55 to-transparent"></div>

        <!-- Subtle ambient luxury tint -->
        <div class="absolute inset-0 bg-black/15 pointer-events-none"></div>
      </div>

      <!-- Thin Golden Divider Line below Navbar -->
      <div class="absolute top-[72px] sm:top-[80px] md:top-[88px] left-0 right-0 h-[1px] bg-[#C5A265]/25 z-20 pointer-events-none"></div>

      <!-- Hero Content -->
      <div class="relative z-20 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="max-w-xl">
          <!-- Tagline with Flanking Horizontal Lines -->
          <div class="inline-flex items-center gap-3 mb-2.5 sm:mb-3">
            <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
            <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-[#C5A265] drop-shadow">
              OUR CATERING PACKAGE
            </span>
            <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
          </div>

          <!-- Headline (Serif font matching Figma) -->
          <h1 class="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-white font-normal tracking-tight mb-3 sm:mb-4 leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
            Catering Package
          </h1>

          <!-- Subtitle / Description -->
          <p class="text-xs sm:text-sm md:text-[15px] text-stone-300 font-light leading-relaxed mb-6 sm:mb-8 drop-shadow">
            Nikmati layanan catering premium dari Kalila untuk melengkapi acara spesial Anda.
          </p>

          <!-- CTA Button -->
          <a
            href="#pilihan-paket"
            class="inline-flex items-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-[#700B11] hover:bg-[#881219] text-white text-xs sm:text-[13px] font-medium tracking-wide transition-all shadow-[0_4px_20px_rgba(112,11,17,0.45)] hover:scale-105 active:scale-95 group cursor-pointer border border-[#8C1B25]/60"
          >
            <span>Lihat Semua Paket</span>
            <span class="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </div>
      </div>
    </section>

    <!-- 2. PILIHAN PAKET CATERING SECTION -->
    <section id="pilihan-paket" class="relative w-full py-16 sm:py-20 lg:py-24 overflow-hidden bg-[#161210]">
      <!-- Section Container -->
      <div class="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Section Header (Centered) -->
        <div class="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <!-- Small Tagline Badge with Flanking Lines -->
          <div class="inline-flex items-center justify-center gap-3 mb-2.5 sm:mb-3">
            <span class="w-8 sm:w-14 h-[1px] bg-[#C5A265]"></span>
            <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-[#C5A265] drop-shadow">
              PILIHAN PAKET CATERING
            </span>
            <span class="w-8 sm:w-14 h-[1px] bg-[#C5A265]"></span>
          </div>

          <!-- Section Title (Serif) -->
          <h2 class="font-serif text-3xl sm:text-4xl md:text-[44px] text-white font-normal tracking-tight mb-2.5 sm:mb-3 leading-tight drop-shadow">
            Paket Catering Kami
          </h2>

          <!-- Subtitle -->
          <p class="text-xs sm:text-sm text-stone-400 font-light leading-relaxed drop-shadow">
            Berbagai pilihan paket catering dengan rasa terbaik dan pelayanan profesional.
          </p>

          <!-- Category Filter Tabs (Pill Buttons) -->
          <div class="flex items-center justify-center gap-2.5 sm:gap-3.5 mt-6 sm:mt-7">
            <button
              type="button"
              @click="activeCategory = 'prasmanan'"
              class="px-6 sm:px-7 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer"
              :class="[
                activeCategory === 'prasmanan'
                  ? 'bg-[#700B11] text-white border border-[#8C1B25] shadow-[0_4px_16px_rgba(112,11,17,0.45)]'
                  : 'bg-transparent text-stone-300 border border-white/20 hover:border-[#C5A265]/50 hover:text-white'
              ]"
            >
              Prasmanan
            </button>

            <button
              type="button"
              @click="activeCategory = 'stall'"
              class="px-6 sm:px-7 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer"
              :class="[
                activeCategory === 'stall'
                  ? 'bg-[#700B11] text-white border border-[#8C1B25] shadow-[0_4px_16px_rgba(112,11,17,0.45)]'
                  : 'bg-transparent text-stone-300 border border-white/20 hover:border-[#C5A265]/50 hover:text-white'
              ]"
            >
              Stall
            </button>

            <button
              type="button"
              @click="activeCategory = 'nasi_box'"
              class="px-6 sm:px-7 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer"
              :class="[
                activeCategory === 'nasi_box'
                  ? 'bg-[#700B11] text-white border border-[#8C1B25] shadow-[0_4px_16px_rgba(112,11,17,0.45)]'
                  : 'bg-transparent text-stone-300 border border-white/20 hover:border-[#C5A265]/50 hover:text-white'
              ]"
            >
              Nasi Box
            </button>
          </div>
        </div>

        <!-- 3. Packages Grid (3 Columns matching Figma) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
          <div
            v-for="pkg in currentPackages"
            :key="pkg.id"
            class="bg-[#181311] border border-[#2B211C] hover:border-[#C5A265]/40 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.65)] group"
          >
            <div>
              <!-- Card Photo with Smooth Zoom on Hover -->
              <div class="relative w-full h-44 sm:h-48 rounded-xl overflow-hidden mb-4 bg-stone-900 shadow-inner">
                <img
                  :src="pkg.image"
                  :alt="pkg.name"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <!-- Subtle Gradient at Bottom of Card Image -->
                <div class="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>

              <!-- Title and Price Row -->
              <div class="flex items-baseline justify-between gap-3 mb-1.5">
                <h3 class="font-serif italic text-base sm:text-lg text-[#F2E3CF] font-normal tracking-wide group-hover:text-white transition-colors">
                  {{ pkg.name }}
                </h3>
                <span class="font-sans font-bold text-sm sm:text-base text-white shrink-0">
                  {{ formatPrice(pkg.price) }}
                </span>
              </div>

              <!-- Short Description -->
              <p class="text-xs sm:text-[13px] text-stone-400 font-light leading-relaxed mb-5">
                {{ pkg.description }}
              </p>
            </div>

            <!-- Card Bottom Bar: Selengkapnya & Shopping Cart Button -->
            <div class="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
              <!-- Selengkapnya Link -->
              <button
                type="button"
                @click="openDetail(pkg)"
                class="inline-flex items-center gap-1.5 text-xs sm:text-[13px] text-[#E8D7BE] hover:text-[#C5A265] transition-colors group/link cursor-pointer"
              >
                <span>Selengkapnya</span>
                <span class="transition-transform group-hover/link:translate-x-1">→</span>
              </button>

              <!-- Shopping Cart Red Button -->
              <button
                type="button"
                @click="handleOrder(pkg)"
                class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#700B11] hover:bg-[#881219] text-white flex items-center justify-center transition-all duration-200 shadow-md hover:scale-105 active:scale-95 cursor-pointer border border-[#8C1B25]/60"
                :aria-label="'Pesan ' + pkg.name"
              >
                <!-- Shopping Cart Icon matching Figma -->
                <svg class="w-4 h-4 fill-none stroke-current" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. FOOTER (Shared Component matching Home) -->
    <Footer />

    <!-- 4. DETAIL MODAL (Opens when clicking "Selengkapnya →") -->
    <div
      v-if="selectedPackage"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all"
      @click.self="selectedPackage = null"
    >
      <div class="relative w-full max-w-lg bg-[#1C1614] border border-[#C5A265]/40 rounded-2xl p-6 sm:p-7 shadow-2xl overflow-hidden animate-fade-in">
        <!-- Close Button -->
        <button
          @click="selectedPackage = null"
          class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          ✕
        </button>

        <!-- Image -->
        <div class="w-full h-48 rounded-xl overflow-hidden mb-5 bg-stone-900">
          <img :src="selectedPackage.image" :alt="selectedPackage.name" class="w-full h-full object-cover" />
        </div>

        <!-- Title & Price -->
        <div class="flex items-baseline justify-between gap-4 mb-2">
          <h3 class="font-serif italic text-2xl text-[#F2E3CF] font-normal">
            {{ selectedPackage.name }}
          </h3>
          <span class="font-sans font-bold text-xl text-white">
            {{ formatPrice(selectedPackage.price) }}
            <span class="text-xs font-normal text-stone-400">/ porsi</span>
          </span>
        </div>

        <p class="text-xs sm:text-sm text-stone-300 font-light mb-4">
          {{ selectedPackage.description }}
        </p>

        <!-- Menu Inclusions -->
        <div class="mb-6">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-[#C5A265] mb-2.5">
            Daftar Menu Termasuk:
          </h4>
          <ul class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <li
              v-for="(item, idx) in selectedPackage.inclusions"
              :key="idx"
              class="flex items-start gap-2 text-xs text-stone-300 font-light"
            >
              <span class="text-[#C5A265] shrink-0 mt-0.5">✦</span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3 pt-4 border-t border-white/10">
          <a
            :href="getConsultUrl(selectedPackage)"
            target="_blank"
            rel="noopener noreferrer"
            class="flex-1 py-2.5 px-4 rounded-xl border border-[#C5A265] text-[#C5A265] hover:bg-[#C5A265]/10 text-xs sm:text-sm font-medium text-center transition-colors"
          >
            Konsultasi WhatsApp
          </a>
          <button
            @click="handleOrder(selectedPackage); selectedPackage = null"
            class="flex-1 py-2.5 px-4 rounded-xl bg-[#700B11] hover:bg-[#881219] text-white text-xs sm:text-sm font-medium text-center transition-colors shadow-lg cursor-pointer"
          >
            Pesan Sekarang
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import Navbar from "../components/common/Navbar.vue";
import Footer from "../components/common/Footer.vue";
import { useToastStore } from "../stores/toast.js";

// Catering Hero & Package Image (User provided)
import HeroCleanBg from "../assets/catering/catering-hero-clean.png";

const router = useRouter();
const toast = useToastStore();

const activeCategory = ref("prasmanan");
const selectedPackage = ref(null);

const whatsappNumber = "6281234567890";
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
  "Halo admin Kalila Catering & Dekorasi, saya ingin berkonsultasi mengenai paket catering pernikahan."
)}`;

// Prasmanan Packages matching Figma Design
const prasmananPackages = [
  {
    id: "prasmanan-silver",
    name: "Paket Prasmanan Silver",
    price: 21000,
    description: "Menu lengkap untuk acara Anda.",
    image: HeroCleanBg,
    inclusions: [
      "Nasi Putih Premium",
      "Olahan Ayam (Ayam Goreng Lengkuas / Rica / Fillet Asam Manis)",
      "Sayur Pilihan (Capcay Goreng / Cah Brokoli Bakso)",
      "Sup Segar (Sup Kimlo / Sup Mutiara / Sup Ayam Jagung)",
      "Sambal Goreng Kentang Krecek",
      "Kerupuk Udang",
      "Buah Potong Segar (Semangka & Melon)",
      "Puding Cocktail + Vla Vanilla",
      "Air Mineral Cup"
    ]
  },
  {
    id: "prasmanan-gold",
    name: "Paket Prasmanan Gold",
    price: 27000,
    description: "Pilihan menu premium dengan rasa istimewa.",
    image: HeroCleanBg,
    inclusions: [
      "Nasi Putih Premium & Nasi Goreng Spesial",
      "Olahan Daging Sapi (Rendang / Daging Balado / Rolade Daging Sapi)",
      "Olahan Ayam (Ayam Bakar Madu / Ayam Suwir Pedas Manis)",
      "Sup Spesial (Sup Buntut / Sup Merah Sosis)",
      "Sayur Pilihan (Cah Kailan Daging Cincang / Capcay Seafood)",
      "Sambal Goreng Ati Ampela Kapri",
      "Kerupuk Udang Super",
      "Buah Potong Segar 3 Macam",
      "Puding Coklat & Aneka Buah + Vla",
      "Es Buah Segar & Air Mineral Cup"
    ]
  },
  {
    id: "prasmanan-deluxe",
    name: "Paket Prasmanan Deluxe",
    price: 35000,
    description: "Pengalaman bersantap terbaik untuk momen spesial.",
    image: HeroCleanBg,
    inclusions: [
      "Nasi Putih Organik & Nasi Liwet / Nasi Kebuli Berempah",
      "Menu Utama Sapi (Beef Black Pepper / Teriyaki / Empal Gentong)",
      "Menu Utama Ikan/Seafood (Fillet Gurame Asam Manis / Udang Crispy)",
      "Menu Olahan Ayam (Chicken Cordon Bleu / Ayam Panggang Kalila)",
      "Sup Signature (Zuppa Soup / Tom Yum Seafood)",
      "Sayur Eksklusif (Baby Corn Jamur Shiitake / Asparagus Kepiting)",
      "Sambal Goreng Hati Daging Giling",
      "Kerupuk Udang Premium",
      "Sweet Corner & Aneka Puding Mini Cup",
      "Buah Potong Eksklusif & Infused Water / Es Sarang Burung"
    ]
  }
];

// Stall Packages (When user switches to Stall)
const stallPackages = [
  {
    id: "stall-sate-ayam",
    name: "Stall Sate Ayam Madura",
    price: 15000,
    description: "Sate ayam empuk bumbu kacang khas dengan lontong.",
    image: HeroCleanBg,
    inclusions: [
      "5 Tusuk Sate Ayam Daging Pilihan",
      "Lontong Daun Pisang Lembut",
      "Bumbu Kacang Gurih Legit Khas",
      "Acar Timun & Sambal Rawit"
    ]
  },
  {
    id: "stall-zuppa-soup",
    name: "Stall Zuppa Soup",
    price: 16000,
    description: "Cream soup lezat dengan puff pastry gurih renyah.",
    image: HeroCleanBg,
    inclusions: [
      "Cream Soup Ayam & Jamur Jagung Manis",
      "Puff Pastry Panggang Renyah Mengembang",
      "Saus Sambal Sachet & Lada Bubuk"
    ]
  },
  {
    id: "stall-kambing-guling",
    name: "Stall Kambing Guling",
    price: 25000,
    description: "Daging kambing muda panggang empuk dengan bumbu kecap pedas.",
    image: HeroCleanBg,
    inclusions: [
      "Daging Kambing Muda Bakar Empuk Tanpa Bau",
      "Lontong Daun",
      "Bumbu Kecap Cabai Rawit & Tomat Segar",
      "Kerupuk Melinjo / Emping"
    ]
  }
];

// Nasi Box Packages (When user switches to Nasi Box)
const nasiBoxPackages = [
  {
    id: "nasi-box-silver",
    name: "Nasi Box Silver",
    price: 22000,
    description: "Pilihan hemat dan lezat untuk berbagai acara Anda.",
    image: HeroCleanBg,
    inclusions: [
      "Nasi Putih Harum",
      "Ayam Goreng Kalasan / Kremes",
      "Sambal Goreng Kentang",
      "Tumis Buncis Jagung Manis",
      "Kerupuk & Sambal Terasi",
      "Pisang Segar & Air Mineral Cup"
    ]
  },
  {
    id: "nasi-box-gold",
    name: "Nasi Box Gold",
    price: 28000,
    description: "Pilihan menu favorit dengan lauk daging istimewa.",
    image: HeroCleanBg,
    inclusions: [
      "Nasi Putih / Nasi Kuning Gurih",
      "Rendang Daging Sapi Empuk",
      "Telur Balado Bulat",
      "Capcay Goreng Bakso",
      "Kerupuk Udang & Sambal Bajak",
      "Jeruk Manis & Air Mineral Botol 330ml"
    ]
  },
  {
    id: "nasi-box-deluxe",
    name: "Nasi Box Deluxe",
    price: 35000,
    description: "Sajian kotak eksklusif lengkap dengan dessert manis.",
    image: HeroCleanBg,
    inclusions: [
      "Nasi Liwet / Nasi Kebuli Beras Pilihan",
      "Daging Sapi Lada Hitam / Empal",
      "Ayam Suwir Rica Kemangi",
      "Urap Sayur / Cah Brokoli Sosis",
      "Peyek Kacang Renyah / Emping",
      "Puding Cup Coklat & Buah Potong",
      "Jus Buah Segar Kemasan"
    ]
  }
];

const currentPackages = computed(() => {
  if (activeCategory.value === "stall") return stallPackages;
  if (activeCategory.value === "nasi_box") return nasiBoxPackages;
  return prasmananPackages;
});

const formatPrice = (val) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
};

const openDetail = (pkg) => {
  selectedPackage.value = pkg;
};

const getConsultUrl = (pkg) => {
  const msg = `Halo admin Kalila, saya ingin konsultasi mengenai ${pkg.name} (${formatPrice(pkg.price)}).`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
};

const handleOrder = (pkg) => {
  toast.showSuccess(
    "Paket Dipilih",
    `${pkg.name} (${formatPrice(pkg.price)}) siap untuk dipesan.`
  );
  // Navigate to booking page if exists or consultation
  router.push(`/booking/${pkg.id}`);
};
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.96);
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
