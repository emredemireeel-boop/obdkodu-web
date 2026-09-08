const SYSTEMS = {
  airbag: { key: 'airbag', name: 'SRS / Hava Yastığı Sistemi' },
  brakes: { key: 'fren-abs-esp', name: 'Fren, ABS ve Denge Kontrolü' },
  steering: { key: 'direksiyon', name: 'Direksiyon ve Sürüş Kontrolü' },
  hybrid: { key: 'hibrit-elektrik', name: 'Hibrit / Elektrikli Tahrik ve Yüksek Voltaj' },
  transmission: { key: 'sanziman', name: 'Şanzıman ve Aktarma Sistemi' },
  emissions: { key: 'emisyon', name: 'Emisyon ve Egzoz Kontrolü' },
  fuel: { key: 'yakit', name: 'Yakıt Besleme ve Enjeksiyon' },
  intake: { key: 'hava-turbo', name: 'Hava Emişi ve Turbo Basıncı' },
  cooling: { key: 'sogutma', name: 'Motor Soğutma Sistemi' },
  ignition: { key: 'atesleme', name: 'Ateşleme ve Yanma Kontrolü' },
  network: { key: 'can-bus', name: 'CAN Bus ve Modüller Arası İletişim' },
  electrical: { key: 'elektrik', name: 'Elektrik, Besleme ve Şarj Sistemi' },
  body: { key: 'govde', name: 'Gövde ve Konfor Elektroniği' },
  engine: { key: 'motor', name: 'Motor Yönetim Sistemi' },
};

