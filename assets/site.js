(() => {
  const menu = document.querySelector('.menu-toggle');
  const mobile = document.querySelector('#mobile-nav');
  if (menu && mobile) menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    mobile.hidden = !open;
  });

  for (const button of document.querySelectorAll('[data-copy]')) button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      const label = button.querySelector('span');
      label.textContent = 'Kopyalandı';
      setTimeout(() => label.textContent = 'Kopyala', 1800);
    } catch { /* Clipboard may be unavailable in local previews. */ }
  });

  const norm = s => String(s || '').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
  const featuredOrder = new Map(['P0420','P0300','P0171','P0128','P0442','P0700'].map((code,index)=>[code,index]));
  const familyOrder = { P:0, B:1, C:2, U:3 };
  let dataPromise;
  const getData = () => dataPromise ??= Promise.all([
    fetch('/assets/catalog.json').then(r => { if (!r.ok) throw new Error('Katalog yüklenemedi'); return r.json(); }),
    fetch('/assets/guide-codes.json').then(r => { if (!r.ok) throw new Error('Rehberler yüklenemedi'); return r.json(); })
  ]).then(([catalog, codes]) => ({ catalog, codes: new Set(codes) }));

  const homeForm = document.querySelector('[data-search-form]');
  if (homeForm) {
    const input = homeForm.querySelector('input');
    const suggestions = homeForm.querySelector('[data-suggestions]');
    let data;
    const hide = () => { suggestions.hidden = true; suggestions.replaceChildren(); };
    const show = () => {
      const q = norm(input.value.trim());
      if (!data || q.length < 2) return hide();
      const matches = data.catalog.filter(item => norm(item.code).includes(q) || norm(item.name).includes(q)).sort((a,b) => Number(b.code.toLowerCase()===q) - Number(a.code.toLowerCase()===q)).slice(0,5);
      suggestions.replaceChildren();
      for (const item of matches) {
        const link = document.createElement('a');
        link.href = data.codes.has(item.code) ? `/ariza-kodlari/${item.code.toLowerCase()}/` : `/ariza-kodlari/?q=${encodeURIComponent(item.code)}`;
        const code = document.createElement('strong'); code.textContent = item.code;
        const label = document.createElement('span'); label.textContent = item.name;
        link.append(code,label); suggestions.append(link);
      }
      suggestions.hidden = !matches.length;
    };
    input.addEventListener('focus', () => getData().then(d => {data=d;show();}).catch(hide));
    input.addEventListener('input', show);
    input.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
    document.addEventListener('click', event => { if (!homeForm.contains(event.target)) hide(); });
    homeForm.addEventListener('submit', async event => {
      event.preventDefault();
      const q = input.value.trim();
      if (!q) { input.focus(); return; }
      try {
        const { codes } = await getData();
        const code = q.toUpperCase();
        if (codes.has(code)) { location.href = `/ariza-kodlari/${code.toLowerCase()}/`; return; }
      } catch { /* Directory remains reachable. */ }
      location.href = `/ariza-kodlari/?q=${encodeURIComponent(q)}`;
    });
  }

  const catalogInput = document.querySelector('[data-catalog-search]');
  if (catalogInput) {
    const resultEl = document.querySelector('#catalog-results');
    const countEl = document.querySelector('#catalog-count');
    const more = document.querySelector('#load-more');
    const filters = [...document.querySelectorAll('[data-filter]')];
    const scopes = [...document.querySelectorAll('[data-scope]')];
    const params = new URLSearchParams(location.search);
    const validCategory = ['P','B','C','U'].includes(params.get('kategori')) ? params.get('kategori') : 'ALL';
    let active = validCategory;
    let scope = ['GUIDE','TR'].includes(params.get('icerik')) ? params.get('icerik') : 'ALL';
    let catalog = [];
    let codes = new Set();
    let matched = [];
    let limit = 30;
    catalogInput.value = params.get('q') || '';
    const setUrl = () => {
      const next = new URL(location.href);
      const q = catalogInput.value.trim();
      if (q) next.searchParams.set('q',q); else next.searchParams.delete('q');
      if (active !== 'ALL') next.searchParams.set('kategori',active); else next.searchParams.delete('kategori');
      if (scope !== 'ALL') next.searchParams.set('icerik',scope); else next.searchParams.delete('icerik');
      history.replaceState(null,'',next.pathname + next.search);
    };
    const render = () => {
      const q = norm(catalogInput.value.trim());
      matched = catalog.filter(item => (active === 'ALL' || item.category === active) && (scope === 'ALL' || (scope === 'GUIDE' ? codes.has(item.code) : item.lang === 'tr')) && (!q || norm(item.code).includes(q) || norm(item.name).includes(q) || norm(item.system).includes(q)));
      matched.sort((a,b) => {
        if (q) return Number(norm(b.code)===q)-Number(norm(a.code)===q) || Number(codes.has(b.code))-Number(codes.has(a.code)) || a.code.localeCompare(b.code);
        const aFeatured=featuredOrder.get(a.code) ?? 999;
        const bFeatured=featuredOrder.get(b.code) ?? 999;
        return aFeatured-bFeatured || Number(codes.has(b.code))-Number(codes.has(a.code)) || (familyOrder[a.category]??9)-(familyOrder[b.category]??9) || a.code.localeCompare(b.code);
      });
      const visible = matched.slice(0,limit);
      resultEl.replaceChildren();
      if (!visible.length) {
        const empty = document.createElement('div'); empty.className='catalog-empty';
        const heading = document.createElement('strong'); heading.textContent='Bu aramayla kod bulunamadı.';
        const text = document.createElement('span'); text.textContent='Kodu boşluksuz yazmayı veya daha kısa bir terim aramayı dene.';
        empty.append(heading,text); resultEl.append(empty);
      }
      for (const item of visible) {
        const hasGuide = codes.has(item.code);
        const entry = document.createElement('div'); entry.className='catalog-entry';
        const row = document.createElement(hasGuide ? 'a' : 'button');
        row.className = `catalog-row${hasGuide ? ' has-guide' : ''}`;
        if (hasGuide) row.href = `/ariza-kodlari/${item.code.toLowerCase()}/`;
        else {row.type='button';row.setAttribute('aria-expanded','false');row.setAttribute('aria-controls',`entry-${item.code}`);}
        const code = document.createElement('strong'); code.textContent=item.code;
        const title = document.createElement('span'); title.textContent=item.name;
        if(item.lang==='en')title.lang='en';
        const kind = document.createElement('small'); kind.textContent=hasGuide ? 'Ayrıntılı rehber ↗' : item.lang==='en' ? 'İngilizce kaynak adı ↓' : 'Dizin kaydı ↓';
        row.append(code,title,kind); entry.append(row);
        if(!hasGuide){
          const panel=document.createElement('div');panel.className='catalog-panel';panel.id=`entry-${item.code}`;panel.hidden=true;
          const heading=document.createElement('strong');heading.textContent=`${item.code} · ${item.lang==='en'?'İngilizce kaynak adı':'Türkçe dizin kaydı'}`;
          const note=document.createElement('p');note.textContent=item.lang==='en'?'Bu kodun Türkçe rehberi henüz hazırlanmadı. Kaynak adı OBDex verisinden alınmıştır. Aracınızın marka/model servis bilgisini karşılaştırın.':'Bu kodun ayrıntılı rehberi henüz hazırlanmadı. Kodun tek başına arızalı parçayı doğrulamadığını unutmayın; diğer kodlar ve canlı verilerle değerlendirin.';
          const source=document.createElement('a');source.href='/yontem-ve-kaynaklar/';source.textContent='Kaynak ve yöntem →';
          panel.append(heading,note,source);entry.append(panel);
          row.addEventListener('click',()=>{const open=panel.hidden;panel.hidden=!open;row.setAttribute('aria-expanded',String(open));});
        }
        resultEl.append(entry);
      }
      countEl.textContent = `${matched.length.toLocaleString('tr-TR')} kod gösteriliyor`;
      more.hidden = matched.length <= limit;
      filters.forEach(button => button.classList.toggle('active',button.dataset.filter===active));
      scopes.forEach(button => button.classList.toggle('active',button.dataset.scope===scope));
      setUrl();
    };
    catalogInput.addEventListener('input', () => {limit=30;render();});
    filters.forEach(button => button.addEventListener('click', () => {active=button.dataset.filter;limit=30;render();}));
    scopes.forEach(button => button.addEventListener('click', () => {scope=button.dataset.scope;limit=30;render();}));
    more.addEventListener('click', () => {limit+=30;render();});
    document.addEventListener('keydown', event => {
      if (event.key==='/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {event.preventDefault();catalogInput.focus();}
    });
    getData().then(data => {catalog=data.catalog;codes=data.codes;render();}).catch(() => {countEl.textContent='Kod dizini yüklenemedi. Sayfayı yenileyin.';});
  }
})();
