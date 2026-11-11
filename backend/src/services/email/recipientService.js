/**
 * Service untuk menentukan daftar penerima notifikasi email efektif (Admin dan Owner)
 */

const Setting = require('../../models/Setting');
const User = require('../../models/User');

function normalizeEmailList(list) {
  if (!Array.isArray(list)) return [];
  const set = new Set();
  for (const item of list) {
    if (typeof item === 'string') {
      const cleaned = item.trim().toLowerCase();
      if (cleaned) {
        set.add(cleaned);
      }
    }
  }
  return Array.from(set);
}

/**
 * Mengambil daftar penerima efektif untuk notifikasi
 * @param {Object} [customSetting] - dokumen Setting opsional
 * @returns {Promise<{ adminEmails: string[], ownerEmails: string[] }>}
 */
async function getEffectiveRecipients(customSetting = null) {
  const setting = customSetting || (await Setting.getSettings());
  const configuredAdminEmails = normalizeEmailList(
    setting?.notificationRecipients?.adminEmails
  );
  const configuredOwnerEmails = normalizeEmailList(
    setting?.notificationRecipients?.ownerEmails
  );

  let effectiveAdmins = [];

  if (configuredAdminEmails.length > 0) {
    effectiveAdmins = configuredAdminEmails;
  } else {
    // Fallback: seluruh akun admin aktif dari koleksi User
    const activeAdmins = await User.find({ role: 'admin', isActive: true })
      .select('email')
      .lean();
    effectiveAdmins = normalizeEmailList(activeAdmins.map((u) => u.email));
  }

  // Aturan deduplikasi: jika alamat ada di admin dan owner, hanya menerima versi admin
  const adminSet = new Set(effectiveAdmins);
  const effectiveOwners = configuredOwnerEmails.filter((email) => !adminSet.has(email));

  return {
    adminEmails: effectiveAdmins,
    ownerEmails: effectiveOwners,
  };
}

module.exports = {
  getEffectiveRecipients,
  normalizeEmailList,
};

