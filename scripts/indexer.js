// =====================================================
// Google Indexing API Bot — OBD Kodları
// Kullanım: npm run index
// Her çalıştırmada 200 URL (günlük Google limiti) gönderir
// =====================================================

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const KEY_FILE = path.join(__dirname, '../service_account.json');
const QUEUE_FILE = path.join(__dirname, '../data/indexing-queue.json');
const CODES_FILE = path.join(__dirname, '../data/obd-codes.json');
const VEHICLES_FILE = path.join(__dirname, '../data/vehicles.json');
const DL_FILE = path.join(__dirname, '../data/dashboard-lights.json');
const DOMAIN = 'https://www.obdkodu.com';

// Google günlük limit: 200 istek/gün
const DAILY_LIMIT = 200;
// İstekler arası bekleme (ms) — API rate limit'e takılmamak için
const REQUEST_DELAY_MS = 150;
// Hata sonrası retry sayısı
const MAX_RETRIES = 3;

// Renkli konsol çıktısı
const c = {
  green: (t) => `\x1b[32m${t}\x1b[0m`,
  red: (t) => `\x1b[31m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  cyan: (t) => `\x1b[36m${t}\x1b[0m`,
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
  dim: (t) => `\x1b[2m${t}\x1b[0m`,
};

// Markalar listesi (server.js ile aynı)
const popularBrands = [
  { name: 'Audi', slug: 'audi' },
  { name: 'BMW', slug: 'bmw' },
  { name: 'BYD', slug: 'byd' },
  { name: 'Chery', slug: 'chery' },
  { name: 'Chevrolet', slug: 'chevrolet' },
  { name: 'Citroen', slug: 'citroen' },
  { name: 'Dacia', slug: 'dacia' },
  { name: 'DS Automobiles', slug: 'ds-automobiles' },
  { name: 'Fiat', slug: 'fiat' },
  { name: 'Ford', slug: 'ford' },
  { name: 'Honda', slug: 'honda' },
  { name: 'Hyundai', slug: 'hyundai' },
  { name: 'Kia', slug: 'kia' },
  { name: 'Mercedes', slug: 'mercedes' },
  { name: 'Mitsubishi', slug: 'mitsubishi' },
  { name: 'Opel', slug: 'opel' },
  { name: 'Peugeot', slug: 'peugeot' },
  { name: 'Renault', slug: 'renault' },
  { name: 'Seat', slug: 'seat' },
  { name: 'Skoda', slug: 'skoda' },
  { name: 'Tesla', slug: 'tesla' },
  { name: 'TOGG', slug: 'togg' },
  { name: 'Toyota', slug: 'toyota' },
  { name: 'Volkswagen', slug: 'volkswagen' },
  { name: 'Volvo', slug: 'volvo' }
];

function createSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadQueue() {
  if (fs.existsSync(QUEUE_FILE)) {
    return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  }
  return { pending: [], completed: [], failed: [], lastRun: null, totalSent: 0 };
}

function saveQueue(queue) {
  queue.lastRun = new Date().toISOString();
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
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
  console.log(c.bold('  🚗 Google Indexing API — OBD Kodları'));
  console.log(c.bold('══════════════════════════════════════════════'));
  console.log('');

  // 1. Dosya kontrolleri
  if (!fs.existsSync(KEY_FILE)) {
    console.error(c.red('✗ HATA: service_account.json dosyası bulunamadı!'));
    console.log('  Lütfen Google Cloud Console\'dan indirdiğiniz yetki dosyasını ana dizine ekleyin.');
    console.log('  Ayrıca service account email adresini Search Console\'da site sahibi olarak eklemeyi unutmayın.');
    return;
  }

  if (!fs.existsSync(CODES_FILE)) {
    console.error(c.red('✗ HATA: obd-codes.json dosyası bulunamadı!'));
    return;
  }

  // 2. Tüm URL'leri hesapla
  console.log(c.cyan('⟳ Tüm URL kombinasyonları hesaplanıyor...'));
  
  const codesData = JSON.parse(fs.readFileSync(CODES_FILE, 'utf-8'));
  
  // Deduplicate codes
  const codesMap = new Map();
  codesData.forEach(code => {
    if (!codesMap.has(code.code)) {
      codesMap.set(code.code, code);
    }
  });
  const uniqueCodes = Array.from(codesMap.values());

  let vehiclesData = [];
  if (fs.existsSync(VEHICLES_FILE)) {
    vehiclesData = JSON.parse(fs.readFileSync(VEHICLES_FILE, 'utf-8'));
  }

  let dashboardLights = [];
  if (fs.existsSync(DL_FILE)) {
    dashboardLights = JSON.parse(fs.readFileSync(DL_FILE, 'utf-8'));
  }

  const modelsList = vehiclesData.map(v => ({
    brandSlug: createSlug(v.brand),
    slug: createSlug(v.model)
  }));

  const allUrls = new Set();

  // Statik sayfalar
  allUrls.add(`${DOMAIN}/`);
  allUrls.add(`${DOMAIN}/arama`);
  allUrls.add(`${DOMAIN}/arama?kategori=P`);
  allUrls.add(`${DOMAIN}/arama?kategori=B`);
  allUrls.add(`${DOMAIN}/arama?kategori=C`);
  allUrls.add(`${DOMAIN}/arama?kategori=U`);
  allUrls.add(`${DOMAIN}/gosterge-paneli`);
  allUrls.add(`${DOMAIN}/hakkinda`);
  allUrls.add(`${DOMAIN}/iletisim`);

  // Dashboard light detay sayfaları
  for (const dl of dashboardLights) {
    allUrls.add(`${DOMAIN}/gosterge-paneli/${dl.id}`);
  }

  // Brand hub pages (SEO)
  allUrls.add(`${DOMAIN}/marka`);
  for (const brand of popularBrands) {
    allUrls.add(`${DOMAIN}/marka/${brand.slug}`);
  }

  // OBD Kod sayfaları (Seviye 1: Genel)
  for (const code of uniqueCodes) {
    const codeId = code.code.toUpperCase();
    allUrls.add(`${DOMAIN}/kod/${codeId}`);

    // Seviye 2: Marka sayfaları
    for (const brand of popularBrands) {
      allUrls.add(`${DOMAIN}/kod/${codeId}/${brand.slug}`);
      
      // Seviye 3: Model sayfaları
      const brandModels = modelsList.filter(m => m.brandSlug === brand.slug);
      for (const model of brandModels) {
        allUrls.add(`${DOMAIN}/kod/${codeId}/${brand.slug}/${model.slug}`);
      }
    }
  }

  const urlArray = Array.from(allUrls);
  console.log(`  ${c.bold(urlArray.length.toLocaleString('tr-TR'))} adet URL hesaplandı`);
  console.log(`    ├─ ${uniqueCodes.length} arıza kodu`);
  console.log(`    ├─ ${popularBrands.length} marka`);
  console.log(`    ├─ ${modelsList.length} model`);
  console.log(`    └─ ${dashboardLights.length} gösterge işareti`);
  console.log('');

  // 3. Kuyruğu yükle ve yeni URL'leri ekle
  const queue = loadQueue();
  
  // failed URL'leri tekrar pending'e al (retry)
  if (queue.failed && queue.failed.length > 0) {
    console.log(c.yellow(`⟲ ${queue.failed.length} başarısız URL tekrar kuyruğa alınıyor...`));
    queue.pending.unshift(...queue.failed);
    queue.failed = [];
  }

  const knownUrls = new Set([...queue.pending, ...(queue.completed || [])]);
  let newCount = 0;
  for (const u of urlArray) {
    if (!knownUrls.has(u)) {
      queue.pending.push(u);
      newCount++;
    }
  }

  if (newCount > 0) {
    console.log(c.green(`✓ Kuyruğa ${newCount.toLocaleString('tr-TR')} yeni URL eklendi`));
  }

  console.log('');
  console.log(c.bold('📊 Kuyruk Durumu:'));
  console.log(`  ├─ Bekleyen  : ${c.yellow(queue.pending.length.toLocaleString('tr-TR'))} URL`);
  console.log(`  ├─ Tamamlanan: ${c.green((queue.completed || []).length.toLocaleString('tr-TR'))} URL`);
  console.log(`  └─ Son çalışma: ${queue.lastRun ? new Date(queue.lastRun).toLocaleString('tr-TR') : 'Hiç çalışmadı'}`);
  console.log('');

  if (queue.pending.length === 0) {
    console.log(c.green('✓ Tüm URL\'ler başarıyla gönderildi! Yeni sayfa yok.'));
    saveQueue(queue);
    return;
  }

  // 4. Google kimlik doğrulaması
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
    console.error(c.red(`✗ Kimlik doğrulama başarısız: ${err.message}`));
    console.log('');
    console.log('  Olası çözümler:');
    console.log('  1. service_account.json dosyasının doğru olduğundan emin olun');
    console.log('  2. Google Cloud Console\'da Indexing API\'nin etkin olduğunu kontrol edin');
    console.log('  3. Service account email\'ini Search Console\'da site sahibi olarak ekleyin');
    return;
  }

  // 5. Batch gönderimi
  const batchSize = Math.min(DAILY_LIMIT, queue.pending.length);
  const batch = queue.pending.splice(0, batchSize);

  console.log('');
  console.log(c.bold(`🚀 ${batchSize} URL Google'a gönderiliyor...`));
  console.log(c.dim(`   (Günlük limit: ${DAILY_LIMIT} | İstekler arası: ${REQUEST_DELAY_MS}ms)`));
  console.log('');

  const indexing = google.indexing('v3');
  let successCount = 0;
  let failCount = 0;
  let rateLimited = false;

  for (let i = 0; i < batch.length; i++) {
    const urlToIndex = batch[i];
    let success = false;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await indexing.urlNotifications.publish({
          auth: jwtClient,
          requestBody: {
            url: urlToIndex,
            type: 'URL_UPDATED'
          }
        });
        success = true;
        successCount++;
        if (!queue.completed) queue.completed = [];
        queue.completed.push(urlToIndex);
        break;
      } catch (err) {
        const status = err.response?.status || err.code;

        // Rate limit (429) veya quota aşımı
        if (status === 429 || (err.message && err.message.includes('quota'))) {
          if (attempt < MAX_RETRIES) {
            const backoff = Math.pow(2, attempt) * 1000;
            process.stdout.write(c.yellow(`  ⚠ Rate limit, ${backoff/1000}s bekleniyor... `));
            await sleep(backoff);
          } else {
            console.log(c.red(`  ✗ Rate limit aşıldı, kalan URL'ler bir sonraki çalışmaya erteleniyor.`));
            // Gönderilemeyen URL'leri pending'e geri koy
            queue.pending.unshift(...batch.slice(i));
            rateLimited = true;
          }
          continue;
        }

        // Auth hatası — devam etmenin anlamı yok
        if (status === 401 || status === 403) {
          console.log(c.red(`  ✗ Yetki hatası (${status}): ${urlToIndex}`));
          console.log(c.dim(`    ${err.message}`));
          if (!queue.failed) queue.failed = [];
          queue.failed.push(urlToIndex);
          failCount++;
          break;
        }

        // Diğer hatalar
        if (attempt === MAX_RETRIES) {
          console.log(c.red(`  ✗ Başarısız (${MAX_RETRIES} deneme): ${urlToIndex}`));
          console.log(c.dim(`    ${err.message}`));
          if (!queue.failed) queue.failed = [];
          queue.failed.push(urlToIndex);
          failCount++;
        } else {
          await sleep(1000 * attempt);
        }
      }
    }

    if (rateLimited) break;

    // İlerleme göster (her 10 URL'de bir veya son URL)
    if (success && (successCount % 10 === 0 || i === batch.length - 1)) {
      process.stdout.write(`\r  ${progressBar(i + 1, batch.length)} ${c.green(`✓${successCount}`)} ${failCount > 0 ? c.red(`✗${failCount}`) : ''}`);
    }

    // Rate limit koruması
    if (i < batch.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  console.log('');
  console.log('');

  // 6. Sonuç raporu
  console.log(c.bold('══════════════════════════════════════════════'));
  console.log(c.bold('  📋 Sonuç Raporu'));
  console.log(c.bold('══════════════════════════════════════════════'));
  console.log(`  ${c.green('✓ Başarılı')}: ${successCount} URL`);
  if (failCount > 0) {
    console.log(`  ${c.red('✗ Başarısız')}: ${failCount} URL`);
  }
  if (rateLimited) {
    console.log(`  ${c.yellow('⚠ Rate limit')}: Kalan URL'ler ertelendi`);
  }
  console.log(`  ${c.cyan('⏳ Kalan')}: ${queue.pending.length.toLocaleString('tr-TR')} URL`);
  
  const completedPct = ((queue.completed || []).length / urlArray.length * 100).toFixed(1);
  console.log(`  ${c.bold('📈 Toplam ilerleme')}: %${completedPct}`);
  console.log('');

  if (queue.pending.length > 0) {
    const daysLeft = Math.ceil(queue.pending.length / DAILY_LIMIT);
    console.log(c.dim(`  💡 Kalan URL'ler için tahmini ${daysLeft} gün daha çalıştırmanız gerekiyor.`));
    console.log(c.dim(`     Her gün "npm run index" komutunu çalıştırın.`));
  }

  // Kaydet
  if (!queue.totalSent) queue.totalSent = 0;
  queue.totalSent += successCount;
  saveQueue(queue);
  
  console.log('');
  console.log(c.green('✓ Kuyruk dosyası güncellendi.'));
  console.log('');
}

main().catch(err => {
  console.error(c.red(`Beklenmeyen hata: ${err.message}`));
  process.exit(1);
});
