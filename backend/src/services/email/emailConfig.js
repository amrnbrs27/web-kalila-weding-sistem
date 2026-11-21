/**
 * Modul status konfigurasi email dan aturan keamanan provider
 */

function extractDomainFromEmail(emailString) {
  if (!emailString || typeof emailString !== 'string') return '';
  const match = emailString.match(/@([a-zA-Z0-9.-]+)>?$/);
  return match && match[1] ? match[1].toLowerCase() : '';
}

function getEmailConfigStatus() {
  const provider = (process.env.EMAIL_PROVIDER || 'log').toLowerCase().trim();
  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase().trim();
  const resendApiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '';
  const emailFrom = process.env.EMAIL_FROM ? process.env.EMAIL_FROM.trim() : '';
  const emailRedirectTo = process.env.EMAIL_REDIRECT_TO ? process.env.EMAIL_REDIRECT_TO.trim() : '';

  // 1. Provider log dan memory di lingkungan production
  if (nodeEnv === 'production' && (provider === 'log' || provider === 'memory')) {
    return {
      ready: false,
      reason: `Provider "${provider}" tidak diizinkan pada environment production`,
      mode: provider,
      provider,
    };
  }

  // 2. Provider log / memory di non-production
  if (provider === 'log' || provider === 'memory') {
    return {
      ready: true,
      reason: null,
      mode: provider,
      provider,
    };
  }

  // 3. Provider resend
  if (provider === 'resend') {
    if (!resendApiKey || !emailFrom) {
      return {
        ready: false,
        reason: 'RESEND_API_KEY dan EMAIL_FROM wajib diisi untuk provider resend',
        mode: nodeEnv === 'production' ? 'production' : 'sandbox',
        provider,
      };
    }

    const domain = extractDomainFromEmail(emailFrom);
    const isSandboxDomain = domain === 'resend.dev' || domain.endsWith('.resend.dev');

    if (isSandboxDomain) {
      if (nodeEnv === 'production') {
        return {
          ready: false,
          reason: 'Domain resend.dev tidak diizinkan di production, diperlukan domain terverifikasi',
          mode: 'sandbox',
          provider,
        };
      }

      // Non-production sandbox
      if (!emailRedirectTo) {
        return {
          ready: false,
          reason: 'Domain uji resend.dev pada lingkungan non-production memerlukan EMAIL_REDIRECT_TO agar semua email dialihkan ke alamat akun terdaftar',
          mode: 'sandbox',
          provider,
        };
      }

      return {
        ready: true,
        reason: null,
        mode: 'sandbox',
        provider,
      };
    }

    // Resend dengan domain terverifikasi non-resend.dev
    return {
      ready: true,
      reason: null,
      mode: nodeEnv === 'production' ? 'production' : 'development',
      provider,
    };
  }

  return {
    ready: false,
    reason: `Provider email "${provider}" tidak dikenal (gunakan resend, log, atau memory)`,
    mode: 'unknown',
    provider,
  };
}

module.exports = {
  extractDomainFromEmail,
  getEmailConfigStatus,
};

