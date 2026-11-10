<template>
  <div
    class="fixed top-5 right-5 sm:top-6 sm:right-6 z-[99999] flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
    aria-live="polite"
  >
    <transition-group
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-3 sm:translate-y-0 sm:translate-x-8 opacity-0 scale-95"
      enter-to-class="transform translate-y-0 sm:translate-x-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform sm:translate-x-8 opacity-0 scale-95"
    >
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="pointer-events-auto w-full rounded-2xl p-4 shadow-2xl backdrop-blur-xl border flex items-start gap-3.5 transition-all overflow-hidden relative"
        :class="getToastClasses(toast.type)"
      >
        <!-- Type Icon -->
        <div class="shrink-0 mt-0.5">
          <!-- Success Icon -->
          <div
            v-if="toast.type === 'success'"
            class="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <!-- Error Icon -->
          <div
            v-else-if="toast.type === 'error'"
            class="w-7 h-7 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400 shadow-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <!-- Info Icon (Gold Theme) -->
          <div
            v-else-if="toast.type === 'info'"
            class="w-7 h-7 rounded-full bg-[#C5A265]/15 border border-[#C5A265]/40 flex items-center justify-center text-[#E6CA65] shadow-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <!-- Warning Icon -->
          <div
            v-else
            class="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 pr-2">
          <h4 class="text-xs sm:text-sm font-semibold tracking-wide text-white leading-tight">
            {{ toast.title }}
          </h4>
          <p v-if="toast.message" class="text-stone-300 text-[11px] sm:text-xs leading-relaxed mt-1">
            {{ toast.message }}
          </p>
        </div>

        <!-- Dismiss Button -->
        <button
          type="button"
          @click="toastStore.removeToast(toast.id)"
          class="shrink-0 text-stone-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Tutup notifikasi"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToastStore } from "../../stores/toast";

const toastStore = useToastStore();

const getToastClasses = (type) => {
  switch (type) {
    case "success":
      return "bg-[#141518]/95 border-emerald-500/40 shadow-[0_16px_36px_rgba(16,185,129,0.2)]";
    case "error":
      return "bg-[#141518]/95 border-red-500/40 shadow-[0_16px_36px_rgba(239,68,68,0.22)]";
    case "info":
      return "bg-[#141518]/95 border-[#C5A265]/40 shadow-[0_16px_36px_rgba(197,162,101,0.22)]";
    case "warning":
      return "bg-[#141518]/95 border-amber-500/40 shadow-[0_16px_36px_rgba(245,158,11,0.2)]";
    default:
      return "bg-[#141518]/95 border-white/20";
  }
};
</script>
