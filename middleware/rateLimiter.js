import rateLimit from 'express-rate-limit';
import path from 'path';

export const globalGetLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: '⛔ Previše GET zahteva – pokušajte ponovo kasnije.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.method !== 'GET') return true;

    const skipExt = [
      '.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.gif',
      '.woff', '.woff2', '.ttf', '.eot', '.ico', '.map', '.mp4', '.webm', '.m4v'
    ];

    const staticFolders = ['/css', '/js', '/images', '/videos', '/fonts'];
    const staticFiles = ['/favicon.ico', '/robots.txt', '/sitemap.xml'];

    const ext = path.extname(req.path).toLowerCase();

    // Primer: /images/xyz.jpg → true
    const isFromStaticFolder = staticFolders.some(folder => req.path.startsWith(folder));
    const isStaticFile = staticFiles.includes(req.path);

    return skipExt.includes(ext) || isFromStaticFolder || isStaticFile;
  }
});

// Contact form: max 1 msg in 1 min
export const contactLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 1,
  message: '⛔ Možete poslati samo jednu poruku u minuti.'
});

// Login: max 3 attempts in 15 min
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 3,
  message: '⛔ Previše pokušaja logovanja – pokušajte kasnije.'
});

// Add to Cart: max 10 times in 1 min
export const cartLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10,
  message: '⛔ Ne možete dodavati više od 10 artikala u minuti.'
});

// Forgot Password: max 2 times in 1 h
export const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 h
  max: 2,
  message: '⛔ Zahtev za reset lozinke ograničen na 2 puta na sat.'
});

// Search: max 15 times in 1 min
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: '⛔ Pretrage su ograničene – pokušajte kasnije.'
});
