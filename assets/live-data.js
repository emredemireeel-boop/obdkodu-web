(() => {
  const form = document.querySelector('[data-trim-form]');
  if (!form) return;
  const result = document.querySelector('[data-trim-result]');
  const error = document.querySelector('[data-trim-error]');
  const copy = document.querySelector('[data-trim-copy]');
  let summary = '';
  const fmt = n => new Intl.NumberFormat('tr-TR', {maximumFractionDigits:1,minimumFractionDigits:1}).format(n);
  const read = name => {
    const raw = form.elements[name].value.trim().replace(',', '.');
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= -100 && n <= 100 ? n : null;
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    const names = ['idleShort','idleLong','revShort','revLong'];
    const values = names.map(read);
    if (values.some(v => v === null)) {
      error.textContent = 'Dört değeri de −100 ile +100 arasında sayı olarak girin. Ondalık için virgül veya nokta kullanabilirsiniz.';
      result.hidden = true;
      copy.hidden = true;
      return;
    }
    error.textContent = '';
    const [idleShort,idleLong,revShort,revLong] = values;
    const idle = idleShort + idleLong;
    const rev = revShort + revLong;
    result.hidden = false;
    result.querySelector('[data-idle-total]').textContent = `${idle > 0 ? '+' : ''}${fmt(idle)} puan`;
    result.querySelector('[data-rev-total]').textContent = `${rev > 0 ? '+' : ''}${fmt(rev)} puan`;
    result.querySelector('[data-trim-difference]').textContent = `${Math.abs(idle - rev).toLocaleString('tr-TR',{maximumFractionDigits:1})} puan`;
    const direction = n => n > 0 ? 'pozitif' : n < 0 ? 'negatif' : 'sıfıra yakın';
    result.querySelector('[data-trim-reading]').textContent = `Rölantide basit toplam ${direction(idle)}, sabit devirde ${direction(rev)}. Pozitif düzeltme yakıt ekleme, negatif düzeltme yakıt azaltma yönünü anlatır. Bu karşılaştırma tek başına arızalı parçayı belirlemez.`;
    summary = `OBDKODU canlı veri notu — Bank 1\nRölanti: STFT ${fmt(idleShort)}%, LTFT ${fmt(idleLong)}%, basit toplam ${fmt(idle)} puan\nSabit devir: STFT ${fmt(revShort)}%, LTFT ${fmt(revLong)}%, basit toplam ${fmt(rev)} puan\nKoşul: motor sıcak, kapalı çevrim; araç ve eşlik eden kodlar ayrıca kaydedilmeli.`;
    copy.hidden = false;
  });
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(summary); copy.textContent = 'Not kopyalandı ✓'; }
    catch { copy.textContent = 'Kopyalama kullanılamıyor'; }
  });
})();
