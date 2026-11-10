<template>
  <div
    class="min-h-screen flex flex-col font-sans overflow-x-hidden transition-colors duration-300"
    :style="{ backgroundColor: isAuthRoute ? '#F7F5E8' : 'transparent' }"
  >
    <router-view v-slot="{ Component, route }">
      <transition :name="transitionName" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const transitionName = ref("fade");

router.beforeEach((to, from) => {
  if (from.name === "login" && to.name === "register") {
    transitionName.value = "auth-to-register";
  } else if (from.name === "register" && to.name === "login") {
    transitionName.value = "auth-to-login";
  } else if (to.name === "login" || to.name === "register") {
    transitionName.value = "auth-fade";
  } else {
    transitionName.value = "fade";
  }
});

const isAuthRoute = computed(() => {
  return route.name === "login" || route.name === "register";
});

// Sync body background to prevent color flash during transitions or overscroll
watch(
  () => route.name,
  (name) => {
    if (typeof document !== "undefined") {
      if (name === "login" || name === "register") {
        document.body.style.backgroundColor = "#F7F5E8";
      } else {
        document.body.style.backgroundColor = "#0B0B0C";
      }
    }
  },
  { immediate: true }
);
</script>
