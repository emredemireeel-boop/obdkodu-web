// =====================================================
// Google Indexing API — EN ÖNCELİKLİ 200 SAYFA
// Kullanım: npm run index:priority
// En çok aratılan OBD kodları + popüler markalar
// =====================================================

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const KEY_FILE = path.join(__dirname, '../service_account.json');
const DOMAIN = 'https://www.obdkodu.com';

// En çok aratılan OBD kodları (Google arama hacmine göre sıralı)
const TOP_CODES = [
  // Tier 1: En yüksek arama hacmi
  'P0420', 'P0171', 'P0300', 'P0301', 'P0302', 'P0303', 'P0304',
  'P0174', 'P0455', 'P0128', 'P0700', 'P0335', 'P0011',
  'P0446', 'P0442', 'P0401', 'P0440', 'P0135', 'P0141',
  'P0340', 'P0325', 'P0341', 'P0306', 'P0305',
  
  // Tier 2: Çok yaygın hatalar
  'P0172', 'P0175', 'P0101', 'P0102', 'P0103',
  'P0106', 'P0107', 'P0108', 'P0110', 'P0115',
  'P0120', 'P0121', 'P0122', 'P0123', 'P0130',
  'P0131', 'P0132', 'P0133', 'P0134', 'P0136',
  'P0137', 'P0138', 'P0139', 'P0140',
  'P0200', 'P0201', 'P0202', 'P0203', 'P0204',
  'P0220', 'P0221', 'P0222', 'P0223',
  'P0230', 'P0261', 'P0262', 'P0263',
  'P0336', 'P0351', 'P0352', 'P0353', 'P0354',
  
  // Tier 3: Türkiye'de sık görülen
  'P0400', 'P0402', 'P0410', 'P0411',
  'P0500', 'P0505', 'P0506', 'P0507',
  'P0600', 'P0601', 'P0602', 'P0603',
  'P0715', 'P0720', 'P0730', 'P0740', 'P0750',
  'P2096', 'P2097', 'P2187', 'P2188', 'P2195', 'P2196',
  'P2263', 'P0299',
  
  // U/B/C kodları (popüler olanlar)
  'U0100', 'U0101', 'U0121', 'U0073', 'U0140',
  'U0401', 'U0422', 'U1000',
  'B0001', 'B0010', 'B0100',
  'C0035', 'C0040', 'C0045', 'C0050',
];

// Türkiye'de en çok aranan markalar (sıralı)
const TOP_BRANDS = [
  'volkswagen', 'ford', 'renault', 'fiat', 'opel',
  'hyundai', 'toyota', 'bmw', 'mercedes', 'audi',
  'peugeot', 'citroen', 'dacia', 'skoda', 'kia',
  'honda', 'seat', 'volvo', 'chevrolet', 'togg',
  'nissan', 'suzuki', 'mazda', 'jeep', 'byd',
  'chery', 'mitsubishi', 'tesla',
];

