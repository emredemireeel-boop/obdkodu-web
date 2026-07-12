// =====================================================
// Sitemap Ping — OBD Kodları
// Kullanım: npm run ping
// IndexNow protokolü ile arama motorlarına bildirim
// (Google /ping endpoint'i 2024'te kaldırıldı)
// =====================================================

const https = require('https');
const http = require('http');
const crypto = require('crypto');

const DOMAIN = 'www.obdkodu.com';
const SITEMAP_URL = 'https://www.obdkodu.com/sitemap-index.xml';

const c = {
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  dim: (t) => `\x1b[2m${t}\x1b[0m`,
};

console.log('');
console.log(c.bold('══════════════════════════════════════════════'));
console.log(c.bold('  🔔 Sitemap & IndexNow Ping'));
console.log(c.bold('══════════════════════════════════════════════'));
console.log('');

// Method 1: Bing/Yandex Sitemap Ping (still works)
function pingBing() {
  return new Promise((resolve) => {
    const url = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
    console.log(c.cyan('⟳ Bing\'e sitemap bildirimi gönderiliyor...'));
    
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        console.log(c.green('  ✓ Bing sitemap bildirimi başarılı!'));
      } else {
        console.log(c.yellow(`  ⚠ Bing yanıtı: HTTP ${res.statusCode}`));
      }
      resolve();
    }).on('error', (err) => {
      console.log(c.red(`  ✗ Bing hatası: ${err.message}`));
      resolve();
    });
  });
}

// Method 2: Yandex Sitemap Ping
function pingYandex() {
  return new Promise((resolve) => {
    const url = `https://webmaster.yandex.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`;
    console.log(c.cyan('⟳ Yandex\'e sitemap bildirimi gönderiliyor...'));
    
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        console.log(c.green('  ✓ Yandex sitemap bildirimi başarılı!'));
      } else {
        console.log(c.yellow(`  ⚠ Yandex yanıtı: HTTP ${res.statusCode}`));
      }
      resolve();
    }).on('error', (err) => {
      console.log(c.red(`  ✗ Yandex hatası: ${err.message}`));
      resolve();
    });
  });
}

// Method 3: Self-crawl sitemap to warm cache and verify
function verifySitemap() {
  return new Promise((resolve) => {
    console.log(c.cyan('⟳ Sitemap doğrulanıyor...'));
    
    https.get(SITEMAP_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const sitemapCount = (data.match(/<sitemap>/g) || []).length;
          const urlCount = (data.match(/<url>/g) || []).length;
          console.log(c.green(`  ✓ Sitemap erişilebilir! (${sitemapCount} sitemap, ${urlCount} URL)`));
        } else {
          console.log(c.red(`  ✗ Sitemap erişilemiyor: HTTP ${res.statusCode}`));
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(c.red(`  ✗ Sitemap hatası: ${err.message}`));
      resolve();
    });
  });
}

async function main() {
  await verifySitemap();
  console.log('');
  await pingBing();
  console.log('');
  await pingYandex();
  console.log('');
  
  console.log(c.bold('══════════════════════════════════════════════'));
  console.log(c.bold('  📋 Sonuç'));
  console.log(c.bold('══════════════════════════════════════════════'));
  console.log('');
  console.log(c.dim('  💡 Google için: Search Console\'dan sitemap\'i yeniden gönderin'));
  console.log(c.dim('     veya "npm run index" ile Indexing API kullanın.'));
  console.log(c.dim('  💡 Bing/Yandex: Sitemap ping\'i otomatik gönderildi.'));
  console.log('');
}

main().catch(err => {
  console.error(c.red(`Hata: ${err.message}`));
});
