import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authApi } from "../api/auth";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("kalila_token") || null);

  let initialUser = null;
  try {
    const rawUser = localStorage.getItem("kalila_user");
    initialUser = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    initialUser = null;
  }
  const user = ref(initialUser);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const userName = computed(() => user.value?.name || "Client");
  const userEmail = computed(() => user.value?.email || "");
  const userRole = computed(() => user.value?.role || "customer");
  const userInitials = computed(() => {
    if (!user.value?.name) return "CL";
    const parts = user.value.name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  });

  const setAuth = (userData, tokenVal) => {
    user.value = userData;
    token.value = tokenVal;
    localStorage.setItem("kalila_token", tokenVal);
    localStorage.setItem("kalila_user", JSON.stringify(userData));
  };

  const logout = () => {
    authApi.logout();
    user.value = null;
    token.value = null;
  };

  const syncAuth = () => {
    const t = localStorage.getItem("kalila_token");
    const u = localStorage.getItem("kalila_user");
    token.value = t || null;
    try {
      user.value = u ? JSON.parse(u) : null;
    } catch {
      user.value = null;
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    userName,
    userEmail,
    userRole,
    userInitials,
    setAuth,
    logout,
    syncAuth,
  };
});
