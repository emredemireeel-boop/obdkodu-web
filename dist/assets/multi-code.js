(() => {
  const input = document.querySelector('#multi-codes');
  const button = document.querySelector('#multi-analyze');
  const output = document.querySelector('#multi-results');
  if (!input || !button || !output) return;

  const relationRules = [
    { codes:['P0300','P0420'], title:'Tekleme ve katalizör verimi', text:'Aktif tekleme katalizör ölçümünü etkileyebilir. Önce tekleme, yakıt karışımı ve egzoz koşullarını değerlendir; yalnızca P0420 ile konvertör kararı verme.', first:'P0300' },
    { codes:['P0300','P0430'], title:'Tekleme ve Bank 2 katalizör verimi', text:'Tekleme Bank 2 katalizör değerlendirmesini etkileyebilir. Tekleme nedeni ve egzoz koşulları çözülmeden konvertör değişimine karar verme.', first:'P0300' },
    { codes:['P0171','P0300'], title:'Fakir karışım ve tekleme', text:'Hava kaçağı veya yakıt beslemesi gibi ortak nedenler her iki kodu da oluşturabilir. Yakıt düzeltmeleri, emme hattı ve tekleme sayaçlarını birlikte incele.', first:'P0171' },
    { codes:['P0174','P0300'], title:'Bank 2 fakir karışım ve tekleme', text:'Bank 2 yakıt düzeltmeleri ile tekleme sayaçlarını karşılaştır. Ortak hava/yakıt sorunu olasılığını araştırmadan parça değiştirme.', first:'P0174' },
    { codes:['P0101','P0171'], title:'Hava ölçümü ve fakir karışım', text:'MAF okuması, emme hattındaki kaçak veya yakıt beslemesi yakıt düzeltmesini etkileyebilir. MAF değişiminden önce canlı veriyi ve kaçakları doğrula.', first:'P0101' },
    { codes:['P0102','P0171'], title:'Düşük MAF sinyali ve fakir karışım', text:'MAF devresi ile karışım kodu ilişkili olabilir. Sensör beslemesini, emme kaçağını ve yakıt düzeltmelerini birlikte değerlendir.', first:'P0102' },
    { codes:['P0562','U0101'], title:'Düşük gerilim ve şanzıman iletişimi', text:'Düşük sistem gerilimi modül iletişimini bozabilir. Önce akü, şarj ve şase koşullarını doğrulayıp U0101 kaydını tekrar değerlendir.', first:'P0562' },
    { codes:['P0562','U0100'], title:'Düşük gerilim ve ECM iletişimi', text:'Modüller arası iletişim kesintisinden önce sistem gerilimi, besleme ve şase bağlantılarını kontrol et.', first:'P0562' },
    { codes:['P0700','P0730'], title:'Şanzıman uyarısı ve hatalı oran', text:'P0700 genellikle TCM tarafındaki ayrıntılı arızayı bildirir. Şanzıman modülündeki P0730 kaydı, hız verileri ve kayma koşulları önceliklidir.', first:'P0730' },
    { codes:['P0700','P0740'], title:'Şanzıman uyarısı ve TCC devresi', text:'P0700 bildirici kod olabilir. TCC devresi, kavrama komutu ve şanzıman yağı verisini araç prosedürüne göre incele.', first:'P0740' },
    { codes:['P2452','P2463'], title:'DPF basınç ölçümü ve kurum yükü', text:'Basınç sensörü devresi arızalıysa filtre yükü yorumu yanıltıcı olabilir. Sensör, hortum ve gerçek karşı basıncı doğrulamadan zorla rejenerasyona karar verme.', first:'P2452' },
    { codes:['P2453','P2463'], title:'DPF basınç verisi ve filtre kısıtlanması', text:'Basınç sensörü aralık hatası, kurum yükü değerlendirmesini etkileyebilir. Önce ölçüm devresini ve hortumları doğrula; ardından gerçek filtre durumunu değerlendir.', first:'P2453' }
  ];
  const safety = {
    P0AA6:'Yüksek voltaj izolasyon uyarısında turuncu kablolara ve batarya muhafazasına müdahale etmeyin.',
    B0001:'Hava yastığı devresinde rastgele ölçüm yapmayın; SRS prosedürünü eğitimli teknisyen uygulamalıdır.',
    B0010:'Hava yastığı devresinde rastgele ölçüm yapmayın; SRS prosedürünü eğitimli teknisyen uygulamalıdır.',
    B0020:'Yan hava yastığı devresinde rastgele ölçüm yapmayın; SRS prosedürünü eğitimli teknisyen uygulamalıdır.',
    P0300:'Motor arıza lambası yanıp sönüyorsa veya aktif tekleme varsa aracı zorlamadan güvenli yerde durun.',
    P2463:'DPF yükü ve basınç verisi doğrulanmadan zorla rejenerasyon uygulamayın.'
  };
  const make = (tag, content, className) => {
    const el = document.createElement(tag);
    if (content) el.textContent = content;
    if (className) el.className = className;
    return el;
  };
  const parse = raw => [...new Set(raw.toUpperCase().split(/[\s,;+/]+/).map(x=>x.trim()).filter(Boolean))];
  const params = new URLSearchParams(location.search);
  if (params.has('kodlar')) input.value = params.get('kodlar').slice(0,120);
  let cache;
  const data = () => cache ??= Promise.all([
    fetch('/assets/catalog.json').then(r => { if (!r.ok) throw new Error('Dizin yüklenemedi'); return r.json(); }),
    fetch('/assets/guide-codes.json').then(r => { if (!r.ok) throw new Error('Rehberler yüklenemedi'); return r.json(); })
  ]).then(([catalog,guides])=>({catalog:new Map(catalog.map(x=>[x.code,x])), guides:new Set(guides)}));
  const renderError = message => {
    output.replaceChildren(make('p',message,'multi-error'));
    output.hidden=false;
  };
  const run = async () => {
    const codes=parse(input.value);
    if (!codes.length) return renderError('Önce en az bir kod girin.');
    if (codes.length > 6) return renderError('Bir seferde en fazla altı kod girin.');
    const invalid=codes.filter(x=>!/^[PBCU][0-9A-F]{4}$/.test(x));
    if (invalid.length) return renderError('Kod biçimini kontrol edin: '+invalid.join(', ')+'. Örnek: P0420.');
    button.disabled=true;
    try {
      const {catalog,guides}=await data();
      const known=codes.filter(x=>catalog.has(x));
      const unknown=codes.filter(x=>!catalog.has(x));
      const matches=relationRules.filter(x=>x.codes.every(code=>codes.includes(code)));
      output.replaceChildren();
      output.append(make('span','03 / SONUÇ','eyebrow'),make('h2',codes.length+' kod birlikte değerlendiriliyor'));
      output.append(make('p','Önce kodların hangi modülde ve hangi koşulda oluştuğunu kaydet. Aşağıdaki ilişkiler olasılıktır; araç özel tanı verisi olmadan neden kesinleşmez.','multi-result-intro'));
      if (unknown.length) output.append(make('p','Dizinde bulunmayan kodlar: '+unknown.join(', ')+'. Araç üreticisinin servis bilgisinden karşılaştırın.','multi-warning'));
      const alerts=known.filter(x=>safety[x]);
      if (alerts.length) {
        const alertBox=make('div','','multi-alert');
        alertBox.append(make('strong','Önce güvenlik'));
        for (const code of alerts) alertBox.append(make('p',code+': '+safety[code]));
        output.append(alertBox);
      }
      const grid=make('div','','multi-result-grid');
      const relations=make('section','','multi-result-card');
      relations.append(make('span','BİRLİKTE OKUMA','eyebrow'),make('h3',matches.length?'Olası ilişkiler':'Önce ortak koşulları ara'));
      if (matches.length) {
        for (const item of matches) {
          const row=make('div','','multi-relation');
          row.append(make('strong',item.codes.join(' + ')+' · '+item.title),make('p',item.text));
          relations.append(row);
        }
      } else relations.append(make('p','Bu kod çifti için önceden doğrulanmış bir ilişki notumuz yok. Kodları bağımsız tanı girişleri olarak ele al; oluşma zamanı, besleme koşulları ve ortak belirtileri karşılaştır.'));
      const checklist=make('section','','multi-result-card');
      checklist.append(make('span','BAŞLANGIÇ SIRASI','eyebrow'),make('h3','Veriyi kaybetmeden ilerle'));
      const ol=make('ol');
      for (const step of ['Kayıtlı ve bekleyen kodları, ilgili modülleri ve donma karelerini kaydet.','Arıza lambasının davranışını ve sürüş belirtilerini not et.','Ortak besleme, hava/yakıt veya ağ sorunlarını uygun olduğunda önce değerlendir.','Araç üreticisinin servis prosedürüne göre ölç, onar ve aynı koşullarda tekrar doğrula.']) ol.append(make('li',step));
      checklist.append(ol);
      grid.append(relations,checklist);
      output.append(grid);
      if (known.length) {
        const links=make('div','','multi-guide-links');
        links.append(make('h3','Kod rehberleri'));
        const row=make('div','','multi-guide-row');
        const priority=new Map(matches.map((x,i)=>[x.first,i]));
        known.sort((a,b)=>(priority.get(a)??99)-(priority.get(b)??99));
        for (const code of known) {
          const item=catalog.get(code);
          const link=make('a');
          link.href=guides.has(code)?'/ariza-kodlari/'+code.toLowerCase()+'/':'/ariza-kodlari/?q='+encodeURIComponent(code);
          link.append(make('strong',code),make('span',item.name),make('small',guides.has(code)?'Ayrıntılı rehberi aç ↗':'Dizin kaydını aç ↗'));
          row.append(link);
        }
        links.append(row);output.append(links);
      }
      const share=make('button','Bağlantıyı kopyala','multi-share');
      share.type='button';
      share.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);share.textContent='Bağlantı kopyalandı';}catch{share.textContent='Tarayıcının adres çubuğundan kopyalayın';}});
      const next=new URL(location.href);
      next.searchParams.set('kodlar',codes.join(','));
      history.replaceState(null,'',next.pathname+next.search);
      output.append(share);
      output.hidden=false;
      output.scrollIntoView({behavior:'smooth',block:'start'});
    } catch {renderError('Kod dizini yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.');}
    finally {button.disabled=false;}
  };
  button.addEventListener('click',run);
  for (const example of document.querySelectorAll('[data-multi-example]')) example.addEventListener('click',()=>{input.value=example.dataset.multiExample;run();});
  if (input.value) run();
})();