const TITLE_TRANSLATIONS = [
  [/lost communication with/gi, 'ile iletişim kaybı'],
  [/invalid data received from/gi, 'biriminden geçersiz veri alındı'],
  [/control module communication bus/gi, 'kontrol modülü iletişim veri yolu'],
  [/catalyst system efficiency below threshold/gi, 'katalizör sistemi verimliliği eşik altında'],
  [/warm up catalyst efficiency below threshold/gi, 'ısınma katalizörü verimliliği eşik altında'],
  [/evaporative emission control system/gi, 'buharlaşma emisyon kontrol sistemi'],
  [/exhaust gas recirculation/gi, 'egzoz gazı devridaimi (EGR)'],
  [/diesel particulate filter/gi, 'dizel partikül filtresi (DPF)'],
  [/oxygen sensor/gi, 'oksijen sensörü'],
  [/heated oxygen sensor/gi, 'ısıtmalı oksijen sensörü'],
  [/air\/fuel ratio sensor/gi, 'hava/yakıt oranı sensörü'],
  [/mass or volume air flow/gi, 'kütlesel veya hacimsel hava akışı'],
  [/mass air flow/gi, 'kütlesel hava akış (MAF)'],
  [/manifold absolute pressure/gi, 'manifold mutlak basınç (MAP)'],
  [/intake air temperature/gi, 'emme havası sıcaklığı'],
  [/engine coolant temperature/gi, 'motor soğutma suyu sıcaklığı'],
  [/throttle\/pedal position/gi, 'gaz kelebeği/pedal konumu'],
  [/throttle position/gi, 'gaz kelebeği konumu'],
  [/camshaft position/gi, 'eksantrik mili konumu'],
  [/crankshaft position/gi, 'krank mili konumu'],
  [/fuel rail pressure/gi, 'yakıt ray basıncı'],
  [/fuel pressure/gi, 'yakıt basıncı'],
  [/fuel volume regulator/gi, 'yakıt hacim regülatörü'],
  [/fuel injector/gi, 'yakıt enjektörü'],
  [/ignition coil/gi, 'ateşleme bobini'],
  [/glow plug/gi, 'kızdırma bujisi'],
  [/knock sensor/gi, 'vuruntu sensörü'],
  [/turbocharger\/supercharger/gi, 'turbo/süperşarj'],
  [/boost pressure/gi, 'aşırı besleme basıncı'],
  [/transmission fluid pressure/gi, 'şanzıman yağı basıncı'],
  [/transmission control system/gi, 'şanzıman kontrol sistemi'],
  [/shift solenoid/gi, 'vites değiştirme solenoidi'],
  [/torque converter clutch/gi, 'tork konvertörü kavraması'],
  [/anti-lock brake system/gi, 'kilitlenme önleyici fren sistemi (ABS)'],
  [/wheel speed sensor/gi, 'tekerlek hız sensörü'],
  [/steering angle sensor/gi, 'direksiyon açı sensörü'],
  [/power steering/gi, 'direksiyon desteği'],
  [/air bag|airbag/gi, 'hava yastığı'],
  [/restraint system/gi, 'yolcu koruma sistemi'],
  [/seat belt/gi, 'emniyet kemeri'],
  [/hybrid battery pack/gi, 'hibrit batarya paketi'],
  [/drive motor/gi, 'tahrik motoru'],
  [/battery charger/gi, 'batarya şarj ünitesi'],
  [/control circuit range\/performance/gi, 'kontrol devresi menzil/performans arızası'],
  [/circuit range\/performance/gi, 'devre menzil/performans arızası'],
  [/control circuit\/open/gi, 'kontrol devresi açık'],
  [/circuit\/open/gi, 'devre açık'],
  [/control circuit low/gi, 'kontrol devresi düşük'],
  [/control circuit high/gi, 'kontrol devresi yüksek'],
  [/circuit low/gi, 'devre düşük sinyal'],
  [/circuit high/gi, 'devre yüksek sinyal'],
  [/circuit intermittent/gi, 'devre kesintili'],
  [/control circuit/gi, 'kontrol devresi'],
  [/sensor circuit/gi, 'sensör devresi'],
  [/actuator circuit/gi, 'aktüatör devresi'],
  [/system too lean/gi, 'sistem çok fakir'],
  [/system too rich/gi, 'sistem çok zengin'],
  [/random\/multiple cylinder misfire detected/gi, 'rastgele/birden fazla silindirde tekleme algılandı'],
  [/cylinder ([0-9]+) misfire detected/gi, '$1. silindirde tekleme algılandı'],
  [/misfire detected/gi, 'tekleme algılandı'],
  [/pressure too low/gi, 'basınç çok düşük'],
  [/pressure too high/gi, 'basınç çok yüksek'],
  [/temperature too high/gi, 'sıcaklık çok yüksek'],
  [/temperature too low/gi, 'sıcaklık çok düşük'],
  [/range\/performance/gi, 'menzil/performans arızası'],
  [/incorrect flow detected/gi, 'hatalı akış algılandı'],
  [/insufficient flow detected/gi, 'yetersiz akış algılandı'],
  [/excessive flow detected/gi, 'aşırı akış algılandı'],
  [/stuck open/gi, 'açık konumda sıkışmış'],
  [/stuck closed/gi, 'kapalı konumda sıkışmış'],
  [/slow response/gi, 'yavaş tepki'],
  [/no activity detected/gi, 'etkinlik algılanmadı'],
  [/signal too low/gi, 'sinyal çok düşük'],
  [/signal too high/gi, 'sinyal çok yüksek'],
  [/performance/gi, 'performans arızası'],
  [/malfunction/gi, 'arıza'],
  [/intermittent/gi, 'kesintili'],
  [/bank ([12])/gi, 'Bank $1'],
  [/sensor ([1234])/gi, 'Sensör $1'],
];

