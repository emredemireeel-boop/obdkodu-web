// =====================================================
// Google Sitemap Ping — OBD Kodları
// Kullanım: npm run ping
// Google'a sitemap'in güncellendiğini bildirir
// =====================================================

const https = require('https');

const SITEMAP_URL = encodeURIComponent('https://www.obdkodu.com/sitemap-index.xml');

const c = {
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
};

console.log('');
console.log(c.bold('══════════════════════════════════════════════'));
console.log(c.bold('  🔔 Google Sitemap Ping'));
console.log(c.bold('══════════════════════════════════════════════'));
console.log('');

const url = `https://www.google.com/ping?sitemap=${SITEMAP_URL}`;

console.log(c.cyan(`⟳ Google'a sitemap bildirimi gönderiliyor...`));
console.log(`  URL: ${url}`);
console.log('');

https.get(url, (res) => {
  if (res.statusCode === 200) {
    console.log(c.green('✓ Sitemap başarıyla Google\'a bildirildi!'));
    console.log(c.green('  Google sitemap\'inizi kısa süre içinde yeniden tarayacaktır.'));
  } else {
    console.log(c.red(`✗ Beklenmeyen yanıt: HTTP ${res.statusCode}`));
  }
  console.log('');
}).on('error', (err) => {
  console.log(c.red(`✗ Hata: ${err.message}`));
  console.log('');
});
