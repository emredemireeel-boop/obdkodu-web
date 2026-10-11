// Each model entry is reviewed against a manufacturer manual. Do not infer that
// the linked generic DTC examples occur more often on this model.
export default [
  {
    slug:'hyundai/i20', name:'Hyundai i20', short:'i20', maker:'Hyundai',
    description:'Hyundai i20 arıza kodunu doğru okumak için beş karakterli OBD kodu, gösterge uyarısı ve model yılı ayrımını öğrenin. P97 gibi eksik kodları nasıl doğrulayacağınızı görün.',
    intro:'i20’de görülen bir uyarı lambası veya kısa ekran mesajı, tek başına OBD arıza kodu değildir. Önce tam kodu ve aracın yılını kaydet; sonra kodun genel anlamını ve Hyundai kılavuzundaki uyarıyı birlikte değerlendir.',
    distinction:'Hyundai Türkiye, i20 için 2016’dan 2024’e farklı kullanıcı kılavuzları yayımlıyor. Gösterge simgesi ve uyarı açıklaması için aracınızın yılına uygun kitapçığı seçin. Motor arıza lambası emisyon veya güç aktarma denetimiyle ilgili olabilir; kod numarasını öğrenmek için uygun bir okuyucuyla kayıtlı ve bekleyen DTC’leri okuyun.',
    example:'“i20 P97” aramasındaki P97, standart beş karakterli DTC’yi tamamlamaz. Son iki karakteri tahmin edip parça önermeyin. Okuyucu ekranında P0… veya P1… ile başlayan tam kodu, varsa ek alt kodu ve hangi modülden geldiğini kaydedin.',
    modelStep:'Araç yılı ve motor tipini, lambanın sabit mi yanıp söndüğünü, sürüşteki belirtiyi, tam DTC’yi ve donma karesini bir araya getirin. Hyundai kılavuzundaki ilgili gösterge açıklaması ile kod rehberini karşılaştırın.',
    examples:['P0300','P0420','P0171'],
    sourceUrl:'https://www.hyundai.com/tr/tr/satis-sonrasi/kullanici-el-kitabi.html',
    sourceText:'Hyundai Türkiye i20 kullanıcı el kitapları',
    manualUrl:'https://dmassets.hyundai.com/is/content/hyundaiautoever/i20-BC3-PEpdf',
    manualText:'2024 i20 resmi kullanım kılavuzu',
    faqs:[
      ['Hyundai i20 P97 arıza kodu nedir?','P97 tek başına standart beş karakterli OBD kodu değildir. Okuyucudaki tam kodu yeniden kontrol edin; eksik karakterleri tahmin ederek teşhis yapmayın.'],
      ['i20 motor arıza lambası yanınca kod nereden öğrenilir?','Gösterge lambası sorunu bildirir; tam DTC için uyumlu bir teşhis cihazıyla araçtaki ilgili modülün kayıtlarını okuyun. Yıl ve motor bilgisini de not edin.']
    ]
  },
  {
    slug:'renault/clio', name:'Renault Clio', short:'Clio', maker:'Renault',
    description:'Renault Clio arıza kodu ve gösterge mesajını ayırın. STOP, servis ve egzoz emisyon uyarılarında neyi kaydedeceğinizi, tam OBD kodunu nasıl yorumlayacağınızı öğrenin.',
    intro:'Clio’da gösterge ekranı çoğu zaman bir mesaj ve ikaz ışığı gösterir; OBD okuyucu ise ayrı bir beş karakterli kayıt verir. “Egzoz emisyon kontrol ettirin” mesajından doğrudan belirli bir P kodu çıkarmak doğru değildir.',
    distinction:'Renault’nun Clio kılavuzunda çalışma arızası mesajlarıyla birlikte servis uyarısı görülebilir. STOP uyarısı ise güvenli biçimde durmayı gerektirir. İkazın türünü ve metnini aynen not etmek, arıza kodunun hangi koşulda oluştuğunu anlamaya yardımcı olur.',
    example:'“Clio egzoz emisyon kontrol ettirin” mesajı partikül filtresi veya emisyon azaltma sistemiyle ilişkili olabilecek farklı durumları kapsar. Tek bir parça veya DTC varsaymayın; tam kodu ve motor tipini okuyun.',
    modelStep:'Ekrandaki mesajı fotoğraflayın, STOP veya servis lambasını ayırın, yıl ve motor bilgisini ekleyin. Kayıtlı/bekleyen kodları ve donma karesini okuyup üretici kılavuzundaki mesajla eşleştirin.',
    examples:['P0401','P2002','P0300'],
    sourceUrl:'https://www.user-manual.renault.com/tr/yol-bilgisayar%C4%B1/calisma-arizalari-mesajlari-2',
    sourceText:'Renault Clio çalışma arızaları mesajları',
    manualUrl:'https://www.user-manual.renault.com/tr/content/clio/getting-know-your-vehicle/ikaz-isiklari',
    manualText:'Clio ikaz ışıkları açıklaması',
    faqs:[
      ['Clio “egzoz emisyon kontrol ettirin” mesajı hangi koddur?','Mesaj tek bir OBD koduna karşılık gelmez. Motor tipine göre ilgili modüldeki tam DTC okunmalı ve kılavuzdaki mesaj açıklamasıyla değerlendirilmelidir.'],
      ['Clio STOP uyarısı görünürse ne yapmalıyım?','Renault kılavuzundaki STOP uyarısı güvenli bir yerde durmayı gerektirir. Aracı zorlamayın; mevcut uyarıları kaydedip uzman yardımına başvurun.']
    ]
  },
  {
    slug:'fiat/egea', name:'Fiat Egea', short:'Egea', maker:'Fiat',
    description:'Fiat Egea arıza kodu, EOBD kaydı ve gösterge mesajı arasındaki farkı öğrenin. Sedan/Cross, model yılı ve motor bilgisiyle tam kodu doğrulama adımları.',
    intro:'Egea’nın ekrandaki uyarısı ile EOBD teşhis cihazının verdiği DTC aynı şey değildir. Model yılı, gövde ve motor seçeneği değiştikçe uyarıların açıklaması da farklılaşabilir; tam kodu okumadan arızalı parça belirlenmez.',
    distinction:'Fiat Egea kullanım kılavuzunda EOBD sistemi ile uyarı ışıkları ve mesajları ayrı başlıklarda açıklanır. Gösterge mesajını olduğu gibi kaydedip aynı anda teşhis cihazının hangi modülde hangi kodu gösterdiğine bakın.',
    example:'“Egea motor arızası” tek başına P kodunun anlamını vermez. Kod P0 ile başlıyorsa genel tanımı okuyabilirsiniz; üreticiye özgü kodda aracın yıl, motor ve servis verisi gerekir. Dizel/benzinli veya Cross/Sedan varsayımı yapmayın.',
    modelStep:'Ekran mesajı, uyarı simgesi, tam beş karakterli kod, yıl, motor ve eşlik eden kodları not edin. Önce basit besleme/bağlantı kontrollerini, ardından üreticinin ilgili test sırasını izleyin.',
    examples:['P0087','P0299','P0300'],
    sourceUrl:'https://www.fiat.com.tr/owners/kullanim-kilavuzlari',
    sourceText:'Fiat Egea kullanım kılavuzları',
    manualUrl:'https://www.fiat.com.tr/content/dam/fiat2023/tr/kullanim-kilavuzlari/egea/2024/egea-sedan-kullanim-kilavuzu-agustos-aralik-2024.pdf',
    manualText:'2024 Egea Sedan resmi kılavuzu',
    faqs:[
      ['Egea ekrandaki uyarı bir OBD kodu mudur?','Her zaman değil. Gösterge metni bir durumu tarif eder; beş karakterli DTC ilgili kontrol ünitesinden teşhis cihazıyla okunur.'],
      ['Fiat Egea için hangi kılavuza bakmalıyım?','Aracınızın yılını ve gövde tipini seçerek Fiat’ın resmi kullanım kılavuzundaki ilgili uyarı bölümünü açın.']
    ]
  },
  {
    slug:'toyota/corolla', name:'Toyota Corolla', short:'Corolla', maker:'Toyota',
    description:'Toyota Corolla arıza ışıkları ve OBD kodlarını karıştırmadan yorumlayın. Motor, fren ve hibrit uyarılarını ayırıp model yılına uygun resmi kılavuzu bulun.',
    intro:'Corolla’da motor arıza, fren, ABS veya hibrit sistemi uyarıları farklı sistemleri anlatır. Bir uyarıyı gelişigüzel P koduna dönüştürmek yanıltıcı olur; önce simgeyi ve tam DTC’yi ayrı ayrı tanımlayın.',
    distinction:'Toyota Türkiye farklı Corolla yılları ve gövde seçenekleri için ayrı kullanıcı el kitapları yayımlar. Kılavuzda arıza uyarı ışığı motor/elektronik kontrol sistemiyle ilişkilendirilebilir; fren ve ABS uyarıları ise ayrı değerlendirilir. Hibrit modellerde yüksek gerilim bileşenlerine kullanıcı müdahalesi yapılmamalıdır.',
    example:'“Corolla motor arıza ışığı” sorgusu tek bir DTC değildir. Aracın benzinli veya hibrit oluşunu, yılı, ekrandaki simgeyi, sesli uyarıyı ve teşhis cihazındaki tam kodu birlikte kaydedin.',
    modelStep:'Önce uyarının hangi sistemde olduğunu kılavuzla doğrulayın. Sürüş güvenliğini etkileyen fren veya güç kaybı varsa aracı güvenli yere alın. Ardından ilgili modüldeki DTC ve donma karesiyle teşhise geçin.',
    examples:['P0420','P0300','U0100'],
    sourceUrl:'https://www.toyota.com.tr/satis-sonrasi-hizmetler/kullanici-el-kitaplari',
    sourceText:'Toyota Türkiye Corolla kullanıcı el kitapları',
    faqs:[
      ['Corolla motor arıza ışığı hangi koda karşılık gelir?','Tek bir koda karşılık gelmez. Tam DTC, araç yılı ve motor/hibrid bilgisiyle birlikte okunmalıdır.'],
      ['Corolla hibrit uyarısında aynı OBD adımları geçerli mi?','Göstergeyi ve kodu okumak yine ilk adımdır; yüksek gerilim sistemi için üreticinin güvenlik prosedürleri ve eğitimli teknisyen gereklidir.']
    ]
  }
];
