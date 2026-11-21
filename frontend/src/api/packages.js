import api from "./auth";

export const packageApi = {
  /**
   * Mengambil daftar paket publik
   * @param {Object} [params] - { category, q, page, limit, sort }
   */
  getPackages: async (params = {}) => {
    const response = await api.get("/packages", { params });
    return response.data;
  },

  /**
   * Mengambil detail paket berdasarkan slug
   * @param {string} slug
   */
  getPackageBySlug: async (slug) => {
    const response = await api.get(`/packages/${slug}`);
    return response.data;
  },
};

export default packageApi;
