const fs = require('fs');
const path = require('path');

const rawPath = path.join(__dirname, 'raw.json');
const dbPath = path.join(__dirname, '../data/obd-codes.json');

const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
let existingCodes = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Hızlı arama için mevcut kodları belleğe al
const existingMap = new Set(existingCodes.map(c => c.code.toUpperCase()));

// İngilizce - Türkçe Teknik Otomotiv Sözlüğü
const dict = {
  "Circuit": "Devresi",
  "Malfunction": "Arızası",
  "Range/Performance": "Aralık/Performans Sorunu",
  "Low": "Düşük Voltaj/Sinyal",
  "High": "Yüksek Voltaj/Sinyal",
  "Intermittent": "Aralıklı (Geçici) Sinyal",
  "Sensor": "Sensörü",
  "Mass or Volume Air Flow": "Kütle veya Hacim Hava Akış (MAF)",
  "Intake": "Emme",
  "Exhaust": "Egzoz",
  "Cylinder": "Silindir",
  "Misfire": "Tekleme",
  "Detected": "Tespit Edildi",
  "System": "Sistemi",
  "Too Lean": "Çok Fakir (Zayıf)",
  "Too Rich": "Çok Zengin",
  "Bank 1": "Bank 1",
  "Bank 2": "Bank 2",
  "Heater": "Isıtıcı",
  "Control": "Kontrol",
  "Valve": "Valfi",
  "Position": "Konum",
  "Temperature": "Sıcaklık",
  "Pressure": "Basınç",
  "Evaporative Emission": "Buharlaşma Emisyon (EVAP)",
  "Catalyst": "Katalizör",
  "Efficiency": "Verimliliği",
  "Below Threshold": "Eşik Değerinin Altında",
  "O2": "Oksijen",
  "Oxygen": "Oksijen",
  "Throttle": "Gaz Kelebeği",
  "Pedal": "Pedal",
  "Switch": "Şalteri/Anahtarı",
  "Relay": "Rölesi",
  "Injector": "Enjektör",
  "Ignition": "Ateşleme",
  "Coil": "Bobini",
  "Primary": "Birincil",
  "Secondary": "İkincil",
  "Camshaft": "Eksantrik Mili",
  "Crankshaft": "Krank Mili",
  "Speed": "Hız",
  "Vehicle": "Araç",
  "Transmission": "Şanzıman",
  "Gear": "Vites",
  "Clutch": "Kavrama",
  "Torque Converter": "Tork Konvertörü",
  "Fluid": "Sıvısı",
  "Level": "Seviyesi",
  "Signal": "Sinyali",
  "Motor": "Motor",
  "Pump": "Pompası",
  "Fan": "Fanı"
};

function translateDesc(desc) {
  let tr = desc;
  for (const [eng, tur] of Object.entries(dict)) {
    const regex = new RegExp(`\\b${eng}\\b`, 'gi');
    tr = tr.replace(regex, tur);
  }
  return tr;
}

// Kelimelere Göre Otomatik Uzman Çözüm Üretici
function enrich(desc, code) {
  let causes = [];
  let solutions = [];
  let affectedSystem = "Motor Kontrol Sistemi (Genel)";

  const d = desc.toLowerCase();

  if (d.includes('sensor') || d.includes('sensörü')) {
    causes.push("İlgili sensörde arıza veya kirlenme");
    causes.push("Sensör soketinde oksitlenme, su alma veya gevşeklik");
    solutions.push("Sensörün soketini çıkarıp kontak spreyi ile temizleyin.");
    solutions.push("Multimetre ile sensör direncini ölçüp fabrika değerleriyle karşılaştırın.");
  }
  if (d.includes('circuit') || d.includes('devresi') || d.includes('voltage')) {
    causes.push("Kablo tesisatında kopukluk, izolasyon erimesi veya kısa devre");
    solutions.push("Kablo demetini fiziksel olarak inceleyin ve yanık kablo arayın.");
  }
  if (d.includes('misfire') || d.includes('tekleme') || d.includes('cylinder')) {
    causes.push("Buji, buji kablosu veya ateşleme bobini arızası");
    causes.push("Yakıt enjektörü tıkanıklığı veya düşük kompresyon");
    solutions.push("Bujileri söküp durumunu (yağlanma/kararma) kontrol edin.");
    affectedSystem = "Ateşleme ve Yakıt Sistemi";
  }
  if (d.includes('evap')) {
    causes.push("Yakıt depo kapağının gevşek olması veya contasının yırtılması");
    causes.push("Kanister veya tahliye (purge) valfinde vakum kaçağı");
    solutions.push("Öncelikle benzin depo kapağını tam sıktığınızdan emin olun.");
    affectedSystem = "Buharlaşma (EVAP) Sistemi";
  }
  if (code.startsWith('P07') || code.startsWith('P08')) {
    affectedSystem = "Otomatik Şanzıman Sistemi";
    causes.push("Eski, yanmış veya seviyesi düşmüş şanzıman yağı");
    causes.push("Şanzıman beyin (TCM) selenoid arızası");
    solutions.push("Şanzıman yağ seviyesini ve rengini kontrol edin, koyuysa yağı yenileyin.");
  }
  if (code.startsWith('U')) {
    affectedSystem = "Ağ ve İletişim (CAN Bus)";
    causes.push("Elektronik modüller arası veri kablosunda kopukluk");
    causes.push("Zayıf akü voltajı veya şase bağlantısı paslanması");
    solutions.push("Akü kutup başlarını temizleyip sıkın. Şase noktalarını zımparalayın.");
  }

  // Varsayılan değerler
  if (causes.length === 0) causes = ["İlgili bileşenin mekanik arızası", "Elektronik kontrol ünitesi (ECU/PCM) iletişim hatası"];
  if (solutions.length === 0) solutions = ["Kaliteli bir OBD-II cihazı ile canlı verileri (Live Data) izleyip parçanın tepkisini ölçün.", "Sorun devam ederse yetkili servise başvurun."];

  return { causes, solutions, affectedSystem };
}

let newAdditions = [];

// JSON verisi CSV'den dönüştürüldüğü için ilk satır Key olarak kalmış, onu da manuel ekleyelim
rawData.unshift({
  "P0100": "P0100",
  "Mass or Volume Air Flow Circuit Malfunction": "Mass or Volume Air Flow Circuit Malfunction"
});

rawData.forEach(item => {
  const code = item["P0100"]?.trim();
  const rawDesc = item["Mass or Volume Air Flow Circuit Malfunction"]?.trim();

  // Kod yoksa veya bizde zaten ekliyse atla (Çakışmaları önler)
  if (!code || !rawDesc || existingMap.has(code.toUpperCase())) {
    return;
  }

  const category = code.charAt(0).toUpperCase();
  const trDesc = translateDesc(rawDesc);
  const { causes, solutions, affectedSystem } = enrich(rawDesc, code);

  newAdditions.push({
    code: code.toUpperCase(),
    name: trDesc,
    description: `Araç beyni (ECU/PCM), sistemde "${trDesc}" arızası tespit etti. (İngilizce Orijinal Tanım: ${rawDesc}).`,
    affectedSystem,
    severity: "orta",
    category: category,
    causes,
    solutions
  });

  existingMap.add(code.toUpperCase());
});

existingCodes.push(...newAdditions);

fs.writeFileSync(dbPath, JSON.stringify(existingCodes, null, 2));

console.log(`BINGO! Başarıyla ${newAdditions.length} YENİ arıza kodu çevrildi ve zenginleştirildi!`);
console.log(`Veritabanındaki TOPLAM KOD SAYISI: ${existingCodes.length}`);