// Renkli konsol
const c = {
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  dim: (t) => `\x1b[2m${t}\x1b[0m`,
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function progressBar(current, total, width = 30) {
  const pct = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  return `[${bar}] ${pct}% (${current}/${total})`;
}

async function main() {
  console.log('');
  console.log(c.bold('══════════════════════════════════════════════'));
  console.log(c.bold('  🚗 Google Index — ÖNCELİKLİ 200 SAYFA'));
  console.log(c.bold('══════════════════════════════════════════════'));
  console.log('');

  // 1. Dosya kontrolü
  if (!fs.existsSync(KEY_FILE)) {
    console.error(c.red('✗ HATA: service_account.json bulunamadı!'));
    return;
  }

  // 2. Öncelikli URL listesi oluştur (200 adet)
  const urls = [];

  // Statik sayfalar (en önemli 5)
  urls.push(`${DOMAIN}/`);
  urls.push(`${DOMAIN}/arama`);
  urls.push(`${DOMAIN}/gosterge-paneli`);
  urls.push(`${DOMAIN}/arama?kategori=P`);
  urls.push(`${DOMAIN}/hakkinda`);
  urls.push(`${DOMAIN}/marka`);

  // Brand hub pages — high value SEO targets
  for (const brand of TOP_BRANDS) {
    urls.push(`${DOMAIN}/marka/${brand}`);
  }

  // En popüler kodların genel sayfaları
  for (const code of TOP_CODES) {
    if (urls.length >= 200) break;
    urls.push(`${DOMAIN}/kod/${code}`);
  }

  // En popüler kod + marka kombinasyonları (Tier 1 kodlar x Top 5 marka)
  const tier1Codes = TOP_CODES.slice(0, 24); // İlk 24 kod
  const top5Brands = TOP_BRANDS.slice(0, 5);  // İlk 5 marka

  for (const code of tier1Codes) {
    for (const brand of top5Brands) {
      if (urls.length >= 200) break;
      urls.push(`${DOMAIN}/kod/${code}/${brand}`);
    }
    if (urls.length >= 200) break;
  }

  // Kalan slotları top markalar ile doldur (Tier 1 kodlar x sonraki markalar)
  if (urls.length < 200) {
    const remainingBrands = TOP_BRANDS.slice(5);
    for (const code of tier1Codes.slice(0, 10)) {
      for (const brand of remainingBrands) {
        if (urls.length >= 200) break;
        urls.push(`${DOMAIN}/kod/${code}/${brand}`);
      }
      if (urls.length >= 200) break;
    }
  }

  // Tam 200'e kes
  const finalUrls = urls.slice(0, 200);

  console.log(c.cyan(`📋 ${finalUrls.length} adet öncelikli URL hazırlandı:`));
  console.log(`  ├─ Statik sayfalar: 5`);
  console.log(`  ├─ Genel kod sayfaları: ${Math.min(TOP_CODES.length, 200 - 5)}`);
  console.log(`  └─ Marka+Kod sayfaları: ${finalUrls.length - 5 - Math.min(TOP_CODES.length, 200 - 5)}`);
  console.log('');

  // 3. Google Auth
  console.log(c.cyan('⟳ Google sunucularına bağlanılıyor...'));
  const key = JSON.parse(fs.readFileSync(KEY_FILE, 'utf-8'));
  const jwtClient = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/indexing']
  });

  try {
    await jwtClient.authorize();
    console.log(c.green('✓ Kimlik doğrulaması başarılı!'));
    console.log(c.dim(`  Service Account: ${key.client_email}`));
  } catch (err) {
    console.error(c.red(`✗ Auth hatası: ${err.message}`));
    return;
  }

  // 4. URL'leri gönder
  console.log('');
  console.log(c.bold(`🚀 ${finalUrls.length} URL Google'a gönderiliyor...`));
  console.log('');

  const indexing = google.indexing('v3');
  let successCount = 0;
  let failCount = 0;
  const errors = [];

  for (let i = 0; i < finalUrls.length; i++) {
    const urlToIndex = finalUrls[i];

    try {
      await indexing.urlNotifications.publish({
        auth: jwtClient,
        requestBody: {
          url: urlToIndex,
          type: 'URL_UPDATED'
        }
      });
      successCount++;
    } catch (err) {
      const status = err.response?.status || err.code;
      failCount++;

      // Rate limit — dur ve bekle, sonra tekrar dene
      if (status === 429) {
        console.log('');
        console.log(c.yellow(`  ⚠ Rate limit! 5 saniye bekleniyor...`));
        await sleep(5000);
        
        // Tekrar dene
        try {
          await indexing.urlNotifications.publish({
            auth: jwtClient,
            requestBody: { url: urlToIndex, type: 'URL_UPDATED' }
          });
          successCount++;
          failCount--; // Başarılı olduysa geri al
        } catch (retryErr) {
          errors.push({ url: urlToIndex, error: retryErr.message });
          // Quota tamamen dolmuşsa dur
          if (retryErr.response?.status === 429) {
            console.log(c.red('  ✗ Günlük quota doldu! Yarın tekrar çalıştırın.'));
            break;
          }
        }
      } else {
        errors.push({ url: urlToIndex, error: `[${status}] ${err.message?.substring(0, 80)}` });
      }
    }

    // Progress göster
    if ((i + 1) % 5 === 0 || i === finalUrls.length - 1) {
      process.stdout.write(`\r  ${progressBar(i + 1, finalUrls.length)} ${c.green(`✓${successCount}`)} ${failCount > 0 ? c.red(`✗${failCount}`) : ''}`);
    }

    // Rate limit koruması: 150ms bekleme
    await sleep(150);
  }

  console.log('\n');

  // 5. Sonuç
  console.log(c.bold('══════════════════════════════════════════════'));
  console.log(c.bold('  📋 SONUÇ'));
  console.log(c.bold('══════════════════════════════════════════════'));
  console.log(`  ${c.green('✓ Başarılı')}: ${successCount} URL`);
  if (failCount > 0) {
    console.log(`  ${c.red('✗ Başarısız')}: ${failCount} URL`);
  }
  console.log('');

  if (errors.length > 0 && errors.length <= 10) {
    console.log(c.yellow('  Hatalar:'));
    errors.forEach(e => console.log(c.dim(`    ${e.url}: ${e.error}`)));
    console.log('');
  }

  if (successCount > 0) {
    console.log(c.green('  🎉 İşlem tamamlandı!'));
    console.log(c.dim('  Google bu URL\'leri öncelikli olarak tarayacaktır.'));
    console.log(c.dim('  Sonuçları Google Search Console\'dan takip edebilirsiniz.'));
  }
  console.log('');
}

main().catch(err => {
  console.error(`Beklenmeyen hata: ${err.message}`);
  process.exit(1);
});
