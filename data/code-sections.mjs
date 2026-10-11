// Editorial groupings for the selected, reviewed DTC guides.
// Order matters: specific motor-management exceptions precede broad code families.
export default [
  {
    id: 'hava-yakit', title: 'Hava, yakıt ve motor tepkisi',
    intro: 'Hava akışı, basınç, sıcaklık, yakıt karışımı ve gaz pedalı verileri aynı çalışma koşulunda birlikte okunur. Kodun adı tek başına arızalı sensörü belirlemez.',
    match: code => /^(P00|P01|P02)/.test(code) || ['P0505','P2106','P2135','P2138','P2181'].includes(code)
  },
  {
    id: 'tekleme', title: 'Tekleme, krank ve ateşleme',
    intro: 'Tekleme ve devir konumu kayıtları birbirinin sonucu olabilir. Yanıp sönen motor lambası ve belirgin sarsıntı varsa aracı zorlamadan güvenli kontrol planı oluştur.',
    match: code => /^P03/.test(code)
  },
  {
    id: 'emisyon', title: 'EGR, katalizör, EVAP ve DPF',
    intro: 'Emisyon kodlarında başka bir motor sorunu ölçümü etkileyebilir. Kaçak, basınç ve sensör verisini doğrulamadan parça değişimine geçme.',
    match: code => /^(P04|P20|P24)/.test(code)
  },
  {
    id: 'sanziman', title: 'Araç hızı ve şanzıman',
    intro: 'Şanzıman arıza bildirimi çoğu zaman başka bir modüldeki ayrıntılı kodla birlikte gelir. Vites konumu, giriş/çıkış hızı ve eşlik eden kayıtları aynı anda oku.',
    match: code => /^P07/.test(code) || code === 'P0500'
  },
  {
    id: 'elektrik', title: 'Kızdırma, şarj ve hibrit sistem',
    intro: 'Elektrik beslemesi başka modüllerin kayıtlarını etkileyebilir. Hibrit yüksek voltaj devrelerinde kullanıcı müdahalesi yerine üretici güvenlik prosedürünü izle.',
    match: code => /^(P06|P0A|P25)/.test(code)
  },
  {
    id: 'govde', title: 'Gövde ve hava yastığı',
    intro: 'B kodları gövde sistemlerine aittir. Hava yastığı devresinde ölçüm ve onarım için araç üreticisinin güvenlik talimatları gerekir.',
    match: code => code.startsWith('B')
  },
  {
    id: 'sasi', title: 'Şasi, ABS ve direksiyon',
    intro: 'C kodlarında tekerlek hızı, fren ve direksiyon verileri birlikte önem taşır. Güvenlik uyarısı varsa sürüşü buna göre değerlendir.',
    match: code => code.startsWith('C')
  },
  {
    id: 'iletisim', title: 'Modüller arası iletişim',
    intro: 'U kodu, bir kontrol modülünün beklediği iletişimi göremediğini bildirir. Akü, besleme, ağ bağlantısı ve başka modüllerdeki kodlar birlikte kontrol edilir.',
    match: code => code.startsWith('U')
  }
];
