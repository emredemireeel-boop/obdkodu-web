const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const port = '3102';
const child = spawn(process.execPath, ['server.js'], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, PORT: port },
  stdio: 'ignore',
});

function request(pathname) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port, path: pathname }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
    }).on('error', reject);
  });
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function waitForServer(timeoutMilliseconds = 60000) {
  const deadline = Date.now() + timeoutMilliseconds;
  while (Date.now() < deadline) {
    try {
      const response = await request('/robots.txt');
      if (response.status === 200) return;
    } catch (error) {
      // The full OBD dataset is still loading; retry until the deadline.
    }
    await delay(500);
  }
  throw new Error('Test server did not become ready in time');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function count(body, pattern) {
  return (body.match(pattern) || []).length;
}

async function verify() {
  await waitForServer();
  const [home, search, pageTwo, keyword, powertrainHub, priorityCode, powertrainSitemap, sitemapMaster, p0420, p0524, reference, alias, api] = await Promise.all([
    request('/'),
    request('/arama'),
    request('/arama?page=2'),
    request('/arama?q=oksijen+sens%C3%B6r%C3%BC'),
    request('/arama?kategori=P'),
    request('/kod/P0016'),
    request('/sitemap-motor-sanziman.xml'),
    request('/sitemap-index.xml'),
    request('/kod/P0420'),
    request('/kod/P0524'),
    request('/kod/U3576'),
    request('/p0420-ariza-kodu'),
    request('/api/search?q=0420'),
  ]);

  assert(home.status === 200 && home.body.includes('data-target="12181"'), 'Homepage code total is not 12,181');
  assert(search.status === 200 && count(search.body, /class="result-card"/g) === 60, 'Search page must render exactly 60 results');
  assert(Buffer.byteLength(search.body) < 100000, 'Search page is unexpectedly large');
  assert((search.headers['x-robots-tag'] || '').startsWith('index'), 'First search listing should be indexable');
  assert((pageTwo.headers['x-robots-tag'] || '').startsWith('noindex'), 'Paginated listings should be noindex');
  assert(count(keyword.body, /class="result-card"/g) > 0, 'Plus-separated keyword search returned no results');
  assert(powertrainHub.body.includes('class="powertrain-hub"'), 'Powertrain category hub is missing');
  assert(count(powertrainHub.body, /<a href="\/kod\/P[0-9A-F]{4}"><strong>/g) === 24, 'Powertrain hub must expose 24 priority guides');
  assert(powertrainHub.body.includes('Motor ve Şanzıman OBD-II Arıza Kodları'), 'Powertrain CollectionPage schema is missing');
  assert((priorityCode.headers['x-robots-tag'] || '').startsWith('index'), 'P0016 priority guide should be indexable');
  assert(count(powertrainSitemap.body, /<url>/g) > 100, 'Powertrain sitemap should contain the quality-filtered P guide set');
  assert(sitemapMaster.body.includes('/sitemap-motor-sanziman.xml'), 'Master sitemap must reference the powertrain sitemap');

  assert((p0420.headers['x-robots-tag'] || '').startsWith('index'), 'P0420 should remain indexable');
  assert(count(p0420.body, /class="risk-fact"/g) === 6, 'Risk panel must contain six decision fields');
  assert(count(p0420.body, /class="faq-item premium-faq-item"/g) === 10, 'Detail pages must contain ten visible FAQs');
  assert(count(p0420.body, /application\/ld\+json/g) >= 6, 'Detail page schemas are incomplete');
  assert(!p0420.body.includes('{{'), 'Template placeholders leaked into P0420');
  assert(!/Tahmini Tamir Maliyeti|estimated.?cost/i.test(p0420.body), 'Repair cost content must not be rendered');

  assert(p0524.body.includes('risk-panel risk-critical'), 'P0524 should show the critical risk state');
  assert((reference.headers['x-robots-tag'] || '').startsWith('noindex'), 'Reference-only records must stay noindex');
  assert(reference.body.includes('U3576 — standart OBD-II kod tanımı'), 'Reference-only fallback title is not safely localized');
  assert(alias.status === 301 && alias.headers.location === '/kod/P0420', 'Friendly code alias must redirect to the canonical page');
  const apiRows = JSON.parse(api.body);
  assert(apiRows[0] && apiRows[0].code === 'P0420', 'Autocomplete should rank exact numeric code first');

  const jsonLdBlocks = [...p0420.body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  jsonLdBlocks.forEach((match, index) => {
    try { JSON.parse(match[1]); }
    catch (error) { throw new Error(`Invalid JSON-LD block ${index + 1}: ${error.message}`); }
  });

  console.log(JSON.stringify({
    codes: 12181,
    searchResultsPerPage: 60,
    keywordResults: count(keyword.body, /class="result-card"/g),
    powertrainSitemapUrls: count(powertrainSitemap.body, /<url>/g),
    powertrainFeaturedGuides: count(powertrainHub.body, /<a href="\/kod\/P[0-9A-F]{4}"><strong>/g),
    riskFields: 6,
    faqs: 10,
    jsonLdBlocks: jsonLdBlocks.length,
    alias: alias.headers.location,
  }));
}

const timer = setTimeout(() => {
  console.error('Content verification timed out.');
  child.kill();
  process.exit(1);
}, 90000);

verify()
  .then(() => {
    clearTimeout(timer);
    child.kill();
  })
  .catch(error => {
    clearTimeout(timer);
    child.kill();
    console.error(error.message);
    process.exitCode = 1;
  });