const LINE_TRANSLATIONS = [
  [/check engine light/gi, 'motor arıza lambası'],
  [/warning light/gi, 'uyarı lambası'],
  [/may illuminate/gi, 'yanabilir'],
  [/increased fuel consumption/gi, 'yakıt tüketiminde artış'],
  [/reduced power output/gi, 'güç çıkışında azalma'],
  [/power loss/gi, 'güç kaybı'],
  [/rough idle/gi, 'düzensiz rölanti'],
  [/hard starting/gi, 'zor çalışma'],
  [/engine may stall/gi, 'motor stop edebilir'],
  [/possible limp mode/gi, 'koruma modu olasılığı'],
  [/limp mode/gi, 'koruma modu'],
  [/failed emissions inspection/gi, 'emisyon ölçümünde başarısızlık'],
  [/wiring break/gi, 'kablo kopuğu'],
  [/open wiring/gi, 'açık devre olmuş kablo'],
  [/wiring fault/gi, 'kablo tesisatı arızası'],
  [/shorted to ground/gi, 'şaseye kısa devre'],
  [/short to ground/gi, 'şaseye kısa devre'],
  [/shorted to battery voltage/gi, 'akü gerilimine kısa devre'],
  [/short to power/gi, 'beslemeye kısa devre'],
  [/unplugged connector/gi, 'ayrılmış konnektör'],
  [/connector corrosion/gi, 'konnektör korozyonu'],
  [/connector pins corroded/gi, 'konnektör pinlerinde korozyon'],
  [/connector loose/gi, 'gevşek konnektör'],
  [/sensor failed/gi, 'sensör arızası'],
  [/module failed/gi, 'kontrol modülü arızası'],
  [/module internal fault/gi, 'kontrol modülü iç arızası'],
  [/module unpowered/gi, 'kontrol modülü besleme kaybı'],
  [/internal short/gi, 'iç kısa devre'],
  [/internal fault/gi, 'iç arıza'],
  [/mechanical fault/gi, 'mekanik arıza'],
  [/vacuum leak/gi, 'vakum kaçağı'],
  [/exhaust leak/gi, 'egzoz kaçağı'],
  [/intake leak/gi, 'emme kaçağı'],
  [/contamination/gi, 'kirlenme'],
  [/aged/gi, 'yaşlanmış'],
  [/drifted/gi, 'ölçüm değeri kaymış'],
  [/out of range/gi, 'izin verilen aralığın dışında'],
  [/open circuit/gi, 'açık devre'],
  [/high resistance/gi, 'yüksek direnç'],
  [/low resistance/gi, 'düşük direnç'],
  [/ground/gi, 'şase'],
  [/wiring/gi, 'kablo tesisatı'],
  [/connector/gi, 'konnektör'],
  [/sensor/gi, 'sensör'],
  [/control module/gi, 'kontrol modülü'],
];

const DEFAULT_SYMPTOMS = {
  airbag: ['Airbag/SRS uyarı lambasının yanması', 'İlgili yolcu koruma devresinin devre dışı kalabilmesi', 'Sürüşte belirgin motor belirtisi görülmemesi'],
  brakes: ['ABS/ESP veya fren uyarı lambasının yanması', 'Denge ve çekiş desteklerinin sınırlanabilmesi', 'Kaygan zeminde fren davranışının değişebilmesi'],
  steering: ['Direksiyon uyarı lambasının yanması', 'Direksiyon desteğinin azalabilmesi', 'Manevra sırasında direksiyonun ağırlaşabilmesi'],
  hybrid: ['Hibrit/EV sistem uyarısının görünmesi', 'Güç kısıtlaması veya koruma modu', 'Şarj ya da elektrikli sürüş işlevinin sınırlanması'],
  transmission: ['Şanzıman veya motor arıza lambasının yanması', 'Vites geçişlerinde sertlik/gecikme', 'Şanzımanın koruma moduna geçebilmesi'],
  emissions: ['Motor arıza lambasının yanması', 'Emisyon değerlerinin bozulabilmesi', 'Yakıt tüketimi veya motor tepkisinde değişiklik'],
  fuel: ['Motor arıza lambasının yanması', 'Zor çalışma, stop etme veya güç kaybı', 'Yakıt tüketiminde ya da egzoz kokusunda değişiklik'],
  intake: ['Motor arıza lambasının yanması', 'Çekiş düşüklüğü veya gaz tepkisinde gecikme', 'Rölanti ve yakıt tüketiminde değişiklik'],
  cooling: ['Sıcaklık uyarısı veya motor arıza lambası', 'Hararet eğilimi ya da fanın olağan dışı çalışması', 'Motor performansının korunma amacıyla kısıtlanması'],
  ignition: ['Motor arıza lambasının yanması', 'Tekleme, sarsıntı veya güç kaybı', 'Yakıt tüketimi ve egzoz emisyonunda artış'],
  network: ['Birden fazla uyarı lambasının birlikte yanması', 'İlgili kontrol modülüne erişilememesi', 'Bazı işlevlerin koruma moduna geçmesi'],
  electrical: ['Akü/şarj veya genel arıza uyarısı', 'Aralıklı elektriksel sorunlar', 'Bazı kontrol modüllerinin kapanması ya da yeniden başlaması'],
  body: ['İlgili konfor veya gövde işlevinin çalışmaması', 'Gösterge panelinde uyarı mesajı', 'Çoğu durumda motor çalışmasının etkilenmemesi'],
  engine: ['Motor arıza lambasının yanması', 'Motor performansı veya rölantide değişiklik', 'Yakıt tüketiminin artabilmesi'],
};

