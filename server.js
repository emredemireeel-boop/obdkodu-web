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
let codesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'obd-codes.json'), 'utf-8')
);

const severityGlobalMap = {
  'low': 'düşük',
  'medium': 'orta',
  'high': 'yüksek'
};

codesData = codesData.map(c => ({
  ...c,
  category: c.code ? c.code.charAt(0).toUpperCase() : 'P',
  severity: severityGlobalMap[c.severity] || c.severity
}));

// Load Models
let vehiclesData = [];
try {
  vehiclesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'vehicles.json'), 'utf-8'));
} catch (e) {
  console.log('vehicles.json not found, continuing without models.');
}

// Load Comments
const commentsFile = path.join(__dirname, 'data', 'comments.json');
let commentsData = [];
try {
  commentsData = JSON.parse(fs.readFileSync(commentsFile, 'utf-8'));
} catch (e) {
  commentsData = [];
}
const commentRateLimit = {};

// Load Dashboard Lights
let dashboardLightsData = [];
try {
  dashboardLightsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'dashboard-lights.json'), 'utf-8'));
} catch (e) {
  console.error('dashboard-lights.json not found.');
}

function createSlug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const modelsList = vehiclesData.map(v => ({
  brandName: v.brand,
  brandSlug: createSlug(v.brand),
  name: v.model,
  slug: createSlug(v.model)
}));

// Deduplicate codes (keep first occurrence of each code)
const codesMap = new Map();
codesData.forEach(code => {
  if (!codesMap.has(code.code)) {
    codesMap.set(code.code, code);
  }
});
const codes = Array.from(codesMap.values());

const popularBrands = [
  { name: 'Audi', slug: 'audi' },
  { name: 'BMW', slug: 'bmw' },
  { name: 'BYD', slug: 'byd' },
  { name: 'Chery', slug: 'chery' },
  { name: 'Chevrolet', slug: 'chevrolet' },
  { name: 'Citroen', slug: 'citroen' },
  { name: 'Dacia', slug: 'dacia' },
  { name: 'DS Automobiles', slug: 'ds-automobiles' },
  { name: 'Fiat', slug: 'fiat' },
  { name: 'Ford', slug: 'ford' },
  { name: 'Honda', slug: 'honda' },
  { name: 'Hyundai', slug: 'hyundai' },
  { name: 'Kia', slug: 'kia' },
  { name: 'Mercedes', slug: 'mercedes' },
  { name: 'Mitsubishi', slug: 'mitsubishi' },
  { name: 'Opel', slug: 'opel' },
  { name: 'Peugeot', slug: 'peugeot' },
  { name: 'Renault', slug: 'renault' },
  { name: 'Seat', slug: 'seat' },
  { name: 'Skoda', slug: 'skoda' },
  { name: 'Tesla', slug: 'tesla' },
  { name: 'TOGG', slug: 'togg' },
  { name: 'Toyota', slug: 'toyota' },
  { name: 'Volkswagen', slug: 'volkswagen' },
  { name: 'Volvo', slug: 'volvo' }
];

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

