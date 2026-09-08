const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function load(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function save(relativePath, content) {
  fs.writeFileSync(path.join(root, relativePath), content, 'utf8');
}

function replaceExact(content, before, after, label) {
  const count = content.split(before).length - 1;
  const expected = label === 'code comments context' || label === 'stylesheet version first' ? 2 : (label === 'dashboard comments context' || label === 'stylesheet version second' ? 0 : 1);
  if (count !== expected) throw new Error(`${label}: expected ${expected} exact matches, found ${count}`);
  return count === 0 ? content : content.split(before).join(after);
}

function replaceCount(content, regex, replacement, expected, label) {
  let count = 0;
  const result = content.replace(regex, (...args) => {
    count += 1;
    return typeof replacement === 'function' ? replacement(...args) : replacement;
  });
  if (count !== expected) throw new Error(`${label}: expected ${expected} matches, found ${count}`);
  return result;
}

function replaceBetween(content, start, end, replacement, label) {
  const startIndex = content.indexOf(start);
  if (startIndex === -1) throw new Error(`${label}: start marker not found`);
  const endIndex = content.indexOf(end, startIndex + start.length);
  if (endIndex === -1) throw new Error(`${label}: end marker not found`);
  if (content.indexOf(start, startIndex + start.length) !== -1) {
    throw new Error(`${label}: duplicate start marker`);
  }
  return content.slice(0, startIndex) + replacement + content.slice(endIndex);
}

let server = load('server.js');

server = replaceExact(
  server,
  "const PORT = process.env.PORT || 3000;\n",
  `const PORT = process.env.PORT || 3000;\n\nconst SECURITY_HEADERS = Object.freeze({\n  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; connect-src 'self'; upgrade-insecure-requests",\n  'Cross-Origin-Opener-Policy': 'same-origin',\n  'Cross-Origin-Resource-Policy': 'same-origin',\n  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',\n  'Referrer-Policy': 'strict-origin-when-cross-origin',\n  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',\n  'X-Content-Type-Options': 'nosniff',\n  'X-Frame-Options': 'DENY',\n});\n\nfunction serializeJsonLd(value) {\n  return JSON.stringify(value)\n    .replace(/</g, '\\\\u003c')\n    .replace(/>/g, '\\\\u003e')\n    .replace(/&/g, '\\\\u0026')\n    .replace(/\\u2028/g, '\\\\u2028')\n    .replace(/\\u2029/g, '\\\\u2029');\n}\n`,
  'security header helpers'
);

server = replaceExact(
  server,
  `// Load Comments\nconst commentsFile = path.join(__dirname, 'data', 'comments.json');\nlet commentsData = [];\ntry {\n  commentsData = JSON.parse(fs.readFileSync(commentsFile, 'utf-8'));\n} catch (e) {\n  commentsData = [];\n}\nconst commentRateLimit = {};\n\n`,
  '',
  'comment storage bootstrap'
);

server = replaceBetween(
  server,
  '  const codeComments = commentsData.filter(c => c.code === code.code).reverse();',
  '  // Find related dashboard light',
  '',
  'code comments query'
);

server = replaceExact(
  server,
  `    comments: paginatedComments,\n    hasComments: formattedComments.length > 0 ? 'true' : '',\n    noComments: formattedComments.length === 0 ? 'true' : '',\n    commentCount: formattedComments.length,\n    paginationHtml: paginationHtml,\n`,
  '',
  'code comments context'
);

server = replaceBetween(
  server,
  '  // --- Comments Logic ---',
  '  // === SERVER-SIDE JSON-LD FOR DASHBOARD LIGHTS ===',
  '',
  'dashboard comments query'
);

server = replaceExact(
  server,
  `    comments: paginatedComments,\n    hasComments: formattedComments.length > 0 ? 'true' : '',\n    noComments: formattedComments.length === 0 ? 'true' : '',\n    commentCount: formattedComments.length,\n    paginationHtml: paginationHtml,\n`,
  '',
  'dashboard comments context'
);

server = replaceBetween(
  server,
  'function escapeHtml(str) {',
  'function handle404(req, res) {',
  `function handleApiComments(req, res) {\n  sendJson(res, 410, {\n    error: 'OBD Kodları üzerindeki kullanıcı yorumları kapatıldı.',\n    communityUrl: 'https://otosoz.com'\n  }, req);\n}\n\n`,
  'comment API implementation'
);

server = replaceExact(
  server,
  "  const pathname = url.parse(req.url).pathname || '';",
  "  const pathname = new URL(req.url, 'http://localhost').pathname;",
  '404 URL parser'
);

server = replaceCount(
  server,
  /(const \w+Json = )JSON\.stringify\(/g,
  '$1serializeJsonLd(',
  25,
  'JSON-LD serialization'
);

server = replaceCount(
  server,
  /^((?: {4}| {6}))'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',$/gm,
  (_, indent) => indent + '...SECURITY_HEADERS,',
  5,
  'shared response security headers'
);

server = replaceExact(
  server,
  "    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });",
  "    res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' });",
  'XML 404 headers'
);

server = replaceExact(
  server,
  `  res.writeHead(200, {\n    'Content-Type': 'application/xml; charset=utf-8',\n    'Cache-Control': 'public, max-age=3600',\n    'X-Content-Type-Options': 'nosniff',\n  });`,
  `  res.writeHead(200, {\n    ...SECURITY_HEADERS,\n    'Content-Type': 'application/xml; charset=utf-8',\n    'Cache-Control': 'public, max-age=3600',\n  });`,
  'XML security headers'
);

server = replaceExact(
  server,
  `  res.writeHead(410, {\n    'Content-Type': 'text/plain; charset=utf-8',`,
  `  res.writeHead(410, {\n    ...SECURITY_HEADERS,\n    'Content-Type': 'text/plain; charset=utf-8',`,
  'legacy sitemap security headers'
);

server = replaceExact(
  server,
  `  // Security: prevent directory traversal\n  if (!safePath.startsWith(publicDir)) {\n    return handle404(req, res);\n  }`,
  `  // Security: prevent directory traversal and sibling-prefix bypasses.\n  const relativePath = path.relative(publicDir, safePath);\n  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {\n    return handle404(req, res);\n  }`,
  'static path containment'
);

server = replaceExact(
  server,
  `  res.writeHead(statusCode, {\n    'Location': location,\n    'Cache-Control': 'public, max-age=86400'\n  });`,
  `  res.writeHead(statusCode, {\n    ...SECURITY_HEADERS,\n    'Location': location,\n    'Cache-Control': 'public, max-age=86400'\n  });`,
  'redirect security headers'
);

server = replaceExact(
  server,
  `  if (pathname === '/api/comments' && req.method === 'POST') {\n    return handleApiComments(req, res);\n  }`,
  `  if (pathname === '/api/comments') {\n    return handleApiComments(req, res);\n  }`,
  'closed comment route'
);

save('server.js', server);

let mainJs = load('public/js/main.js');
mainJs = replaceExact(
  mainJs,
  `  initSearch();\n  initAnimations();`,
  `  initSearch();\n  initAutoSubmitFilters();\n  initDashboardCards();\n  initAnimations();`,
  'client initializers'
);

mainJs = replaceBetween(
  mainJs,
  'function showSuggestions(results, input) {',
  'function hideSuggestions(input) {',
  `function showSuggestions(results, input) {\n  const form = input.closest('form');\n  const box = form && form.querySelector('.search-suggestions');\n\n  if (!box) return;\n  box.replaceChildren();\n  if (!Array.isArray(results) || !results.length) {\n    box.classList.remove('active');\n    return;\n  }\n\n  const fragment = document.createDocumentFragment();\n  results.forEach(item => {\n    const category = /^[PBCU]$/.test(String(item.category || '')) ? item.category : 'P';\n    const code = String(item.code || '').toUpperCase();\n    const link = document.createElement('a');\n    link.href = '/kod/' + encodeURIComponent(code);\n    link.className = 'suggestion-item';\n\n    const badge = document.createElement('span');\n    badge.className = 'code-badge category-' + category;\n    badge.textContent = category;\n\n    const codeLabel = document.createElement('span');\n    codeLabel.className = 'suggestion-code';\n    codeLabel.textContent = code;\n\n    const name = document.createElement('span');\n    name.className = 'suggestion-name';\n    name.textContent = String(item.name || '');\n\n    link.append(badge, codeLabel, name);\n    fragment.appendChild(link);\n  });\n\n  box.appendChild(fragment);\n  box.classList.add('active');\n}\n\n`,
  'safe search suggestions'
);

mainJs = replaceBetween(
  mainJs,
  '// =========== COMMENTS FORM ===========',
  '// =========== DETAIL PAGE TOOLS ===========',
  `// =========== CSP-SAFE UI ACTIONS ===========\nfunction initAutoSubmitFilters() {\n  document.querySelectorAll('[data-auto-submit]').forEach(control => {\n    control.addEventListener('change', () => {\n      if (control.form) control.form.requestSubmit();\n    });\n  });\n}\n\nfunction initDashboardCards() {\n  document.querySelectorAll('[data-dashboard-url]').forEach(card => {\n    const openCard = () => {\n      const target = card.getAttribute('data-dashboard-url');\n      if (target && target.startsWith('/gosterge-paneli/')) window.location.assign(target);\n    };\n\n    card.addEventListener('click', event => {\n      if (!event.target.closest('a')) openCard();\n    });\n    card.addEventListener('keydown', event => {\n      if (event.key === 'Enter' || event.key === ' ') {\n        event.preventDefault();\n        openCard();\n      }\n    });\n  });\n}\n\n`,
  'remove comment client and inline handlers'
);

save('public/js/main.js', mainJs);

let detail = load('views/detail.html');
detail = replaceBetween(
  detail,
  '    <!-- Sponsor Banner -->',
  '    <!-- Back Button -->',
  `    <!-- Community discussions live on Otosöz; local comments are disabled. -->\n    <section class="community-redirect" id="yorumlar" aria-labelledby="community-title">\n      <div class="community-redirect-icon" aria-hidden="true">💬</div>\n      <div class="community-redirect-content">\n        <span class="community-redirect-kicker">Yorumlar Otosöz'de</span>\n        <h2 id="community-title">{{code}} deneyiminizi otomobil topluluğuyla paylaşın</h2>\n        <p>OBD Kodları üzerinde kullanıcı yorumu yayınlanmıyor. Sorunuzu, aracınızın marka-model ve motor bilgileriyle Otosöz topluluğuna taşıyabilirsiniz.</p>\n      </div>\n      <a href="https://otosoz.com" target="_blank" rel="noopener noreferrer" class="community-redirect-button">\n        Otosöz.com'u incele <span aria-hidden="true">↗</span>\n      </a>\n    </section>\n\n`,
  'detail community redirect'
);
save('views/detail.html', detail);

let dashboardDetail = load('views/dashboard-light-detail.html');
dashboardDetail = replaceBetween(
  dashboardDetail,
  '    <!-- User Comments Section -->',
  '    <!-- Back Button -->',
  `    <!-- Community discussions live on Otosöz; local comments are disabled. -->\n    <section class="community-redirect" id="yorumlar" aria-labelledby="community-title">\n      <div class="community-redirect-icon" aria-hidden="true">💬</div>\n      <div class="community-redirect-content">\n        <span class="community-redirect-kicker">Yorumlar Otosöz'de</span>\n        <h2 id="community-title">{{name}} deneyiminizi otomobil topluluğuyla paylaşın</h2>\n        <p>OBD Kodları üzerinde kullanıcı yorumu yayınlanmıyor. Sorunuzu, aracınızın marka-model ve motor bilgileriyle Otosöz topluluğuna taşıyabilirsiniz.</p>\n      </div>\n      <a href="https://otosoz.com" target="_blank" rel="noopener noreferrer" class="community-redirect-button">\n        Otosöz.com'u incele <span aria-hidden="true">↗</span>\n      </a>\n    </section>\n\n`,
  'dashboard community redirect'
);
save('views/dashboard-light-detail.html', dashboardDetail);

let layout = load('views/layout.html');
layout = replaceBetween(
  layout,
  '  <script>\n    // Prevent flash of wrong theme',
  '  </script>\n',
  '  <script src="/js/theme-init.min.js?v=1"></script>\n',
  'external theme bootstrap'
);
layout = replaceExact(layout, '/css/style.min.css?v=9', '/css/style.min.css?v=10', 'stylesheet version first');
layout = replaceExact(layout, '/css/style.min.css?v=9', '/css/style.min.css?v=10', 'stylesheet version second');
layout = replaceExact(layout, '/js/main.min.js?v=9', '/js/main.min.js?v=10', 'script version');
layout = replaceExact(
  layout,
  '<a href="https://otosoz.com" target="_blank" class="nav-sponsor-link">',
  '<a href="https://otosoz.com" target="_blank" rel="noopener noreferrer" class="nav-sponsor-link">',
  'nav external link safety'
);
save('views/layout.html', layout);

let home = load('views/home.html');
home = replaceExact(
  home,
  '<a href="https://otosoz.com" target="_blank" class="sponsor-banner" style="margin-top: 0;">',
  '<a href="https://otosoz.com" target="_blank" rel="noopener noreferrer" class="sponsor-banner" style="margin-top: 0;">',
  'home external link safety'
);
save('views/home.html', home);

let search = load('views/search.html');
search = replaceExact(
  search,
  '<select name="sistem" id="systemFilter" onchange="this.form.submit()">',
  '<select name="sistem" id="systemFilter" data-auto-submit>',
  'search CSP-safe change event'
);
save('views/search.html', search);

let dashboard = load('views/dashboard-lights.html');
dashboard = replaceExact(
  dashboard,
  '<div class="dl-card" onclick="window.location.href=\'/gosterge-paneli/{{id}}\'">',
  '<div class="dl-card" role="link" tabindex="0" data-dashboard-url="/gosterge-paneli/{{id}}">',
  'dashboard card CSP-safe click'
);
dashboard = replaceExact(
  dashboard,
  '<div class="dl-card dl-card-ev" onclick="window.location.href=\'/gosterge-paneli/{{id}}\'">',
  '<div class="dl-card dl-card-ev" role="link" tabindex="0" data-dashboard-url="/gosterge-paneli/{{id}}">',
  'EV card CSP-safe click'
);
save('views/dashboard-lights.html', dashboard);

let css = load('public/css/style.css');
css += `\n\n/* Community redirect: comments are hosted on Otosöz. */\n.community-redirect {\n  display: grid;\n  grid-template-columns: auto minmax(0, 1fr) auto;\n  align-items: center;\n  gap: 20px;\n  margin: 36px 0;\n  padding: 28px;\n  border: 1px solid rgba(5, 150, 105, 0.28);\n  border-radius: var(--radius-lg);\n  background: linear-gradient(135deg, rgba(5, 150, 105, 0.12), var(--bg-card) 58%);\n  box-shadow: var(--shadow-md);\n}\n\n.community-redirect-icon {\n  display: grid;\n  place-items: center;\n  width: 58px;\n  height: 58px;\n  border-radius: 17px;\n  background: rgba(5, 150, 105, 0.14);\n  font-size: 1.7rem;\n}\n\n.community-redirect-kicker {\n  display: block;\n  margin-bottom: 5px;\n  color: var(--accent-blue);\n  font-size: 0.76rem;\n  font-weight: 900;\n  letter-spacing: 0.07em;\n  text-transform: uppercase;\n}\n\n.community-redirect h2 {\n  margin: 0 0 7px;\n  color: var(--text-primary);\n  font-size: clamp(1.15rem, 2vw, 1.45rem);\n}\n\n.community-redirect p {\n  margin: 0;\n  color: var(--text-secondary);\n  line-height: 1.65;\n}\n\n.community-redirect-button {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  min-height: 46px;\n  padding: 11px 18px;\n  border-radius: 999px;\n  background: var(--accent-blue);\n  color: #fff;\n  font-weight: 800;\n  text-decoration: none;\n  white-space: nowrap;\n  transition: transform 0.2s ease, box-shadow 0.2s ease;\n}\n\n.community-redirect-button:hover,\n.community-redirect-button:focus-visible {\n  color: #fff;\n  transform: translateY(-2px);\n  box-shadow: 0 12px 26px rgba(5, 150, 105, 0.24);\n}\n\n.dl-card[role='link']:focus-visible {\n  outline: 3px solid var(--accent-blue);\n  outline-offset: 4px;\n}\n\n@media (max-width: 760px) {\n  .community-redirect {\n    grid-template-columns: auto minmax(0, 1fr);\n    padding: 22px;\n  }\n\n  .community-redirect-button {\n    grid-column: 1 / -1;\n    width: 100%;\n  }\n}\n`;
save('public/css/style.css', css);

let nginx = load('nginx-obdkodu.conf');
nginx = replaceExact(
  nginx,
  `    # Security headers (SEO: Google favors secure sites)\n    add_header X-Content-Type-Options "nosniff" always;\n    add_header X-Frame-Options "DENY" always;\n    add_header X-XSS-Protection "1; mode=block" always;\n    add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;\n    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'" always;`,
  `    # Security headers\n    server_tokens off;\n    client_max_body_size 16k;\n    add_header X-Content-Type-Options "nosniff" always;\n    add_header X-Frame-Options "DENY" always;\n    add_header X-XSS-Protection "0" always;\n    add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;\n    add_header Cross-Origin-Opener-Policy "same-origin" always;\n    add_header Cross-Origin-Resource-Policy "same-origin" always;\n    add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; connect-src 'self'; upgrade-insecure-requests" always;`,
  'nginx security headers'
);
nginx = replaceExact(
  nginx,
  `        # 1 year cache for static assets (cache-busted by query params)\n        expires 1y;\n        add_header Cache-Control "public, immutable";\n        add_header X-Content-Type-Options "nosniff" always;`,
  `        # 1 year cache for static assets (cache-busted by query params).\n        # No nested add_header directives: inherit the full security header set.\n        expires 1y;`,
  'nginx static header inheritance'
);
save('nginx-obdkodu.conf', nginx);

console.log('Security and Otosöz redirect updates applied.');
