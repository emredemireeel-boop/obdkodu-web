const fs = require('fs');
const path = require('path');

const newCodes = [
  {
    "code": "P2503",
    "name": "Şarj Sistemi Voltajı Düşük",
    "description": "Alternatörden gelen şarj voltajının sistemin ihtiyacını karşılayamayacak kadar düşük olduğunu belirtir. Akü şarj olmuyor olabilir.",
    "severity": "yüksek",
    "affectedSystem": "Şarj ve Elektrik Sistemi",
    "symptoms": ["Akü uyarı lambasının yanması", "Farların kısık yanması", "Araçta elektronik sistemlerin kapanması", "Marş basmama veya zor çalışma"],
    "causes": ["Arızalı alternatör (şarj dinamosu)", "Gevşek veya kopuk alternatör kayışı", "Ömrünü yitirmiş akü", "Şarj kablosunda korozyon veya oksitlenme"],
    "solutions": ["Alternatör kayışının gerginliğini ve fiziksel durumunu kontrol edin.", "Multimetre ile motor çalışırken alternatör voltajını ölçün (13.5V - 14.5V olmalı).", "Akü kutup başlarını temizleyip sıkıca bağlayın.", "Arızalıysa alternatör kömürlerini veya diyot tablasını değiştirin."]
  },
  {
    "code": "C1093",
    "name": "Lastik Basınç Sensörü Sinyali Alınamıyor",
    "description": "TPMS (Lastik Basınç İzleme Sistemi) modülünün bir veya daha fazla tekerlek sensöründen sinyal alamadığını gösterir.",
    "severity": "orta",
    "affectedSystem": "Lastik Basınç Sistemi (TPMS)",
    "symptoms": ["TPMS uyarı lambasının yanıp sönmesi ve sonra sabit yanması", "Göstergede lastik basınçlarının tire (-) olarak görünmesi"],
    "causes": ["TPMS sensörünün pilinin bitmesi", "Sensörün fiziksel hasar görmesi (lastik sökümü sırasında vb.)", "TPMS alıcı anteninde veya modülünde arıza", "Sonradan takılan jantlarda sensör olmaması"],
    "solutions": ["TPMS sensör kalibrasyon cihazı ile her tekerlekteki sensörlerin sinyal yayıp yaymadığını kontrol edin.", "Pili biten veya bozulan sensörü yenisi ile değiştirin.", "Yeni sensör takıldıysa OBD cihazı ile araca tanıtma (kodlama) işlemini yapın.", "Lastik basınçlarını kontrol edip sistemi sıfırlayın."]
  },
  {
    "code": "C1094",
    "name": "Lastik Basıncı Düşük Uyarı Eşiği",
    "description": "Bir veya birden fazla lastiğin basıncının, üreticinin belirlediği minimum güvenli sınırın altına düştüğünü bildirir.",
    "severity": "orta",
    "affectedSystem": "Lastik Basınç Sistemi (TPMS)",
    "symptoms": ["TPMS uyarı ışığının sabit yanması", "Sürüş sırasında aracın bir tarafa çekmesi", "Yol tutuşunda zayıflama"],
    "causes": ["Lastiklerden birine çivi veya yabancı madde batması", "Jant kenarından veya supaptan hava kaçağı", "Sıcaklık değişimlerine bağlı doğal basınç düşüşü"],
    "solutions": ["Araçtaki tüm lastiklerin basınçlarını bir manometre ile ölçün.", "Eksik olan lastiğe fabrika değerlerine (kapı içinde yazar) uygun şekilde hava basın.", "Lastikte patlak varsa tamir ettirin.", "Hava basıldıktan sonra araçtaki TPMS sıfırlama (reset) tuşuna veya menüsüne basarak sistemi güncelleyin."]
  },
  {
    "code": "C2126",
    "name": "Lastik Basıncı Monitörü Sensör İletişim Hatası",
    "description": "TPMS ana modülünün tekerleklerdeki sensörlerden veri alırken iletişim kesintisi yaşadığını gösterir.",
    "severity": "orta",
    "affectedSystem": "Lastik Basınç Sistemi (TPMS)",
    "symptoms": ["TPMS lambasının hata uyarısı vermesi", "Ekrandaki basınç verilerinin aralıklı olarak kaybolup geri gelmesi"],
    "causes": ["Araç içi kablolama arızası", "Alıcı anten modülünün hasar görmesi", "Sensör frekansını engelleyen harici elektronik parazit (örneğin ucuz şarj aletleri)"],
    "solutions": ["TPMS modülüne giden kablo tesisatını ve soketleri kontrol edin.", "Araçta sonradan takılmış elektronik cihazları (kamera, şarj cihazı) çıkarıp hatanın devam edip etmediğini gözlemleyin.", "Gerekirse TPMS modülünü yazılımsal olarak güncelleyin veya yenileyin."]
  },
  {
    "code": "P2452",
    "name": "Dizel Partikül Filtresi (DPF) Basınç Sensörü 'A' Devresi",
    "description": "Motor kontrol ünitesinin, dizel partikül filtresinin doluluk oranını ölçen diferansiyel basınç sensöründen anormal veya mantıksız bir voltaj sinyali aldığını belirtir.",
    "severity": "orta",
    "affectedSystem": "Egzoz Emisyon / DPF Sistemi",
    "symptoms": ["Motor arıza ve DPF lambasının yanması", "Motorun kendini korumaya alması (Limp Mode) ve çekişten düşmesi", "Rejenerasyon işleminin başlamaması"],
    "causes": ["DPF basınç sensörünün kendisinin arızalanması", "Sensöre giden hortumların yırtılması, erimesi veya tıkanması", "Sensörün kablo tesisatında kısa devre veya kopukluk", "DPF'nin aşırı kurum ile tamamen tıkanması"],
    "solutions": ["DPF basınç sensörüne giden kauçuk/metal hortumları çatlak ve tıkanıklık açısından gözle muayene edin.", "Hasarlı hortumları yüksek ısıya dayanıklı yenileriyle değiştirin.", "Hortumlar sağlamsa basınç sensörünü değiştirin ve diagnostik cihazı ile adaptasyon yapın.", "Sorun çözüldükten sonra aracı uzun yolda devirli kullanarak rejenerasyon işlemini başlatın."]
  },
  {
    "code": "C1000",
    "name": "Elektronik Park Freni Modülü İç Hata",
    "description": "Elektronik Park Freni (EPB) kontrol modülünün kendi içinde bir donanım veya yazılım hatası algıladığını gösterir.",
    "severity": "yüksek",
    "affectedSystem": "Fren Sistemi / EPB",
    "symptoms": ["El freni uyarı lambasının kırmızı veya sarı yanıp sönmesi", "El freninin çekilememesi veya indirilememesi (sıkışması)", "Göstergede 'Park Freni Arızası' uyarısı"],
    "causes": ["EPB modülünde elektriksel kısa devre veya yanma", "Modül yazılımında çökme", "Arka kaliper motorlarının aşırı akım çekerek modülü bozması", "Düşük akü voltajı"],
    "solutions": ["Akü voltajını kontrol edin; düşük akü voltajı EPB hatalarının en yaygın nedenidir.", "Fren kaliper motorlarına giden kablo soketlerini oksitlenme ve kopukluk açısından inceleyin.", "Diagnostik cihazı ile EPB modülü hata kayıtlarını silip sistemi kalibre etmeye çalışın.", "Sorun devam ederse EPB kontrol modülünün tamiri veya değişimi gerekir."]
  },
  {
    "code": "P0671",
    "name": "Silindir 1 Kızdırma Bujisi Devresi Hatası",
    "description": "Motor kontrol ünitesinin (ECU), 1 numaralı silindire ait kızdırma (ısıtma) bujisi devresinde elektriksel bir sorun tespit ettiğini belirtir.",
    "severity": "orta",
    "affectedSystem": "Motor / Ateşleme (Dizel)",
    "symptoms": ["Kızdırma bujisi uyarı lambasının yanıp sönmesi veya sönmemesi", "Motor soğukken (özellikle kış aylarında) zor çalışma", "İlk çalıştırmada beyaz/gri duman atma", "Soğuk motorda sarsıntılı rölanti"],
    "causes": ["1 numaralı kızdırma bujisinin patlaması/yanması", "Bujiye giden kabloda veya pipoda kopukluk/temassızlık", "Kızdırma bujisi rölesi veya modülü arızası", "Sigorta atması"],
    "solutions": ["1 numaralı kızdırma bujisini sökerek bir multimetre ile direnç (ohm) ölçümü yapın (Genellikle 0.5 - 2 ohm arası olmalıdır).", "Direnç okunamıyorsa veya sonsuzsa buji patlaktır, yenisiyle değiştirin (Tavsiye edilen tüm bujilerin set halinde değişimidir).", "Buji sağlamsa, kontağı açıp bujiye giden kablodaki voltajı kontrol edin.", "Voltaj yoksa kızdırma rolesini veya ilgili sigortayı kontrol edin."]
  },
  {
    "code": "P0672",
    "name": "Silindir 2 Kızdırma Bujisi Devresi Hatası",
    "description": "Motor kontrol ünitesinin (ECU), 2 numaralı silindire ait kızdırma (ısıtma) bujisi devresinde hata algılamasıdır. P0671 ile aynı sebep ve çözümlere sahiptir.",
    "severity": "orta",
    "affectedSystem": "Motor / Ateşleme (Dizel)",
    "symptoms": ["Kızdırma bujisi uyarı lambasının yanıp sönmesi", "Soğuk havalarda motorun zor çalışması veya sarsıntılı çalışması", "İlk çalıştırmada artan egzoz emisyonu (beyaz duman)"],
    "causes": ["2 numaralı kızdırma bujisinin arızalanması", "Kablo tesisatında kopukluk", "Kızdırma bujisi kontrol modülü arızası"],
    "solutions": ["2 numaralı silindirdeki kızdırma bujisini test edin.", "Arızalıysa değiştirin. Kırılma riskine karşı sökerken motorun sıcak olması veya pas sökücü kullanılması tavsiye edilir.", "Kablo bağlantılarını ve modülü kontrol edin."]
  },
  {
    "code": "P0673",
    "name": "Silindir 3 Kızdırma Bujisi Devresi Hatası",
    "description": "3 numaralı silindirin kızdırma bujisinde veya devresinde hata olduğunu gösterir. Çözüm yolları diğer kızdırma bujisi hataları ile birebir aynıdır.",
    "severity": "orta",
    "affectedSystem": "Motor / Ateşleme (Dizel)",
    "symptoms": ["Soğuk marş zorlukları", "Kızdırma uyarı lambası sönmeme sorunu"],
    "causes": ["3 numaralı bujinin ömrünü tamamlaması", "Elektriksel tesisat sorunları"],
    "solutions": ["Multimetre ile bujinin omajını ölçün.", "Bujiyi değiştirin.", "Piponun tam oturduğundan ve kabloda oksitlenme olmadığından emin olun."]
  },
  {
    "code": "P0674",
    "name": "Silindir 4 Kızdırma Bujisi Devresi Hatası",
    "description": "4 numaralı silindirin kızdırma bujisinde hata tespit edildiğini gösterir. (Sıralı 4 silindirli dizel motorlar için).",
    "severity": "orta",
    "affectedSystem": "Motor / Ateşleme (Dizel)",
    "symptoms": ["Soğuk marş zorlukları", "Kızdırma uyarı lambası hatası"],
    "causes": ["4 numaralı bujinin bozulması", "Kablolama veya modül hatası"],
    "solutions": ["4 numaralı bujiyi test edip değiştirin.", "Eğer 4 buji de aynı anda hata veriyorsa, sorunun kızdırma rölesi veya ana modülde olduğunu unutmayın."]
  },
  {
    "code": "C0176",
    "name": "Direksiyon Açı Sensörü Devresi Hatası",
    "description": "Elektrikli veya hidrolik direksiyon destek sisteminde (EPS) direksiyon açı sensörü ile iletişimin koptuğunu veya verilerin mantıksız olduğunu gösterir.",
    "severity": "yüksek",
    "affectedSystem": "Direksiyon ve ESP Sistemi",
    "symptoms": ["Direksiyon arıza lambasının (kırmızı veya sarı direksiyon simgesi) yanması", "ESP/Kayma önleyici sistem lambasının yanması", "Direksiyonun aniden çok sertleşmesi veya toparlamaması"],
    "causes": ["Direksiyon sargısının (clockspring) kopması", "Açı sensörünün kalibrasyonunu kaybetmesi (Örn: Rot ayarı sonrası veya akü değişimi sonrası)", "Sensörde donanımsal arıza"],
    "solutions": ["Aracın rot ayarının düzgün yapıldığından ve direksiyonun tam merkezde olduğundan emin olun.", "OBD diagnostik cihazı ile 'Direksiyon Açı Sensörü Sıfırlama (Kalibrasyon)' işlemini yapın.", "Sorun devam ediyorsa veya direksiyon çevrildiğinde sürtünme sesi geliyorsa direksiyon sargısını/sensörünü değiştirin."]
  },
  {
    "code": "C0544",
    "name": "Direksiyon Açı Sensörü Sinyali Hatalı",
    "description": "Direksiyon açı sensöründen alınan sinyalin, tekerlek hız sensörlerinden alınan verilerle uyuşmadığını gösterir. Sistem aracın hangi yöne gittiğini belirleyemez.",
    "severity": "orta",
    "affectedSystem": "Direksiyon ve ESP Sistemi",
    "symptoms": ["ESP ve ABS lambalarının yanması", "Viraj aydınlatma sisteminin çalışmaması", "Şerit takip sisteminin devre dışı kalması"],
    "causes": ["Hatalı rot ayarı nedeniyle direksiyonun yamuk durması", "Sensör kalibrasyon eksikliği", "Kir, toz veya donanım arızası nedeniyle hatalı okuma"],
    "solutions": ["Ön düzen kontrolü ve düzgün bir rot ayarı yaptırın.", "Bilgisayarlı cihazla sensör kalibrasyonu gerçekleştirin.", "Sensör bağlantılarını ve veri yolunu kontrol edin."]
  },
  {
    "code": "C1089",
    "name": "EPS (Elektrikli Direksiyon) Motor Hızı Sensörü Hatası",
    "description": "Elektrikli hidrolik direksiyon (EPS) motorunun dönüş hızını ölçen sensörde arıza olduğunu bildirir. EPS sistemi direksiyona gereken desteği sağlayamaz.",
    "severity": "yüksek",
    "affectedSystem": "Direksiyon Sistemi (EPS)",
    "symptoms": ["Direksiyonun ağırlaşması", "Manevra yaparken direksiyonun kesik kesik destek vermesi", "Kırmızı direksiyon ikaz lambası"],
    "causes": ["EPS motoru veya entegre sensörünün bozulması", "EPS kontrol ünitesine su girmesi veya oksitlenme", "Zayıf akü veya alternatör problemi"],
    "solutions": ["Akü ve şarj dinamosu voltajlarını ölçün; EPS sistemi yüksek akım çeker ve voltaj düşünce ilk kapanan sistemdir.", "EPS modülü soketlerinde korozyon temizliği yapın.", "Sorun donanımsalsa EPS kolonunun veya motorunun onarımı/değişimi gerekir."]
  },
  {
    "code": "C0267",
    "name": "Düşük Fren Hidrolik Seviyesi Uyarısı",
    "description": "Fren hidroliği (yağı) rezervuarındaki seviye sensörü, sıvının güvenli sınırın altına düştüğünü algılamıştır.",
    "severity": "yüksek",
    "affectedSystem": "Fren Sistemi",
    "symptoms": ["Kırmızı ünlem veya fren (Brake) lambasının sürekli yanması", "Fren pedalında yumuşama veya boşa gitme hissi", "Fren mesafesinin uzaması"],
    "causes": ["Fren balatalarının tamamen bitmesi sonucu hidrolik seviyesinin düşmesi", "Fren hortumlarında, kaliperlerde veya ana merkezde hidrolik kaçağı", "Seviye sensörünün veya şamandırasının arızalanması"],
    "solutions": ["Fren hidrolik kutusunun seviyesini gözle kontrol edin; eksikse DOT standardına uygun yağ ekleyin.", "Ancak yağ durduk yere eksilmez, bu nedenle DİKKAT! Aracı lifte alıp tüm tekerleklerdeki fren hortumlarını ve merkezleri kaçaklara karşı inceleyin.", "Fren balatalarını kontrol edin; tamamen aşındıysa değiştirin."]
  },
  {
    "code": "U0167",
    "name": "İmmobilizer Kontrol Modülü İle İletişim Kesildi",
    "description": "Aracın güvenlik (İmmobilizer) modülü ile ana bilgisayar (ECU veya BCM) arasındaki CAN-BUS veri iletişiminin kesildiğini bildirir.",
    "severity": "yüksek",
    "affectedSystem": "Güvenlik / İletişim Ağı",
    "symptoms": ["Aracın marş basmaması veya çalışıp hemen stop etmesi", "Göstergede anahtar/kilit (İmmobilizer) lambasının yanıp sönmesi", "Araç kapılarının kumanda ile kilitlenememesi"],
    "causes": ["Anahtarın çipinin hasar görmesi veya hafızasını yitirmesi", "Kontak çevresindeki okuyucu anten (halka) arızası", "İmmobilizer modülüne giden kablolarda kopukluk", "Akü voltajının aniden çökmesi (kısa devre)"],
    "solutions": ["Yedek anahtarınız varsa araçla yedek anahtarı deneyerek sorunun anahtarda mı yoksa araçta mı olduğunu tespit edin.", "Akü voltajını kontrol edin ve kutup başlarını sıkın.", "Kontak okuyucu anten soketini kontrol edin.", "Yetkili serviste veya anahtarcıda anahtarların araca yeniden kodlanmasını sağlayın."]
  },
  {
    "code": "P203F",
    "name": "Redüktant (AdBlue) Seviyesi Çok Düşük",
    "description": "Dizel egzoz sıvısı (AdBlue / DEF) seviyesinin kritik seviyeye indiğini bildirir. Belli bir kilometre sonra aracın motoru çalışmayı reddeder.",
    "severity": "yüksek",
    "affectedSystem": "Egzoz Emisyon / AdBlue",
    "symptoms": ["Göstergede 'Motor XXX km sonra çalışmayacak' uyarısı", "AdBlue ikaz lambasının yanması"],
    "causes": ["AdBlue tankındaki sıvının gerçekten bitmesi", "Seviye sensörünün (genellikle tankın içindedir) takılı kalması veya bozulması"],
    "solutions": ["Araca derhal kaliteli ve standartlara uygun (ISO 22241) AdBlue sıvısı ekleyin.", "Sıvı eklenmesine rağmen lamba sönmüyorsa, sensör şamandırası kristalleşme nedeniyle takılmış olabilir; sistemi uygun katkılarla veya temizleyici ile temizleyin.", "Sorun çözülmezse AdBlue tankı/pompa ünitesi değişimi gerekebilir."]
  },
  {
    "code": "P204F",
    "name": "Redüktant (AdBlue) Sistemi Performansı Bank 1",
    "description": "AdBlue enjeksiyon sisteminin NOx emisyonlarını yeterince düşüremediğini belirtir. Sistem görevini yerine getirememektedir.",
    "severity": "orta",
    "affectedSystem": "Egzoz Emisyon / AdBlue",
    "symptoms": ["AdBlue uyarı lambası", "Motor arıza lambası", "Egzozda beyaz kristalleşme birikintileri"],
    "causes": ["Kalitesiz, sulandırılmış veya tarihi geçmiş AdBlue kullanımı", "AdBlue enjektörünün kurum veya kristalleşme ile tıkanması", "NOx sensörü arızası", "Katalizör arızası"],
    "solutions": ["Kötü kalitedeki AdBlue sıvısını tamamen boşaltıp sistemi yıkayın ve yeni sıvı koyun.", "AdBlue enjektörünü (dozaj valfini) sökerek sıcak su ile kristalleşmeleri temizleyin.", "NOx sensörü okumalarını diagnostik ile kontrol edip arızalıysa değiştirin."]
  },
  {
    "code": "P218F",
    "name": "Redüktant (AdBlue) Akışı Çok Düşük",
    "description": "AdBlue pompasının veya enjektörünün egzoza yeterli miktarda sıvı basamadığını gösterir.",
    "severity": "orta",
    "affectedSystem": "Egzoz Emisyon / AdBlue",
    "symptoms": ["AdBlue sistemi arıza uyarısı", "Performans kısıtlaması"],
    "causes": ["AdBlue pompasının bozulması", "Hatların veya enjektörün tıkanması", "Hatta kaçak olması"],
    "solutions": ["AdBlue enjektör hattındaki basıncı kontrol edin.", "Enjektörü ve boruları söküp tıkanıklıkları (kristalleşmeleri) sıcak su veya özel çözücülerle temizleyin.", "Pompa arızalıysa değiştirin."]
  },
  {
    "code": "C0711",
    "name": "Havalı Süspansiyon Seviye Sensörü Hatalı Sinyal",
    "description": "Aracın şasisinin yere olan yüksekliğini ölçen seviye sensöründen dengesiz veya ulaşılamaz veriler geldiğini belirtir.",
    "severity": "orta",
    "affectedSystem": "Havalı Süspansiyon Sistemi",
    "symptoms": ["Sarı veya kırmızı süspansiyon arıza lambası", "Aracın bir köşesinin veya tamamının yere çökmesi", "Far yükseklik ayarının çalışmaması"],
    "causes": ["Seviye sensörünün çubuğunun (rotilinin) kırılması veya yerinden çıkması", "Sensöre su girmesi", "Kablo kopukluğu"],
    "solutions": ["Aracın altına girerek ilgili tekerlekteki yükseklik sensörünün mekanik kolunu kontrol edin.", "Kırık veya çıkmışsa onarın/değiştirin.", "Sensör içi su almışsa yenisi ile değiştirip kalibrasyon yapın."]
  },
  {
    "code": "C1991",
    "name": "Süspansiyon Modülü İç Arızası",
    "description": "Havalı süspansiyon sistemini yöneten ana beyinde (modülde) donanımsal veya yazılımsal bir iç hata oluştuğunu gösterir.",
    "severity": "yüksek",
    "affectedSystem": "Havalı Süspansiyon Sistemi",
    "symptoms": ["Tüm süspansiyon sisteminin devre dışı kalması", "Süspansiyon ayarlarının (Sport/Comfort) seçilememesi"],
    "causes": ["Süspansiyon modülüne su girmesi (Genellikle bagaj zemininde veya koltuk altındadır)", "Aşırı voltaj", "Kısa devre"],
    "solutions": ["Modülü bulup soketlerinde oksitlenme veya su izi olup olmadığına bakın.", "Temizleyip kurutun. Çalışmazsa modülün yazılımının güncellenmesi veya parçanın değiştirilmesi gerekir."]
  },
  {
    "code": "C2774",
    "name": "Süspansiyon Yükseklik Sensörü Hatası",
    "description": "Yükseklik sensörünün belirlenen sınırlar dışında bir voltaj (çok yüksek veya çok düşük) ürettiğini gösterir.",
    "severity": "orta",
    "affectedSystem": "Havalı Süspansiyon Sistemi",
    "symptoms": ["Göstergede süspansiyon arıza uyarısı", "Araç yüksekliğinin ayarlanamaması"],
    "causes": ["Sensör arızası", "Tesisat kısa devresi"],
    "solutions": ["Sensör tesisatını ölçerek 5V referans voltajının geldiğinden emin olun.", "Sensör değiştirildiğinde OBD üzerinden yüksekliğin yeniden tanıtılması (adaptasyon) şarttır."]
  },
  {
    "code": "C0689",
    "name": "Süspansiyon Pnömatik Kompresör Arızası",
    "description": "Havalı süspansiyon sistemine hava basan kompresörün istenen basınca ulaşamadığını veya aşırı ısındığını gösterir.",
    "severity": "yüksek",
    "affectedSystem": "Havalı Süspansiyon Sistemi",
    "symptoms": ["Süspansiyon lambasının yanması", "Aracın yere oturması ve kompresör sesinin hiç duyulmaması veya sürekli (hiç durmadan) çalışması"],
    "causes": ["Hava körüklerinde veya valf bloğunda oluşan büyük bir kaçak yüzünden kompresörün sürekli çalışıp yanması", "Kompresör rölesinin yapışık kalması", "Kompresör içindeki piston sekmanının aşınması"],
    "solutions": ["Sistemi sabunlu su ile kontrol ederek hava kaçaklarını (körük patlağı vb.) bulun ve onarın.", "Kompresör rölesini değiştirin (Bozulan kompresörlerin %90 nedeni yapışan röledir).", "Kompresör yeterli basınç üretemiyorsa tamir takımı (yeni sekman/silindir) uygulayın veya kompresörü değiştirin."]
  },
  {
    "code": "C1A16",
    "name": "Radar Sensörü Görüşü Engellendi (Cruise Control)",
    "description": "Adaptif Hız Sabitleyici (ACC) veya Çarpışma Önleme sistemine ait ön radar veya kamera sensörünün yolunu göremediğini bildirir.",
    "severity": "düşük",
    "affectedSystem": "Hız Sabitleyici / Radar",
    "symptoms": ["Hız sabitleyici lambasının hata vermesi", "Ekranda 'ACC Kullanılamıyor - Sensör Görüşü Yok' uyarısı"],
    "causes": ["Radar sensörünün önünün çamur, yoğun kar veya buzla kaplanması", "Sensör ayağının çarpma sonucu eğilmesi", "Ön cam kamerasının buğulanması"],
    "solutions": ["Ön panjurdaki veya logodaki radar sensörünün üzerini nemli bir bezle temizleyin.", "Kış aylarında kar birikintisini temizleyin.", "Eğer önden ufak bir kaza yapıldıysa radarın hizası (kalibrasyonu) bozulmuş olabilir, yetkili serviste kalibre ettirin."]
  }
];

const obdDataPath = path.join(__dirname, '../data/obd-codes.json');
const obdData = JSON.parse(fs.readFileSync(obdDataPath, 'utf-8'));

const existingCodes = new Set(obdData.map(c => c.code.toUpperCase()));
let addedCount = 0;

newCodes.forEach(codeObj => {
  if (!existingCodes.has(codeObj.code.toUpperCase())) {
    obdData.push(codeObj);
    addedCount++;
  }
});

fs.writeFileSync(obdDataPath, JSON.stringify(obdData, null, 2));
console.log(`${addedCount} yeni arıza kodu eklendi!`);