function handleDetail(req, res, codeId, brandSlug = null, modelSlug = null) {
  const code = codes.find(c => c.code.toUpperCase() === codeId.toUpperCase());
  
  if (!code) {
    return handle404(req, res);
  }

  let brandObj = null;
  let modelObj = null;
  let brandModels = [];

  if (brandSlug) {
    brandObj = popularBrands.find(b => b.slug === brandSlug.toLowerCase());
    if (!brandObj) {
      return handle404(req, res);
    }
    
    brandModels = modelsList.filter(m => m.brandSlug === brandObj.slug);

    if (modelSlug) {
      modelObj = brandModels.find(m => m.slug === modelSlug.toLowerCase());
      if (!modelObj) {
        return handle404(req, res);
      }
    }
  }

  // Find related codes (same category, same affected system)
  const related = codes.filter(c =>
    c.code !== code.code &&
    (c.category === code.category) &&
    (c.affectedSystem === code.affectedSystem || c.code.substring(0, 3) === code.code.substring(0, 3))
  ).slice(0, 6);

  let categoryName = "Bilinmeyen Kategori";
  if (code.category === 'P') { categoryName = "Motor ve Şanzıman"; }
  if (code.category === 'B') { categoryName = "Gövde ve Elektronik"; }
  if (code.category === 'C') { categoryName = "Şasi ve Fren Sistemi"; }
  if (code.category === 'U') { categoryName = "İletişim Ağı ve Veri Yolu"; }

  const severityTextMap = {
    'low': 'Düşük Ciddiyet',
    'düşük': 'Düşük Ciddiyet',
    'medium': 'Orta Ciddiyet',
    'orta': 'Orta Ciddiyet',
    'high': 'Yüksek Ciddiyet',
    'yüksek': 'Yüksek Ciddiyet',
  };

  const severityClassMap = {
    'low': 'düşük',
    'düşük': 'düşük',
    'medium': 'orta',
    'orta': 'orta',
    'high': 'yüksek',
    'yüksek': 'yüksek'
  };
  const mappedSeverity = severityClassMap[code.severity] || 'düşük';

  let pageTitle = `${code.code} - ${code.name}`;
  let metaDescription = `${code.code} arıza kodu: ${code.name}. ${code.description.substring(0, 150)}`;
  let displayCodeName = code.name;
  let canonicalUrl = `https://www.obdkodu.com/kod/${code.code}`;
  let displayDescription = code.description;

  if (brandObj && !modelObj) {
    pageTitle = `${brandObj.name} ${code.code} Arıza Kodu: Nedenleri ve Çözümü`;
    metaDescription = `${brandObj.name} aracınızda ${code.code} arıza kodu mu var? ${code.name} sorununun nedenleri, belirtileri ve kesin çözüm yöntemleri.`;
    displayCodeName = `${brandObj.name} ${code.code} - ${code.name}`;
    canonicalUrl = `https://www.obdkodu.com/kod/${code.code}/${brandObj.slug}`;
    displayDescription = `Eğer ${brandObj.name} marka aracınızda ${code.code} arıza kodunu görüyorsanız, ${code.description}`;
  } else if (brandObj && modelObj) {
    pageTitle = `${brandObj.name} ${modelObj.name} ${code.code} Arıza Kodu Çözümü`;
    metaDescription = `${brandObj.name} ${modelObj.name} model aracınızda ${code.code} arıza kodu mu var? ${code.name} sorununun nedenleri ve kesin çözümü.`;
    displayCodeName = `${brandObj.name} ${modelObj.name} ${code.code} - ${code.name}`;
    canonicalUrl = `https://www.obdkodu.com/kod/${code.code}/${brandObj.slug}/${modelObj.slug}`;
    displayDescription = `Eğer ${brandObj.name} ${modelObj.name} aracınızda ${code.code} arıza kodunu görüyorsanız, ${code.description}`;
  }

  const codeComments = commentsData.filter(c => c.code === code.code).reverse();
  const formattedComments = codeComments.map(c => {
    const d = new Date(c.date);
    return {
      ...c,
      formattedDate: `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
    };
  });

  const urlParts = req.url.split('?');
  const pathname = urlParts[0];
  const queryStr = urlParts[1] || '';
  const pageMatch = queryStr.match(/(?:^|&)page=(\d+)/);
  const page = pageMatch ? parseInt(pageMatch[1]) : 1;
  const limit = 10;
  const totalPages = Math.ceil(formattedComments.length / limit);
  
  let paginationHtml = '';
  if (totalPages > 1) {
    paginationHtml = '<div class="pagination">';
    for (let i = 1; i <= totalPages; i++) {
      const activeClass = i === page ? 'active' : '';
      paginationHtml += `<a href="${pathname}?page=${i}#yorumlar" class="page-link ${activeClass}">${i}</a>`;
    }
    paginationHtml += '</div>';
  }

  const paginatedComments = formattedComments.slice((page - 1) * limit, page * limit);

  // Find related dashboard light
  let relatedLight = dashboardLightsData.find(l => l.exampleCodes.includes(code.code));
  if (!relatedLight) {
    // If not directly in example codes, match by category prefix (e.g. P0, P2)
    relatedLight = dashboardLightsData.find(l => l.relatedCodeCategories.some(cat => code.code.startsWith(cat)));
  }

  let hasDashboardLight = '';
  let dlName = '';
  let dlDesc = '';
  let dlImg = '';
  let dlSvg = '';
  let dlIsEV = '';

  let dlNoImage = '';
  let dlGlowClass = '';

  if (relatedLight) {
    hasDashboardLight = 'true';
    dlName = relatedLight.name;
    dlDesc = relatedLight.description;
    dlIsEV = relatedLight.id.startsWith('ev-') ? 'true' : '';
    dlGlowClass = relatedLight.color === 'red' ? 'svg-glow-red' : (relatedLight.color === 'yellow' ? 'svg-glow-yellow' : 'svg-glow-green');
    
    const imgPath = path.join(__dirname, 'public', 'images', 'dashboard-lights', `${relatedLight.id}.png`);
    if (fs.existsSync(imgPath)) {
      dlImg = `/images/dashboard-lights/${relatedLight.id}.png`;
    } else {
      dlSvg = relatedLight.iconSvg;
      dlNoImage = 'true';
    }
  }

  const html = render('detail', {
    pageTitle,
    metaDescription,
    canonicalUrl,
    activeSearch: 'active',
    ...code,
    name: displayCodeName,
    description: displayDescription,
    categoryName: categoryName,
    severityText: severityTextMap[code.severity] || code.severity,
    severity: mappedSeverity,
    isHighSeverity: (code.severity === 'yüksek' || code.severity === 'high') ? 'true' : '',
    isNotHighSeverity: (code.severity !== 'yüksek' && code.severity !== 'high') ? 'true' : '',
    hasDashboardLight,
    dlName,
    dlDesc,
    dlImg,
    dlSvg,
    dlIsEV,
    dlNoImage,
    dlGlowClass,
    hasRelated: related.length > 0 ? 'true' : '',
    relatedCodes: related,
    brandName: brandObj ? brandObj.name : '',
    modelName: modelObj ? modelObj.name : '',
    popularBrands,
    brandModels,
    showBrandsCloud: !brandObj ? 'true' : '',
    showModelsCloud: (brandObj && !modelObj && brandModels.length > 0) ? 'true' : '',
    isBrandPage: (brandObj && !modelObj) ? 'true' : '',
    isModelPage: (brandObj && modelObj) ? 'true' : '',
    brandSlug: brandObj ? brandObj.slug : '',
    comments: paginatedComments,
    hasComments: formattedComments.length > 0 ? 'true' : '',
    noComments: formattedComments.length === 0 ? 'true' : '',
    commentCount: formattedComments.length,
    paginationHtml: paginationHtml
  });
  sendHtml(res, 200, html);
}

function handleDashboardLightDetail(req, res, id) {
  const light = dashboardLightsData.find(l => l.id === id);
  if (!light) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    const html = render('index', { 
      pageTitle: 'Gösterge Bulunamadı - OBDKodları', 
      metaDescription: 'Aradığınız gösterge işareti bulunamadı.',
      canonicalUrl: 'https://www.obdkodu.com/'
    });
    res.end(html);
    return;
  }

  // First: exact matches from exampleCodes
  let relatedCodesList = codesData.filter(c => 
    light.exampleCodes && light.exampleCodes.includes(c.code)
  );

  // If we have fewer than 5 exact matches, supplement with category prefix matches
  if (relatedCodesList.length < 5 && light.relatedCodeCategories) {
    const existingCodes = new Set(relatedCodesList.map(c => c.code));
    const categoryMatches = codesData.filter(c => 
      !existingCodes.has(c.code) && 
      light.relatedCodeCategories.some(cat => c.code.startsWith(cat))
    ).slice(0, 20 - relatedCodesList.length);
    relatedCodesList = [...relatedCodesList, ...categoryMatches];
  }

  relatedCodesList = relatedCodesList.slice(0, 20);

  const imgPath = path.join(__dirname, 'public', 'images', 'dashboard-lights', `${light.id}.png`);
  const hasImage = fs.existsSync(imgPath);

  // --- Comments Logic ---
  const codeComments = commentsData.filter(c => c.code === light.id).reverse();
  const formattedComments = codeComments.map(c => {
    const d = new Date(c.date);
    return {
      ...c,
      formattedDate: `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`
    };
  });

  const urlParts = req.url.split('?');
  const pathname = urlParts[0];
  const queryStr = urlParts[1] || '';
  const pageMatch = queryStr.match(/(?:^|&)page=(\d+)/);
  const page = pageMatch ? parseInt(pageMatch[1]) : 1;
  const limit = 10;
  const totalPages = Math.ceil(formattedComments.length / limit);
  
  let paginationHtml = '';
  if (totalPages > 1) {
    paginationHtml = '<div class="pagination">';
    for (let i = 1; i <= totalPages; i++) {
      const activeClass = i === page ? 'active' : '';
      paginationHtml += `<a href="${pathname}?page=${i}#yorumlar" class="page-link ${activeClass}">${i}</a>`;
    }
    paginationHtml += '</div>';
  }

  const paginatedComments = formattedComments.slice((page - 1) * limit, page * limit);

  const context = {
    pageTitle: `${light.name} Neden Yanar? - OBDKodları`,
    metaDescription: `${light.name} neden yanar? ${light.description.substring(0, 120)}`,
    canonicalUrl: `https://www.obdkodu.com/gosterge-paneli/${light.id}`,
    activeDashboard: 'active',
    id: light.id,
    name: light.name,
    description: light.description,
    iconSvg: light.iconSvg,
    imageUrl: hasImage ? `/images/dashboard-lights/${light.id}.png` : '',
    hasImage: hasImage ? 'true' : '',
    noImage: !hasImage ? 'true' : '',
    glowClass: light.color === 'red' ? 'svg-glow-red' : (light.color === 'yellow' ? 'svg-glow-yellow' : 'svg-glow-green'),
    isEV: light.id.startsWith('ev-') ? 'true' : '',
    isHighSeverity: light.severity === 'yüksek' ? 'true' : '',
    isMediumSeverity: light.severity === 'orta' ? 'true' : '',
    isLowSeverity: light.severity === 'düşük' ? 'true' : '',
    hasRelatedCodes: relatedCodesList.length > 0 ? 'true' : '',
    relatedCodesList: relatedCodesList.map(c => {
      let mappedSeverity = 'low';
      if (c.severity === 'yüksek' || c.severity === 'high') mappedSeverity = 'high';
      else if (c.severity === 'orta' || c.severity === 'medium') mappedSeverity = 'medium';
      return { ...c, severity: mappedSeverity };
    }),
    noRelatedCodes: relatedCodesList.length === 0 ? 'true' : '',
    comments: paginatedComments,
    hasComments: formattedComments.length > 0 ? 'true' : '',
    noComments: formattedComments.length === 0 ? 'true' : '',
    commentCount: formattedComments.length,
    paginationHtml: paginationHtml
  };

  const html = render('dashboard-light-detail', context);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
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

function handleDashboardLights(req, res) {
  const processedLights = dashboardLightsData.map(light => {
    const htmlCodes = light.exampleCodes.map(code => {
      const cat = code.substring(0, 1);
      return `<span class="code-badge category-${cat}" style="font-size: 0.8rem; padding: 3px 8px;">${code}</span>`;
    }).join('');

    // Check if a real image exists for this light
    const imgPath = path.join(__dirname, 'public', 'images', 'dashboard-lights', `${light.id}.png`);
    const hasImage = fs.existsSync(imgPath);

    return {
      ...light,
      isRed: light.color === 'red' ? 'true' : '',
      isYellow: light.color === 'yellow' ? 'true' : '',
      isGreen: light.color === 'green' ? 'true' : '',
      isHigh: light.severity === 'yüksek' ? 'true' : '',
      isMedium: light.severity === 'orta' ? 'true' : '',
      isLow: light.severity === 'düşük' ? 'true' : '',
      isEV: light.id.startsWith('ev-') ? 'true' : '',
      imageUrl: hasImage ? `/images/dashboard-lights/${light.id}.png` : '',
      hasImage: hasImage ? 'true' : '',
      noImage: !hasImage ? 'true' : '',
      glowClass: light.color === 'red' ? 'svg-glow-red' : (light.color === 'yellow' ? 'svg-glow-yellow' : 'svg-glow-green'),
      exampleCodesHtml: htmlCodes
    };
  });

  const classicLights = processedLights.filter(l => !l.id.startsWith('ev-'));
  const evLights = processedLights.filter(l => l.id.startsWith('ev-'));

  const html = render('dashboard-lights', {
    pageTitle: 'Gösterge Paneli İşaretleri ve Anlamları',
    metaDescription: 'Araç gösterge panelinde yanan motor arıza, ABS, ESP, Akü, Yağ basıncı, EV batarya, şarj sistemi gibi ikaz ışıklarının anlamları ve ilgili OBD arıza kodları.',
    activeDashboard: 'active',
    lights: classicLights,
    evLights: evLights,
    hasEvLights: evLights.length > 0 ? 'true' : ''
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

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.replace(/[&<>"']/g, c => map[c]);
}

function handleApiComments(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
    if (body.length > 10000) req.connection.destroy();
  });
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      const now = Date.now();
      if (!commentRateLimit[ip]) commentRateLimit[ip] = [];
      commentRateLimit[ip] = commentRateLimit[ip].filter(t => now - t < 3600000);
      if (commentRateLimit[ip].length >= 2) {
        return sendJson(res, 429, { error: 'Çok fazla yorum gönderdiniz. Lütfen 1 saat bekleyin.' });
      }

      if (data.website && data.website.trim() !== '') {
        return sendJson(res, 200, { success: true }); // Honeypot trap
      }

      if (!data.name || !data.comment || !data.code) {
        return sendJson(res, 400, { error: 'Lütfen tüm alanları doldurun.' });
      }

      const text = data.comment.toLowerCase();
      const nameText = data.name.toLowerCase();

      // Spam Link Check
      if (text.includes('http') || text.includes('www.') || text.includes('.com') || text.includes('<a ')) {
        return sendJson(res, 400, { error: 'Spam koruması: Yorumlarda link paylaşımına izin verilmemektedir.' });
      }

      // Profanity Filter (Küfür/Argo Filtresi)
      const badWords = [
        'amk', 'aq', 'oç', 'orospu', 'piç', 'yarrak', 'yarak', 'göt', 'amcık', 
        'siktir', 'pezevenk', 'kahpe', 'fahişe', 'fuck', 'shit', 'bitch', 'asshole',
        'sik', 'sikiş', 'am', 'yavşak', 'ibne', 'puşt', 'pic', 'amk', 'sikik'
      ];
      const profanityRegex = new RegExp('(^|\\s|\\W)(' + badWords.join('|') + ')(\\s|\\W|$)', 'i');
      
      if (profanityRegex.test(text) || profanityRegex.test(nameText)) {
        return sendJson(res, 400, { error: 'Topluluk kurallarına aykırı (argo/küfür) kelimeler içerdiği için yorumunuz reddedildi.' });
      }

      const cleanComment = escapeHtml(data.comment.trim());
      const cleanName = escapeHtml(data.name.trim().substring(0, 50));
      const codeId = escapeHtml(data.code.trim().toUpperCase());

      const newComment = {
        id: Date.now().toString(),
        code: codeId,
        name: cleanName,
        comment: cleanComment,
        date: new Date().toISOString()
      };

      commentsData.push(newComment);
      fs.writeFileSync(commentsFile, JSON.stringify(commentsData, null, 2));

      commentRateLimit[ip].push(now);
      sendJson(res, 200, { success: true, comment: newComment });
    } catch (e) {
      sendJson(res, 400, { error: 'Geçersiz veri.' });
    }
  });
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
  <url>
    <loc>${baseUrl}/gosterge-paneli</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
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

  if (pathname === '/gosterge-paneli' || pathname === '/gosterge-paneli/') {
    return handleDashboardLights(req, res);
  }

  // Check if it's a dashboard light detail page
  const dlMatch = pathname.match(/^\/gosterge-paneli\/([a-zA-Z0-9-]+)$/);
  if (dlMatch) {
    return handleDashboardLightDetail(req, res, dlMatch[1]);
  }

  // SEO
  if (pathname === '/robots.txt' && req.method === 'GET') {
    return handleRobotsTxt(req, res);
  }

  if (pathname === '/sitemap.xml' && req.method === 'GET') {
    return handleSitemap(req, res);
  }

  // Code detail: /kod/P0300 or /kod/P0300/hyundai or /kod/P0300/hyundai/i20
  const codeMatch = pathname.match(/^\/kod\/([A-Za-z0-9]+)(?:\/([A-Za-z0-9-]+))?(?:\/([A-Za-z0-9-]+))?$/);
  if (codeMatch && req.method === 'GET') {
    return handleDetail(req, res, codeMatch[1], codeMatch[2], codeMatch[3]);
  }

  // API endpoints
  if (pathname === '/api/search' && req.method === 'GET') {
    return handleApiSearch(req, res, query);
  }

  if (pathname === '/api/comments' && req.method === 'POST') {
    return handleApiComments(req, res);
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
