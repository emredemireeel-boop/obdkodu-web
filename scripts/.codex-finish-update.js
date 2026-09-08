const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, content) => fs.writeFileSync(path.join(root, file), content, 'utf8');

function replaceExact(content, before, after, expected, label) {
  const count = content.split(before).length - 1;
  if (count !== expected) throw new Error(`${label}: expected ${expected}, found ${count}`);
  return content.split(before).join(after);
}

function replaceBetween(content, start, end, replacement, label) {
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end, startIndex + start.length);
  if (startIndex === -1 || endIndex === -1) throw new Error(`${label}: markers not found`);
  return content.slice(0, startIndex) + replacement + content.slice(endIndex + end.length);
}

let server = read('server.js');
const schemaNames = [
  'webSiteSchemaJson', 'orgSchemaJson', 'searchBreadcrumbJson',
  'faqSchemaJson', 'techArticleJson', 'howToSchemaJson', 'breadcrumbJson',
  'definedTermJson', 'webPageJson', 'dlBreadcrumbJson', 'dlArticleJson',
  'itemListJson', 'breadcrumbJson', 'itemListJson', 'breadcrumbJson',
  'itemListJson', 'breadcrumbJson', 'itemListJson', 'breadcrumbJson',
  'itemListJson', 'breadcrumbJson', 'collectionJson', 'breadcrumbJson',
  'dlItemListJson', 'dlListBreadcrumbJson'
];
let schemaIndex = 0;
server = server.replace(/\$1serializeJsonLd\(/g, () => {
  const name = schemaNames[schemaIndex++];
  if (!name) throw new Error('More broken JSON-LD declarations than expected');
  return `const ${name} = serializeJsonLd(`;
});
if (schemaIndex !== schemaNames.length) {
  throw new Error(`JSON-LD repair expected ${schemaNames.length}, found ${schemaIndex}`);
}
write('server.js', server);

let layout = read('views/layout.html');
layout = replaceBetween(
  layout,
  '  <script>\n    // Prevent flash of wrong theme',
  '  </script>\n',
  '  <script src="/js/theme-init.min.js?v=1"></script>\n',
  'theme bootstrap'
);
layout = replaceExact(layout, '/css/style.min.css?v=9', '/css/style.min.css?v=10', 2, 'stylesheet version');
layout = replaceExact(layout, '/js/main.min.js?v=9', '/js/main.min.js?v=10', 1, 'main script version');
layout = replaceExact(
  layout,
  '<a href="https://otosoz.com" target="_blank" class="nav-sponsor-link">',
  '<a href="https://otosoz.com" target="_blank" rel="noopener noreferrer" class="nav-sponsor-link">',
  1,
  'nav link safety'
);
write('views/layout.html', layout);

let home = read('views/home.html');
home = replaceExact(
  home,
  '<a href="https://otosoz.com" target="_blank" class="sponsor-banner" style="margin-top: 0;">',
  '<a href="https://otosoz.com" target="_blank" rel="noopener noreferrer" class="sponsor-banner" style="margin-top: 0;">',
  1,
  'home link safety'
);
write('views/home.html', home);

let search = read('views/search.html');
search = replaceExact(
  search,
  '<select name="sistem" id="systemFilter" onchange="this.form.submit()">',
  '<select name="sistem" id="systemFilter" data-auto-submit>',
  1,
  'search inline handler'
);
write('views/search.html', search);

let dashboard = read('views/dashboard-lights.html');
dashboard = replaceExact(
  dashboard,
  '<div class="dl-card" onclick="window.location.href=\'/gosterge-paneli/{{id}}\'">',
  '<div class="dl-card" role="link" tabindex="0" data-dashboard-url="/gosterge-paneli/{{id}}">',
  1,
  'dashboard inline handler'
);
dashboard = replaceExact(
  dashboard,
  '<div class="dl-card dl-card-ev" onclick="window.location.href=\'/gosterge-paneli/{{id}}\'">',
  '<div class="dl-card dl-card-ev" role="link" tabindex="0" data-dashboard-url="/gosterge-paneli/{{id}}">',
  1,
  'EV inline handler'
);
write('views/dashboard-lights.html', dashboard);

let css = read('public/css/style.css');
if (css.includes('.community-redirect {')) throw new Error('Community CSS already exists');
css += `\n\n/* Community redirect: comments are hosted on Otosöz. */
.community-redirect {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
  margin: 36px 0;
  padding: 28px;
  border: 1px solid rgba(5, 150, 105, 0.28);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.12), var(--bg-card) 58%);
  box-shadow: var(--shadow-md);
}

.community-redirect-icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 17px;
  background: rgba(5, 150, 105, 0.14);
  font-size: 1.7rem;
}

.community-redirect-kicker {
  display: block;
  margin-bottom: 5px;
  color: var(--accent-blue);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.community-redirect h2 {
  margin: 0 0 7px;
  color: var(--text-primary);
  font-size: clamp(1.15rem, 2vw, 1.45rem);
}

.community-redirect p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.65;
}

.community-redirect-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 11px 18px;
  border-radius: 999px;
  background: var(--accent-blue);
  color: #fff;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.community-redirect-button:hover,
.community-redirect-button:focus-visible {
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgba(5, 150, 105, 0.24);
}

.dl-card[role='link']:focus-visible {
  outline: 3px solid var(--accent-blue);
  outline-offset: 4px;
}

@media (max-width: 760px) {
  .community-redirect {
    grid-template-columns: auto minmax(0, 1fr);
    padding: 22px;
  }

  .community-redirect-button {
    grid-column: 1 / -1;
    width: 100%;
  }
}
`;
write('public/css/style.css', css);

let nginx = read('nginx-obdkodu.conf');
nginx = replaceExact(
  nginx,
  `    # Security headers (SEO: Google favors secure sites)
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'" always;`,
  `    # Security headers
    server_tokens off;
    client_max_body_size 16k;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "0" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Resource-Policy "same-origin" always;
    add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; connect-src 'self'; upgrade-insecure-requests" always;`,
  1,
  'nginx security block'
);
nginx = replaceExact(
  nginx,
  `        # 1 year cache for static assets (cache-busted by query params)
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff" always;`,
  `        # 1 year cache for static assets (cache-busted by query params).
        # No nested add_header directives: inherit the full security header set.
        expires 1y;`,
  1,
  'nginx static inheritance'
);
write('nginx-obdkodu.conf', nginx);

console.log('Remaining security updates applied.');
