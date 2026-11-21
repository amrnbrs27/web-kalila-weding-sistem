<template>
  <div class="min-h-screen bg-[#161210] text-gray-200 font-sans selection:bg-[#C5A265] selection:text-black">
    <!-- Navbar -->
    <Navbar :show-konsultasi="false" :nav-capsule="false" />

    <!-- 1. HERO SECTION: BLOG & INSPIRATION -->
    <section class="relative w-full pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-16 lg:pb-20 overflow-hidden border-b border-[#C5A265]/20">
      <!-- Background Image with Overlay -->
      <div class="absolute inset-0 z-0">
        <img
          :src="HeroBg"
          alt="Blog Wedding Background"
          class="w-full h-full object-cover object-center scale-105"
        />
        <!-- Dark tint overlay for text readability -->
        <div class="absolute inset-0 bg-[#161210]/55"></div>
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
            OUR BLOG
          </span>
          <span class="w-8 sm:w-12 h-[1px] bg-[#C5A265]"></span>
        </div>

        <!-- Headline -->
        <h1 class="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] text-white font-normal tracking-tight mb-3 sm:mb-4 leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
          Wedding Inspiration &amp; Articles
        </h1>

        <!-- Subtitle -->
        <p class="text-xs sm:text-sm md:text-[15px] text-stone-300 font-light leading-relaxed max-w-xl mx-auto mb-7 sm:mb-8 drop-shadow">
          Temukan inspirasi tren dekorasi, panduan susunan acara, dan tips kuliner pernikahan impian Anda bersama Kalila.
        </p>

        <!-- Category Filter Tabs -->
        <div class="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
          <button
            v-for="tab in categories"
            :key="tab.value"
            type="button"
            @click="activeCategory = tab.value"
            class="px-6 sm:px-7 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer"
            :class="[
              activeCategory === tab.value
                ? 'bg-[#700B11] text-white border border-[#8C1B25] shadow-[0_4px_16px_rgba(112,11,17,0.45)]'
                : 'bg-transparent text-stone-300 border border-white/20 hover:border-[#C5A265]/50 hover:text-white'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </section>

    <!-- 2. ARTICLES GRID SECTION (Matching Uploaded Mockup Exactly) -->
    <section class="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <!-- 3-Column Responsive Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        <article
          v-for="article in filteredArticles"
          :key="article.id"
          @click="openArticle(article)"
          class="relative rounded-3xl overflow-hidden group cursor-pointer border border-[#2B211C] hover:border-[#C5A265]/60 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.7)] hover:-translate-y-1.5 h-[380px] sm:h-[420px] md:h-[450px] bg-stone-900 flex flex-col justify-end"
        >
          <!-- Cover Photo with Zoom Effect -->
          <img
            :src="article.image"
            :alt="article.title"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          <!-- Dark Gradient Overlay from bottom -->
          <div class="relative z-10 p-6 sm:p-7 bg-gradient-to-t from-black/95 via-black/55 to-transparent flex flex-col justify-end">
            <!-- Top meta inside card -->
            <div class="flex items-center gap-2 mb-2 text-[#DFBA73] text-xs font-medium">
              <!-- Calendar Icon -->
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span>{{ article.date }}</span>
              <span class="text-stone-500">•</span>
              <span class="text-[11px] uppercase tracking-wider text-stone-300 font-semibold">{{ article.categoryLabel }}</span>
            </div>

            <!-- Title & Arrow Button in bottom row -->
            <div class="flex items-end justify-between gap-4">
              <div>
                <h2 class="font-serif text-lg sm:text-xl text-white font-normal group-hover:text-[#F2E3CF] transition-colors leading-snug drop-shadow line-clamp-2">
                  {{ article.title }}
                </h2>
                <!-- Small gold accent line below title -->
                <div class="w-10 h-[1.5px] bg-[#C5A265] mt-2.5 transition-all duration-300 group-hover:w-16"></div>
              </div>

              <!-- Circular Arrow Button -->
              <button
                type="button"
                class="w-10 h-10 rounded-full border border-white/50 group-hover:border-[#C5A265] group-hover:bg-[#C5A265] group-hover:text-black text-white flex items-center justify-center transition-all duration-300 shadow-md shrink-0 cursor-pointer"
                :aria-label="'Baca artikel ' + article.title"
              >
                <svg class="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </article>
      </div>

      <!-- Empty state if category has no articles -->
      <div
        v-if="filteredArticles.length === 0"
        class="flex flex-col items-center justify-center py-20 text-stone-500 gap-3 text-center"
      >
        <svg class="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
        </svg>
        <p class="text-sm">Belum ada artikel untuk kategori ini.</p>
      </div>
    </section>

    <!-- 3. ARTICLE DETAIL MODAL (Reading View) -->
    <div
      v-if="selectedArticle"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all"
      @click.self="selectedArticle = null"
    >
      <div class="relative w-full max-w-3xl bg-[#1C1614] border border-[#C5A265]/40 rounded-3xl overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[92vh]">
        <!-- Close Button -->
        <button
          @click="selectedArticle = null"
          class="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-30 border border-white/10"
          aria-label="Tutup artikel"
        >
          ✕
        </button>

        <!-- Cover Image with Gradient -->
        <div class="relative w-full h-64 sm:h-80 bg-stone-950 overflow-hidden shrink-0">
          <img
            :src="selectedArticle.image"
            :alt="selectedArticle.title"
            class="w-full h-full object-cover object-center"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-[#1C1614] via-transparent to-transparent"></div>
        </div>

        <!-- Article Content Body -->
        <div class="p-6 sm:p-8 space-y-5 overflow-y-auto">
          <!-- Meta Tags -->
          <div class="flex flex-wrap items-center gap-3 text-xs">
            <span class="px-3 py-1 rounded-full bg-[#700B11] text-white font-medium border border-[#941A29]/60">
              {{ selectedArticle.categoryLabel }}
            </span>
            <span class="text-[#DFBA73] font-medium flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              {{ selectedArticle.date }}
            </span>
            <span class="text-stone-400">• {{ selectedArticle.readTime }}</span>
          </div>

          <!-- Main Title -->
          <h1 class="font-serif text-2xl sm:text-3xl lg:text-4xl text-white font-normal leading-tight">
            {{ selectedArticle.title }}
          </h1>

          <!-- Author Byline -->
          <div class="flex items-center gap-3 pt-2 pb-4 border-b border-white/10">
            <div class="w-10 h-10 rounded-full bg-[#C5A265]/20 border border-[#C5A265]/40 flex items-center justify-center text-[#DFBA73] font-serif font-bold">
              K
            </div>
            <div>
              <p class="text-xs sm:text-sm font-medium text-white">Tim Editorial Kalila</p>
              <p class="text-[11px] text-stone-400">Wedding Planner &amp; Event Stylist</p>
            </div>
          </div>

          <!-- Content Paragraphs -->
          <div class="space-y-4 text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
            <p v-for="(p, pIdx) in selectedArticle.content" :key="pIdx">
              {{ p }}
            </p>
          </div>

          <!-- Key Highlights / Quote Box -->
          <div v-if="selectedArticle.highlight" class="p-4 sm:p-5 rounded-2xl bg-[#241C19] border-l-4 border-[#C5A265] text-stone-200">
            <p class="text-xs sm:text-sm italic leading-relaxed text-[#F2E3CF]">
              "{{ selectedArticle.highlight }}"
            </p>
          </div>

          <!-- CTA Consultation via WhatsApp -->
          <div class="flex flex-col sm:flex-row items-center gap-3 pt-5 border-t border-white/10">
            <a
              :href="getConsultUrl(selectedArticle)"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full sm:flex-1 py-3 px-5 rounded-full bg-[#700B11] hover:bg-[#851019] text-white text-xs sm:text-sm font-medium text-center transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer border border-[#941A29]/60"
            >
              <span>Konsultasikan Konsep Ini via WhatsApp</span>
              <span class="transition-transform group-hover:translate-x-1">→</span>
            </a>

            <button
              type="button"
              @click="selectedArticle = null"
              class="w-full sm:w-auto py-3 px-6 rounded-full border border-white/20 text-stone-300 hover:text-white hover:border-[#C5A265] text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              Tutup
            </button>
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
import HeroBg from "../assets/portofolio-bg.png";

// Article Images
import blog1Img from "../assets/blog-1.jpg";
import blog2Img from "../assets/blog-2.jpg";
import blog3Img from "../assets/blog-3.jpg";
import blog4Img from "../assets/dekor/amaryllis-wedding.png";
import blog5Img from "../assets/dekor/rose-wedding.png";
import blog6Img from "../assets/dekor/sunflower-wedding.png";

const whatsappNumber = "6281234567890";
const activeCategory = ref("semua");
const selectedArticle = ref(null);

// Category filter tabs
const categories = [
  { value: "semua",       label: "Semua" },
  { value: "tren",        label: "Tren Dekorasi" },
  { value: "rundown",     label: "Susunan Acara" },
  { value: "tips",        label: "Tips & Budget" },
  { value: "tradisional", label: "Tradisional" },
  { value: "catering",    label: "Catering" },
];

// Articles List (6 Articles matching the 3x2 grid layout of the Figma mockup)
const articles = [
  {
    id: 1,
    title: "20 Tahun Kalila Catering & Dekorasi: Perjalanan Menghadirkan Momen Spesial",
    date: "27 / 12 / 2024",
    category: "tradisional",
    categoryLabel: "Cerita Kalila",
    image: blog1Img,
    readTime: "4 menit baca",
    highlight: "Dua dekade mendampingi ribuan pasangan mengikat janji suci menjadi bukti komitmen kami dalam menghadirkan keindahan dan kesempurnaan di hari paling bersejarah.",
    content: [
      "Perjalanan Kalila Catering & Dekorasi bermula dari sebuah impian sederhana: ingin membuat momen sakral pernikahan menjadi kenangan terindah yang tak lekang oleh waktu bagi setiap pasangan.",
      "Selama 20 tahun berkarya di industri wedding Yogyakarta dan sekitarnya, Kalila terus berinovasi mengikuti perkembangan tren, mulai dari estetika gebyok ukir tradisional Jawa yang sarat filosofi hingga konsep modern kontemporer yang elegan.",
      "Kunci dari eksistensi kami adalah dedikasi tanpa kompromi pada kualitas bahan makanan, kerapian instalasi dekorasi bunga segar, serta ketulusan tim wedding planner yang selalu siap menjadi sahabat terbaik calon pengantin."
    ]
  },
  {
    id: 2,
    title: "5 Tren Susunan Acara Pernikahan Modern untuk Tahun Ini",
    date: "12 / 07 / 2025",
    category: "rundown",
    categoryLabel: "Susunan Acara",
    image: blog2Img,
    readTime: "5 menit baca",
    highlight: "Rundown pernikahan modern kini lebih mengutamakan interaksi yang hangat, intimate, dan bebas dari kelelahan berlebih bagi pengantin maupun keluarga.",
    content: [
      "Pernikahan masa kini telah bergeser dari acara seremonial kaku menjadi perayaan yang penuh kehangatan emosional dan interaksi akrab dengan para tamu undangan.",
      "Salah satu tren paling populer adalah 'Sunset Vow Exchange' atau pengucapan janji nikah menjelang sore, dilanjutkan dengan champagne toast atau sparkling toast bersama sahabat terdekat.",
      "Selain itu, tradisi 'First Look' antara mempelai pria dan wanita sebelum akad/pemberkatan kini menjadi momen favorit fotografer untuk menangkap ekspresi haru yang paling murni dan personal."
    ]
  },
  {
    id: 3,
    title: "Tips Memilih Dekorasi Pernikahan Impian Sesuai Anggaran",
    date: "12 / 07 / 2025",
    category: "tips",
    categoryLabel: "Tips & Budget",
    image: blog3Img,
    readTime: "4 menit baca",
    highlight: "Dekorasi yang memukau bukan tentang seberapa mahal biayanya, melainkan seberapa cerdas Anda menentukan focal point yang paling sering tertangkap kamera.",
    content: [
      "Menentukan dekorasi pernikahan sering kali menjadi hal yang membingungkan bagi calon pengantin, terutama saat harus menyeimbangkan antara inspirasi Pinterest dan batas anggaran yang ada.",
      "Langkah pertama yang bijak adalah memprioritaskan 3 titik utama (Focal Points): pelaminan pengantin (main backdrop), area masuk & lorong jalan (aisle entrance), serta backdrop photobooth tempat tamu berfoto.",
      "Konsultasikan kepada tim desainer Kalila mengenai pilihan bunga kombinasi segar dan artificial premium untuk mengoptimalkan anggaran tanpa mengurangi kemegahan visual sedikit pun."
    ]
  },
  {
    id: 4,
    title: "Pesona Pernikahan Adat Jawa: Makna Filosofis Gebyok & Roncean Melati",
    date: "15 / 08 / 2025",
    category: "tradisional",
    categoryLabel: "Tradisional",
    image: blog4Img,
    readTime: "5 menit baca",
    highlight: "Di balik keanggunan ukiran gebyok kayu jati tersimpan doa dan restu leluhur untuk ketentraman dan kedudukan mulia bahtera rumah tangga baru.",
    content: [
      "Pernikahan adat Jawa senantiasa memiliki daya pikat magis yang memancarkan kewibawaan dan kesakralan mendalam. Setiap elemen dalam tata ruang pelaminan menyimpan arti simbolik yang adiluhung.",
      "Gebyok pelaminan berukir jati melambangkan gerbang perlindungan keluarga baru, sementara untaian bunga melati tumpangsari melambangkan kesucian lahir dan batin serta keharuman budi pekerti kedua mempelai.",
      "Kalila memadukan pakem tradisional ini dengan tata pencahayaan hangat (warm ambient lighting) modern sehingga nuansa mistis klasik tetap anggun dan memesona di era sekarang."
    ]
  },
  {
    id: 5,
    title: "Panduan Memilih Menu Catering Prasmanan agar Tamu Berkesan",
    date: "20 / 09 / 2025",
    category: "catering",
    categoryLabel: "Catering",
    image: blog5Img,
    readTime: "4 menit baca",
    highlight: "Kelezatan hidangan dan kelancaran alur antrean prasmanan adalah 2 hal paling krusial yang akan terus dibicarakan oleh tamu undangan Anda.",
    content: [
      "Catering menyumbang lebih dari 40% kepuasan tamu dalam sebuah pesta pernikahan. Oleh karena itu, memilih kombinasi menu yang tepat adalah keputusan yang sangat strategis.",
      "Pastikan Anda memiliki keseimbangan antara hidangan utama berkuah segar (seperti Sup Pengantin atau Tom Yum), protein gurih (Daging Rendang / Roast Beef), dan gubukan interaktif (Stall Dimsum, Zuppa Soup, atau Sate Ayam).",
      "Tim Kalila Catering selalu memastikan rasio hidangan dan kapasitas tamu dihitung dengan margin aman 10-15% agar tidak terjadi kekurangan sajian sampai acara selesai."
    ]
  },
  {
    id: 6,
    title: "Inspirasi Konsep Pernikahan Outdoor & Garden Party yang Romantis",
    date: "05 / 10 / 2025",
    category: "tren",
    categoryLabel: "Tren Dekorasi",
    image: blog6Img,
    readTime: "4 menit baca",
    highlight: "Pernikahan di ruang terbuka menghadirkan kedekatan alami dengan alam semesta, gemerlap fairy lights di malam hari, dan foto estetik berlatar panorama hijau.",
    content: [
      "Bagi pasangan yang menyukai suasana santai, segar, dan berbaur dengan alam, konsep Garden Party atau Glasshouse Wedding adalah pilihan yang sangat istimewa.",
      "Kunci sukses dekorasi outdoor adalah memilih jenis bunga yang tahan terik cuaca, menyediakan flooring kayu atau karpet datar agar tamu nyaman berbusana, serta instalasi lampu gantung bohlam pijar untuk menciptakan suasana 'bintang jatuh' saat senja tiba.",
      "Kalila memiliki tim logistik berpengalaman yang siap merancang rencana mitigasi cuaca (Plan B tent / glass enclosure) sehingga acara outdoor Anda tetap berlangsung lancar dan berkesan."
    ]
  }
];

// Filter articles by category
const filteredArticles = computed(() => {
  if (activeCategory.value === "semua") return articles;
  return articles.filter(a => a.category === activeCategory.value);
});

const openArticle = (article) => {
  selectedArticle.value = article;
};

const getConsultUrl = (article) => {
  const msg = `Halo admin Kalila Catering & Dekorasi, saya membaca artikel "${article.title}" dan tertarik berkonsultasi mengenai konsep pernikahan kami.`;
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