const DEFAULT_CAUSES = {
  transmission: ['Şanzıman yağı seviyesi veya yağın durumuyla ilgili sorun', 'İlgili sensör, solenoid ya da aktüatör arızası', 'Kablo, konnektör, besleme veya şase sorunu'],
  emissions: ['Egzoz veya emisyon hattında kaçak, tıkanma ya da kirlenme', 'İlgili sensörün ölçüm veya ısıtıcı devresi arızası', 'Kablo, konnektör, besleme veya şase sorunu'],
  fuel: ['Yakıt basıncı, enjektör veya yakıt besleme sorunu', 'İlgili sensör ya da regülatör arızası', 'Kablo, konnektör, besleme veya şase sorunu'],
  intake: ['Emme hattında kaçak, kirlenme veya hava akışı kısıtlaması', 'MAF, MAP, sıcaklık veya basınç sensörü arızası', 'Kablo, konnektör, besleme veya şase sorunu'],
  cooling: ['Termostat, fan veya soğutma devresi sorunu', 'Soğutma suyu sıcaklık sensörü arızası', 'Kablo, konnektör, besleme veya şase sorunu'],
  ignition: ['Buji, ateşleme bobini veya yanma kalitesi sorunu', 'Krank/eksantrik sinyali ya da yakıt besleme sorunu', 'Kablo, konnektör, besleme veya şase sorunu'],
  electrical: ['Sistem geriliminin düşük veya kararsız olması', 'İlgili röle, sigorta ya da kontrol devresi arızası', 'Kablo, konnektör, besleme veya şase sorunu'],
  engine: ['İlgili sensör veya aktüatörün beklenen aralık dışında çalışması', 'Mekanik ayar, zamanlama ya da hava-yakıt koşulu sorunu', 'Kablo, konnektör, besleme veya şase sorunu'],
};

const SYSTEM_DIAGNOSIS_FOCUS = {
  transmission: 'Teşhiste şanzıman yağı seviyesi ve durumu, TCM canlı verileri, sensör-solenoid komutları ve tesisat birlikte değerlendirilmelidir.',
  emissions: 'Teşhiste egzoz kaçakları, sensör canlı verileri, ısıtıcı devreleri ve emisyon bileşenlerinin gerçek çalışma koşulları birlikte kontrol edilmelidir.',
  fuel: 'Teşhiste yakıt basıncı, pompa ve regülatör komutları, enjektör dengesi ve sensör değerleri üretici teknik verisiyle karşılaştırılmalıdır.',
  intake: 'Teşhiste emme kaçakları, hava ölçümü, gaz kelebeği verileri ve turbo basıncı aynı çalışma koşulunda karşılaştırılmalıdır.',
  cooling: 'Teşhiste soğuk çalıştırma verisi, gerçek soğutma suyu sıcaklığı, termostat ve fan kumandası birlikte izlenmelidir.',
  ignition: 'Teşhiste tekleme sayaçları, ateşleme ve yakıt beslemesi ile krank-eksantrik senkronu birlikte incelenmelidir.',
  electrical: 'Teşhiste akü gerilimi, şarj sistemi, sigorta-röle hattı ve yük altındaki gerilim düşümü ölçülmelidir.',
  engine: 'Teşhiste donma karesi, ilgili canlı veri kanalları, mekanik durum ve elektrik devresi birlikte değerlendirilmelidir.',
};

const CRITICAL_PATTERNS = [
  /oil pressure too low|low engine oil pressure|yağ basıncı (çok )?düşük/i,
  /engine overtemperature|coolant overtemperature|overheat|hararet/i,
  /fuel leak|yakıt kaçağı/i,
  /brake fluid pressure|fren hidrolik basıncı/i,
  /high voltage.*isolation|yüksek voltaj.*yalıtım/i,
];

const HIGH_PATTERNS = [
  /misfire|tekleme/i,
  /air ?bag|srs|restraint|hava yastığı/i,
  /anti-lock|\babs\b|brake|fren/i,
  /steering|direksiyon/i,
  /throttle actuator|gaz kelebeği aktüatörü/i,
  /crankshaft position|krank mili konumu/i,
  /transmission|şanzıman/i,
  /hybrid|high voltage|drive motor|hibrit|yüksek voltaj|tahrik motoru/i,
];

