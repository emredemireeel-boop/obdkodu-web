// ============================================================
// OBD kodlarına isabetli "belirtiler" (symptoms) ekleme scripti
// - Belirtisi olmayan kodlara, kod ailesi + kategori + isimdeki
//   teknik anahtar kelimelere göre doğru belirtiler üretir.
// - Mevcut belirtileri OLDUĞU GİBİ korur.
// ============================================================
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'data', 'obd-codes.json');
const data = JSON.parse(fs.readFileSync(file, 'utf-8'));

const lc = (s) => (s || '').toLowerCase();

// Kategori bazlı temel belirti (fallback)
const baseByCategory = {
  P: [
    'Motor arıza (Check Engine / MIL) uyarı lambasının yanması',
    'Motor performansında düşüş ve yakıt tüketiminde artış'
  ],
  B: [
    'Gösterge panelinde ilgili uyarı lambasının yanması',
    'İlgili konfor/gövde sisteminin düzgün çalışmaması'
  ],
  C: [
    'ABS / ESP / fren sistemi uyarı lambasının yanması',
    'Sürüş güvenliği (denge/çekiş) sistemlerinin devre dışı kalması'
  ],
  U: [
    'Gösterge panelinde birden fazla uyarı lambasının aynı anda yanması',
    'Araç kontrol modülleri arasında haberleşme (iletişim) kaybı'
  ]
};

// Anahtar kelime -> belirti eşlemesi (TR + karışık EN kelimeler dahil)
const keywordSymptoms = [
  { k: ['tekleme', 'misfire', 'ateşleme', 'ignition', 'buji', 'coil', 'bobin'],
    s: ['Motorun teklemesi ve sarsıntılı (titreşimli) çalışması', 'Rölantide düzensizlik ve zor hızlanma'] },
  { k: ['şanzıman', 'transmission', 'tork konvertör', 'torque converter', 'vites', 'gear', 'debriyaj', 'clutch'],
    s: ['Vites geçişlerinde sertlik, darbe veya gecikme', 'Şanzımanın acil durum (limp / arıza) moduna geçmesi'] },
  { k: ['soğutma', 'coolant', 'sıcaklık', 'temperature', 'thermostat', 'termostat', 'aşırı ısınma', 'overheat'],
    s: ['Motor çalışma sıcaklığının anormal seyretmesi', 'Soğutma fanının sürekli çalışması veya hiç devreye girmemesi'] },
  { k: ['enjektör', 'injector', 'yakıt', 'fuel', 'karışım', 'mixture', 'fakir', 'zengin', 'lean', 'rich', 'pompa', 'pump'],
    s: ['Zor çalışma, stop etme veya rölanti düzensizliği', 'Yakıt tüketiminde belirgin artış'] },
  { k: ['egr', 'emisyon', 'emission', 'katalitik', 'catalyst', 'katalizör', 'evap', 'buharlaşma', 'purge', 'egzoz', 'exhaust'],
    s: ['Egzoz emisyon değerlerinin yükselmesi (egzoz muayenesinde kalma)', 'Egzozdan anormal koku, duman veya performans kaybı'] },
  { k: ['turbo', 'boost', 'şarj basınc', 'turbocharger', 'wastegate', 'aşırı doldur'],
    s: ['Turbo basıncında düşüş ve gözle görülür güç kaybı', 'Hızlanmada tepki gecikmesi'] },
  { k: ['direksiyon', 'steering', 'hidrolik direksiyon', 'power steering'],
    s: ['Direksiyonun ağırlaşması veya hassasiyet kaybı', 'Direksiyon (EPS) uyarı lambasının yanması'] },
  { k: ['abs', 'fren', 'brake', 'çekiş', 'traction', 'esp', 'stability', 'denge', 'tekerlek hız', 'wheel speed'],
    s: ['ABS/ESP ve çekiş kontrol sistemlerinin devre dışı kalması', 'Ani frenlemede tekerlek kilitlenme riski ve kayma'] },
  { k: ['airbag', 'hava yastığı', 'srs', 'kemer', 'gergi', 'pretensioner', 'çarpışma', 'crash'],
    s: ['SRS / Hava Yastığı uyarı lambasının sürekli yanması', 'Olası bir kazada hava yastığı veya kemer gergisinin çalışmama riski'] },
  { k: ['oksijen', 'lambda', 'oxygen', 'hego', 'o2 ', 'o2s', 'sonda'],
    s: ['Rölanti düzensizliği ve yakıt tüketiminde artış', 'Emisyon değerlerinin yükselmesi'] },
  { k: ['krank', 'crankshaft', 'eksantrik', 'camshaft', 'cmp', 'ckp', 'devir', 'rpm', 'hız sensör', 'speed sensor', 'turbine', 'turbin'],
    s: ['Motorun düzensiz çalışması, zor çalışması veya stop etmesi', 'Gösterge (devir/hız) değerlerinde hata veya tutarsızlık'] },
  { k: ['klima', 'a/c', 'a-c', 'hvac', 'ısıtma', 'kalorifer', 'blower', 'üfleme', 'fan '],
    s: ['Klima veya kalorifer sisteminin düzgün çalışmaması', 'Kabin sıcaklık / üfleme ayarının tutmaması'] },
  { k: ['aydınlatma', 'lamba', 'lamp', 'far', 'headlight', 'sinyal', 'light', 'stop lambası'],
    s: ['İlgili aydınlatma biriminin çalışmaması veya kesik yanması', 'Gösterge panelinde ilgili aydınlatma uyarısı'] },
  { k: ['can bus', 'iletişim', 'communication', 'network', 'haberleşme', 'veri yolu', 'lost communication', 'bus off', 'modül'],
    s: ['Modüller arası veri iletişiminin kesilmesi', 'Birbirinden bağımsız birden fazla sistemin aynı anda arıza vermesi'] },
  { k: ['akü', 'battery', 'gerilim', 'voltage', 'voltaj', 'charging', 'şarj sistem', 'alternatör', 'alternator'],
    s: ['Akü şarj / gerilim uyarısı ve elektrikli sistemlerde kararsızlık', 'Aracın zor çalışması veya elektronik arızalar'] },
  { k: ['gaz kelebeği', 'throttle', 'gaz pedalı', 'pedal', 'accelerator', 'kelebek'],
    s: ['Gaz tepkisinde gecikme, boğulma veya ani devir değişimi', 'Rölanti devrinin düzensizleşmesi ve güç kaybı'] },
  { k: ['immobiliz', 'immobilizer', 'anahtar', 'key', 'kontak', 'kilit', 'güvenlik sistemi'],
    s: ['Aracın çalışmaması veya çalışıp hemen stop etmesi', 'İmmobilizer / kontak uyarısının yanması'] },
  { k: ['hibrit', 'hybrid', 'elektrik motor', 'ev ', 'yüksek gerilim', 'high voltage', 'inverter', 'invertör'],
    s: ['Hibrit/elektrikli tahrik sisteminin güç sınırlamasına geçmesi', 'Aracın elektrikli modda çalışamaması ve uyarı lambaları'] }
];

