// ===================================
// OBD Kodları Web Sitesi - Node.js Server
// Saf Node.js, framework kullanılmıyor
// ===================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { render } = require('./lib/template');

const PORT = process.env.PORT || 3000;

// Load OBD codes data
const codesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'obd-codes.json'), 'utf-8')
);

// Deduplicate codes (keep first occurrence of each code)
const codesMap = new Map();
codesData.forEach(code => {
  if (!codesMap.has(code.code)) {
    codesMap.set(code.code, code);
  }
});
const codes = Array.from(codesMap.values());

// Precompute category counts
const categoryNames = {
  P: 'Powertrain (Motor & Şanzıman)',
  B: 'Body (Gövde)',
  C: 'Chassis (Şasi)',
  U: 'Network (İletişim)'
};

function getCategoryCounts(codesList) {
  return {
    pCount: codesList.filter(c => c.category === 'P').length,
    bCount: codesList.filter(c => c.category === 'B').length,
    cCount: codesList.filter(c => c.category === 'C').length,
    uCount: codesList.filter(c => c.category === 'U').length,
  };
}

const counts = getCategoryCounts(codes);
const totalCodes = codes.length;

// MIME types for static files
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// =========== ROUTE HANDLERS ===========

function handleHome(req, res) {
  // Pick popular codes (The 30 most searched codes)
  const popular = [
    'P0171', 'P0174', 'P2096', 'P0101', 'P0102', 'P0135', 'P0138', 'P0420', 'P0430', 'P0401', 
    'P0440', 'P0442', 'P0455', 'P0456', 'P0128', 'P0115', 'P0113', 'P0122', 'P0505', 'P0300', 
    'P0301', 'P0335', 'P0500', 'P0011', 'P0299', 'P2135', 'P0700', 'C0035', 'U0100', 'U0073'
  ].map(c => codes.find(item => item.code === c)).filter(Boolean);

  const html = render('home', {
    pageTitle: 'Ana Sayfa',
    metaDescription: 'OBD-II arıza kodlarını arayın ve aracınızdaki sorunları hızlıca teşhis edin. Detaylı açıklamalar, olası nedenler ve çözüm önerileri.',
    activeHome: 'active',
    totalCodes,
    ...counts,
    popularCodes: popular,
  });
  sendHtml(res, 200, html);
}

function handleSearch(req, res, query) {
  const q = (query.q || '').trim().toUpperCase();
  const kategori = (query.kategori || '').trim().toUpperCase();

  let filtered = codes;

  // Filter by search query
  if (q) {
    const qLower = q.toLowerCase();
    filtered = filtered.filter(c =>
      c.code.toLowerCase().includes(qLower) ||
      c.name.toLowerCase().includes(qLower) ||
      c.description.toLowerCase().includes(qLower) ||
      c.affectedSystem.toLowerCase().includes(qLower)
    );
  }

  // Compute counts for filtered results (before category filter)
  const filteredCounts = {
    pFilterCount: filtered.filter(c => c.category === 'P').length,
    bFilterCount: filtered.filter(c => c.category === 'B').length,
    cFilterCount: filtered.filter(c => c.category === 'C').length,
    uFilterCount: filtered.filter(c => c.category === 'U').length,
  };
  const totalCount = filtered.length;

  // Filter by category
  if (kategori && ['P', 'B', 'C', 'U'].includes(kategori)) {
    filtered = filtered.filter(c => c.category === kategori);
  }

  const queryParam = q ? `&q=${encodeURIComponent(q)}` : '';
  const searchOnlyParam = q ? `?q=${encodeURIComponent(q)}` : '';

  const html = render('search', {
    pageTitle: q ? `"${q}" arama sonuçları` : (kategori ? `${categoryNames[kategori] || kategori} Kodları` : 'Tüm Arıza Kodları'),
    metaDescription: `OBD-II arıza kodları listesi. ${filtered.length} sonuç bulundu.`,
    activeSearch: 'active',
    searchQuery: query.q || '',
    isSearchQuery: q ? 'true' : '',
    activeCategory: kategori,
    isActiveCategory: (!q && kategori) ? 'true' : '',
    categoryName: categoryNames[kategori] || '',
    
    // Simplified filter variables for template
    urlAll: `/arama${searchOnlyParam}`,
    urlP: `/arama?kategori=P${queryParam}`,
    urlB: `/arama?kategori=B${queryParam}`,
    urlC: `/arama?kategori=C${queryParam}`,
    urlU: `/arama?kategori=U${queryParam}`,
    
    activeAll: !kategori ? 'active' : '',
    activeP: kategori === 'P' ? 'active' : '',
    activeB: kategori === 'B' ? 'active' : '',
    activeC: kategori === 'C' ? 'active' : '',
    activeU: kategori === 'U' ? 'active' : '',

    resultCount: filtered.length,
    totalCount,
    ...filteredCounts,
    hasResults: filtered.length > 0 ? 'true' : '',
    noResults: filtered.length === 0 ? 'true' : '',
    results: filtered,
  });
  sendHtml(res, 200, html);
}