const LOW_PATTERNS = [
  /courtesy lamp|vanity lamp|license plate lamp|washer|interior light/i,
  /ayna|iç aydınlatma|plaka lambası|cam yıkama/i,
];

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function translateAutomotiveText(value, titleMode = false) {
  let output = normalizeText(value);
  const replacements = titleMode ? [...TITLE_TRANSLATIONS, ...LINE_TRANSLATIONS] : [...LINE_TRANSLATIONS, ...TITLE_TRANSLATIONS];
  replacements.forEach(([pattern, replacement]) => {
    output = output.replace(pattern, replacement);
  });
  return output.replace(/\s+/g, ' ').trim();
}

function hasLikelyEnglish(value) {
  return /\b(the|with|from|and|circuit|sensor|control|pressure|temperature|performance|incorrect|invalid|module|system|received|routing|messages|failed|fault|supply|signal|stuck|range)\b/i.test(value);
}

function classifySystem(code) {
  // The first DTC character is authoritative for the top-level system.
  if (code.category === 'U' || String(code.code || '').startsWith('U')) return SYSTEMS.network;
  const text = normalizeText([
    code.code,
    code.name,
    code.titleEn,
    code.description,
    code.descriptionEn,
    code.affectedSystem,
    ...(code.affectedComponents || []),
  ].join(' ')).toLocaleLowerCase('tr-TR');

  if (/air ?bag|srs|restraint|pretensioner|seat belt|hava yastığı/.test(text)) return SYSTEMS.airbag;
  if (/anti-lock|\babs\b|brake|yaw|traction|stability|fren|denge kontrol/.test(text)) return SYSTEMS.brakes;
  if (/steering|direksiyon/.test(text)) return SYSTEMS.steering;
  if (/hybrid|electric vehicle|high voltage|drive motor|traction battery|hibrit|elektrikli|yüksek voltaj|tahrik motor/.test(text)) return SYSTEMS.hybrid;
  if (/transmission|gear|shift|torque converter|clutch|şanzıman|vites|kavrama/.test(text)) return SYSTEMS.transmission;
  if (/catalyst|oxygen sensor|nox|reductant|exhaust|emission|evap|egr|particulate|kataliz|oksijen sensörü|egzoz|emisyon|dpf/.test(text)) return SYSTEMS.emissions;
  if (/coolant|cooling fan|thermostat|soğutma|hararet/.test(text)) return SYSTEMS.cooling;
  if (/fuel|injector|rail pressure|yakıt|enjektör/.test(text)) return SYSTEMS.fuel;
  if (/turbo|boost|intake|manifold|air flow|map sensor|maf sensor|emme|hava akış/.test(text)) return SYSTEMS.intake;
  if (/misfire|ignition|spark|knock|glow plug|ateşleme|tekleme|vuruntu|kızdırma/.test(text)) return SYSTEMS.ignition;
  if (/communication|data bus|can bus|network|serial data|iletişim|veri yolu/.test(text) || code.category === 'U') return SYSTEMS.network;
  if (/voltage|battery|generator|alternator|power supply|ground|gerilim|akü|şarj|besleme|şase/.test(text)) return SYSTEMS.electrical;
  if (code.category === 'B') return SYSTEMS.body;
  return SYSTEMS.engine;
}

function severityKey(value) {
  const normalized = normalizeText(value).toLocaleLowerCase('tr-TR');
  if (['critical', 'kritik'].includes(normalized)) return 'critical';
  if (['high', 'yüksek'].includes(normalized)) return 'high';
  if (['medium', 'orta'].includes(normalized)) return 'medium';
  return 'low';
}

