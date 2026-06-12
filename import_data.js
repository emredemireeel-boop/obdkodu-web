const fs = require('fs');
const path = require('path');

const sourcePath = 'c:\\Users\\GAMER\\Desktop\\otoasfalt-web\\data\\obd-codes.json';
const targetPath = path.join(__dirname, 'data', 'obd-codes.json');

try {
  console.log('Veriler okunuyor...');
  const rawData = fs.readFileSync(sourcePath, 'utf-8');
  const codes = JSON.parse(rawData);
  
  console.log(`${codes.length} adet kod bulundu. Veriler dönüştürülüyor...`);
  
  const mappedCodes = codes.map(item => {
    // Ciddiyet seviyesini bizim formata uyarla (düşük, orta, yüksek)
    let sev = (item.severity || 'orta').toLowerCase().trim();
    if (sev === 'değişken') sev = 'orta';
    
    return {
      code: item.code,
      category: item.type || item.code.charAt(0),
      name: item.title || item.code,
      severity: sev,
      description: item.description || item.title || '',
      affectedSystem: Array.isArray(item.systems) ? item.systems.join(', ') : (item.systems || 'Genel Sistem'),
      symptoms: item.symptoms || [],
      causes: item.causes || [],
      solutions: item.fixes || []
    };
  });
  
  console.log('Veriler yeni formata çevrildi. Kaydediliyor...');
  fs.writeFileSync(targetPath, JSON.stringify(mappedCodes, null, 2), 'utf-8');
  console.log(`Başarılı! Toplam ${mappedCodes.length} adet arıza kodu projeye eklendi.`);
  
} catch (error) {
  console.error('Bir hata oluştu:', error);
}
