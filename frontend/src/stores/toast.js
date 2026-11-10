import { defineStore } from "pinia";
import { ref } from "vue";

export const useToastStore = defineStore("toast", () => {
  const toasts = ref([]);
  let counter = 0;

  /**
   * Menampilkan toast notification
   * @param {'success' | 'error' | 'info' | 'warning'} type
   * @param {string} title
   * @param {string} message
   * @param {number} duration - durasi dalam ms (default 4000)
   */
  const addToast = (type, title, message, duration = 4000) => {
    const id = ++counter;
    const newToast = {
      id,
      type,
      title,
      message,
      duration,
    };

    toasts.value.push(newToast);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  const showSuccess = (title, message = "", duration = 4000) => {
    return addToast("success", title, message, duration);
  };

  const showError = (title, message = "", duration = 4000) => {
    return addToast("error", title, message, duration);
  };

  const showInfo = (title, message = "", duration = 4000) => {
    return addToast("info", title, message, duration);
  };

  const showWarning = (title, message = "", duration = 4000) => {
    return addToast("warning", title, message, duration);
  };

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
});