function buildSeverityAssessment(code) {
  const system = classifySystem(code);
  const text = normalizeText(`${code.name} ${code.titleEn} ${code.description} ${code.descriptionEn} ${code.affectedSystem}`);
  let level = severityKey(code.severity);

  if (CRITICAL_PATTERNS.some((pattern) => pattern.test(text))) level = 'critical';
  else if (HIGH_PATTERNS.some((pattern) => pattern.test(text)) || code.flags?.limp_mode_possible) level = 'high';
  else if (LOW_PATTERNS.some((pattern) => pattern.test(text))) level = 'low';
  else if (code.flags?.emissions_relevant || code.flags?.mil || ['P', 'C', 'U'].includes(code.category)) level = level === 'low' ? 'medium' : level;

  const config = {
    low: {
      label: 'Düşük', emoji: '🟢', headline: 'Düşük risk',
      drivable: 'Genellikle evet. Uyarı davranışını izleyin ve uygun zamanda teşhis planlayın.',
      continueRisk: 'Sorun büyüyebilir veya ilgili konfor/izleme işlevi devre dışı kalabilir; kodu uzun süre görmezden gelmeyin.',
      action: 'Planlı kontrol önerilir.',
    },
    medium: {
      label: 'Orta', emoji: '🟡', headline: 'Orta risk',
      drivable: 'Kırmızı uyarı, hararet, yakıt kokusu, belirgin güç kaybı veya yanıp sönen motor lambası yoksa kısa ve sakin sürüş çoğu durumda mümkündür.',
      continueRisk: 'Yakıt tüketimi, emisyon veya sürüş kalitesi bozulabilir; arıza başka kodları tetikleyebilir.',
      action: 'Kısa sürede arıza tespiti yaptırın.',
    },
    high: {
      label: 'Yüksek', emoji: '🟠', headline: 'Yüksek risk',
      drivable: 'Yalnızca araç normal tepki veriyor ve kırmızı güvenlik uyarısı yoksa en yakın güvenli servise kadar sınırlı sürüş düşünülmelidir.',
      continueRisk: 'Koruma modu, yolda kalma, emisyon sistemi hasarı veya ilgili güvenlik desteğinin devre dışı kalması mümkündür.',
      action: 'Aynı gün profesyonel kontrol önerilir.',
    },
    critical: {
      label: 'Kritik', emoji: '🔴', headline: 'Kritik – En kısa sürede kontrol edilmeli',
      drivable: 'Hayır. Aracı güvenli bir yerde durdurun; motoru kapatın ve gerekiyorsa çekici kullanın.',
      continueRisk: 'Sürüşe devam etmek ciddi mekanik hasar, yangın/yakıt riski veya sürüş güvenliği kaybına yol açabilir.',
      action: 'Sürüşe devam etmeyin; acil profesyonel destek alın.',
    },
  }[level];

  const affectsFuel = ['engine', 'ignition', 'fuel', 'intake', 'emissions', 'transmission', 'cooling'].includes(
    Object.entries(SYSTEMS).find(([, value]) => value.key === system.key)?.[0]
  );
  const affectsInspection = code.flags?.emissions_relevant || ['brakes', 'steering', 'airbag'].some((key) => SYSTEMS[key].key === system.key);
  const canDamage = ['critical', 'high'].includes(level) || ['ignition', 'fuel', 'cooling', 'hybrid', 'transmission'].some((key) => SYSTEMS[key].key === system.key);

  const inspection = code.flags?.emissions_relevant
    ? 'Geçememe riski vardır. Kod emisyonla ilişkiliyse egzoz ölçüm değerleri ve uyarı durumu sonucu olumsuz etkileyebilir; kesin karar ölçüm ve muayenede verilir.'
    : affectsInspection
      ? 'Geçememe riski vardır. Güvenlik sistemi uyarısı veya işlev kaybı muayene sonucunu olumsuz etkileyebilir; tek başına DTC kesin sonucu göstermez.'
      : 'Kod tek başına muayene sonucunu belirlemez. İlgili uyarı lambası, sistem işlevi ve ölçüm değerleri birlikte değerlendirilir.';

  const fuelImpact = affectsFuel
    ? 'Etkileyebilir. ECU yedek değer kullanırsa karışım, tork yönetimi veya vites stratejisi değişebilir.'
    : 'Genellikle doğrudan etkilemez; ancak düşük sistem gerilimi veya ağ arızaları dolaylı etki oluşturabilir.';

  const damageRisk = canDamage
    ? 'Vardır. Arızanın niteliğine göre katalizör, motor, şanzıman, yüksek voltaj veya güvenlik sistemi etkilenebilir.'
    : 'Doğrudan ağır hasar riski genellikle düşüktür; arızanın büyümesi veya başka işlevleri etkilemesi mümkündür.';

  return {
    level,
    label: config.label,
    emoji: config.emoji,
    headline: config.headline,
    action: config.action,
    drivable: config.drivable,
    continueRisk: config.continueRisk,
    inspection,
    fuelImpact,
    damageRisk,
    system,
    methodologyNote: 'Bu seviye, kodun sistemi ve tipik etkileri için genel bir önceliklendirmedir. Araçtaki gerçek belirti, eşlik eden kodlar ve üretici prosedürü sonucu değiştirebilir.',
  };
}

