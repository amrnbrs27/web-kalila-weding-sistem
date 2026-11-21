const sanitizeHtml = require('sanitize-html');

const ALLOWED_TAGS = [
  'p',
  'br',
  'h2',
  'h3',
  'h4',
  'strong',
  'em',
  'u',
  's',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'figure',
  'figcaption',
  'hr',
  'code',
  'pre',
];

const ALLOWED_ATTRIBUTES = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height'],
};

const ALLOWED_SCHEMES = ['http', 'https', 'mailto', 'tel'];

/**
 * Memeriksa apakah URL gambar berasal dari host Cloudinary dengan CLOUDINARY_CLOUD_NAME yang sah.
 */
function isAllowedCloudinaryImage(src) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName || typeof src !== 'string') return false;
  const prefix = `https://res.cloudinary.com/${cloudName}/`;
  return src.startsWith(prefix);
}

/**
 * Menyanitasi isi artikel HTML dengan daftar putih (allowlist) ketat.
 * Idempoten: menyanitasi dua kali menghasilkan keluaran yang sama persis.
 */
function sanitizeContentHtml(html) {
  if (!html || typeof html !== 'string') return '';

  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ALLOWED_SCHEMES,
    allowedSchemesByTag: {
      a: ALLOWED_SCHEMES,
    },
    // Buang tag img yang bukan berasal dari Cloudinary milik akun
    exclusiveFilter: (frame) => {
      if (frame.tag === 'img') {
        const src = frame.attribs?.src;
        return !isAllowedCloudinaryImage(src);
      }
      return false;
    },
    transformTags: {
      a: (tagName, attribs) => {
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        };
      },
      img: (tagName, attribs) => {
        const cleanAttribs = {
          src: attribs.src || '',
          alt: attribs.alt || '',
        };
        if (attribs.width && /^[1-9]\d{0,3}$/.test(String(attribs.width).trim())) {
          const w = parseInt(String(attribs.width).trim(), 10);
          if (w >= 1 && w <= 4000) cleanAttribs.width = String(w);
        }
        if (attribs.height && /^[1-9]\d{0,3}$/.test(String(attribs.height).trim())) {
          const h = parseInt(String(attribs.height).trim(), 10);
          if (h >= 1 && h <= 4000) cleanAttribs.height = String(h);
        }
        return {
          tagName: 'img',
          attribs: cleanAttribs,
        };
      },
    },
  });
}

/**
 * Membersihkan seluruh tag HTML dan menyisakan teks biasa.
 */
function htmlToPlainText(html) {
  if (!html || typeof html !== 'string') return '';
  const spaced = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|h[2-4]|li|blockquote|div|figure|figcaption)>/gi, ' ');
  const stripped = sanitizeHtml(spaced, {
    allowedTags: [],
    allowedAttributes: {},
  });
  return stripped.replace(/\s+/g, ' ').trim();
}

/**
 * Menghitung jumlah kata dari teks biasa.
 */
function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Membuat ringkasan (excerpt) sekitar 200 karakter dipotong pada batas kata diakhiri '...'.
 */
function buildExcerpt(htmlOrText, maxLen = 200) {
  const plain = htmlToPlainText(htmlOrText);
  if (plain.length <= maxLen) return plain;
  const sub = plain.slice(0, maxLen);
  const lastSpace = sub.lastIndexOf(' ');
  const cut = lastSpace > 0 ? sub.slice(0, lastSpace) : sub;
  return `${cut}...`;
}

/**
 * Membersihkan tag HTML dari nilai teks biasa (title, excerpt, metaDescription, authorName, tags).
 */
function sanitizePlainText(text) {
  if (!text || typeof text !== 'string') return '';
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

module.exports = {
  sanitizeContentHtml,
  htmlToPlainText,
  countWords,
  buildExcerpt,
  sanitizePlainText,
  isAllowedCloudinaryImage,
};

