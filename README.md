# OBDKODU

OBD arıza kodlarını anlaşılır Türkçe ile açıklayan, bağımsız ve statik bir web sitesi.

## Çalıştırma

Node.js 20 veya üzeri yeterlidir; paket kurulumu gerekmez.

```bash
npm run build
npm run dev
```

Yerel önizleme `http://localhost:4173` adresindedir. Yayın için `dist/` klasörünün **içeriğini** `obdkodu.com` alan adının web köküne yükleyin. Sunucu, klasörlerdeki `index.html` dosyasını servis etmelidir. Örnek Nginx kuralı: `try_files $uri $uri/ =404;`.

## İçerik düzenleme

- `data/catalog.json`: 12.181 kodluk aranabilir dizin; 9.533 genel OBDex kodu ve önceki projeden yerel kayıtlar. 3.551 kayıt Türkçe ad taşır. Dizin kaydı, tek başına bir onarım önerisi değildir.
- `data/guides.json`: Önceki projeden seçilmiş 57 Türkçe rehber.
- `data/curated-guides.mjs`: Bu sürümde yeniden yazılmış 24 kod rehberi; 81 ayrıntılı sayfa üretilir.
- `scripts/build.mjs`: Sayfa şablonları, editoryal düzeltmeler, bağlantılar, JSON-LD, sitemap ve robots.
- `assets/site.css`, `assets/site.js` ve `assets/multi-code.js`: Görsel tasarım, arama ve çoklu kod yorumlama aracı.
- `assets/fonts/`: Yerel DM Sans ve Manrope fontları; OFL lisans metinleri aynı klasörde.

Yeni kod rehberi eklemek için `data/curated-guides.mjs` içine dikkatle doğrulanmış bir kayıt ekleyip `npm run build` çalıştırın. `data/catalog.json` içindeki kodlar aranabilir; yalnızca seçilmiş rehberlerin ayrı sayfası oluşturulur. Bu, otomatik üretilmiş zayıf sayfaların dizine girmesini önler. `scripts/expand-data.mjs` yalnızca aynı masaüstündeki eski projeden yeniden içe aktarma gerektiğinde kullanılmalıdır; normal build için eski proje gerekmez.

`/kodlari-birlikte-yorumla/` sayfası, kullanıcıların birkaç kodu birlikte değerlendirmesine yardımcı olur. Kuralları `assets/multi-code.js` içinde sınırlı ve açık biçimde tanımlıdır; otomatik teşhis iddiası taşımaz. Kod verisi yalnızca arama ve bu araç kullanıldığında indirilir.

## SEO ve yayın kontrolü

Üretim kanonik alan adı, mevcut projenin URL geçmişini korumak için `https://www.obdkodu.com` olarak ayarlıdır. Kök alan adı ve HTTP sürümleri HTTPS `www` adresine 301 ile yönlendirilmelidir. `robots.txt`, `sitemap.xml`, canonical URL, Open Graph ve JSON-LD üretilir. Google Search Console'da alan adını doğrulayıp sitemap'i gönderin. FAQPage şeması yapısal anlam taşır; Google, Mayıs 2026'dan beri FAQ zengin sonucunu göstermiyor.

Eski sitenin `/kod/P0420` benzeri adreslerini, marka ve gösterge sayfalarını yayından kaldırmadan önce [geçiş notlarını](deploy/MIGRATION.md) uygulayın. Hostingden bağımsız yönlendirme tablosu `deploy/redirects.csv` içinde; Nginx örneği `deploy/nginx-code-redirects.conf` içindedir.

İletişim sayfasında site sahibinin verdiği `birakiyoruziletisim@gmail.com` adresi kullanılır. Kurumsal kimlik bilgilerini yayın öncesi kendi bilgilerinizle tamamlayın. Sitede uydurma uzman, müşteri yorumu veya fiyat iddiası bulunmaz.

## Kaynak ve editoryal yaklaşım

Dizin ve rehber başlangıcı, aynı bilgisayardaki mevcut `obdkodu-web` projesinden alınmıştır. O proje, [OBDex](https://github.com/foerbsnavi/obdex) CC0 verisini de içerir. Sitedeki yöntem ve kaynak sayfası okuyucuya veri kapsamını açıklar. Tanı önerileri üretici servis prosedürünün yerine geçmez; kod genellikle arızalı parçayı değil, kontrol edilmesi gereken sistemi belirtir.
