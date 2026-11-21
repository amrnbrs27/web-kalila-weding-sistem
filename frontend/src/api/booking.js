import api from "./auth";

export const bookingApi = {
  /**
   * Buat pesanan baru oleh pelanggan (Customer)
   * @param {Object} payload
   * @param {string} payload.packageId - ID paket MongoDB aktif
   * @param {string} payload.eventDate - Format YYYY-MM-DD
   * @param {string} payload.eventName - Nama acara (3-120 karakter)
   * @param {string} payload.location - Lokasi / venue acara
   * @param {string} [payload.contactName]
   * @param {string} [payload.contactPhone]
   * @param {string} [payload.contactEmail]
   * @param {number} [payload.guestCount]
   * @param {string} [payload.notes]
   * @param {Object} [payload.formData] - { decorArea, servingTime, additionalNeeds }
   */
  createBooking: async (payload) => {
    const response = await api.post("/bookings", payload);
    return response.data;
  },

  /**
   * Ambil daftar riwayat pesanan milik pelanggan saat ini
   * @param {Object} [params] - { page, limit, status, sort }
   */
  getMyBookings: async (params = {}) => {
    const response = await api.get("/bookings/me", { params });
    return response.data;
  },

  /**
   * Ambil detail pesanan spesifik milik pelanggan
   * @param {string} bookingId
   */
  getMyBookingById: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  /**
   * Ambil informasi rekening / QRIS pembayaran DP
   * @param {string} bookingId
   */
  getPaymentInfo: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}/payment-info`);
    return response.data;
  },

  /**
   * Unggah bukti transfer DP
   * @param {string} bookingId
   * @param {File} proofFile
   */
  uploadPaymentProof: async (bookingId, proofFile) => {
    const formData = new FormData();
    formData.append("proof", proofFile);

    const response = await api.post(`/bookings/${bookingId}/payment-proof`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Cek ketersediaan tanggal acara
   * @param {string} category - 'dekor' | 'catering' | 'wedding'
   * @param {string} month - Format YYYY-MM
   */
  checkAvailability: async (category, month) => {
    const response = await api.get("/availability", {
      params: { category, month },
    });
    return response.data;
  },
};

export default bookingApi;