function handleDetail(req, res, codeId) {
  const code = codes.find(c => c.code.toUpperCase() === codeId.toUpperCase());
  
  if (!code) {
    return handle404(req, res);
  }

  // Find related codes (same category, same affected system)
  const related = codes.filter(c =>
    c.code !== code.code &&
    (c.category === code.category) &&
    (c.affectedSystem === code.affectedSystem || c.code.substring(0, 3) === code.code.substring(0, 3))
  ).slice(0, 6);

  const severityTextMap = {
    'düşük': 'Düşük Ciddiyet',
    'orta': 'Orta Ciddiyet',
    'yüksek': 'Yüksek Ciddiyet',
  };

  const html = render('detail', {
    pageTitle: `${code.code} - ${code.name}`,
    metaDescription: `${code.code} arıza kodu: ${code.name}. ${code.description.substring(0, 150)}`,
    activeSearch: 'active',
    ...code,
    categoryName: categoryNames[code.category] || code.category,
    severityText: severityTextMap[code.severity] || code.severity,
    isHighSeverity: code.severity === 'yüksek' ? 'true' : '',
    hasRelated: related.length > 0 ? 'true' : '',
    relatedCodes: related,
  });
  sendHtml(res, 200, html);
}

function handleAbout(req, res) {
  const html = render('about', {
    pageTitle: 'Hakkında',
    metaDescription: 'OBD-II (On-Board Diagnostics II) arıza teşhis sistemi hakkında bilgi. Kod yapısı, kategoriler ve ciddiyet seviyeleri.',
    activeAbout: 'active',
  });
  sendHtml(res, 200, html);
}

function handlePrivacy(req, res) {
  const html = render('privacy', {
    pageTitle: 'Gizlilik Politikası',
    metaDescription: 'obdkodu.com gizlilik politikası ve çerez (cookie) kullanım ilkeleri.',
  });
  sendHtml(res, 200, html);
}

function handleTerms(req, res) {
  const html = render('terms', {
    pageTitle: 'Kullanım Koşulları',
    metaDescription: 'obdkodu.com kullanım koşulları ve yasal sorumluluk reddi beyanı.',
  });
  sendHtml(res, 200, html);
}

function handleContact(req, res) {
  const html = render('contact', {
    pageTitle: 'İletişim',
    metaDescription: 'Soru, görüş ve önerileriniz için obdkodu.com iletişim bilgileri.',
  });
  sendHtml(res, 200, html);
}

function handleApiSearch(req, res, query) {
  const q = (query.q || '').trim();
  const limit = parseInt(query.limit) || 10;

  if (!q || q.length < 2) {
    return sendJson(res, 200, []);
  }

  const qLower = q.toLowerCase();
  const results = codes.filter(c =>
    c.code.toLowerCase().includes(qLower) ||
    c.name.toLowerCase().includes(qLower)
  ).slice(0, limit);

  sendJson(res, 200, results.map(c => ({
    code: c.code,
    category: c.category,
    name: c.name,
    severity: c.severity,
  })));
}

