<template>
  <div class="min-h-screen bg-[#0B0B0C] text-gray-200">
    <Navbar />
    <main class="pt-36 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-2xl mx-auto mb-12">
        <span class="text-xs uppercase tracking-[0.25em] text-[#C5A265] font-semibold">
          LAYANAN KAMI
        </span>
        <h1 class="font-serif text-4xl sm:text-5xl text-white font-normal mt-2">
          Katalog Paket Kalila
        </h1>
        <p class="text-sm text-gray-400 mt-4">
          Pilih kategori paket dekorasi, catering lezat, atau paket pernikahan all-in-one sesuai kebutuhan Anda.
        </p>

        <!-- Category Filters -->
        <div class="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            @click="activeCategory = 'all'"
            :class="activeCategory === 'all' ? 'bg-[#C5A265] text-black font-semibold' : 'bg-[#141518] text-gray-300 border border-[#2A2D36]'"
            class="px-5 py-2 rounded-full text-xs transition-colors"
          >
            Semua Paket
          </button>
          <button
            @click="activeCategory = 'dekor'"
            :class="activeCategory === 'dekor' ? 'bg-[#C5A265] text-black font-semibold' : 'bg-[#141518] text-gray-300 border border-[#2A2D36]'"
            class="px-5 py-2 rounded-full text-xs transition-colors"
          >
            Paket Dekorasi
          </button>
          <button
            @click="activeCategory = 'catering'"
            :class="activeCategory === 'catering' ? 'bg-[#C5A265] text-black font-semibold' : 'bg-[#141518] text-gray-300 border border-[#2A2D36]'"
            class="px-5 py-2 rounded-full text-xs transition-colors"
          >
            Paket Catering
          </button>
          <button
            @click="activeCategory = 'wedding'"
            :class="activeCategory === 'wedding' ? 'bg-[#C5A265] text-black font-semibold' : 'bg-[#141518] text-gray-300 border border-[#2A2D36]'"
            class="px-5 py-2 rounded-full text-xs transition-colors"
          >
            Paket Wedding
          </button>
        </div>
      </div>

      <!-- Packages Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div
          v-for="pkg in filteredPackages"
          :key="pkg.id"
          class="rounded-2xl overflow-hidden bg-[#141518] border border-[#2A2D36] flex flex-col group hover:border-[#C5A265]/50 transition-all duration-300 shadow-xl"
        >
          <div class="h-56 overflow-hidden relative">
            <img :src="pkg.image" :alt="pkg.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div class="absolute top-4 right-4 bg-[#8B1E2F] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              {{ pkg.category }}
            </div>
          </div>
          <div class="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h3 class="font-serif text-xl font-medium text-white group-hover:text-[#E6CA65] transition-colors">
                {{ pkg.name }}
              </h3>
              <p class="text-xs text-gray-400 mt-2 line-clamp-2">{{ pkg.description }}</p>
              <div class="mt-4 pt-4 border-t border-[#2A2D36]">
                <span class="text-xs text-gray-400">Mulai dari</span>
                <p class="font-serif text-xl font-bold text-[#E6CA65]">{{ formatRupiah(pkg.price) }}</p>
              </div>
            </div>
            <div class="mt-6 flex items-center gap-3">
              <router-link
                :to="`/paket/${pkg.id}`"
                class="flex-1 py-2.5 rounded-full border border-[#C5A265] text-[#C5A265] hover:bg-[#C5A265] hover:text-black text-xs font-semibold text-center transition-colors"
              >
                Detail Paket
              </router-link>
              <router-link
                :to="`/booking/${pkg.id}`"
                class="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#A82438] to-[#8B1E2F] hover:from-[#B82E44] hover:to-[#9B2235] text-white text-xs font-semibold text-center transition-all shadow-md"
              >
                Pesan
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import Navbar from "../components/common/Navbar.vue";
import Footer from "../components/common/Footer.vue";

const route = useRoute();
const activeCategory = ref(route.params.category || "all");

const packages = ref([
  {
    id: 1,
    name: "Dekorasi Ruby Elegance",
    category: "dekor",
    price: 15000000,
    description: "Dekorasi panggung 8-10 meter dengan nuansa bunga segar luxury, lighting warm ambient, dan karpet mawar.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    name: "Catering Royal Buffet (500 Porsi)",
    category: "catering",
    price: 32500000,
    description: "Menu lengkap 6 hidangan utama, 3 stall dessert istimewa, es podeng, dan minuman dingin gratis.",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    name: "Kalila Gold Royal Wedding",
    category: "wedding",
    price: 75000000,
    description: "Paket lengkap all-in: Dekorasi mewah, Catering 800 porsi, Makeup & Busana, Dokumentasi Cinematic, MC & Sound.",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
  },
]);

const filteredPackages = computed(() => {
  if (activeCategory.value === "all") return packages.value;
  return packages.value.filter((p) => p.category === activeCategory.value);
});

const formatRupiah = (val) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
};
</script>
