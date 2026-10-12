const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export default function commentSection(code) {
  const safeCode = esc(code);
  return `<section class="detail-section comments-section" id="deneyimler">
    <span class="section-nr">SÜRÜCÜ DENEYİMLERİ</span>
    <div class="comments-heading"><div><h2>Bu kod sende nasıl çözüldü?</h2><p>${safeCode} için yaşadığın belirtiyi ve denediğin çözümü araç bilgisiyle paylaş. Gerçek deneyimler, aynı kodu araştıranlara yol gösterir.</p></div><span class="comments-badge">Topluluk notları</span></div>
    <!--COMMENTS_SLOT-->
    <form class="comment-form" action="/yorumlar/ekle" method="post" accept-charset="UTF-8" data-comment-form>
      <h3>Deneyimini ekle</h3><p class="comment-form-intro">Üyelik gerekmez. Paylaştığın ad, araç ve deneyim herkes tarafından görülebilir.</p>
      <input type="hidden" name="code" value="${safeCode}">
      <div class="comment-trap" aria-hidden="true"><label>Web sitesi<input name="website" tabindex="-1" autocomplete="off"></label></div>
      <div class="comment-fields two"><label>Adın<input name="firstName" autocomplete="given-name" maxlength="40" required></label><label>Soyadın<input name="lastName" autocomplete="family-name" maxlength="40" required></label></div>
      <div class="comment-fields two"><label>Marka<input name="brand" list="vehicle-brands" autocomplete="off" maxlength="50" required data-vehicle-brand><datalist id="vehicle-brands"></datalist></label><label>Model<input name="model" list="vehicle-models" autocomplete="off" maxlength="60" required data-vehicle-model><datalist id="vehicle-models"></datalist></label></div>
      <div class="comment-fields"><label>Model yılı <span class="optional">isteğe bağlı</span><input name="year" type="number" min="1980" max="2030" inputmode="numeric" placeholder="Örn. 2017"></label></div>
      <div class="comment-fields"><label>Arızayı nasıl fark ettin?<textarea name="symptom" maxlength="1000" minlength="20" rows="3" placeholder="Belirtiler, eşlik eden kodlar ve kontrol ettiğin veriler..." required></textarea></label><label>Nasıl çözüldü? <span class="optional">isteğe bağlı</span><textarea name="solution" maxlength="1000" rows="3" placeholder="Ölçüm, yapılan işlem ve sonrasında ne değişti?"></textarea></label><label>Ek not <span class="optional">isteğe bağlı</span><textarea name="note" maxlength="600" rows="2" placeholder="Aynı sorunu yaşayanlara yararlı olabilecek başka bir ayrıntı"></textarea></label></div>
      <label class="comment-consent"><input type="checkbox" name="consent" value="yes" required><span>Adım, araç bilgim ve yazdıklarımın bu sayfada herkese açık yayımlanmasını kabul ediyorum. <a href="/gizlilik/">Gizlilik bilgisi</a></span></label>
      <button class="button button-primary" type="submit">Deneyimi paylaş <span aria-hidden="true">↗</span></button><p class="comment-privacy">Plaka, telefon, e-posta veya kişisel iletişim bilgisi yazma. Gönderiler içerik denetiminden geçer; onarım tavsiyesi yerine deneyim olarak değerlendirilmelidir.</p>
    </form><script src="/assets/comments.js" defer></script>
  </section>`;
}
