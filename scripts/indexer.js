const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const KEY_FILE = path.join(__dirname, '../service_account.json');
const QUEUE_FILE = path.join(__dirname, '../data/indexing-queue.json');
const CODES_FILE = path.join(__dirname, '../data/obd-codes.json');
const VEHICLES_FILE = path.join(__dirname, '../data/vehicles.json');
const DOMAIN = 'https://www.obdkodu.com';

const BATCH_SIZE = 200;

// Popular brands list
const popularBrands = [
  { name: 'Audi', slug: 'audi' },
  { name: 'BMW', slug: 'bmw' },
  { name: 'Chevrolet', slug: 'chevrolet' },
  { name: 'Citroen', slug: 'citroen' },
  { name: 'Dacia', slug: 'dacia' },
  { name: 'Fiat', slug: 'fiat' },
  { name: 'Ford', slug: 'ford' },
  { name: 'Honda', slug: 'honda' },
  { name: 'Hyundai', slug: 'hyundai' },
  { name: 'Kia', slug: 'kia' },
  { name: 'Mazda', slug: 'mazda' },
  { name: 'Mercedes', slug: 'mercedes' },
  { name: 'Nissan', slug: 'nissan' },
  { name: 'Opel', slug: 'opel' },
  { name: 'Peugeot', slug: 'peugeot' },
  { name: 'Renault', slug: 'renault' },
  { name: 'Seat', slug: 'seat' },
  { name: 'Skoda', slug: 'skoda' },
  { name: 'Subaru', slug: 'subaru' },
  { name: 'Suzuki', slug: 'suzuki' },
  { name: 'Tofaş', slug: 'tofas' },
  { name: 'TOGG', slug: 'togg' },
  { name: 'Toyota', slug: 'toyota' },
  { name: 'Volkswagen', slug: 'volkswagen' },
  { name: 'Volvo', slug: 'volvo' }
];

function createSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('--- Google Indexing API Bot Başlatıldı ---');
  
  if (!fs.existsSync(KEY_FILE)) {
    console.error('HATA: service_account.json dosyası bulunamadı!');
    console.log('Lütfen Google Cloud üzerinden indirdiğiniz yetki dosyasını ana dizine ekleyin.');
    return;
  }

  // 1. Build massive URL list
  console.log('Tüm muhtemel URL kombinasyonları hesaplanıyor...');
  const codesData = JSON.parse(fs.readFileSync(CODES_FILE, 'utf-8'));
  
  let vehiclesData = [];
  if (fs.existsSync(VEHICLES_FILE)) {
    vehiclesData = JSON.parse(fs.readFileSync(VEHICLES_FILE, 'utf-8'));
  }
  
  const modelsList = vehiclesData.map(v => ({
    brandSlug: createSlug(v.brand),
    slug: createSlug(v.model)
  }));

  const allUrls = [];

  for (const c of codesData) {
    const codeId = c.code.toUpperCase();
    allUrls.push(`${DOMAIN}/kod/${codeId}`); // Level 1 (Genel Kod)

    for (const b of popularBrands) {
      allUrls.push(`${DOMAIN}/kod/${codeId}/${b.slug}`); // Level 2 (Marka)
      
      const brandModels = modelsList.filter(m => m.brandSlug === b.slug);
      for (const m of brandModels) {
        allUrls.push(`${DOMAIN}/kod/${codeId}/${b.slug}/${m.slug}`); // Level 3 (Model)
      }
    }
  }

  console.log(`Toplam ${allUrls.length} adet URL hesaplandı.`);

  // 2. Load Queue
  let queue = { pending: [], completed: [] };
  if (fs.existsSync(QUEUE_FILE)) {
    queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
  }

  // 3. Find newly added URLs
  const knownUrls = new Set([...queue.pending, ...queue.completed]);
  let newCount = 0;
  for (const u of allUrls) {
    if (!knownUrls.has(u)) {
      queue.pending.push(u);
      newCount++;
    }
  }
  
  if (newCount > 0) {
    console.log(`Kuyruğa ${newCount} adet yeni URL eklendi.`);
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  }

  console.log(`Bekleyen (Pending): ${queue.pending.length} URL`);
  console.log(`Tamamlanan (Completed): ${queue.completed.length} URL`);

  if (queue.pending.length === 0) {
    console.log('Gönderilecek yeni sayfa yok. Bot duruyor.');
    return;
  }

  // 4. Authenticate
  console.log('Google Sunucularına Bağlanılıyor...');
  const key = JSON.parse(fs.readFileSync(KEY_FILE, 'utf-8'));
  const jwtClient = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/indexing']
  });

  try {
    await jwtClient.authorize();
    console.log('Google kimlik doğrulaması (Auth) BAŞARILI!');
  } catch (err) {
    console.error('Kimlik doğrulama başarısız oldu:', err.message);
    return;
  }

  // 5. Send Batch
  const batch = queue.pending.splice(0, BATCH_SIZE);
  console.log(`Google API'ye limitler dahilinde ${batch.length} adet URL gönderiliyor...`);

  let successCount = 0;
  const indexing = google.indexing('v3');

  for (const url of batch) {
    try {
      await indexing.urlNotifications.publish({
        auth: jwtClient,
        requestBody: {
          url: url,
          type: 'URL_UPDATED'
        }
      });
      successCount++;
      queue.completed.push(url);
    } catch (err) {
      console.error(`Hata [${url}]:`, err.message);
      // Eğer limit aşıldıysa tekrar denemek için kuyruğa geri koy
      queue.pending.unshift(url); 
      break; // Limite takıldıysa döngüyü kır
    }
    // Google API limitlerine saygı için 100ms bekleme
    await new Promise(resolve => setTimeout(resolve, 100)); 
  }

  console.log(`\nİşlem Tamamlandı: ${successCount} URL başarıyla Google Index'e eklendi.`);
  console.log(`Kalan bekleyen URL sayısı: ${queue.pending.length}`);
  
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  console.log('Veritabanı (Queue) güncellendi.');
}

main();
