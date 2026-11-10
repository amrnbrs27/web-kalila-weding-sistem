import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor untuk menambahkan JWT token pada header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("kalila_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authApi = {
  /**
   * Login pengguna (Customer / Admin)
   * @param {string} email
   * @param {string} password
   */
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    if (response.data?.data?.token) {
      localStorage.setItem("kalila_token", response.data.data.token);
      localStorage.setItem("kalila_user", JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  /**
   * Registrasi akun pelanggan baru
   * @param {{ name: string, email: string, phone: string, password: string }} data
   */
  register: async ({ name, email, phone, password }) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      phone,
      password,
    });
    if (response.data?.data?.token) {
      localStorage.setItem("kalila_token", response.data.data.token);
      localStorage.setItem("kalila_user", JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  /**
   * Ambil data profil user saat ini
   */
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  /**
   * Keluar / Logout
   */
  logout: () => {
    localStorage.removeItem("kalila_token");
    localStorage.removeItem("kalila_user");
  },

  /**
   * Dapatkan user yang sedang aktif dari localStorage
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem("kalila_user");
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * Dapatkan token aktif
   */
  getToken: () => {
    return localStorage.getItem("kalila_token");
  },
};

export default api;