function handle404(req, res) {
  const html = render('404', {
    pageTitle: 'Sayfa Bulunamadı',
    metaDescription: 'Aradığınız sayfa bulunamadı.',
  });
  sendHtml(res, 404, html);
}

function handleRobotsTxt(req, res) {
  const robots = `User-agent: *
Allow: /
Sitemap: https://www.obdkodu.com/sitemap.xml`;
  
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=86400',
  });
  res.end(robots);
}

function handleSitemap(req, res) {
  const baseUrl = 'https://www.obdkodu.com';
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/arama</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/hakkinda</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/gizlilik-politikasi</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/kullanim-kosullari</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/iletisim</loc>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
`;

  codes.forEach(c => {
    xml += `  <url>
    <loc>${baseUrl}/kod/${c.code}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  });

  xml += `</urlset>`;

  res.writeHead(200, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=86400',
  });
  res.end(xml);
}

function handleStatic(req, res, filePath) {
  const fullPath = path.join(__dirname, 'public', filePath);
  const safePath = path.resolve(fullPath);
  const publicDir = path.resolve(path.join(__dirname, 'public'));

  // Security: prevent directory traversal
  if (!safePath.startsWith(publicDir)) {
    return handle404(req, res);
  }

  fs.readFile(safePath, (err, data) => {
    if (err) {
      return handle404(req, res);
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    });
    res.end(data);
  });
}

// =========== HELPERS ===========

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache',
  });
  res.end(html);
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
  });
  res.end(JSON.stringify(data));
}

function parseQuery(queryString) {
  const params = {};
  if (!queryString) return params;
  queryString.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  });
  return params;
}

// =========== SERVER ===========

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;
  const query = parseQuery(parsedUrl.query);

  // Route matching
  if (pathname === '/' && req.method === 'GET') {
    return handleHome(req, res);
  }

  if (pathname === '/arama' && req.method === 'GET') {
    return handleSearch(req, res, query);
  }

  if (pathname === '/hakkinda' && req.method === 'GET') {
    return handleAbout(req, res);
  }

  if (pathname === '/gizlilik-politikasi' && req.method === 'GET') {
    return handlePrivacy(req, res);
  }

  if (pathname === '/kullanim-kosullari' && req.method === 'GET') {
    return handleTerms(req, res);
  }

  if (pathname === '/iletisim' && req.method === 'GET') {
    return handleContact(req, res);
  }

  // SEO
  if (pathname === '/robots.txt' && req.method === 'GET') {
    return handleRobotsTxt(req, res);
  }

  if (pathname === '/sitemap.xml' && req.method === 'GET') {
    return handleSitemap(req, res);
  }

  // Code detail: /kod/P0300
  const codeMatch = pathname.match(/^\/kod\/([A-Za-z0-9]+)$/);
  if (codeMatch && req.method === 'GET') {
    return handleDetail(req, res, codeMatch[1]);
  }

  // API endpoints
  if (pathname === '/api/search' && req.method === 'GET') {
    return handleApiSearch(req, res, query);
  }

  // Static files: /css/*, /js/*, /images/*
  if (pathname.startsWith('/css/') || pathname.startsWith('/js/') || pathname.startsWith('/images/')) {
    return handleStatic(req, res, pathname);
  }

  // Favicon
  if (pathname === '/favicon.ico') {
    res.writeHead(204);
    return res.end();
  }

  // 404 for everything else
  handle404(req, res);
});

server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║                                           ║
  ║   🚗  OBD Kodları Web Sitesi             ║
  ║                                           ║
  ║   Sunucu başlatıldı:                     ║
  ║   http://localhost:${PORT}                   ║
  ║                                           ║
  ║   ${totalCodes} arıza kodu yüklendi              ║
  ║   P: ${counts.pCount} | B: ${counts.bCount} | C: ${counts.cCount} | U: ${counts.uCount}       ║
  ║                                           ║
  ╚═══════════════════════════════════════════╝
  `);
});
