// These guides answer distinct diagnostic tasks; BAR is used for technical context,
// not as a statement of Turkish inspection rules or model-specific repair advice.
export default [
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
