const fs = require('fs');
const path = require('path');

const codesFile = path.join(__dirname, '../data/obd-codes.json');
let codesData = JSON.parse(fs.readFileSync(codesFile, 'utf-8'));

// Top 20 Enriched Codes Data
const enrichedCodes = {
  'P0420': {
    description: "P0420 arıza kodu, 'Katalitik Konvertör Sistemi Verimliliği Sınırın Altında (Sıra 1)' anlamına gelir. Motor kontrol ünitesi (ECU), egzoz sistemindeki katalitik konvertörün egzoz gazlarını temizleme görevini yeterince yerine getiremediğini tespit ettiğinde bu kodu kaydeder. Katalitik konvertör, zararlı emisyonları zararsız gazlara dönüştürmekle görevlidir. Sıra 1, motorun 1 numaralı silindirini içeren tarafı ifade eder. Bu arıza genellikle konvertörün iç petek yapısının erimesi, tıkanması veya ömrünü yitirmesi sonucu ortaya çıkar. Ancak bazen sadece arızalı bir oksijen (O2) sensörü veya egzoz kaçağı da bu kodun tetiklenmesine neden olabilir.",
    symptoms: [
      "Motor arıza lambasının (Check Engine) sürekli yanması",
      "Araçta yakıt tüketiminin belirgin şekilde artması",
      "Egzozdan çürük yumurta veya kükürt kokusu gelmesi",
      "Hızlanma esnasında çekiş düşüklüğü ve isteksizlik",
      "Motorun rölantide düzensiz veya sarsıntılı çalışması"
    ],
    causes: [
      "Katalitik konvertörün ömrünü tamamlaması veya hasar görmesi",
      "Katalitik konvertör öncesi veya sonrası oksijen (O2) sensörünün arızalanması",
      "Egzoz manifoldlarında veya egzoz borularında kaçak olması",
      "Motorun zengin veya fakir karışımla çalışıp konvertöre zarar vermesi",
      "Kötü kalitede yakıt kullanılması"
    ],
    solutions: [
      "Egzoz sisteminde çatlak veya kaçak olup olmadığını fiziki olarak kontrol edin.",
      "Diagnostik cihazı bağlayarak O2 sensörlerinin (Özellikle Sıra 1 Sensör 2) voltaj grafiklerini canlı izleyin. Sürekli dalgalanıyorsa konvertör işlevini yitirmiştir.",
      "Oksijen sensörlerinin kablo tesisatını ve soketlerini oksitlenmeye karşı inceleyin.",
      "Emme manifoldunu ve enjektörleri sızıntıya karşı kontrol edin (Motor zengin çalışıyorsa konvertörü bozar).",
      "Gerekirse katalitik konvertörü yenisi ile değiştirin (İçi boşaltılırsa muayeneden geçmez ve araç performansı etkilenebilir)."
    ],
    severity: "yüksek",
    affectedSystem: "Egzoz ve Emisyon Sistemi"
  },
  'P0171': {
    description: "P0171 kodu, motorun 'Sıra 1' (Bank 1) tarafında hava/yakıt karışımının çok fakir (System Too Lean) olduğunu belirtir. Bu, motora giren havanın çok fazla veya motora enjekte edilen yakıtın çok az olduğu anlamına gelir. İdeal hava yakıt karışımı (stokiyometrik oran) 14.7:1'dir. ECU bu dengeyi sağlamak için yakıt miktarını artırmaya çalışır (Long Term Fuel Trim artar). Eğer ECU yakıtı maksimum seviyeye kadar artırmasına rağmen hala yeterli zenginliğe ulaşamazsa P0171 kodunu yakar. Bu durum genellikle vakum kaçakları, tıkalı enjektörler veya arızalı MAF sensöründen kaynaklanır.",
    symptoms: [
      "Motor arıza lambasının (MIL) yanması",
      "Rölantide titreme, dalgalanma veya motorun stop etmesi",
      "Araç hızlanırken tekleme veya güç kaybı yaşanması",
      "Motorun ilk çalıştırılmasında (soğuk marş) zorlanma",
      "Fakir karışımdan dolayı yanma odasının aşırı ısınması ve supap vuruntusu"
    ],
    causes: [
      "Emme manifoldunda, vakum hortumlarında veya PCV valfinde hava kaçağı (Vakum kaçağı)",
      "Kirlenmiş veya arızalanmış Kütle Hava Akış (MAF) sensörü",
      "Tıkanmış yakıt filtresi veya zayıf yakıt pompası nedeniyle düşük yakıt basıncı",
      "Kirli veya tıkanmış yakıt enjektörleri",
      "Egzost manifoldu veya O2 sensörü çevresinde egzoz kaçağı"
    ],
    solutions: [
      "Duman testi (smoke test) yaparak motordaki vakum kaçaklarını tespit edin ve onarın.",
      "MAF sensörünü özel MAF temizleyici sprey ile dikkatlice temizleyin.",
      "Yakıt basıncını bir manometre ile ölçerek yakıt pompasının durumunu kontrol edin.",
      "Eğer LPG takılı ise, LPG ayarlarının (haritasının) bozuk olması bu koda sebep olabilir; LPG ayarını yenileyin.",
      "Ön Oksijen (O2) sensörünün doğru okuma yapıp yapmadığını osiloskop veya OBD cihazı ile test edin."
    ],
    severity: "yüksek",
    affectedSystem: "Hava ve Yakıt Karışım Sistemi"
  },
  'P0300': {
    description: "P0300 kodu, motorun farklı silindirlerinde rastgele veya çoklu tekleme (Random/Multiple Cylinder Misfire) algılandığını gösterir. Normalde tekleme tek bir silindirde olduğunda P0301, P0302 gibi spesifik kodlar verilir. Ancak P0300 varsa, sorun motordaki genel bir sistemi (yakıt basıncı, genel vakum kaçağı, kötü yakıt, tıkalı katalizör veya eksantrik/krank sensörü arızası) işaret eder. Tekleme, silindir içerisindeki hava/yakıt karışımının doğru zamanda tutuşmamasından kaynaklanır. Zamanında müdahale edilmezse yanmamış yakıt doğrudan egzoza atılır ve katalitik konvertörü eriterek çok yüksek masraflara yol açabilir.",
    symptoms: [
      "Motor arıza lambasının yanması (Eğer tekleme şiddetliyse arıza lambası yanıp söner / flaş yapar)",
      "Motorda şiddetli sarsıntı ve titreme (Özellikle rölantide)",
      "Hızlanma sırasında silkelenme, güç kaybı ve gaz yememe",
      "Egzozdan patlama (backfire) sesi gelmesi veya çiğ yakıt kokusu",
      "Araç çalışmasında zorlanma veya stop etme"
    ],
    causes: [
      "Bozuk, kirli veya yanlış aralıklı bujiler",
      "Zayıf ateşleme bobinleri veya kopuk buji kabloları",
      "Düşük yakıt basıncı (Arızalı yakıt pompası veya tıkalı yakıt filtresi)",
      "Büyük vakum kaçakları veya EGR valfinin açık kalması",
      "Kötü veya sulu yakıt alınması"
    ],
    solutions: [
      "Motor arıza lambası yanıp sönüyorsa, aracı güvenli bir şekilde kenara çekip stop edin; aksi halde katalizör eriyebilir.",
      "Buji ve ateşleme bobinlerinin durumunu kontrol edin; çatlak veya karbon izi varsa değiştirin.",
      "Araçta LPG varsa, LPG enjektörlerini devre dışı bırakarak benzinde test edin.",
      "Yakıt basıncını ölçün ve düşükse yakıt filtresi ile pompayı değiştirin.",
      "EGR sisteminin sıkışıp sıkışmadığını ve manifoldda kaçak olup olmadığını duman testi ile doğrulayın."
    ],
    severity: "yüksek",
    affectedSystem: "Ateşleme Sistemi"
  },
  'P0430': {
    description: "P0430 kodu, P0420 kodunun V-tipi (V6, V8) veya çok manifoltlu motorlardaki karşılığıdır. Anlamı 'Katalitik Konvertör Sistemi Verimliliği Sınırın Altında (Sıra 2)'dir. ECU, Sıra 2 tarafındaki (1 numaralı silindirin olmadığı karşı bank) katalitik konvertörün egzoz emisyonlarını filtreleme kapasitesinin düştüğünü belirlemiştir. Arkadaki Oksijen (O2) sensörünün ürettiği sinyal, öndeki sensörün sinyaliyle aynı dalgalanmayı gösterdiğinde katalizörün işlevini yitirdiği anlaşılır. Bu arıza yüksek yakıt tüketimi ve muayeneden geçememe ile sonuçlanır.",
    symptoms: [
      "Motor arıza lambasının (MIL) yanması",
      "Araç emisyon testlerinden (TÜVTÜRK egzoz muayenesi vb.) geçememesi",
      "Yakıt tüketiminde gözle görülür bir artış",
      "Özellikle yokuşlarda veya yüklüyken motor performansında düşüş",
      "Egzozdan rahatsız edici kükürt veya çürük yumurta kokusu"
    ],
    causes: [
      "Sıra 2 tarafındaki katalitik konvertörün hasar görmesi veya içinin dağılması",
      "Sıra 2'deki alt oksijen sensörünün (Sensör 2) arızalanması veya yavaş yanıt vermesi",
      "Oksijen sensörü öncesinde egzoz borusunda kaçak/çatlak olması",
      "Motorun sürekli zengin karışım veya tekleme ile çalışıp konvertörü bozması"
    ],
    solutions: [
      "Katalizörün gerçekten bozuk olup olmadığını anlamak için OBD cihazıyla O2 sensörü grafiği izleyin.",
      "Eğer O2 sensör voltajı 0.1V ile 0.9V arası sürekli dalgalanıyorsa katalizör ömrünü tamamlamıştır, yenisi ile değiştirilmelidir.",
      "Egzoz spiralinde, flanşlarda veya manifold bağlantılarında egzoz gazı kaçağı olup olmadığını dumanla test edin.",
      "Oksijen sensörlerini voltmetre veya osiloskop ile kontrol edin, arızalıysa orijinal veya kaliteli muadili ile değiştirin."
    ],
    severity: "yüksek",
    affectedSystem: "Egzoz ve Emisyon Sistemi"
  },
  'P0174': {
    description: "P0174 kodu, P0171 kodunun kardeşi olup 'Sıra 2' (Bank 2) tarafında sistemin çok fakir (System Too Lean) olduğunu belirtir. Bu kod genellikle V6 veya V8 motorlarda karşımıza çıkar. ECU, Sıra 2 egzozundan gelen Oksijen sensörü verisine dayanarak karışımın aşırı hava barındırdığını veya yeterli yakıt içermediğini tespit eder. Bu durum motor sıcaklığının artmasına, piston ve supap erimelerine yol açabileceğinden dikkate alınması gereken ciddi bir koddur.",
    symptoms: [
      "Motor arıza ışığının yanması",
      "Motorun sarsıntılı çalışması ve tekleme yapması",
      "Ani gaza basışlarda aracın boğulması ve ivmelenmeme",
      "Egzozdan çiğ yakıt kokusu gelmemesi, aksine aracın aşırı ısınma eğilimi göstermesi",
      "Rölanti devrinin sürekli inip çıkması (dalgalanma)"
    ],
    causes: [
      "Sıra 2 tarafındaki emme manifold contası kaçağı veya vakum hortumu yırtığı",
      "Arızalı veya kirlenmiş Kütle Hava Akış (MAF) sensörü (bu durumda genellikle P0171 ile birlikte görülür)",
      "Zayıf yakıt pompası veya tıkalı yakıt filtresi",
      "Sıra 2 tarafındaki yakıt enjektörlerinde tıkanıklık veya arıza",
      "Egzozda veya ön Oksijen sensörü (Sıra 2 Sensör 1) bağlantısında hava kaçağı"
    ],
    solutions: [
      "Eğer P0171 ve P0174 kodları birlikte alınıyorsa sorun geneldir (MAF sensörü veya Yakıt pompası gibi). İlk olarak MAF sensörünü temizleyin.",
      "Sadece P0174 kodu varsa sorun Sıra 2'ye özeldir. Sıra 2 tarafındaki manifold contalarına balata spreyi sıkarak motor devrinde değişme olup olmadığını (vakum kaçağı) test edin.",
      "Yakıt basıncını ölçün.",
      "Araç lpg'li ise lpg enjektörlerinin Sıra 2 tarafındaki bağlantılarını ve gaz ayarını kontrol ettirin."
    ],
    severity: "yüksek",
    affectedSystem: "Hava ve Yakıt Karışım Sistemi"
  },
  'P0301': {
    description: "P0301 arıza kodu, motorun 1 numaralı silindirinde tekleme (misfire) algılandığını gösterir. ECU, krank mili konum sensöründen aldığı verilerle pistonların dönüş hızını hesaplar. 1 numaralı silindir ateşleme anında beklenen krank mili ivmelenmesini sağlayamazsa bu kod üretilir. Tekleme, silindirde yakıtın yanmaması anlamına gelir. Yanmayan çiğ yakıt doğrudan egzoza gönderilir ve kısa sürede katalitik konvertörün erimesine yol açabilir. 1 numaralı silindir genellikle motorun triger kayışı/zinciri tarafındaki ilk silindirdir.",
    symptoms: [
      "Motor arıza lambasının yanıp sönmesi (Flaş yapması, katalizör hasarı tehlikesi)",
      "Araçta belirgin bir çekiş düşüklüğü ve güç kaybı",
      "Rölantide beklerken motorun beşik gibi sallanması",
      "Egzoz sesinde patırtı veya ritim bozukluğu duyulması",
      "Yakıt tüketiminde aşırı artış"
    ],
    causes: [
      "1. Silindirdeki bujinin ömrünü tamamlaması, yağlanması veya kırılması",
      "1. Silindirdeki ateşleme bobininin zayıflaması veya tamamen bozulması",
      "1. Silindire giden buji kablosunda kopukluk veya elektrik atlaması (şelale yapması)",
      "1. Silindir yakıt enjektörünün tıkanması veya arızalanması",
      "1. Silindirde düşük kompresyon (Supap yanması, segman kırılması veya kapak contası hasarı)"
    ],
    solutions: [
      "Öncelikle 1. silindirin ateşleme bobinini veya buji kablosunu söküp 2. silindir ile yer değiştirin. Arıza kodu P0302'ye kayarsa sorun bobin/kablodur.",
      "Bujileri söküp durumunu kontrol edin, elektrot erimesi veya karbon birikimi varsa set olarak değiştirin.",
      "Ateşleme sistemi sağlamsa 1. silindir enjektörünü test edin.",
      "Buji ve enjektör sağlamsa kompresyon testi (basınç testi) yaparak motor içi mekanik hasar olup olmadığını kontrol edin."
    ],
    severity: "yüksek",
    affectedSystem: "Ateşleme Sistemi"
  },
  'P0302': {
    description: "P0302 arıza kodu, motorun 2 numaralı silindirinde tekleme (misfire) algılandığı anlamına gelir. Tıpkı P0301 gibi, bu silindirdeki hava-yakıt karışımı ya hiç ateşlenmiyor ya da eksik ateşleniyordur. Bu durum aracın performansını anında hissettirecek şekilde düşürür. Sorunun kaynağı genellikle ateşleme elemanlarıdır (buji, bobin), ancak yakıt sistemi (enjektör) veya mekanik kompresyon kayıpları da bu koda neden olabilir.",
    symptoms: [
      "Check Engine (Motor Arıza) ışığının yanması veya yanıp sönmesi",
      "Motorda gözle görülür titreme ve rölanti dalgalanması",
      "Hızlanma taleplerinde aracın tepkisiz kalması",
      "Araçta sarsıntılı ve konforsuz sürüş",
      "Egzozda sülfür/benzin kokusu"
    ],
    causes: [
      "2. silindir bujisinin veya ateşleme bobininin arızalı olması",
      "2. silindir enjektörünün yakıt püskürtmemesi",
      "Emme manifoldunun sadece 2. silindire yakın kısmında oluşan bir vakum kaçağı",
      "Mekanik sorunlar (Subap ayarı bozukluğu, yanık subap, erimiş piston veya düşük kompresyon)"
    ],
    solutions: [
      "Yer değiştirme taktiğini kullanın: 2. silindirin bobinini 1. silindir ile, bujisini ise 3. silindir ile değiştirip arıza kodunu silin. Arıza P0301 veya P0303 olarak değişirse arızalı parçayı bulmuşsunuzdur.",
      "Kabloları gözden geçirin, bobin soketine gelen tetikleme sinyalini test lambasıyla kontrol edin.",
      "Eğer araç LPG'li ise LPG enjektörü arızalanmış olabilir, aracı benzine alarak test edin.",
      "Gerekirse motor kompresyon testi yapın."
    ],
    severity: "yüksek",
    affectedSystem: "Ateşleme Sistemi"
  },
  'P0303': {
    description: "P0303 arıza kodu, 3 numaralı silindirde ardışık tekleme (misfire) yaşandığını belirtir. Araç beyni krank dönme hızındaki anlık yavaşlamaları sezinleyerek teklemenin hangi silindirden kaynaklandığını tespit eder. Tekleyen bir silindir güç üretmez, aksine diğer silindirlerin ürettiği gücü yutarak motoru frenler. Katalitik konvertörün yanmaması için bu koda acilen müdahale edilmesi hayati önem taşır.",
    symptoms: [
      "Motor arıza lambasının yanıp sönmesi (Tehlike işareti)",
      "Özellikle düşük devirlerde ve rölantide aşırı titreme",
      "Hızlanma esnasında aracın kesiklik yapması (sirkeleme)",
      "Zengin karışıma bağlı olarak artan emisyon ve yakıt tüketimi"
    ],
    causes: [
      "3. silindir ateşleme bobini, bujisi veya buji kablosu arızası",
      "3. silindire giden yakıt enjektöründe tıkanma veya elektriksel devre açıklığı",
      "Sadece 3. silindiri etkileyen bir manifold kaçağı",
      "Silindir kapağı contası yanığı veya supap deformasyonu"
    ],
    solutions: [
      "Klasik teşhis yöntemi: 3. silindirin bobin ve bujisini çalışan bir silindirinkiyle yer değiştirip arızanın yer değiştirip değiştirmediğini gözlemleyin.",
      "Ateşleme sağlamsa, enjektör soketini dinleyin veya osiloskop ile sinyali kontrol edin.",
      "Kompresyon ve silindir kaçak testi (Leak-down test) uygulayarak supap sızdırmazlığını ölçün."
    ],
    severity: "yüksek",
    affectedSystem: "Ateşleme Sistemi"
  },
  'P0304': {
    description: "P0304 arıza kodu, 4 numaralı silindirde yanma olayı gerçekleşmediğini (tekleme) bildirir. 4 silindirli motorlarda bu genellikle şanzımana en yakın olan en son silindirdir. Buji çakmıyor olabilir, enjektör işemiyor olabilir veya o silindirde hiç basınç olmayabilir. Hangi sebeple olursa olsun yanma gerçekleşmez ve motor 3 silindirli bir araç gibi oldukça dengesiz ve sarsıntılı çalışır.",
    symptoms: [
      "Motor kontrol ışığının aralıklı yanıp sönmesi veya sürekli yanması",
      "Çok belirgin güç eksikliği (araba gitmez, yokuş çıkamaz)",
      "Motor rölantisinin çok dalgalı ve sarsıntılı olması",
      "Egzozdan patlama benzeri (Misfire) seslerin duyulması"
    ],
    causes: [
      "4 numaralı buji veya bobinin arızalanması (En yaygın neden)",
      "4 numaralı enjektörün kirlenmesi, tıkanması veya soketinin çıkması",
      "Emme manifold contası kaçağı",
      "Düşük silindir kompresyonu (Eksantrik profili aşınması, subap yanması vb.)"
    ],
    solutions: [
      "4. silindir ateşleme bileşenlerini sökerek fiziki durumlarını (yağlanma, kırık seramik, karbon izi) kontrol edin.",
      "Arızalı olduğundan şüphelenilen bileşeni başka bir silindirdeki sağlam bileşenle yer değiştirerek kodun değişip değişmediğini izleyin.",
      "Bobin tesisatını ve ECU tetikleme sinyallerini kontrol edin.",
      "Kompresyon saati ile 4. silindirin basıncını ölçün, diğerleriyle karşılaştırın."
    ],
    severity: "yüksek",
    affectedSystem: "Ateşleme Sistemi"
  },
  'P0113': {
    description: "P0113 kodu, Emme Havası Sıcaklık (IAT - Intake Air Temperature) Sensörü devresinden ECU'ya çok yüksek bir voltaj girişi olduğunu belirtir. Bu durum genellikle IAT sensörü içindeki termistör devresinin açığa çıkması (kopması) veya kablo soketinin çıkık olmasından kaynaklanır. IAT sensörü, motora giren havanın sıcaklığını ölçer. Hava soğuksa yoğundur ve daha çok yakıt gerekir; hava sıcaksa seyreltiktir ve daha az yakıt gerekir. Bu sensör arızalandığında ECU hava sıcaklığını -40°C olarak varsayar ve motora aşırı zengin yakıt gönderir.",
    symptoms: [
      "Motor arıza lambasının yanması",
      "Zengin karışıma bağlı olarak artan yakıt tüketimi",
      "Motor sıcakken ilk marşta zor çalışma (Zengin karışım nedeniyle boğulma)",
      "Egzozdan siyah duman atması",
      "Rölanti dalgalanması"
    ],
    causes: [
      "IAT sensörü soketinin çıkmış veya kablosunun kopmuş olması (Devre açıklığı)",
      "IAT sensörünün iç direncinin tamamen yanması (Sensör arızası)",
      "Sensör toprak (şasi) veya sinyal hattında kısa devre",
      "Nadir durumlarda Motor Kontrol Ünitesi (ECU) arızası"
    ],
    solutions: [
      "Öncelikle IAT sensörünün soketinin yerine tam oturduğundan ve kilitlendiğinden emin olun.",
      "Sensör soketini çıkarıp multimetre ile referans voltajını (genelde 5V) ve şasi bağlantısını kontrol edin.",
      "Sensörün direncini Ohmmetre ile ölçün, eğer sonsuz direnç (açık devre) gösteriyorsa sensörü yenisiyle değiştirin.",
      "Hava filtresi değişiminden sonra genellikle usta sensör soketini takmayı unutur, en çok bu koda sebep olan ihmaldir."
    ],
    severity: "orta",
    affectedSystem: "Hava ve Yakıt Karışım Sistemi"
  },
  'P0401': {
    description: "P0401 arıza kodu, Egzoz Gazı Geri Çevrim (EGR - Exhaust Gas Recirculation) sisteminde yetersiz akış algılandığını gösterir. EGR sistemi, azot oksit (NOx) emisyonlarını düşürmek için yanma odası sıcaklığını düşürmek amacıyla bir miktar egzoz gazını tekrar emme manifolduna gönderir. P0401 kodu, ECU'nun EGR valfini açmasına rağmen manifolda beklenen miktarda egzoz gazının gelmediğini (akışın yetersiz olduğunu) saptaması anlamına gelir. Bu genellikle kurum ve karbon birikintilerine bağlı mekanik tıkanıklıklardan oluşur.",
    symptoms: [
      "Motor arıza lambasının (MIL) yanması",
      "Hızlanma esnasında hafif vuruntu veya şakırtı sesi (Pinging/Detonation)",
      "Motor performansında veya yakıt tüketiminde çok ufak bir düşüş (genelde sürücü hissetmeyebilir)",
      "Araç emisyon değerlerinin, özellikle NOx oranının yasal sınırları aşması"
    ],
    causes: [
      "EGR valfinin veya EGR borularının karbon/kurum ile tamamen tıkanması",
      "EGR valfinin sıkışması ve açılmaması",
      "EGR valfini kontrol eden vakum selenoidinin (veya vakum hortumlarının) arızalanması/kopması",
      "DPFE (Fark Basınç) sensörünün bozulması veya tıkanması"
    ],
    solutions: [
      "EGR valfini ve borularını sökerek içerisindeki yoğun kurum ve karbonu özel çözücü spreylerle temizleyin.",
      "Vakum ile çalışan bir sistemse, vakum hortumlarında çatlak veya kopukluk olup olmadığını kontrol edin.",
      "EGR sistemine hava basıncı farkını bildiren DPFE sensörü varsa, bu sensörün hortumlarını ve sensörün kendisini test edip gerekiyorsa değiştirin.",
      "EGR valfi diyaframı yırtılmış veya elektrik motoru yanmışsa yenisi ile değiştirin."
    ],
    severity: "orta",
    affectedSystem: "Egzoz ve Emisyon Sistemi"
  },
  'P0442': {
    description: "P0442 kodu, Evaporatif Emisyon (EVAP) sisteminde küçük bir sızıntı (Small Leak Detected) olduğunu belirtir. EVAP sistemi, benzin deposundaki yakıt buharlarının atmosfere karışmasını önler, bu buharları bir aktif karbon kutusunda (canister) depolar ve motor çalışırken manifolda emdirerek yakılmasını sağlar. Bu kod, ECU'nun sistemde 0.04 inç (1 mm) kadar küçük bir basınç kaybı saptadığı anlamına gelir. Genellikle gevşek bırakılmış bir depo kapağı bu kodun en büyük nedenidir.",
    symptoms: [
      "Sadece Motor arıza lambasının (Check Engine) yanması",
      "Sürüş hissiyatında, performansta veya yakıt tüketiminde hiçbir fark olmaması",
      "Aracın dışında veya içinde hafif bir benzin kokusu (her zaman olmaz)"
    ],
    causes: [
      "Benzin deposu kapağının tam kapatılmamış (tık sesi gelene kadar sıkılmamış) olması",
      "Depo kapağı contasının (o-ring) aşınması veya çatlaması",
      "EVAP tahliye (purge) veya havalandırma (vent) valflerinden birinde çok küçük bir sızıntı",
      "Yakıt deposu veya karbon kutusuna giden buhar hortumlarında kılcal çatlaklar"
    ],
    solutions: [
      "İlk yapmanız gereken şey yakıt depo kapağını açıp tekrar sıkıca kapatmaktır. Hata kodunu silin ve birkaç gün izleyin.",
      "Eğer kod geri gelirse depo kapağını ucuz bir yan sanayi ile değil, orijinali ile değiştirin.",
      "Sorun devam ediyorsa serviste EVAP sistemine sis/duman makinesi (Smoke Machine) bağlanarak kaçak yeri mikroskobik çatlaklara kadar tespit edilmelidir.",
      "Gerekirse havalandırma (Vent) veya temizleme (Purge) solenoid valfleri test edilip yenilenmelidir."
    ],
    severity: "düşük",
    affectedSystem: "EVAP Sistemi"
  },
  'P0455': {
    description: "P0455 arıza kodu, Evaporatif Emisyon (EVAP) Kontrol Sisteminde büyük bir sızıntı (Gross Leak / No Flow) tespit edildiğini gösterir. Küçük sızıntı (P0442) aksine, burada çok ciddi bir basınç kaybı veya buhar kaçışı vardır. Sisteme hiç vakum tutturulamıyordur. Bu arıza genellikle yakıt deposu kapağının tamamen açık unutulması, kaybolması veya hortumların tamamen kopması/çıkması durumunda kaydedilir.",
    symptoms: [
      "Motor arıza lambasının (MIL) sürekli yanması",
      "Aracın özellikle arka kısmında veya yakıt deposu bölgesinde güçlü benzin buharı kokusu",
      "Aracın performansına veya çalışmasına etki eden görünür bir belirti olmaması (Motor sorunsuz çalışmaya devam eder)"
    ],
    causes: [
      "Yakıt depo kapağının açık unutulması veya takılmamış olması",
      "EVAP karbon kutusu (Charcoal Canister) veya hortumlarında büyük bir yırtık/kırık",
      "EVAP Havalandırma (Vent) valfinin açık pozisyonda sıkışıp kalması",
      "Yakıt doldurma boğazında çürük, delik veya büyük çatlaklar"
    ],
    solutions: [
      "Yakıt deposu kapağının aracın üzerinde olup olmadığını kontrol edin ve sıkıca kapatın.",
      "Aracın altına eğilerek karbon kutusu (genelde arka çamurluk veya depo yanında bulunur) hortumlarının çıkıp çıkmadığına bakın.",
      "Havalandırma (Vent) solenoid valfini söküp 12V uygulayarak tam kapanıp kapanmadığını (klik sesi ve hava sızdırmazlığı) test edin.",
      "Smoke test (Duman testi) uygulayarak koca deliğin/kaçak noktasının nerede olduğunu gözle görülür hale getirin."
    ],
    severity: "düşük",
    affectedSystem: "EVAP Sistemi"
  },
  'P0135': {
    description: "P0135 arıza kodu, motorun 1. sıra (Bank 1) 1. sensör (Sensör 1) konumundaki Oksijen (O2) sensörünün ısıtıcı devresinde arıza olduğunu gösterir. Oksijen sensörlerinin doğru ölçüm yapabilmesi için yaklaşık 300°C ile 400°C arası bir sıcaklığa ulaşması gerekir. Modern sensörler, egzoz gazının ısınmasını beklememek için içlerinde kendi ısıtıcı rezistanslarını taşırlar. ECU bu ısıtıcı devreye giden akımda bir sorun (açık devre, kısa devre veya yüksek direnç) saptarsa P0135 kodunu tetikler. Bu arıza motor ısındıktan sonra performansı pek etkilemez ancak soğuk motor emisyonlarını bozar.",
    symptoms: [
      "Motor arıza lambasının yanması",
      "Soğuk motor ilk çalıştırıldığında (motor tam ısınana kadar) rölantide düzensizlik veya zengin karışım belirtileri",
      "Yakıt tüketiminde çok ufak miktarda artış",
      "Emisyon muayenesinden geçememe"
    ],
    causes: [
      "Oksijen sensörü içindeki ısıtıcı elemanın (rezistans) kopması veya yanması",
      "Oksijen sensörüne giden kablolarda (özellikle egzoz sıcağından dolayı) erime veya kopukluk",
      "O2 ısıtıcı devresine ait sigortanın atması veya ısıtıcı rölesinin bozulması",
      "Sensör soketine su/nem girmesi sonucu oksitlenme"
    ],
    solutions: [
      "O2 sensörünün fişini çekin ve multimetre ile sensör tarafındaki iki aynı renkli kablo (genelde iki beyaz veya iki siyah) arasındaki direnci ölçün. Sonsuz (açık devre) ise sensör değişmelidir.",
      "Aracın O2 ısıtıcı sigortasını kontrol edin, atmışsa tesisatta kısa devre arayın.",
      "Kablo demetinin egzoz borusuna temas edip erimediğini fiziksel olarak kontrol edin.",
      "Arızalı olduğu teyit edilen birinci oksijen sensörünü yenileyin."
    ],
    severity: "orta",
    affectedSystem: "Egzoz ve Emisyon Sistemi"
  },
  'P0141': {
    description: "P0141 arıza kodu, 1. sıra (Bank 1) 2. sensör (Sensör 2) pozisyonundaki, yani katalitik konvertörden *sonraki* Oksijen (O2) sensörünün ısıtıcı devresi arızasını temsil eder. P0135 kodunun katalizör arkasındaki versiyonudur. İkinci sensörün birincil amacı motor karışımını ayarlamak değil, katalitik konvertörün verimliliğini izlemektir. Bu sensörün ısıtıcısı bozulursa, sensör çalışma sıcaklığına geç ulaşır ve bu süre zarfında ECU katalizör performansını test edemez.",
    symptoms: [
      "Sadece Motor arıza lambasının yanması",
      "Sürüş performansında, çekişte veya rölantide hiçbir değişiklik olmaması",
      "Araç emisyon (egzoz) muayenesinden sistem hazır olmadığı için geçememe"
    ],
    causes: [
      "Sensör 2 içindeki ısıtıcı rezistansının ömrünü doldurup kopması",
      "Aracın altındaki sensöre giden kabloların taş sekmesi, su girmesi veya kasis sürtmesi sonucu kopması/hasar görmesi",
      "Isıtıcı devresi sigortasının (genellikle Heater Fuse) atması"
    ],
    solutions: [
      "Katalizörün arkasında yer alan O2 sensörünün kablolarını aracın altına girerek görsel olarak inceleyin.",
      "Sensör soketindeki ısıtıcı uçlarının direncini ölçün (Genellikle 3 ile 30 Ohm arası çıkmalıdır). Direnç okunmuyorsa sensör değiştirilmelidir.",
      "Eğer direnç sağlamsa, ECU'dan gelen 12V ısıtıcı voltajının gelip gelmediğini kontrol edin.",
      "Uygun, orijinal ekipman bir O2 sensörü takarak arıza kodunu silin."
    ],
    severity: "düşük",
    affectedSystem: "Egzoz ve Emisyon Sistemi"
  },
  'P0101': {
    description: "P0101 kodu, Kütle Hava Akış (MAF) Sensörünün performans aralığının dışında sinyal gönderdiğini gösterir. ECU, motor devri (RPM) ve gaz kelebeği pozisyonuna (TPS) göre motora girmesi gereken hava miktarını teorik olarak bilir. Ancak MAF sensöründen okunan gerçek hava miktarı bu teorik değerlerle tutuşmuyorsa P0101 arıza kodu kaydedilir. MAF sensörü hava filtresinin hemen arkasındadır ve ince telleri vasıtasıyla giren havanın kütlesini ölçer. Teller kirlendiğinde ölçüm bozulur.",
    symptoms: [
      "Motor arıza lambasının yanması",
      "Ani gaza basmalarda vuruntu, rölantide dalgalanma veya aracın stop etmesi",
      "Düşük yakıt ekonomisi ve egzozdan siyah duman çıkması",
      "Motor gücünde belirgin bir azalma ve isteksiz devirlenme"
    ],
    causes: [
      "MAF sensörünün içindeki ölçüm tellerinin toz, yağ veya kir ile kaplanması",
      "Açık hava filtresi (performans filtresi) yağının sensöre kaçarak bozması",
      "MAF sensörü ile gaz kelebeği arasındaki yırtık bir hava hortumundan (vakum kaçağı) ölçülmemiş hava girmesi",
      "MAF sensörünün donanımsal olarak bozulması"
    ],
    solutions: [
      "MAF sensörüne giden kauçuk/plastik hava hortumlarında yırtık, çatlak veya kelepçe gevşekliği olup olmadığını kontrol edin. Ölçülmemiş hava en büyük nedendir.",
      "MAF sensörünü söküp, karbüratör spreyi DEĞİL, sadece MAF Sensörü Temizleyici sprey kullanarak tellere dokunmadan temizleyin.",
      "Hava filtresini kontrol edin, çok kirliyse veya yırtıksa değiştirin.",
      "Eğer temizlik ve kaçak kontrolü işe yaramazsa, sensörün elektriksel çıkışlarını osiloskop ile test edin ve bozuksa değiştirin."
    ],
    severity: "yüksek",
    affectedSystem: "Hava ve Yakıt Karışım Sistemi"
  },
  'P0102': {
    description: "P0102 kodu, Kütle Hava Akış (MAF) sensörünün 'A' devresinde çok düşük frekans veya voltaj girişine rastlandığını belirtir. MAF sensörü, motora çok az hava girdiğini ya da sensörün tamamen işlevsiz kaldığını ECU'ya bildiriyordur. ECU 0.4 voltun (veya spesifik bir alt limitin) altında sinyal aldığında bu kodu atar. Araba bu durumda 'Safe Mode' (Koruma Modu) na girebilir veya çok sarsıntılı çalışabilir.",
    symptoms: [
      "Arıza lambası (Check Engine) sürekli yanar",
      "Aracın marş alması zorlaşır, çalışsa bile hemen stop etme eğilimi gösterir",
      "Limp Mode (Koruma Modu) sebebiyle araç 3000 devri veya belli bir hızı geçmez",
      "Aşırı güç kaybı yaşanır"
    ],
    causes: [
      "MAF sensörünün tamamen fişten çıkık olması veya kablolarının kopması",
      "Sensörün iç devresinin kısa devre veya açık devre sonucu yanması",
      "Hava filtresinin veya hava emiş borusunun bir bez, poşet veya yoğun pislik ile tamamen tıkanması",
      "Sensör şasi bağlantısının zayıflaması"
    ],
    solutions: [
      "MAF sensörünün fişini çıkarın. Bazı araçlar fiş çekiliyken varsayılan değerleri kullanıp düzelir. Eğer fiş çekildiğinde araç daha iyi çalışıyorsa MAF sensörü kesinlikle bozuktur.",
      "Hava filtresini söküp emiş borusunun içini kontrol edin, fiziksel bir tıkanıklık (yaprak, poşet) varsa çıkarın.",
      "Multimetre ile MAF soketinde 12V (veya 5V referans) ve Şasi bağlantısı olduğunu doğrulayın.",
      "Kablo demetinde kopukluk yoksa MAF sensörünü yenisi ile değiştirin."
    ],
    severity: "yüksek",
    affectedSystem: "Hava ve Yakıt Karışım Sistemi"
  },
  'P0128': {
    description: "P0128 arıza kodu, motor soğutma sıvısı sıcaklığının (Coolant Temperature) termostat tarafından belirlenen düzene ulaşmadığını (beklenen sürede ısınmadığını) bildirir. Modern motorların verimli ve düşük emisyonlu çalışabilmesi için yaklaşık 85°C - 95°C sıcaklığa ulaşması gerekir. Termostat, motor suyu ısınana kadar suyu motor içinde hapsederek radyatöre göndermeyen mekanik bir valftir. Termostat açık konumda takılı kalırsa motor suyu sürekli soğur ve motor hiçbir zaman ideal sıcaklığa ulaşamaz.",
    symptoms: [
      "Motor arıza ışığının (MIL) yanması",
      "Hararet göstergesinin çok yavaş yükselmesi veya uzun yolda sürat yapıldığında çeyrek seviyesine hatta sıfıra kadar düşmesi",
      "Kaloriferin içeriye sıcak hava yerine ılık veya soğuk hava üflemesi",
      "Motor soğuk çalıştığı için (Closed Loop rejimine geçemediğinden) yakıt tüketiminin ciddi oranda artması"
    ],
    causes: [
      "Soğutma sıvısı termostatının açık pozisyonda (veya erken açacak şekilde) bozulması (En yaygın sebep)",
      "Motor Soğutma Sıvısı Sıcaklık (ECT) sensörünün yanlış, düşük değer ölçmesi",
      "Soğutma fanının sürekli, yüksek devirde aralıksız çalışması",
      "Radyatör suyunun bitmesi (nadiren de olsa bu kodu tetikleyebilir)"
    ],
    solutions: [
      "Termostat muhtemelen açık kalmıştır. Çözüm %90 oranında termostatın yenilenmesidir.",
      "Termostat değiştirmeden önce, OBD cihazı veya canlı veri okuyucu ile motor sıcaklığını (ECT) izleyin. Cihazda gösterilen sıcaklık ile göstergedeki tutmuyorsa sorun ECT sensöründedir.",
      "Araç fanının motor soğukken bile çalışıp çalışmadığını kontrol edin; rölesi takılı kaldıysa motor ısınamaz.",
      "Termostat değişimi sırasında antifriz yenilemesi de yapılması önerilir."
    ],
    severity: "orta",
    affectedSystem: "Motor Soğutma Sistemi"
  },
  'P0340': {
    description: "P0340 kodu, Eksantrik Mili Konum Sensörü (Camshaft Position Sensor - CMP) 'A' devresinde bir arıza olduğunu gösterir. Bu sensör, eksantrik milinin dönüş hızını ve konumunu ECU'ya bildirerek, ECU'nun yakıt enjeksiyonunu ve ateşleme zamanlamasını (senkronizasyon) tam mili miline ayarlamasını sağlar. Bu sensörden sinyal alınamazsa, ECU ateşleme yapacağı zamanı bilemez ve araç ya hiç çalışmaz ya da çok zor marş alır.",
    symptoms: [
      "Motor arıza lambası yanar",
      "Motorun marş basmasına rağmen çalışmaması (No start)",
      "Uzun marş süresi (Araç ancak 5-10 saniye marş yaptıktan sonra çalışır)",
      "Seyir halindeyken motorun aniden stop etmesi ve tekrar zor çalışması",
      "Düzensiz rölanti, gaz yememe ve güç kaybı"
    ],
    causes: [
      "Eksantrik sensörünün tamamen arızalanması (ısıya bağlı iç devre kopması sık görülür)",
      "Sensör soketinde oksitlenme veya tesisatta kısa/açık devre",
      "Triger kayışının/zincirinin sente atlaması veya gevşemesi (Zamanlama hatası)",
      "Zayıf akü voltajı veya marş motoru parazitleri"
    ],
    solutions: [
      "Sensörün elektrik bağlantısını, sokette yağ sızıntısı olup olmadığını kontrol edin ve balata spreyi ile temizleyin.",
      "Sensörü söküp ucunda metal talaşı birikip birikmediğine bakın (manyetik olduğu için talaş toplar ve okumayı bozar).",
      "Sensörün arızalı olup olmadığını ölçü aleti (veya daha iyisi osiloskop) ile test edin, bozuksa orjinal parça ile değiştirin.",
      "Sensör değişmesine rağmen hata devam ediyorsa, triger kayışı/zinciri zamanlamasını (sente) kontrol ettirin."
    ],
    severity: "yüksek",
    affectedSystem: "Ateşleme ve Zamanlama Sistemi"
  },
  'P0446': {
    description: "P0446 arıza kodu, Evaporatif Emisyon (EVAP) Sisteminin Havalandırma (Vent) Kontrol Devresinde bir elektriksel arıza olduğunu belirtir. Havalandırma valfi, aktif karbon kutusuna dışarıdan temiz hava girmesini sağlar veya sistemin kendi basıncını test edebilmesi için valfi kapatarak sistemi mühürler. ECU, bu valfe giden devrede bir direnç, kısa devre veya açık devre tespit ettiğinde bu kodu oluşturur. Sistem sızıntısı (P0442) kodundan farklı olarak bu, direkt elektriksel bir devre sorunudur.",
    symptoms: [
      "Motor arıza lambasının yanması",
      "Bazen akaryakıt istasyonunda depoyu doldururken zorlanma veya pompanın sürekli atması",
      "Araç sürüş dinamiklerinde hiçbir değişiklik hissedilmemesi"
    ],
    causes: [
      "Havalandırma (Vent) solenoid valfinin bobininin yanması veya sıkışması",
      "Vent valfi soketine su veya çamur dolması (Valf genellikle aracın altında veya arka çamurluk davlumbazında yer aldığı için suya maruz kalır)",
      "Havalandırma filtresinin veya valfinin örümcek ağları, böcekler veya toz ile tıkanması",
      "Kablo demetinde kopukluk"
    ],
    solutions: [
      "Aracın altına girerek Vent valfini (genellikle karbon canisterın yanındadır) bulun, fişini çekin ve korozyon/su kontrolü yapın.",
      "Multimetre ile valf soketine 12V gelip gelmediğini kontrol edin.",
      "Valfi söküp doğrudan aküden 12V verin. 'Klik' sesi çıkarmıyor veya hava geçişini kapatmıyorsa valf arızalıdır, yenisi ile değiştirin.",
      "Valf çalışıyorsa hortumlardaki fiziki tıkanıklıkları (örümcek yuvası gibi) basınçlı hava ile temizleyin."
    ],
    severity: "düşük",
    affectedSystem: "EVAP Sistemi"
  }
};

let enrichedCount = 0;

for (let i = 0; i < codesData.length; i++) {
  const codeObj = codesData[i];
  if (enrichedCodes[codeObj.code]) {
    const enriched = enrichedCodes[codeObj.code];
    codesData[i] = {
      ...codeObj,
      description: enriched.description,
      symptoms: enriched.symptoms,
      causes: enriched.causes,
      solutions: enriched.solutions,
      severity: enriched.severity,
      affectedSystem: enriched.affectedSystem
    };
    enrichedCount++;
  }
}

fs.writeFileSync(codesFile, JSON.stringify(codesData, null, 2));

console.log(`Successfully enriched ${enrichedCount} OBD codes with Long-Tail SEO content.`);