function buildDiagnosticSteps(code) {
  const system = classifySystem(code);
  const safetyFirst = ['airbag', 'fren-abs-esp', 'hibrit-elektrik'].includes(system.key)
    ? 'Bu sistem güvenlik veya yüksek voltaj içerir. Üreticinin enerjisiz bırakma ve kişisel koruyucu ekipman prosedürü olmadan devreye müdahale etmeyin.'
    : 'Kırmızı uyarı, hararet, yakıt kokusu veya yanıp sönen motor lambası varsa testi durdurun ve aracı kullanmayın.';

  return [
    { title: 'Güvenliği değerlendirin', text: safetyFirst },
    { title: 'Tüm modülleri tarayın', text: `${code.code} ile birlikte kayıtlı bekleyen, kalıcı ve üreticiye özel kodları not edin; kodları teşhis tamamlanmadan silmeyin.` },
    { title: 'Donma karesini kaydedin', text: 'Devir, motor yükü, sıcaklık, araç hızı ve sistem gerilimini arızanın oluştuğu koşullarla birlikte saklayın.' },
    { title: 'Görsel ve temel kontrolleri yapın', text: `${system.name} için konnektör, kablo, sigorta, şase, hortum ve mekanik bağlantıları servis şemasına göre inceleyin.` },
    { title: 'Canlı veriyi karşılaştırın', text: 'İlgili sensör/aktüatör değerini benzer kanal, ortam koşulu ve üretici referansıyla karşılaştırın; tek bir anlık değere göre parça değiştirmeyin.' },
    { title: 'Devreyi yük altında doğrulayın', text: 'Besleme, şase, gerilim düşümü ve sinyal ölçümlerinde araca özel pin dizilimi ile teknik değerleri kullanın. Evrensel volt/ohm değeri varsaymayın.' },
    { title: 'Onarımı doğrulayın', text: 'Kök neden giderildikten sonra kodu silin, gerekiyorsa adaptasyon yapın ve aynı çalışma koşullarında yol/monitör testiyle kodun dönmediğini kontrol edin.' },
  ];
}

function buildFaqs(code, assessment) {
  const causes = (code.causes || []).slice(0, 3).join(', ');
  return [
    { question: `${code.code} arıza kodu nedir?`, answer: `${code.code}, ${code.name} durumunu ifade eder. Kontrol ünitesi ${code.affectedSystem} içinde beklenen koşulun oluşmadığını kaydetmiştir; kod tek başına arızalı parçayı kanıtlamaz.` },
    { question: `${code.code} ne kadar ciddi?`, answer: `Genel aciliyet seviyesi ${assessment.label} olarak değerlendirilir. ${assessment.action} ${assessment.methodologyNote}` },
    { question: `${code.code} ile araç kullanılabilir mi?`, answer: assessment.drivable },
    { question: `${code.code} görmezden gelinirse ne olur?`, answer: assessment.continueRisk },
    { question: `${code.code} muayeneden geçmeye engel olur mu?`, answer: assessment.inspection },
    { question: `${code.code} yakıt tüketimini artırır mı?`, answer: assessment.fuelImpact },
    { question: `${code.code} başka parçalara zarar verir mi?`, answer: assessment.damageRisk },
    { question: `${code.code} kodunun en sık nedenleri nelerdir?`, answer: causes ? `Öncelikle şu olasılıklar kontrol edilir: ${causes}. Kesin neden ölçümle doğrulanmalıdır.` : 'Kablo, konnektör, besleme/şase, sensör veya aktüatör ve mekanik sistem birlikte kontrol edilmelidir.' },
    { question: `${code.code} kodunu silmek arızayı çözer mi?`, answer: 'Hayır. Kodu silmek yalnızca kaydı ve bazı öğrenilmiş verileri temizler. Kök neden devam ediyorsa kod yeniden oluşur; önce donma karesi kaydedilmeli ve arıza doğrulanmalıdır.' },
    { question: `${code.code} her araçta aynı anlama mı gelir?`, answer: 'Standart/generic kodlarda temel anlam ortaktır; üreticiye ayrılmış kodlarda anlam model yılı, motor, şanzıman ve kontrol ünitesi yazılımına göre değişebilir. VIN uyumlu servis bilgisi esas alınmalıdır.' },
  ];
}