// Elektriksel devre arızaları için ek genel belirti
const electricalKeywords = ['devre', 'circuit', 'açık', 'open', 'kısa devre', 'short', 'voltaj', 'voltage', 'sinyal', 'signal', 'electrical', 'range', 'performans', 'düşük', 'yüksek', 'low', 'high'];
const electricalSymptom = 'İlgili sensör/aktüatör sinyalinin kesilmesi ve sistemin varsayılan (güvenli) değerle çalışması';

function generateSymptoms(code) {
  const name = lc(code.name);
  const desc = lc(code.description);
  const text = name + ' ' + desc;
  const cat = (code.code || 'P')[0].toUpperCase();

  const result = [];
  const seen = new Set();
  const push = (arr) => {
    for (const s of arr) {
      if (!seen.has(s)) { seen.add(s); result.push(s); }
    }
  };

  // 1) Anahtar kelime eşleşmeleri (en isabetli olanlar önce)
  for (const entry of keywordSymptoms) {
    if (entry.k.some(kw => text.includes(kw))) {
      push(entry.s);
    }
    if (result.length >= 4) break;
  }

  // 2) Elektriksel devre arızası ise ek belirti
  if (result.length < 4 && electricalKeywords.some(kw => text.includes(kw))) {
    push([electricalSymptom]);
  }

  // 3) Kategori temel belirtileriyle tamamla
  push(baseByCategory[cat] || baseByCategory.P);

  return result.slice(0, 4);
}

let enriched = 0;
for (const code of data) {
  if (!code.symptoms || !Array.isArray(code.symptoms) || code.symptoms.length === 0) {
    const syms = generateSymptoms(code);
    if (syms.length) {
      code.symptoms = syms;
      enriched++;
    }
  }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
console.log('Enriched codes with symptoms:', enriched);
console.log('Total codes:', data.length);
const stillMissing = data.filter(c => !c.symptoms || !c.symptoms.length).length;
console.log('Still missing symptoms:', stillMissing);
