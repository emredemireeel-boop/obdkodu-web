# obdkodu.com yayın ve SEO geçiş notları

Eski `obdkodu-web` projesi `https://www.obdkodu.com` alan adını canonical olarak kullanıyor. Yeni site de bu adresi kullanır. HTTP ve kök alan adı `https://www.obdkodu.com` adresine **301** yönlendirilmelidir. Yayın öncesi mevcut DNS, TLS sertifikası ve hosting kök dizini doğrulanmalıdır.

## Kritik yönlendirmeler

`npm run build`, hostingden bağımsız `deploy/redirects.csv` tablosunu üretir. Tabloyu kullandığınız sağlayıcının yönlendirme paneline 301 kuralları olarak aktarın. Ayrıntılı rehberi bulunan eski `/kod/P0420` adresleri doğrudan yeni `/ariza-kodlari/p0420/` sayfalarına taşınır. `deploy/nginx-code-redirects.conf` yalnızca Nginx kullanan kurulumlar için ek bir örnektir.

Apache dışındaki hostinglerde rehberi olmayan eski kod adresleri için `/kod/{KOD}` → `/ariza-kodlari/?q={KOD}` yönlendirmesi kurulabilir. Bu ikinci grubun eski sıralamalarının korunacağı garanti edilemez; eski sayfalar ile yeni arama görünümü aynı içerik değildir. Mümkünse kalan eski kod yollarını eski uygulamada sunmaya devam edin.

Eski `/arama`, `/hakkinda`, `/kaynaklar-ve-metodoloji`, `/gizlilik-politikasi` ve `/sistem` adresleri de yakın yeni sayfalara yönlendirilir. CSV ve Nginx örneği her build sonrası yeni rehber sayfalarını kapsayacak şekilde yeniden üretilir.

## Kaldırılmaması gereken eski içerik

Eski projede `/marka/…`, `/gosterge-paneli/…`, `/sistem/…` ve `/kod/P0420/hyundai` gibi marka özel sayfalar bulunuyor. Yeni sürüm bunların eşdeğerini henüz üretmiyor. Bunları 404'e düşürmek veya ilgisiz sayfalara topluca yönlendirmek organik trafik ve ziyaretçi deneyimi açısından risklidir. Apache kurulumunda `deploy/apache-route-rules.conf` eski ana dalın Node sunucusuna (yalnızca 127.0.0.1:3000) vekil sunucu olarak yönlendirir. Seçilmiş kodlar yeni rehbere 301 ile geçer; kalan eski kod detayları eski uygulamada kalır. `/kullanim-kosullari` da eski uygulamada sunulur.

Apache ile yayın için `deploy/apache-obdkodu.conf` dosyası örnek sanal sunucu yapılandırmasıdır. `rewrite`, `proxy`, `proxy_http`, `headers` ve `deflate` modülleri etkin olmalıdır. HTTPS ve kanonik alan adı yönlendirmesi sertifika kurulduktan sonra ayrıca doğrulanmalıdır.

## Statik yayın

Yeni `dist/` klasörünü web köküne koyun. Nginx için dizin URL'lerinde `index.html` hizmeti verilmeli; bulunmayan yollara `dist/404.html` ile gerçek **404** yanıtı dönmelidir. Örnek yerleşim:

```nginx
root /var/www/obdkoduwebb/dist;
index index.html;
include /var/www/obdkoduwebb/deploy/nginx-code-redirects.conf;

location / {
    try_files $uri $uri/ =404;
}

error_page 404 /404.html;
location = /404.html { internal; }
```

Bu Nginx örneği yalnızca o altyapıyı kullananlar içindir; farklı hostingte panelin statik site ve yönlendirme ayarlarını kullanın. Örnek, eski uygulamanın hâlâ sunacağı yollar için gerekli proxy bloklarını içermez. Nginx kullanılıyorsa canlı dosyaya doğrudan kopyalamadan önce mevcut bloklarla birleştirin ve `nginx -t` çalıştırın.

## Yayın sonrası

1. Ana sayfa, birkaç rehber, eski `/kod/P0420`, sitemap ve robots için gerçek HTTP durum kodlarını kontrol edin.
2. `https://www.obdkodu.com/sitemap.xml` adresini Google Search Console'a gönderin.
3. Search Console'da 404, soft 404, yinelenen canonical ve yönlendirme raporlarını izleyin.
4. Eski site haritaları yeni sunucuda açık kalacaksa eski, kaldırılan adresleri listeden çıkarın. Yeni sitemap yalnızca yeni kanonik sayfaları içerir.
5. Canlı alan adındaki e-posta adresi ve gizlilik metnini işletme bilgilerine göre doğrulayın.

Arama sonucu sıralaması teknik yapılandırmayla garanti edilmez. Buradaki amaç taranabilir, tutarlı ve kullanıcıya yararlı bir geçiş sağlamaktır.