function createFallbackCode(record) {
  const translatedTitle = translateAutomotiveText(record.titleEn, true);
  const localizedTitle = translatedTitle && !hasLikelyEnglish(translatedTitle)
    ? translatedTitle
    : `${record.code} — standart OBD-II kod tanımı`;
  const base = {
    code: record.code,
    category: record.code.charAt(0),
    name: localizedTitle,
    titleEn: record.titleEn,
    descriptionEn: record.descriptionEn,
    affectedComponents: record.affectedComponents || [],
    flags: record.flags || {},
    relatedCodes: record.relatedCodes || [],
    sourceLinks: record.sources || [],
    sourceQuality: 'reference-only',
    sourceDataset: 'OBDex',
  };
  const system = classifySystem(base);
  base.affectedSystem = system.name;
  base.description = `${record.code} standart OBD-II kaydı, “${base.name}” durumunu ifade eder. Kontrol ünitesi ${system.name} içinde beklenen elektriksel, mekanik veya iletişim koşulunun oluşmadığını algılar. Kod, arızalı parçayı tek başına kanıtlamaz; üretici servis bilgisi ve ölçüm sonucu ile doğrulanmalıdır.`;
  base.symptoms = (record.symptomsEn || [])
    .map((line) => translateAutomotiveText(line))
    .filter((line) => line && !hasLikelyEnglish(line))
    .slice(0, 6);
  if (base.symptoms.length < 3) base.symptoms = DEFAULT_SYMPTOMS[Object.keys(SYSTEMS).find((key) => SYSTEMS[key].key === system.key) || 'engine'];
  base.causes = (record.causes || [])
    .map((cause) => translateAutomotiveText(cause.labelEn))
    .filter((line) => line && !hasLikelyEnglish(line))
    .slice(0, 6);
  if (base.causes.length < 3) {
    base.causes = ['Kablo veya konnektör arızası', 'Besleme ya da şase sorunu', 'İlgili sensör, aktüatör veya kontrol modülü arızası'];
  }
  base.solutions = buildDiagnosticSteps(base).map((step) => `${step.title}: ${step.text}`);
  base.severity = buildSeverityAssessment(base).level;
  return base;
}

function mergeUnique(items, additions, limit = 7) {
  const seen = new Set();
  return [...(items || []), ...(additions || [])]
    .map(normalizeText)
    .filter((item) => {
      const key = item.toLocaleLowerCase('tr-TR');
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

// Search demand is used only to choose which already-public guides receive a
// deeper editorial scaffold. It is not a shortcut to index every imported row.
function enrichPriorityCode(code) {
  const system = classifySystem(code);
  const systemKey = Object.keys(SYSTEMS).find((key) => SYSTEMS[key].key === system.key) || 'engine';
  const currentDescription = normalizeText(code.description);
  const introduction = `${code.code} arıza kodu, “${code.name}” durumunun kontrol ünitesi tarafından kaydedildiğini gösterir. Bu kayıt ${system.name} kapsamında değerlendirilir; tek başına hangi parçanın değiştirilmesi gerektiğini kanıtlamaz.`;
  const focus = SYSTEM_DIAGNOSIS_FOCUS[systemKey] || SYSTEM_DIAGNOSIS_FOCUS.engine;
  const description = currentDescription.length >= 180
    ? currentDescription
    : `${introduction} ${currentDescription && currentDescription.toLocaleLowerCase('tr-TR') !== code.name.toLocaleLowerCase('tr-TR') ? currentDescription : ''} ${focus} Eşlik eden kodlar, donma karesi ve araç üreticisinin servis prosedürü kesin teşhis için esas alınmalıdır.`.replace(/\s+/g, ' ').trim();
  const defaultCauses = DEFAULT_CAUSES[systemKey] || DEFAULT_CAUSES.engine;

  return {
    ...code,
    seoPriority: true,
    description,
    symptoms: mergeUnique(code.symptoms, DEFAULT_SYMPTOMS[systemKey] || DEFAULT_SYMPTOMS.engine),
    causes: mergeUnique(code.causes, defaultCauses),
    solutions: mergeUnique(code.solutions, buildDiagnosticSteps({ ...code, affectedSystem: system.name }).map((step) => `${step.title}: ${step.text}`)),
  };
}

module.exports = {
  SYSTEMS,
  buildDiagnosticSteps,
  buildFaqs,
  buildSeverityAssessment,
  classifySystem,
  createFallbackCode,
  enrichPriorityCode,
  translateAutomotiveText,
};
