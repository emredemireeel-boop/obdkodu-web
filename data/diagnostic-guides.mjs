// These guides answer distinct diagnostic tasks; BAR is used for technical context,
// not as a statement of Turkish inspection rules or model-specific repair advice.
export default [
  {
    slug: 'ford-p1000-kodu',
    title: 'Ford P1000 Kodu: OBD Hazırlık Testi Neden Tamamlanmadı?',
    description: 'Ford P1000, hazırlık monitörleri ve kod silme ilişkisi. Hangi bilgileri kaydetmeli, ne zaman başka arıza kodlarına bakmalı? Kaynaklı açıklama.',
    lead: 'Ford’un P1000 açıklaması, OBD izleme testlerinin tamamlanmadığını bildirir. Bu kayıt tek başına belirli bir parçanın bozulduğunu göstermez.',
    sections: [
      ['Hangi işlemlerden sonra görülebilir?', 'Ford servis kaynağı; akü veya motor kontrol ünitesi bağlantısının kesilmesini, kodların cihazla silinmesini ve izleme döngüsünün tamamlanmamasını olası bağlamlar arasında sayar. Son işlem geçmişini not edin.'],
      ['Tekrar silmek çözüm mü?', 'Kod silme işlemi testlerin tamamlandığını kanıtlamaz. Cihazdaki readiness ekranından hangi monitörün tamamlanmadığını ve eşlik eden kodları kaydedin. Tek başına P1000 kaydına dayanarak sensör veya kontrol ünitesi sipariş etmeyin.'],
      ['Kaç kilometrede kaybolur?', 'Her araca uygulanabilecek sabit kilometre sözü verilemez. Sürüş ve test koşulları araç sürümüne bağlıdır. Model yılına uygun üretici prosedürü kullanılmalı; güvenli sürüş koşulları zorlanmamalıdır.'],
      ['Kaynağın sınırı ve muayene', 'Bağlantıdaki belge 1999 Ford PCED servis dokümanıdır; tüm yeni Ford modellerinin prosedürü veya Türkiye muayene mevzuatı olarak uygulanamaz. Marka, yıl, motor, modül, tüm kodlar ve readiness ekranıyla birlikte araca uygun güncel servis kaynağını kontrol edin.']
    ],
    sourceUrl: 'https://www.fordservicecontent.dealerconnection.com/pubs/content/~WVX2/~MUS~LEN/15/VX25112.HTM',
    sourceText: 'Ford PCED (1999): P1000 ve OBD monitörlerinin tamamlanması',
    related: ['/rehber/obd-readiness-hazir-degil/', '/rehber/kalici-obd-kodu/', '/kodlari-birlikte-yorumla/']
  },
  {
    slug: 'obd-cihazi-kod-gostermiyor',
    title: 'OBD cihazı kod göstermiyorsa ne kontrol edilir?',
    description: 'Motor veya ABS uyarısı varken OBD cihazı kod bulamıyor mu? Bağlantı hatası, yanlış modül ve kod durumu arasındaki farkı güvenli sırayla ayırın.',
    lead: '“Kod yok” mesajı ile “araçla bağlantı kurulamıyor” mesajı aynı sorun değildir. Önce cihazın gerçekten hangi kontrol ünitesiyle konuştuğunu doğrulayın.',
    sections: [
      ['Önce ekrandaki sonucu ayır', 'Cihaz hiç bağlantı kuramıyorsa soket, besleme, kablo veya iletişim uyumu araştırılır. Bağlantı kurulup kod listesi boş görünüyorsa kayıtlı, bekleyen ve kalıcı kod ekranlarını ayrı ayrı kontrol edin. Yalnız motor modülünü tarayan basit bir okuyucu, ABS veya hava yastığı modülündeki kaydı göstermeyebilir.'],
      ['Bağlantı yoksa güvenli ilk kontroller', 'Kontak ve cihazın kendi yönergelerine göre bağlantıyı yeniden deneyin. OBD soketinde gözle görülen hasar veya gevşeklik olup olmadığına bakın. Akü gerilimi düşükse veya başka modüllerle de iletişim yoksa bu bulguyu not edin. Soket pinlerini rastgele kısa devre ederek deneme yapmayın; tesisat ve besleme ölçümünü servis şemasına göre yaptırın.'],
      ['Uyarı var, genel kod listesi boşsa', 'Gösterge mesajını ve lambanın tam adını fotoğraflayın. Motor arıza lambası ile ABS, SRS veya bakım uyarısı farklı sistemlere aittir. Cihazın ilgili modülü destekleyip desteklemediğini kontrol edin; gerekirse araca uygun, modül bazlı tarama yaptırın. Kodu bulmadan parça siparişi vermeyin.'],
      ['Sonucu nasıl kaydetmeli?', 'Marka, model, yıl, motor, cihaz adı, seçilen modül, bağlantı hatası metni ve tarama zamanı birlikte yazılmalıdır. Böylece cihaz sınırlaması ile gerçek araç arızasını ayırmak kolaylaşır. Güvenlik uyarısı veya sürüş davranışında değişiklik varsa uzman kontrolünü geciktirmeyin.']
    ],
    sourceUrl: 'https://bar.ca.gov/obd-test-reference',
    sourceText: 'California BAR: OBD iletişimi ve test referansı',
    related: ['/araclar/', '/rehber/eksik-obd-kodu/', '/sistemler/']
  },
  {
    slug: 'obd-readiness-hazir-degil',
    title: 'OBD readiness “hazır değil” ne demek?',
    description: 'OBD cihazında readiness veya monitor not ready görüyorsanız kod silme, akü sökme ve sürüş koşullarının izleyicilere etkisini öğrenin.',
    lead: 'Readiness, aracın emisyon izleyicilerinin kendi testlerini tamamlayıp tamamlamadığını gösterir. “Hazır değil” her zaman aynı arızayı veya aynı çözümü anlatmaz.',
    sections: [
      ['Readiness ile arıza kodunu ayır', 'Bir izleyicinin “not ready” olması, o testin henüz tamamlanmadığını gösterir. Bu durum tek başına belirli bir parçanın bozuk olduğunu kanıtlamaz. Motor arıza lambası, kayıtlı ve bekleyen kodlar ile izleyici durumunu birlikte okuyun.'],
      ['Neden tamamlanmamış olabilir?', 'Akünün sökülmesi veya kodların silinmesi bazı izleyicileri sıfırlayabilir. Test için gereken sıcaklık, hız, yük ve sürüş koşulları henüz oluşmamış olabilir. Ayrıca bir sistem arızası, ilgili izleyicinin tamamlanmasını engelleyebilir. Tek bir kilometre veya gün sayısı bütün araçlar için geçerli değildir.'],
      ['Güvenli ilerleme sırası', 'Önce kodları ve donma karesini kaydedin; aktif arıza varsa nedenini bulun. Sonra hangi izleyicinin hazır olmadığını ve aracın model yılını not edin. Üreticinin servis bilgisindeki sürüş koşullarını izleyin ve tekrar tarayın. İzleyici kalıcı olarak tamamlanmıyorsa yazılım veya sistem arızası olasılığını uzmanla değerlendirin.'],
      ['Muayene kurallarını karıştırmayın', 'Kaynakta verilen izinli “hazır değil” sayıları Kaliforniya emisyon testi içindir; Türkiye’deki araç muayenesi için kural olarak aktarılmaz. Buradaki amaç cihaz ekranındaki teknik durumun ne söylediğini anlamaktır.']
    ],
    sourceUrl: 'https://bar.ca.gov/obd-test-reference',
    sourceText: 'California BAR: readiness monitor açıklaması',
    related: ['/rehber/kalici-obd-kodu/', '/rehber/kod-okunduktan-sonra/', '/ariza-kodlari/']
  }
];
