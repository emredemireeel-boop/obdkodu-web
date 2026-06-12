const fs = require('fs');
const path = require('path');

const advancedCodes = [
  {
    "code": "P0171",
    "name": "Sistem Çok Fakir - Bank 1",
    "description": "Birinci silindir sırasındaki (Bank 1) hava-yakıt karışımının, motorun telafi edemeyeceği kadar fazla hava veya yetersiz yakıt içerdiğini (stokiometrik 14.7:1 oranının bozulduğunu) gösterir. PCM, STFT ve LTFT değerlerini pozitif yönde %15-%20 artırarak silindirlere ekstra yakıt pompalamaya çalışır.",
    "causes": ["Emme manifoldu veya vakum hortumlarındaki çatlaklardan sisteme giren ölçülmemiş hava", "Kirlenmiş bir Kütle Hava Akış (MAF) sensörü", "Gerekli yakıt basıncını sağlayamayan arızalı yakıt pompası"],
    "symptoms": ["LTFT (Uzun Vadeli Yakıt Kesme) değerlerinde %15 üzerinde pozitif artış", "Performans ve çekiş düşüklüğü", "Dalgalı rölanti"],
    "solutions": ["Duman testi (smoke test) ile sistemdeki gizli vakum kaçaklarının görselleştirilmesi ve onarımı", "MAF sensörünün saniye başına gram (g/s) verilerinin anlık olarak izlenmesi ve sensörün temizlenmesi/değişimi", "Yakıt basınç testi yapılarak pompanın kontrolü"],
    "severity": "yüksek",
    "affectedSystem": "Yakıt ve Hava Karışımı"
  },
  {
    "code": "P0174",
    "name": "Sistem Çok Fakir - Bank 2",
    "description": "V6 veya V8 motor bloğu konfigürasyonlarında ikinci silindir sırasındaki (Bank 2) hava-yakıt karışımının aşırı fakir duruma düştüğünü belirtir. P0171 ile aynı operasyonel mantığı paylaşır. Her iki kodun aynı anda gelmesi, tüm motoru etkileyen merkezi bir arızayı gösterir.",
    "causes": ["Gaz kelebeği gövdesi öncesindeki ana emme körüğünde büyük bir yırtık", "Tüm enjektör hattını etkileyen düşük basınçlı merkezi yakıt pompası", "Vakum hortumu çatlakları"],
    "symptoms": ["Sistemde yüksek hava/düşük yakıt durumu", "Motor güç kaybı", "Rölantide dalgalanma"],
    "solutions": ["Ana emme körüğündeki yırtıkların kontrol edilmesi", "Merkezi yakıt pompası basınç testi", "Emme manifoldu duman testi"],
    "severity": "yüksek",
    "affectedSystem": "Yakıt ve Hava Karışımı"
  },
  {
    "code": "P2096",
    "name": "Katalizör Sonrası Yakıt Kesme Sistemi Çok Fakir - Bank 1",
    "description": "Motor kontrol modülünün, katalitik konvertör çıkışında yer alan arka oksijen sensöründen (downstream) aşırı fakir bir okuma aldığını belirtir. Sistem, sahte bir fakir okumasına dayanarak gereksiz yere yakıt enjekte edeceğinden motorun çalışma dinamiği bozulur.",
    "causes": ["Katalitik konvertör ile sensör arasındaki egzoz borularında mikro çatlaklar", "Oksitlenmiş veya yüksek dirence maruz kalmış sensör kablolaması", "Motor beyninin iç yazılımsal kalibrasyon hatası"],
    "symptoms": ["Motor boğulmaları", "Dalgalı rölanti", "Yakıt tüketiminde %15'e varan artışlar"],
    "solutions": ["Egzoz sızıntılarının tespiti ve onarımı", "O2 sensör voltaj salınımlarının kontrolü", "Sensör kablolama ve soket temizliği"],
    "severity": "orta",
    "affectedSystem": "Yakıt ve Hava Karışımı"
  },
  {
    "code": "P0101",
    "name": "Kütle veya Hacim Hava Akışı 'A' Devresi Menzil/Performans",
    "description": "MAF (Kütle Hava Akış) sensörünün ürettiği voltaj frekansının, motor devri ve gaz kelebeği açısına dayanan teorik hava emiş modeli ile uyuşmadığında kaydedilir. Doğrudan donanımsal bir okuma hatasıdır.",
    "causes": ["MAF sensör telinin kirlenmesi", "Açık hava filtrelerinden sızan yağ partiküllerinin ölçüm direncini değiştirmesi", "Korozyona uğramış soket bağlantıları"],
    "symptoms": ["Çekiş kaybı", "Güç düşüklüğü", "Motorda performans kaybı"],
    "solutions": ["Sensör telinin temizlenmesi", "Soket bağlantılarının korozyondan arındırılması", "Emme hortumu yırtıklarının kontrolü"],
    "severity": "yüksek",
    "affectedSystem": "Sensör Dinamikleri"
  },
  {
    "code": "P0102",
    "name": "Kütle veya Hacim Hava Akışı 'A' Devresi Düşük Giriş",
    "description": "Sensörün performansından ziyade elektriksel bir devrenin çöküşünü ifade eder. Sensör sinyal devresindeki voltajın veya frekansın önceden belirlenmiş eşik değerinin tamamen altına inmesidir. Sistem acil durum haritasına (limp-home mode) geçer.",
    "causes": ["Kablo tesisatında ciddi bir kopukluk", "Şasiye kısa devre durumu", "Sensörün iç elektroniğinin yanması"],
    "symptoms": ["Emisyonlarda ve yakıt tüketiminde ciddi dalgalanmalar", "Limp-home (acil durum) moduna geçiş", "Performansın kilitlenmesi"],
    "solutions": ["Tesisat kısa devresinin kontrolü ve kabloların onarımı", "Fiş korozyonunun temizlenmesi", "Sigortaların ve sensörün değiştirilmesi"],
    "severity": "yüksek",
    "affectedSystem": "Sensör Dinamikleri"
  },
  {
    "code": "P0135",
    "name": "O2 Sensörü Isıtıcı Devresi Bank 1, Sensör 1",
    "description": "Katalitik konvertörden önce bulunan birincil oksijen sensörünün iç ısıtma devresindeki arızadır. Sensörün 315°C operasyonel sıcaklığa ulaşması geciktiğinden PCM kapalı döngüye girmekte zorlanır.",
    "causes": ["Sensör içindeki ısıtıcı rezistansın açık devre olması", "Isıtıcı devresinin kısa devre yapması"],
    "symptoms": ["Soğuk çalıştırma emisyonlarında artış", "Kapalı döngüye geçişin gecikmesi", "Yakıt israfı"],
    "solutions": ["Isıtıcı devresi voltaj ve direnç ölçümü", "Sensör soket ve bağlantılarının kontrolü", "Hasarlı oksijen sensörünün değiştirilmesi"],
    "severity": "orta",
    "affectedSystem": "Egzoz Emisyon Sistemleri"
  },
  {
    "code": "P0138",
    "name": "O2 Sensörü Devresi Yüksek Voltaj Bank 1, Sensör 2",
    "description": "İkincil sensörün voltajının beklenen 0.1V - 0.9V aralığının üstüne çıkarak 1.1V veya daha yüksek değerlerde kilitli kalması durumudur.",
    "causes": ["Motorun aşırı zengin bir hava-yakıt karışımıyla boğulması", "Sensör kablolarının sıcak egzoz borularına temas ederek erimesi ve voltaj kısa devresi oluşturması", "Egzozda hiç oksijen kalmaması"],
    "symptoms": ["Katalitik konvertör peteklerinin çiğ yakıt sebebiyle erimesi (uzun vadede)", "Sürekli yüksek sensör voltajı (1.1V üstü)"],
    "solutions": ["Sensör tesisatının egzoza temas edip etmediğinin görsel kontrolü ve onarımı", "Zengin karışım yaratan diğer enjektör/hava arızalarının giderilmesi", "Sensörün değiştirilmesi"],
    "severity": "yüksek",
    "affectedSystem": "Egzoz Emisyon Sistemleri"
  },
  {
    "code": "P0420",
    "name": "Katalizör Sistemi Verimliliği Eşik Değerin Altında - Bank 1",
    "description": "Konvertör sonrası oksijen sensörü grafiğinin, konvertör öncesi sensörü taklit etmesiyle tetiklenir. Konvertör içerisindeki rodyum, paladyum ve platinin kimyasal reaksiyon yeteneklerini kalıcı olarak kaybettiğini kanıtlar.",
    "causes": ["Uzun süre onarılmamış tekleme (misfire)", "Silindir içine sızan antifriz", "Aşırı zengin karışıma bağlı konvertör tahribatı"],
    "symptoms": ["Egzoz emisyon testlerinden kalma", "İkinci sensör grafiğinin birincisiyle aynı şekilde inip çıkması", "Performans kısıtlaması (bazen)"],
    "solutions": ["Altta yatan ana arızanın (tekleme, antifriz sızıntısı) tespit edilip giderilmesi", "Egzoz sızıntılarının kontrolü", "Hasar görmüş katalitik konvertörün değiştirilmesi"],
    "severity": "yüksek",
    "affectedSystem": "Egzoz Emisyon Sistemleri"
  },
  {
    "code": "P0430",
    "name": "Katalizör Sistemi Verimliliği Eşik Değerin Altında - Bank 2",
    "description": "V6/V8 motorlarda ikinci silindir sırasının çıkışındaki konvertörün iflas ettiğini gösterir. Tamamen P0420 ile aynı mekanizmaya dayanır.",
    "causes": ["Onarılmamış tekleme sorunları", "Aşırı zengin karışım", "Silindire sızan soğutma sıvısı"],
    "symptoms": ["Yüksek emisyonlar", "Sensör dalgalanmalarının Bank 2'de eşleşmesi"],
    "solutions": ["Hava-yakıt oranındaki sapmaların elimine edilmesi", "Egzoz sızıntılarının tespiti", "Katalitik konvertörün Bank 2 için değiştirilmesi"],
    "severity": "yüksek",
    "affectedSystem": "Egzoz Emisyon Sistemleri"
  },
  {
    "code": "P0401",
    "name": "Egzoz Gazı Geri Çevrim 'A' Akışı Yetersiz",
    "description": "Yanma odasındaki tepe sıcaklıkları düşüren EGR sistemindeki fiziksel daralmayı belirtir. PCM, EGR valfi açıldığında beklenen basınç değişimini göremezse bu kod tetiklenir.",
    "causes": ["Motor bloğundan manifolda giden dar EGR kanallarının sertleşmiş karbon ve kurumla tamamen tıkanması", "EGR valfinin bozulması"],
    "symptoms": ["Yanma odası sıcaklıklarının kontrolsüzce artması", "Vuruntu (detonation) denilen yıkıcı motor patlamaları", "Çekiş kaybı"],
    "solutions": ["EGR kanallarının mekanik olarak temizlenmesi", "Karbon ve kurum birikintilerinin kazınması", "Gerekirse EGR valfinin değişimi"],
    "severity": "yüksek",
    "affectedSystem": "Egzoz Emisyon Sistemleri"
  },
  {
    "code": "P0440",
    "name": "Buharlaşmalı Emisyon Sistemi Genel Arızası",
    "description": "EVAP sisteminin genel hatlarıyla izolasyon testini geçemediğini, sistemin beklenen negatif veya pozitif basıncı oluşturamadığını ifade eder.",
    "causes": ["Sistemdeki valflerin işleyişinde bozulma", "Hortumlarda fiziksel bir delik veya kaçak", "Depo izolasyon hatası"],
    "symptoms": ["Yakıt buharı kokusu", "Emisyon muayenesinden başarısızlık"],
    "solutions": ["Alt kodların incelenerek spesifik sorunun bulunması", "Sistemin basınç/vakum testi ile kontrolü"],
    "severity": "orta",
    "affectedSystem": "Buharlaşmalı Emisyon (EVAP)"
  },
  {
    "code": "P0442",
    "name": "Buharlaşmalı Emisyon Sistemi Sızıntı Tespit Edildi - Küçük Sızıntı",
    "description": "Sistemde çapı 0.040 inç civarında çok ufak bir sızıntı noktası algılandığını gösterir.",
    "causes": ["Benzin kapağının tam oturtulmaması", "Kapağın altındaki sızdırmazlık O-ringinin aşınması", "Karbon kanister hortumlarındaki yüzey çatlakları"],
    "symptoms": ["Araç çevresinde hafif benzin kokusu", "Arıza lambasının (MIL) yanması"],
    "solutions": ["Benzin kapağı contasının kontrolü/değişimi", "Sisteme duman testi (EVAP smoke testing) uygulanması", "Karanlık ortamda halojen veya UV ışıkla sızıntı aranması"],
    "severity": "orta",
    "affectedSystem": "Buharlaşmalı Emisyon (EVAP)"
  },
  {
    "code": "P0455",
    "name": "Buharlaşmalı Emisyon Sistemi Büyük Sızıntı Tespit Edildi",
    "description": "Yakıt deposu ve EVAP bağlantılarında basıncın tutulmasını tamamen engelleyen devasa bir açık olduğunu gösterir. Purge valfi açıldığında basınç sensöründe vakum eğrisi görülmez.",
    "causes": ["Benzin kapağının hiç takılmamış olması", "Havalandırma valfinin (vent valve) mekanik olarak açık konumda sıkışması", "Karbon kanister ünitesinin fiziksel darbeyle yarılması"],
    "symptoms": ["Yoğun benzin buharı kokusu", "Yakıt deposu basınç sensöründe sıfır vakum değişimi"],
    "solutions": ["Benzin kapağının kontrolü", "Havalandırma valfinin işlevsellik testi", "Karbon kanisterin hasar kontrolü ve değişimi"],
    "severity": "orta",
    "affectedSystem": "Buharlaşmalı Emisyon (EVAP)"
  },
  {
    "code": "P0456",
    "name": "Buharlaşmalı Emisyon Sistemi Sızıntı Tespit Edildi - Çok Küçük Sızıntı",
    "description": "Sızıntının 0.020 inç gibi saç teli inceliğinde bir delikten kaynaklandığını gösterir. Oldukça hassas bir kaçaktır.",
    "causes": ["Motor bölmesinden depoya uzanan tahliye borularındaki mikroskobik sürtünme aşınmaları", "Purge valfinin tam olarak kapanamayıp sızıntı yapması"],
    "symptoms": ["Emisyon testinden kesin olarak kalma", "Genellikle sürüş güvenliğini etkilemez ancak doğaya hidrokarbon salar"],
    "solutions": ["Gelişmiş duman testi uygulaması", "Purge valfinin sızdırmazlık testi ve onarımı", "Plastik boruların mikroskobik hasar analizi"],
    "severity": "düşük",
    "affectedSystem": "Buharlaşmalı Emisyon (EVAP)"
  },
  {
    "code": "P0128",
    "name": "Soğutma Sıvısı Sıcaklığı Termostat Düzenleme Sıcaklığının Altında",
    "description": "Motorun ısınma döngüsüyle (warm-up cycle) ilgili kronik bir başarısızlık. Araç öngörülen sürede optimum sıcaklığa (90-105°C) ulaşamaz ve ECM sürekli zengin karışım basar.",
    "causes": ["Mekanik termostatın açık konumda sıkışıp kalması (stuck open)", "Sürekli çalışan hatalı bir radyatör fanı", "Sensöre ulaşmayan düşük soğutma sıvısı seviyesi"],
    "symptoms": ["Bujilerin kurum bağlaması", "Katalizörün çiğ yakıtla dolması", "Araç içi kalorifer sisteminin sürekli soğuk üflemesi"],
    "solutions": ["Arızalı mekanik termostatın değiştirilmesi", "Radyatör fanı kontrol devresinin test edilmesi", "Soğutma sıvısı seviyesinin tamamlanması"],
    "severity": "orta",
    "affectedSystem": "Termal Yönetim"
  },
  {
    "code": "P0115",
    "name": "Motor Soğutma Sıvısı Sıcaklık Sensörü 1 Devresi",
    "description": "Soğutma sıvısı sıcaklığını ECM'ye ileten termistörün elektriksel olarak devreden çıktığını, fişinin koptuğunu veya aşırı direnç oluşturduğunu belirtir.",
    "causes": ["Sensör fişinin kopması veya çıkması", "Sensör termistörünün elektriksel iç arızası", "Tesisatta yüksek direnç/oksitlenme"],
    "symptoms": ["Radyatör fanlarının acil durum olarak en yüksek kademede sürekli çalışması", "Enjeksiyon stratejisinin bozulması", "Aracın motoru aşırı ısınmış farz etmesi"],
    "solutions": ["Kablo tesisatının ve fiş bağlantılarının kontrolü", "ECT sensörünün direnç testi ve değişimi", "Oksitlenmiş kısımların temizlenmesi"],
    "severity": "yüksek",
    "affectedSystem": "Termal Yönetim"
  },
  {
    "code": "P0113",
    "name": "Emme Havası Sıcaklık Sensörü 1 Devresi Yüksek Giriş",
    "description": "Negatif Sıcaklık Katsayısına sahip IAT sensöründe kablo kopması nedeniyle direncin sonsuza çıkması ve PCM'in 4.7V üzeri giriş okumasıdır. PCM sıcaklığı -40°C olarak hesaplar.",
    "causes": ["Kablo tesisatının kopması", "Sensör konnektörünün çekili unutulması", "Sensör iç direnç kopması"],
    "symptoms": ["Egzozdan siyah duman atılması", "-40°C algısına bağlı devasa miktarda çiğ yakıt atımı ve boğulma", "Rölanti dengesizlikleri ve teklemeler"],
    "solutions": ["Kablo tesisatının voltaj ve direnç ölçümü", "Kopan kabloların onarılması", "Arızalı IAT sensörünün yenilenmesi"],
    "severity": "yüksek",
    "affectedSystem": "Sensör Dinamikleri"
  },
  {
    "code": "P0122",
    "name": "Gaz Kelebeği/Pedal Konum Sensörü 'A' Devresi Düşük Giriş",
    "description": "Gaz kelebeği üzerindeki bir potansiyometre olan TPS sensöründen gelen referans voltajının sıfıra yaklaştığını (genellikle 0.5V'un altına düştüğünü) ifade eder.",
    "causes": ["Potansiyometre fırçalarının aşınması", "TPS voltajının 0.5V altına çakılması", "Kablo kopukluğu veya kısa devre"],
    "symptoms": ["İvmelenme kaybı ve kısıtlanması", "Otomatik şanzımanın vites değiştirme noktalarını (shift points) hesaplayamaması", "Vites kararsızlığı"],
    "solutions": ["Sensör referans voltajının (5V) ve topraklamasının ölçümü", "TPS sensör değişimi ve kalibrasyonu"],
    "severity": "yüksek",
    "affectedSystem": "Sensör Dinamikleri"
  },
  {
    "code": "P0505",
    "name": "Rölanti Kontrol Sistemi Arızası",
    "description": "Rölanti Hava Kontrol (IAC) sisteminin çöküşünü gösterir. Sürücü gazdan ayağını çektiğinde motor devri hedeflenen 600-800 RPM bandında tutulamaz.",
    "causes": ["Egzoz ve yağ buharlarının IAC valfinde oluşturduğu karbon birikintisinin hareketi kısıtlaması", "Manifold contalarındaki dış vakum kaçakları", "İç minyatür step motor arızası"],
    "symptoms": ["Devir iğnesinin sürekli aşağı yukarı oynaması", "Dur-kalk trafikte motorun sarsılıp stop etmesi", "Rölantinin anormal yüksek kalarak fren yapmayı zorlaştırması"],
    "solutions": ["IAC valfinin ve bypass kanallarının mekanik temizliği ile karbonun arındırılması", "Manifold contası sızıntılarının dumanla testi ve onarımı", "Temizlikle düzelmezse valf değişimi"],
    "severity": "orta",
    "affectedSystem": "Rölanti Kontrol Dinamikleri"
  },
  {
    "code": "P0300",
    "name": "Rastgele/Çoklu Silindir Teklemesi Tespit Edildi",
    "description": "Yanma reaksiyonlarının birçok silindirde asimetrik gerçekleştiğini gösteren jenerik koddur. Krank mili pozisyon sensörü ivme düşüşlerini saptar. Semptomlar tek bir silindire izole değildir.",
    "causes": ["Zayıf basınçlı bir yakıt pompası", "Büyük çaplı vakum kaçakları", "Düşük oktanlı, su karışmış kalitesiz yakıt", "Kirlenmiş yakıt enjektörleri"],
    "symptoms": ["Yanıp sönen arıza lambası (flashing CEL)", "Çiğ benzinin egzoza dökülmesi ve katalizör tahribatı", "Sarsıntılı çalışma"],
    "solutions": ["Yakıt basıncının ölçülmesi", "Kapsamlı vakum kaçağı araması", "Yakıt kalitesinin kontrolü ve kirli enjektörlerin temizlenmesi/değişimi"],
    "severity": "yüksek",
    "affectedSystem": "Ateşleme Senkronizasyonu"
  },
  {
    "code": "P0301",
    "name": "Silindir 1 Teklemesi Tespit Edildi",
    "description": "P0300'ün aksine problemin izole bir şekilde yalnızca 1 numaralı silindirin odacığında gerçekleştiğini işaret eder.",
    "causes": ["Ateşleme bobini arızası", "Buji tırnak erimesi veya yağlanması", "Supap erimesi veya piston sekmanı aşınması gibi kompresyon kaybı"],
    "symptoms": ["Motorda sarsıntı", "Silindir bazlı vuruntu ve güç kaybı"],
    "solutions": ["1. silindir elemanlarının diğer silindirlerle yer değiştirilerek (swap testing) arızanın taşınıp taşınmadığının izlenmesi", "Kayıp taşınmıyorsa motor kompresyon ve kaçak testlerinin yapılması"],
    "severity": "yüksek",
    "affectedSystem": "Ateşleme Senkronizasyonu"
  },
  {
    "code": "P0335",
    "name": "Krank Mili Pozisyon Sensörü 'A' Devresi Arızası",
    "description": "Ateşleme zamanlamasının ve enjeksiyon palsının ana referans noktası olan CKP sensörünün işlevini yitirdiğini belirtir.",
    "causes": ["Sensör tesisatının kopması veya oksitlenmesi", "Krank kasnağındaki manyetik okuyucu dişlilerin (tone ring) zarar görmesi", "Sensör iç sargı kopukluğu"],
    "symptoms": ["Ateşleme sisteminin tamamen durması", "Motorun marş basması ancak çalışmaması (no-start/no-crank)"],
    "solutions": ["Krank sensörü soket ve kablolarının ölçülmesi", "Sensör değişimi ve manyetik okuyucu alanın kontrolü"],
    "severity": "yüksek",
    "affectedSystem": "Ateşleme Senkronizasyonu"
  },
  {
    "code": "P0500",
    "name": "Araç Hız Sensörü Malfonksiyonu",
    "description": "Güç aktarım organı ile gövde sistemleri arasında bilgi alışverişini sağlayan VSS sensöründen gelen elektronik hız verisinin PCM'e ulaşmamasıdır.",
    "causes": ["ABS hız sensörleri arızası", "Sensör veri ağındaki CAN-bus iletişimsizliği", "Kopmuş kablolar"],
    "symptoms": ["Kilometre saatinin çalışmayı durdurması", "Otomatik şanzıman vites değiştirme algoritmalarının kaybıyla vuruntulu atışlar", "Hız sabitleme (Cruise Control) iptali"],
    "solutions": ["Tarama aletiyle yürüyüş testinde her tekerlekten gelen verilerin kontrolü", "Sıfır gösteren devrenin fiziki kablo onarımı veya sensör değişimi"],
    "severity": "yüksek",
    "affectedSystem": "Ağ Mimarisindeki Çöküşler"
  },
  {
    "code": "P0011",
    "name": "'A' Eksantrik Mili Pozisyonu - Zamanlama Aşırı İleri veya Sistem Performansı Bank 1",
    "description": "Değişken Supap Zamanlama (VVT) mekanizmalarındaki kritik mekanik/hidrolik arızadır. Eksantrik mili hedeflenen 'ileri' konumda takılı kalır ve rölanti pozisyonuna dönemez.",
    "causes": ["İhmal edilmiş bakım ve kirli motor yağı", "Yağ tortuları (sludge) ve çamurlaşmanın VVT hidrolik yağ kontrol valfi eleklerini tıkaması", "Solenoidin sıkışması"],
    "symptoms": ["Emme supapları ile pistonlar arasında fiziksel çarpışmalar (interference) ve mekanik yıkım", "Motorda ciddi güç kaybı ve rölanti bozukluğu"],
    "solutions": ["VVT solenoidinin ohmmetre ile direncinin (5-15 Ω) test edilmesi ve temizliği", "Motor yağı ve yağ filtresinin fabrika viskozitesine uygun tam sentetik yağla değiştirilmesi"],
    "severity": "yüksek",
    "affectedSystem": "Performans Destek Sistemleri (VVT)"
  },
  {
    "code": "P0299",
    "name": "Turboşarj/Süperşarj 'A' Düşük Basınç / Underboost Durumu",
    "description": "Turbo destekli motorlarda gerçek manifold basıncının, beyin tarafından hesaplanan hedef basıncın tehlikeli şekilde altında kalması durumudur.",
    "causes": ["Turbo çıkış hortumlarındaki kelepçe gevşemeleri veya intercooler sızıntıları (boost leak)", "Atık kapakçığının (wastegate) yay bozukluğu nedeniyle tam kapanamaması", "Turbo pervanesinin kırılması veya kompresör aşınması"],
    "symptoms": ["Sistemin aracı korumak için çekişten düşürmesi (limp mode) ve ivmelenme izni vermemesi", "Dış basınç sızıntılarına bağlı ıslık (whining) veya tıslama sesi"],
    "solutions": ["Sistemdeki basınç sızıntılarının (boost leak test) bulunması", "Hortum ve kelepçe yenilemeleri", "Ağır durumlarda turbo veya wastegate revizyonu"],
    "severity": "yüksek",
    "affectedSystem": "Performans Destek Sistemleri (Turbo)"
  },
  {
    "code": "P2135",
    "name": "Gaz Kelebeği/Pedal Konum Sensörü 'A' / 'B' Voltaj Korelasyonu",
    "description": "Drive-by-Wire (elektronik gaz kelebeği) konseptinde güvenlik amaçlı bulunan iki ayrı konum sensörünün voltajlarının birbiriyle eşleşmemesi durumudur.",
    "causes": ["Kablo kısa devresi", "Gaz kelebeği veya pedal içindeki potansiyometre fırçalarının aşınması"],
    "symptoms": ["Kontrolsüz gaz açılması ihtimaline karşı PCM'in güç düşürme modunu (Reduced Engine Power) etkinleştirmesi", "Hızın maksimum 30 km/h bandına kısıtlanması", "Yüksek rölanti durumu"],
    "solutions": ["Pedal ve gaz kelebeği gövdesi voltaj eşleşmelerinin canlı veriden izlenmesi", "Gövde ve soket temizliği, değişimi ve yeniden adaptasyon adaptasyonu"],
    "severity": "yüksek",
    "affectedSystem": "Elektronik Gaz Kelebeği"
  },
  {
    "code": "P0700",
    "name": "Şanzıman Kontrol Sistemi Arızası - MIL Talebi",
    "description": "Şanzıman Kontrol Modülünün (TCM) saptadığı bir sorunu ECM'ye bildirerek göstergede Check Engine ışığını (MIL) yakmasını istediği, doğrudan tamir yönlendirmesi içermeyen genel (şemsiye) koddur.",
    "causes": ["TCM içerisinde sensör ağı iletişim eksikliği", "Aşırı ısınma durumu", "İç hidrolik basınç kaybı", "Vites ayrılma hatası"],
    "symptoms": ["Şanzımanın 2. veya 3. viteste kilitlenmesi (Limp-in)", "Vites geçişlerinde vuruntu ve yüksek hararet"],
    "solutions": ["Diagnostik cihazıyla şanzıman menüsüne girilip TCM'de bekleyen alt arıza kodlarının (spesifik hataların) okunması ve bu hatalara odaklanılması"],
    "severity": "yüksek",
    "affectedSystem": "Şanzıman"
  },
  {
    "code": "C0035",
    "name": "Sol Ön Tekerlek Hız Sensörü Devresi",
    "description": "Anti-Blokaj Fren Sistemi (ABS) ve Elektronik Stabilite Programı (ESP) ile ilgili doğrudan şasi hatasıdır. Tekerlek hızı okunamadığından ABS devre dışı kalır.",
    "causes": ["Poryadaki sensörün manyetik sinyal üretememesi", "Fren hattı boyunca kopan kablolar", "Dönen manyetik halkanın (tone ring) kirlenmesi veya kırılması"],
    "symptoms": ["ABS'nin devreden çıkması", "Fren pedalındaki sarsıntılı (titreşimli) ABS geri bildiriminin kaybolması", "ESP lambası uyarısı"],
    "solutions": ["Fiziki kablo tesisatının ohmmetrik ölçümü", "Manyetik halkanın (tone ring) temizlenmesi", "Hasarlı ABS sensörünün değiştirilmesi"],
    "severity": "yüksek",
    "affectedSystem": "Şasi Dinamikleri"
  },
  {
    "code": "U0100",
    "name": "ECM/PCM 'A' ile İletişim Kaybedildi",
    "description": "Aracın ağ omurgasındaki en kritik sorunlardan biridir. TCM, ABS veya BCM gibi modüllerin Motor Kontrol Modülünden (ECM) düzenli saniyelerde alması gereken durum (alive) paketlerini alamadığında oluşur.",
    "causes": ["Modüller için 12.6V referans eşiği sağlayamayan zayıf aküler", "ECM soketine giren su ve oksitlenmiş şasi bağlantıları", "Erimiş veri kabloları veya anakartın yanmış iletişim çipi"],
    "symptoms": ["Marş dinamosunun dönmesi ancak ateşleme olmaması (no-crank/no-start)", "Sürüş esnasında motorun aniden elektrik kesip stop etmesi"],
    "solutions": ["Akü durumunun ve 12V beslemelerinin test edilmesi", "ECM pinleri ve şasi noktalarının temizlenmesi/onarılması", "En kötü senaryoda ECM değişimi ve immobilizer adaptasyonu"],
    "severity": "yüksek",
    "affectedSystem": "Ağ Mimarisindeki Çöküşler"
  },
  {
    "code": "U0073",
    "name": "Kontrol Modülü İletişim Yolu Bus 'A' Kapalı",
    "description": "Ağ topolojisinin donanımı korumak veya kısa devre nedeniyle ana veri yollarını (CAN High/Low) tamamen trafiğe kapatmasıdır. U0100'den farklı olarak tüm cadde ulaşıma kapanır.",
    "causes": ["Ağdaki modüllerden birinin iç kısa devresi", "Sonlandırma dirençleri (terminating resistor) devresinin kopması veya sapması", "Veri hattının şasiye teması"],
    "symptoms": ["Gösterge panelindeki tüm ışıkların bir anda yanması (yılbaşı ağacı efekti)", "Kapı kilitlerinin işlevsizleşmesi", "Vitesin 'Park' pozisyonunda kilitli kalması"],
    "solutions": ["DLC portundan CAN pinlerindeki direncin ölçülmesi (normali 60 Ω olmalıdır)", "Direnç sapmalarında hatalı modülün fişi çekilerek hattın normale döndüğü anın bulunması (unplugging testi)"],
    "severity": "yüksek",
    "affectedSystem": "Ağ Mimarisindeki Çöküşler"
  }
];

const dataPath = path.join(__dirname, 'data', 'obd-codes.json');

try {
  let existingCodes = [];
  if (fs.existsSync(dataPath)) {
    existingCodes = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  }

  let updateCount = 0;
  let newCount = 0;

  advancedCodes.forEach(advancedCode => {
    const existingIndex = existingCodes.findIndex(c => c.code === advancedCode.code);
    
    // Ensure category is set properly
    advancedCode.category = advancedCode.code.charAt(0);
    
    if (existingIndex !== -1) {
      // Override details
      existingCodes[existingIndex] = { ...existingCodes[existingIndex], ...advancedCode };
      updateCount++;
    } else {
      // Add if not exist
      existingCodes.push(advancedCode);
      newCount++;
    }
  });

  fs.writeFileSync(dataPath, JSON.stringify(existingCodes, null, 2), 'utf-8');
  console.log(`Veritabanı güncellendi! ${updateCount} kod zenginleştirildi, ${newCount} yeni kod eklendi.`);

} catch(err) {
  console.error("Hata:", err);
}
