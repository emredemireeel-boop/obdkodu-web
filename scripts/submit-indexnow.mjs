import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { isIP } from 'node:net';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const key = fs.readFileSync(path.join(root, 'data/indexnow-key.txt'), 'utf8').trim();
const sitemap = fs.readFileSync(path.join(root, 'dist/sitemap.xml'), 'utf8');
const allUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const requested = process.argv.slice(2);
const urlList = requested.length ? requested : allUrls;

if (!/^[a-f0-9]{32}$/.test(key)) throw new Error('Geçersiz IndexNow anahtarı');
if (!urlList.length || urlList.length > 10000) throw new Error('1 ile 10000 arası URL gerekli');
for (const url of urlList) {
  if (!allUrls.includes(url)) throw new Error(`Sitemap dışında URL: ${url}`);
}

const keyUrl = `https://www.obdkodu.com/${key}.txt`;
const originIp = process.env.OBDKODU_ORIGIN_IP;
if (originIp && !isIP(originIp)) throw new Error('OBDKODU_ORIGIN_IP geçerli bir IP adresi olmalı');
let keyStatus;
let keyBody;
try {
  if (originIp) {
    ({ status: keyStatus, body: keyBody } = await new Promise((resolve, reject) => {
      https.get(keyUrl, { lookup: (_host, options, callback) => options.all ? callback(null, [{ address: originIp, family: isIP(originIp) }]) : callback(null, originIp, isIP(originIp)) }, response => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', chunk => { body += chunk; });
        response.on('end', () => resolve({ status: response.statusCode, body }));
      }).on('error', reject);
    }));
  } else {
    const response = await fetch(keyUrl);
    keyStatus = response.status;
    keyBody = await response.text();
  }
} catch {
  throw new Error('Canlı anahtar dosyasına güvenli HTTPS bağlantısı kurulamadı; alan adının DNS kaydını kontrol edin. Geçiş sırasında OBDKODU_ORIGIN_IP kullanabilirsiniz.');
}
if (keyStatus !== 200 || keyBody.trim() !== key) {
  throw new Error(`Canlı IndexNow anahtar dosyası doğrulanamadı: HTTP ${keyStatus}`);
}

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: 'www.obdkodu.com', key, keyLocation: keyUrl, urlList })
});
if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
}
console.log(`IndexNow ${response.status}: ${urlList.length} kanonik URL bildirildi.`);
