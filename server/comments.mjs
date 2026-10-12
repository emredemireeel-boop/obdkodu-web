import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = process.env.COMMENT_DIST || path.join(root, 'dist');
const dataDir = process.env.COMMENT_DATA_DIR || path.join(root, 'comments-data');
const port = Number(process.env.COMMENT_PORT || 3101);
const domain = 'https://www.obdkodu.com';
const eventFile = path.join(dataDir, 'events.jsonl');
const adminSalt = process.env.COMMENT_ADMIN_SALT || '';
const adminHash = process.env.COMMENT_ADMIN_HASH || '';
const sessionKey = process.env.COMMENT_SESSION_KEY || '';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
const normal = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
const fold = value => normal(value).toLocaleLowerCase('tr').replace(/[çğıöşü]/g, c => ({ç:'c',ğ:'g',ı:'i',ö:'o',ş:'s',ü:'u'}[c]));
const secretReady = adminSalt && adminHash && sessionKey.length >= 32;
const comments = new Map();
const usedIds = new Set();
const limits = new Map();
const codeSet = new Set(JSON.parse(fs.readFileSync(path.join(dist, 'assets/guide-codes.json'), 'utf8')));

fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
if (fs.existsSync(eventFile)) {
  const rows = fs.readFileSync(eventFile, 'utf8').split('\n');
  for (const row of rows) {
    if (!row) continue;
    try {
      const event = JSON.parse(row);
      if (event.type === 'add' && /^\d{8}$/.test(event.comment?.id)) { comments.set(event.comment.id, event.comment); usedIds.add(event.comment.id); }
      if (event.type === 'delete') comments.delete(event.id);
    } catch { console.error('Invalid comments event skipped'); }
  }
}
function save(event) {
  const fd = fs.openSync(eventFile, 'a', 0o600);
  try { fs.writeSync(fd, JSON.stringify(event) + '\n'); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
}
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', ...headers });
  res.end(body);
}
function redirect(res, url) { res.writeHead(303, { Location:url, 'Cache-Control':'no-store' }); res.end(); }
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 7000) { reject(new Error('too-large')); req.destroy(); } });
    req.on('end', () => resolve(new URLSearchParams(body)));
    req.on('error', reject);
  });
}
function originOkay(req) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  return (!origin || origin === domain) && (!referer || referer.startsWith(domain + '/'));
}
const spamWords = /\b(?:amk|aq|orospu|pic|siktir|sikik|yarrak|gotveren|ibne|fahise|gerizekali|salak)\b/i;
function rejectText(fields) {
  const combined = fields.join(' ');
  const folded = fold(combined);
  if (spamWords.test(folded)) return 'Argo veya hakaret içeren ifadeleri çıkarıp yeniden deneyin.';
  if (/(?:https?:\/\/|www\.|\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b|\+?\d[\d\s-]{8,}\d)/i.test(combined)) return 'Bağlantı veya iletişim bilgisi paylaşmayın.';
  if (/[<>]/.test(combined) || /(.)\1{7,}/u.test(combined)) return 'Metni sadeleştirip yeniden deneyin.';
  return '';
}
function rateOkay(ip, area, max, windowMs) {
  const key = `${area}:${ip}`;
  const now = Date.now();
  const recent = (limits.get(key) || []).filter(time => now - time < windowMs);
  if (recent.length >= max) return false;
  recent.push(now); limits.set(key, recent);
  return true;
}
function id() {
  let candidate;
  do { candidate = String(crypto.randomInt(10_000_000, 100_000_000)); } while (usedIds.has(candidate));
  return candidate;
}
function pageFor(code) { return `/ariza-kodlari/${code.toLowerCase()}/`; }
function publicComments(code) { return [...comments.values()].filter(item => item.code === code).sort((a,b) => b.createdAt.localeCompare(a.createdAt)); }
function commentMarkup(item) {
  const date = new Date(item.createdAt).toLocaleDateString('tr-TR', { timeZone:'Europe/Istanbul', year:'numeric', month:'long', day:'numeric' });
  return `<article class="comment-card" id="yorum-${item.id}"><div class="comment-card-top"><div><strong>${esc(item.firstName)} ${esc(item.lastName)}</strong><span>${esc(item.brand)} ${esc(item.model)}${item.year ? ` · ${esc(item.year)}` : ''}</span></div><div class="comment-meta"><time datetime="${esc(item.createdAt)}">${esc(date)}</time><small>Etiket #${item.id}</small></div></div><div class="comment-copy"><strong>Yaşanan belirti</strong><p>${esc(item.symptom)}</p>${item.solution ? `<strong>Uygulanan çözüm</strong><p>${esc(item.solution)}</p>` : ''}${item.note ? `<strong>Ek not</strong><p>${esc(item.note)}</p>` : ''}</div></article>`;
}
function renderComments(code, requestedPage, notice) {
  const all = publicComments(code);
  const pages = Math.max(1, Math.ceil(all.length / 10));
  const current = Math.min(pages, Math.max(1, requestedPage));
  const shown = all.slice((current - 1) * 10, current * 10);
  const base = pageFor(code);
  const links = pages > 1 ? `<nav class="comment-pagination" aria-label="Yorum sayfaları">${Array.from({length:pages}, (_, i) => { const n=i+1; return `<a href="${base}${n===1 ? '#deneyimler' : `?yorum-sayfa=${n}#deneyimler`}"${n===current ? ' aria-current="page"' : ''}>${n}</a>`; }).join('')}</nav>` : '';
  const noticeHtml = notice === 'eklendi' ? '<p class="comment-notice" role="status">Deneyimin yayımlandı. Paylaşımın için teşekkürler.</p>' : notice === 'silindi' ? '<p class="comment-notice" role="status">Yorum kaldırıldı.</p>' : '';
  const intro = `<div class="comment-list-intro"><strong>${all.length ? `${all.length} sürücü deneyimi` : 'İlk deneyim senin olabilir'}</strong><span>${all.length ? 'En yeni paylaşımlar önce gösterilir.' : 'Bu kod hakkında henüz deneyim paylaşılmadı.'}</span></div>`;
  const cards = shown.length ? `<div class="comment-list">${shown.map(commentMarkup).join('')}</div>` : '';
  return { html:noticeHtml + intro + cards + links, current, pages, shown, total:all.length };
}
function renderCode(req, res, code, u) {
  const route = pageFor(code);
  const file = path.join(dist, route, 'index.html');
  if (!fs.existsSync(file)) return send(res, 404, 'Sayfa bulunamadı');
  const requestedPage = /^\d+$/.test(u.searchParams.get('yorum-sayfa') || '') ? Number(u.searchParams.get('yorum-sayfa')) : 1;
  const output = renderComments(code, requestedPage, u.searchParams.get('durum'));
  if (requestedPage > output.pages) return redirect(res, route + (output.pages > 1 ? `?yorum-sayfa=${output.pages}` : '') + '#deneyimler');
  let html = fs.readFileSync(file, 'utf8').replace('<!--COMMENTS_SLOT-->', output.html);
  if (output.current > 1) {
    const canonical = `${domain}${route}?yorum-sayfa=${output.current}`;
    html = html.replace(`<link rel="canonical" href="${domain}${route}">`, `<link rel="canonical" href="${canonical}">`)
      .replace(/<title>[^<]+<\/title>/, `<title>${code} sürücü deneyimleri · ${output.current}. sayfa | OBDKODU</title>`)
      .replace(/<meta name="description" content="[^"]+">/, `<meta name="description" content="${code} kodu için sürücülerin araç, belirti ve çözüm deneyimleri. ${output.current}. sayfadaki ${output.shown.length} paylaşımı okuyun.">`)
      .replace(`<meta property="og:url" content="${domain}${route}">`, `<meta property="og:url" content="${canonical}">`);
  }
  if (output.shown.length) html = html.replace(/<script type="application\/ld\+json">([^<]+)<\/script>/, (whole, source) => {
    const schema = JSON.parse(source);
    const article = schema['@graph'].find(node => node['@type'] === 'TechArticle');
    if (!article) return whole;
    article.comment = output.shown.map(item => ({'@type':'Comment', '@id':`${domain}${route}#yorum-${item.id}`, author:{'@type':'Person',name:`${item.firstName} ${item.lastName}`},datePublished:item.createdAt,text:[item.symptom,item.solution,item.note].filter(Boolean).join(' ')}));
    return `<script type="application/ld+json">${json(schema)}</script>`;
  });
  send(res, 200, html, { 'Cache-Control':'public, max-age=0, must-revalidate' });
}
function adminSession(req) {
  if (!secretReady) return null;
  const match = /(?:^|;\s*)obd_comment_admin=([^;]+)/.exec(req.headers.cookie || '');
  if (!match) return null;
  const [until, nonce, signature] = decodeURIComponent(match[1]).split('.');
  if (!/^\d+$/.test(until) || Number(until) < Date.now() || !/^[a-f0-9]{24}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(signature)) return null;
  const expected = crypto.createHmac('sha256', sessionKey).update(`${until}.${nonce}`).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex')) ? {until, nonce} : null;
}
function csrf(session) { return crypto.createHmac('sha256', sessionKey).update(`csrf:${session.until}.${session.nonce}`).digest('hex'); }
function shell(title, content) { return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(title)} | OBDKODU</title><link rel="stylesheet" href="/assets/site.css"><style>body{background:#f5f8f4}.admin-wrap{max-width:1050px;margin:70px auto;padding:0 22px}.admin-wrap h1{font-size:36px}.admin-card{background:#fff;border:1px solid #dce6de;border-radius:14px;padding:22px;margin:16px 0}.admin-card form{display:inline}.admin-card button{background:#a5342d;color:white;border:0;border-radius:6px;padding:9px 16px;font-weight:700;cursor:pointer}.admin-card input{padding:10px;border:1px solid #bccbc0;border-radius:6px}.admin-head{display:flex;justify-content:space-between;align-items:center;gap:20px}.admin-head a{color:#176449}.admin-detail{white-space:pre-wrap;overflow-wrap:anywhere}.admin-search{margin:25px 0}.admin-search input{width:min(100%,350px)}</style></head><body><main class="admin-wrap">${content}</main></body></html>`; }
function adminPage(req, res, u) {
  const session = adminSession(req);
  if (!session) return send(res, 200, shell('Yorum yönetimi', `<h1>Yorum yönetimi</h1><form class="admin-card" method="post" action="/yorum-yonetimi/giris"><label>Yönetici parolası <input type="password" name="password" required autocomplete="current-password"></label><button type="submit">Giriş yap</button></form>`), {'X-Robots-Tag':'noindex, nofollow'});
  const q = normal(u.searchParams.get('q')).toLocaleLowerCase('tr');
  const all = [...comments.values()].sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  const filtered = q ? all.filter(item => [item.id,item.code,item.firstName,item.lastName,item.brand,item.model].some(value => String(value).toLocaleLowerCase('tr').includes(q))) : all;
  const cards = filtered.slice(0,100).map(item => `<article class="admin-card"><div class="admin-head"><div><strong>#${item.id} · ${esc(item.code)}</strong><p>${esc(item.firstName)} ${esc(item.lastName)} · ${esc(item.brand)} ${esc(item.model)} ${esc(item.year || '')}</p><time>${esc(item.createdAt)}</time></div><form method="post" action="/yorum-yonetimi/sil"><input type="hidden" name="id" value="${item.id}"><input type="hidden" name="csrf" value="${csrf(session)}"><button type="submit" onclick="return confirm('Bu yorumu kaldırmak istiyor musunuz?')">Yorumu kaldır</button></form></div><p class="admin-detail">${esc(item.symptom)}${item.solution ? `\n\nÇözüm: ${esc(item.solution)}` : ''}${item.note ? `\n\nNot: ${esc(item.note)}` : ''}</p><a href="${pageFor(item.code)}#yorum-${item.id}">Sayfada aç ↗</a></article>`).join('');
  return send(res, 200, shell('Yorum yönetimi', `<div class="admin-head"><div><span class="section-nr">OBDKODU · YÖNETİM</span><h1>Yorumlar</h1><p>${all.length} yayımlanmış yorum · En yeni 100 kayıt gösterilir</p></div><form method="post" action="/yorum-yonetimi/cikis"><input type="hidden" name="csrf" value="${csrf(session)}"><button type="submit">Çıkış</button></form></div><form class="admin-search" method="get"><input name="q" value="${esc(q)}" placeholder="Etiket, kod, ad veya araç ara"><button type="submit">Ara</button></form>${cards || '<p>Yorum bulunamadı.</p>'}`), {'X-Robots-Tag':'noindex, nofollow'});
}
async function handle(req, res) {
  const u = new URL(req.url, 'http://localhost');
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || req.socket.remoteAddress || 'unknown';
  if (req.method === 'GET' && /^\/assets\/[a-zA-Z0-9._/-]+$/.test(u.pathname)) {
    const assetRoot = path.join(dist, 'assets');
    const file = path.resolve(dist, '.' + u.pathname);
    if (file.startsWith(assetRoot + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      const type = file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : file.endsWith('.json') ? 'application/json' : file.endsWith('.woff2') ? 'font/woff2' : file.endsWith('.png') ? 'image/png' : 'application/octet-stream';
      res.writeHead(200, {'Content-Type':type, 'Cache-Control':'public, max-age=3600', 'X-Content-Type-Options':'nosniff'});
      return fs.createReadStream(file).pipe(res);
    }
  }
  const match = /^\/ariza-kodlari\/([pbcu][0-9a-f]{4})\/$/i.exec(u.pathname);
  if ((req.method === 'GET' || req.method === 'HEAD') && match) {
    const code = match[1].toUpperCase();
    if (!codeSet.has(code)) return send(res, 404, 'Kod bulunamadı');
    return renderCode(req, res, code, u);
  }
  if (req.method === 'POST' && u.pathname === '/yorumlar/ekle') {
    if (!originOkay(req)) return send(res, 403, 'Kaynak doğrulanamadı.');
    if (!rateOkay(ip, 'post', 3, 60 * 60 * 1000)) return send(res, 429, 'Çok sık gönderim yapıldı. Lütfen daha sonra deneyin.');
    const form = await readBody(req);
    const code = normal(form.get('code')).toUpperCase();
    if (!codeSet.has(code)) return send(res, 400, 'Geçersiz arıza kodu.');
    if (normal(form.get('website'))) return redirect(res, pageFor(code));
    const item = { id:id(), code, firstName:normal(form.get('firstName')),lastName:normal(form.get('lastName')),brand:normal(form.get('brand')),model:normal(form.get('model')),year:normal(form.get('year')),symptom:normal(form.get('symptom')),solution:normal(form.get('solution')),note:normal(form.get('note')),createdAt:new Date().toISOString() };
    if (form.get('consent') !== 'yes' || !item.firstName || !item.lastName || !item.brand || !item.model || item.symptom.length < 20) return send(res, 400, 'Zorunlu alanları doldurun ve paylaşım onayını işaretleyin.');
    if ([item.firstName,item.lastName].some(x => x.length > 40) || item.brand.length > 50 || item.model.length > 60 || item.symptom.length > 1000 || item.solution.length > 1000 || item.note.length > 600 || (item.year && (!/^\d{4}$/.test(item.year) || +item.year < 1980 || +item.year > new Date().getFullYear()+1))) return send(res, 400, 'Alan uzunluklarını veya model yılını kontrol edin.');
    const rejected = rejectText([item.firstName,item.lastName,item.brand,item.model,item.symptom,item.solution,item.note]);
    if (rejected) return send(res, 400, rejected);
    const duplicate = [...comments.values()].some(other => other.code === code && fold(other.symptom) === fold(item.symptom) && fold(other.solution) === fold(item.solution));
    if (duplicate) return send(res, 409, 'Bu deneyim daha önce paylaşılmış görünüyor.');
    save({type:'add',comment:item}); comments.set(item.id, item); usedIds.add(item.id);
    return redirect(res, `${pageFor(code)}?durum=eklendi#yorum-${item.id}`);
  }
  if (u.pathname === '/yorum-yonetimi/' && req.method === 'GET') return adminPage(req, res, u);
  if (u.pathname === '/yorum-yonetimi/giris' && req.method === 'POST') {
    if (!secretReady) return send(res, 503, 'Yönetici erişimi henüz ayarlanmadı.', {'X-Robots-Tag':'noindex'});
    if (!originOkay(req) || !rateOkay(ip,'login',8,60*60*1000)) return send(res, 429, 'Daha sonra tekrar deneyin.');
    const form = await readBody(req);
    const candidate = crypto.scryptSync(String(form.get('password') || ''), adminSalt, 64);
    const expected = Buffer.from(adminHash, 'hex');
    if (expected.length !== 64 || !crypto.timingSafeEqual(candidate, expected)) return send(res, 403, shell('Giriş başarısız', '<h1>Parola hatalı</h1><a href="/yorum-yonetimi/">Geri dön</a>'), {'X-Robots-Tag':'noindex'});
    const until = String(Date.now()+12*60*60*1000), nonce=crypto.randomBytes(12).toString('hex');
    const signature=crypto.createHmac('sha256',sessionKey).update(`${until}.${nonce}`).digest('hex');
    res.writeHead(303, {Location:'/yorum-yonetimi/', 'Set-Cookie':`obd_comment_admin=${until}.${nonce}.${signature}; HttpOnly; Secure; SameSite=Strict; Path=/yorum-yonetimi/; Max-Age=43200`, 'Cache-Control':'no-store'}); return res.end();
  }
  if (u.pathname === '/yorum-yonetimi/sil' && req.method === 'POST') {
    const session = adminSession(req);
    if (!session || !originOkay(req)) return send(res, 403, 'Yetki yok.');
    const form = await readBody(req);
    const token = String(form.get('csrf') || '');
    if (!/^[a-f0-9]{64}$/.test(token) || !crypto.timingSafeEqual(Buffer.from(token,'hex'),Buffer.from(csrf(session),'hex'))) return send(res, 403, 'Geçersiz istek.');
    const id = String(form.get('id') || '');
    if (comments.has(id)) { comments.delete(id); save({type:'delete',id,at:new Date().toISOString()}); }
    return redirect(res, '/yorum-yonetimi/');
  }
  if (u.pathname === '/yorum-yonetimi/cikis' && req.method === 'POST') {
    const session = adminSession(req);
    if (!session || !originOkay(req)) return send(res, 403, 'Yetki yok.');
    const form = await readBody(req);
    if (form.get('csrf') !== csrf(session)) return send(res, 403, 'Geçersiz istek.');
    res.writeHead(303, {Location:'/yorum-yonetimi/', 'Set-Cookie':'obd_comment_admin=; HttpOnly; Secure; SameSite=Strict; Path=/yorum-yonetimi/; Max-Age=0'}); return res.end();
  }
  return send(res, 404, 'Sayfa bulunamadı', {'X-Robots-Tag':'noindex'});
}
http.createServer((req,res) => { handle(req,res).catch(error => { console.error(error); if (!res.headersSent) send(res,500,'İşlem tamamlanamadı.'); else res.end(); }); }).listen(port,'127.0.0.1', () => console.log(`Comments listening on 127.0.0.1:${port}`));
