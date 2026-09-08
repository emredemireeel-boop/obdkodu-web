// ===================================
// OBD Kodları Web Sitesi - Node.js Server
// Saf Node.js, framework kullanılmıyor
// ===================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { render } = require('./lib/template');
const {
  buildDiagnosticSteps,
  buildFaqs,
  buildSeverityAssessment,
  classifySystem,
  createFallbackCode,
  enrichPriorityCode,
} = require('./lib/obd-content');

const PORT = process.env.PORT || 3000;

const SECURITY_HEADERS = Object.freeze({
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; connect-src 'self'; upgrade-insecure-requests",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
});

function serializeJsonLd(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

// Load OBD codes data
let codesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'obd-codes.json'), 'utf-8')
);

// Expand the public lookup database with the audited CC0 OBDex registry.
// Existing Turkish editorial records always win. Reference-only fallbacks are
// useful to visitors but stay out of the SEO index until editorial review.
let obdexMeta = null;
try {
  const obdex = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data', 'obdex-generic.json'), 'utf-8')
  );
  obdexMeta = obdex.meta || null;
  const existingByCode = new Map(codesData.map(item => [item.code, item]));
  for (const record of obdex.records || []) {
    const existing = existingByCode.get(record.code);
    if (existing) {
      existing.titleEn = record.titleEn;
      existing.descriptionEn = record.descriptionEn;
      existing.affectedComponents = record.affectedComponents || [];
      existing.flags = record.flags || {};
      existing.relatedCodes = record.relatedCodes || [];
      existing.sourceLinks = record.sources || [];
      existing.sourceDataset = 'OBDex';
      continue;
    }
    const fallback = createFallbackCode(record);
    codesData.push(fallback);
    existingByCode.set(fallback.code, fallback);
  }
} catch (e) {
  console.error('obdex-generic.json could not be loaded:', e.message);
}

// Editorial improvements for high-intent codes are kept separate from the
// imported database so future data refreshes do not overwrite reviewed copy.
try {
  const codeGuideOverrides = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data', 'code-guide-overrides.json'), 'utf-8')
  );
  const overridesByCode = new Map(codeGuideOverrides.map(item => [item.code, item]));
  codesData = codesData.map(code => ({ ...code, ...(overridesByCode.get(code.code) || {}) }));
} catch (e) {
  console.error('code-guide-overrides.json not found.');
}

let seoPriorityPCodeList = [];
let seoPriorityPCodes = new Set();
try {
  const priorityData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data', 'seo-priority-p-codes.json'), 'utf-8')
  );
  seoPriorityPCodeList = Array.isArray(priorityData.codes) ? priorityData.codes : [];
  seoPriorityPCodes = new Set(seoPriorityPCodeList);
} catch (e) {
  console.error('seo-priority-p-codes.json not found.');
}

const severityGlobalMap = {
  'low': 'düşük',
  'medium': 'orta',
  'high': 'yüksek',
  'critical': 'kritik'
};

codesData = codesData.map(c => {
  let normalized = {
    ...c,
    category: c.code ? c.code.charAt(0).toUpperCase() : 'P',
    severity: severityGlobalMap[c.severity] || c.severity
  };
  if (normalized.category === 'P' && seoPriorityPCodes.has(normalized.code)) {
    normalized = enrichPriorityCode(normalized);
  }
  const system = classifySystem(normalized);
  const assessment = buildSeverityAssessment(normalized);
  return {
    ...normalized,
    affectedSystem: normalized.affectedSystem || system.name,
    systemKey: system.key,
    severity: severityGlobalMap[assessment.level] || assessment.level,
  };
});

// Load Models
let vehiclesData = [];
try {
  vehiclesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'vehicles.json'), 'utf-8'));
} catch (e) {
  console.log('vehicles.json not found, continuing without models.');
}

// Load Dashboard Lights
let dashboardLightsData = [];
try {
  dashboardLightsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'dashboard-lights.json'), 'utf-8'));
} catch (e) {
  console.error('dashboard-lights.json not found.');
}

let systemGuidesData = [];
try {
  systemGuidesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'system-guides.json'), 'utf-8'));
} catch (e) {
  console.error('system-guides.json not found.');
}

function createSlug(str) {
  const transliterationMap = {
    ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u',
    Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u'
  };
  return String(str)
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, char => transliterationMap[char])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Mixed-brand rows describe shared platforms, not a real model landing page.
// Mercedes-Benz is normalized to the public-facing Mercedes brand hub.
const brandAliases = { 'Mercedes-Benz': 'Mercedes' };
const modelsMap = new Map();
vehiclesData.forEach(vehicle => {
  if (!vehicle.brand || !vehicle.model || vehicle.brand.includes('/')) return;
  const brandName = brandAliases[vehicle.brand] || vehicle.brand;
  const model = {
    brandName,
    brandSlug: createSlug(brandName),
    name: vehicle.model,
    slug: createSlug(vehicle.model)
  };
  const key = `${model.brandSlug}/${model.slug}`;
  if (!modelsMap.has(key)) modelsMap.set(key, model);
});
const modelsList = Array.from(modelsMap.values());

// Deduplicate codes (keep first occurrence of each code)
const codesMap = new Map();
codesData.forEach(code => {
  if (!codesMap.has(code.code)) {
    codesMap.set(code.code, code);
  }
});
const codes = Array.from(codesMap.values());

// Only expose genuinely useful, editorially complete code guides to Search.
// The full database stays available to visitors, but short/generated entries
// must not dilute the crawl budget or recreate the old doorway-page footprint.
function isIndexableCode(code) {
  if (code.sourceQuality === 'reference-only' && (!code.seoPriority || /standart OBD-II kod tanımı/i.test(code.name))) return false;
  const hasDetailedDescription = String(code.description || '').trim().length >= 180;
  const hasCompleteGuidance = ['symptoms', 'causes', 'solutions'].every(field =>
    Array.isArray(code[field]) && code[field].filter(Boolean).length >= 3
  );
  return hasDetailedDescription && hasCompleteGuidance;
}

const indexableCodes = codes.filter(isIndexableCode);
const indexablePowertrainCodes = indexableCodes.filter(code => code.category === 'P');
const indexableOtherCodes = indexableCodes.filter(code => code.category !== 'P');
const priorityPowertrainCodes = seoPriorityPCodeList
  .map(codeId => codes.find(code => code.code === codeId))
  .filter(code => code && isIndexableCode(code));

const popularBrands = [
  { name: 'Abarth', slug: 'abarth' },
  { name: 'Alfa Romeo', slug: 'alfa-romeo' },
  { name: 'Audi', slug: 'audi' },
  { name: 'BMW', slug: 'bmw' },
  { name: 'BYD', slug: 'byd' },
  { name: 'Chery', slug: 'chery' },
  { name: 'Chevrolet', slug: 'chevrolet' },
  { name: 'Citroen', slug: 'citroen' },
  { name: 'Cupra', slug: 'cupra' },
  { name: 'Dacia', slug: 'dacia' },
  { name: 'DS Automobiles', slug: 'ds-automobiles' },
  { name: 'Fiat', slug: 'fiat' },
  { name: 'Ford', slug: 'ford' },
  { name: 'Honda', slug: 'honda' },
  { name: 'Hyundai', slug: 'hyundai' },
  { name: 'Isuzu', slug: 'isuzu' },
  { name: 'Jaecoo', slug: 'jaecoo' },
  { name: 'Jaguar', slug: 'jaguar' },
  { name: 'Jeep', slug: 'jeep' },
  { name: 'KGM', slug: 'kgm' },
  { name: 'Kia', slug: 'kia' },
  { name: 'Land Rover', slug: 'land-rover' },
  { name: 'Lexus', slug: 'lexus' },
  { name: 'Maserati', slug: 'maserati' },
  { name: 'Mazda', slug: 'mazda' },
  { name: 'Mercedes', slug: 'mercedes' },
  { name: 'MG', slug: 'mg' },
  { name: 'MINI', slug: 'mini' },
  { name: 'Mitsubishi', slug: 'mitsubishi' },
  { name: 'Nissan', slug: 'nissan' },
  { name: 'Opel', slug: 'opel' },
  { name: 'Omoda', slug: 'omoda' },
  { name: 'Peugeot', slug: 'peugeot' },
  { name: 'Porsche', slug: 'porsche' },
  { name: 'Renault', slug: 'renault' },
  { name: 'Saab', slug: 'saab' },
  { name: 'Seat', slug: 'seat' },
  { name: 'Skoda', slug: 'skoda' },
  { name: 'Smart', slug: 'smart' },
  { name: 'SsangYong', slug: 'ssangyong' },
  { name: 'Subaru', slug: 'subaru' },
  { name: 'Suzuki', slug: 'suzuki' },
  { name: 'Tesla', slug: 'tesla' },
  { name: 'TOGG', slug: 'togg' },
  { name: 'Toyota', slug: 'toyota' },
  { name: 'Volkswagen', slug: 'volkswagen' },
  { name: 'Volvo', slug: 'volvo' }
];

// Precompute category counts
const categoryNames = {
  P: 'Motor & Şanzıman',
  B: 'Gövde',
  C: 'Şasi',
  U: 'İletişim'
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

function codeMatchesSystemGuide(code, guide) {
  return (guide.prefixes || []).some(prefix => code.code.startsWith(prefix));
}

function getCodesForSystemGuide(guide) {
  const featuredOrder = new Map((guide.featuredCodes || []).map((codeId, index) => [codeId, index]));
  return codes
    .filter(code => codeMatchesSystemGuide(code, guide))
    .sort((a, b) => {
      const aOrder = featuredOrder.has(a.code) ? featuredOrder.get(a.code) : Number.MAX_SAFE_INTEGER;
      const bOrder = featuredOrder.has(b.code) ? featuredOrder.get(b.code) : Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder || a.code.localeCompare(b.code);
    });
}

const systemGuides = systemGuidesData.map(guide => ({
  ...guide,
  codeCount: getCodesForSystemGuide(guide).length
}));

function getSystemGuideForCode(code) {
  return systemGuides.find(guide => codeMatchesSystemGuide(code, guide)) || null;
}

// MIME types for static files
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xsl': 'application/xml; charset=utf-8',
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
  // Pick popular codes (The 12 most searched codes — reduced for faster page load)
  const popular = [
    'P0420', 'P0300', 'P0171', 'P0101', 'P0335', 'P0340',
    'P0401', 'P0299', 'P0700', 'P0455', 'P0128', 'P0016'
  ].map(c => codes.find(item => item.code === c)).filter(Boolean);

  // WebSite schema — enables Google Sitelinks Search Box
  const webSiteSchemaJson = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "OBD Kodları",
    "alternateName": "OBD Kodu",
    "url": "https://www.obdkodu.com",
    "inLanguage": "tr",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.obdkodu.com/arama?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  });

  // Organization schema — brand authority signal
  const orgSchemaJson = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "OBD Kodları",
    "url": "https://www.obdkodu.com",
    "logo": "https://www.obdkodu.com/images/logo.png",
    "description": `Türkçe OBD-II arıza kodu veritabanı. ${totalCodes.toLocaleString('tr-TR')} kod, ciddiyet değerlendirmesi ve güvenli doğrulama adımları.`,
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "info@obdkodu.com",
      "contactType": "customer service",
      "availableLanguage": "Turkish"
    }
  });

  const html = render('home', {
    pageTitle: 'OBD-II Arıza Kodu Sorgulama — Türkçe Veritabanı',
    metaDescription: `Araç arıza kodlarını anında sorgulayın. ${totalCodes.toLocaleString('tr-TR')} OBD-II kodu, ciddiyet seviyesi, belirtiler ve güvenli teşhis adımları.`,
    canonicalUrl: 'https://www.obdkodu.com/',
    activeHome: 'active',
    totalCodes,
    ...counts,
    popularCodes: popular,
    popularBrands,
    systemGuides: systemGuides.slice(0, 8),
    webSiteSchemaJson,
    orgSchemaJson,
  });
  sendHtml(res, 200, html);
}

function handleSearch(req, res, query) {
  const rawQuery = (query.q || '').trim();
  const q = rawQuery.toLowerCase();
  const kategori = (query.kategori || '').trim().toUpperCase();
  const sistem = (query.sistem || '').trim().toLowerCase();
  const requestedPage = Math.max(1, parseInt(query.page, 10) || 1);

  let filtered = codes;
  if (q) {
    const tokens = q.split(/\s+/).filter(Boolean);
    filtered = filtered.filter(code => {
      const haystack = [code.code, code.name, code.description, code.affectedSystem, code.systemKey, code.titleEn]
        .join(' ')
        .toLowerCase();
      return tokens.every(token => haystack.includes(token));
    });
  }

  const availableSystems = Array.from(new Map(codes.map(code => [
    code.systemKey,
    { key: code.systemKey, name: code.affectedSystem }
  ])).values()).filter(option => option.key).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  const validSystem = availableSystems.some(option => option.key === sistem) ? sistem : '';
  if (validSystem) filtered = filtered.filter(code => code.systemKey === validSystem);

  const filteredCounts = {
    pFilterCount: filtered.filter(code => code.category === 'P').length,
    bFilterCount: filtered.filter(code => code.category === 'B').length,
    cFilterCount: filtered.filter(code => code.category === 'C').length,
    uFilterCount: filtered.filter(code => code.category === 'U').length,
  };
  const totalCount = filtered.length;

  if (kategori && ['P', 'B', 'C', 'U'].includes(kategori)) {
    filtered = filtered.filter(code => code.category === kategori);
  }

  const resultCount = filtered.length;
  const pageSize = 60;
  const totalPages = Math.max(1, Math.ceil(resultCount / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const results = filtered.slice((page - 1) * pageSize, page * pageSize);

  const buildSearchUrl = (overrides = {}) => {
    const params = new URLSearchParams();
    const values = { q: rawQuery, kategori, sistem: validSystem, page, ...overrides };
    if (values.q) params.set('q', values.q);
    if (values.kategori) params.set('kategori', values.kategori);
    if (values.sistem) params.set('sistem', values.sistem);
    if (values.page && values.page > 1) params.set('page', String(values.page));
    const suffix = params.toString();
    return suffix ? `/arama?${suffix}` : '/arama';
  };

  let paginationHtml = '';
  if (totalPages > 1) {
    const visiblePages = new Set([1, totalPages]);
    for (let number = Math.max(1, page - 2); number <= Math.min(totalPages, page + 2); number++) {
      visiblePages.add(number);
    }
    let previousNumber = 0;
    paginationHtml = '<nav class="search-pagination" aria-label="Arama sonucu sayfaları">';
    if (page > 1) paginationHtml += `<a href="${buildSearchUrl({ page: page - 1 })}" rel="prev">← Önceki</a>`;
    for (const number of [...visiblePages].sort((a, b) => a - b)) {
      if (number - previousNumber > 1) paginationHtml += '<span aria-hidden="true">…</span>';
      paginationHtml += `<a href="${buildSearchUrl({ page: number })}"${number === page ? ' class="active" aria-current="page"' : ''}>${number}</a>`;
      previousNumber = number;
    }
    if (page < totalPages) paginationHtml += `<a href="${buildSearchUrl({ page: page + 1 })}" rel="next">Sonraki →</a>`;
    paginationHtml += '</nav>';
  }

  const categorySuffix = `${rawQuery ? `&q=${encodeURIComponent(rawQuery)}` : ''}${validSystem ? `&sistem=${encodeURIComponent(validSystem)}` : ''}`;
  const allParams = new URLSearchParams();
  if (rawQuery) allParams.set('q', rawQuery);
  if (validSystem) allParams.set('sistem', validSystem);
  const allSuffix = allParams.toString();

  let searchCanonical = 'https://www.obdkodu.com/arama';
  if (kategori && !q && !validSystem && page === 1) searchCanonical += `?kategori=${kategori}`;
  const isNoIndex = (q || validSystem || page > 1) ? 'true' : '';
  const isAllCodes = (!q && !kategori && !validSystem) ? 'true' : '';

  const categoryMetaMap = {
    P: `OBD-II P kategorisindeki ${filteredCounts.pFilterCount} motor ve şanzıman arıza kodunu inceleyin.`,
    B: `OBD-II B kategorisindeki ${filteredCounts.bFilterCount} gövde ve SRS arıza kodunu inceleyin.`,
    C: `OBD-II C kategorisindeki ${filteredCounts.cFilterCount} ABS, direksiyon ve şasi kodunu inceleyin.`,
    U: `OBD-II U kategorisindeki ${filteredCounts.uFilterCount} CAN bus ve iletişim kodunu inceleyin.`,
  };
  const selectedSystem = availableSystems.find(option => option.key === validSystem);
  const metaDesc = q
    ? `“${rawQuery}” araması için ${resultCount} OBD-II arıza kodu bulundu.`
    : selectedSystem
      ? `${selectedSystem.name} ile ilgili ${resultCount} OBD-II kodunu ciddiyet ve teşhis bilgileriyle inceleyin.`
      : kategori
        ? categoryMetaMap[kategori]
        : `${totalCount} OBD-II arıza kodunu ciddiyet, belirtiler, olası nedenler ve doğrulama adımlarıyla inceleyin.`;

  const searchBreadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: 'https://www.obdkodu.com/' },
    { '@type': 'ListItem', position: 2, name: 'Arıza Kodları' }
  ];
  if (kategori && !q) {
    searchBreadcrumbItems[1].item = 'https://www.obdkodu.com/arama';
    searchBreadcrumbItems.push({ '@type': 'ListItem', position: 3, name: categoryNames[kategori] || kategori });
  }
  const searchBreadcrumbJson = serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: searchBreadcrumbItems
  });
  const isPowertrainCategory = !q && kategori === 'P' && !validSystem && page === 1;
  const powertrainFeaturedCodes = isPowertrainCategory ? priorityPowertrainCodes.slice(0, 24) : [];
  const powertrainCollectionJson = isPowertrainCategory ? serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Motor ve Şanzıman OBD-II Arıza Kodları',
    description: `${counts.pCount} P kodu içinden arama talebi yüksek ve ayrıntılı teşhis rehberi bulunan güç aktarma kodları.`,
    url: 'https://www.obdkodu.com/arama?kategori=P',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: powertrainFeaturedCodes.length,
      itemListElement: powertrainFeaturedCodes.map((code, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `${code.code} ${code.name}`,
        url: `https://www.obdkodu.com/kod/${code.code}`,
      })),
    },
  }) : '';

  const html = render('search', {
    pageTitle: q ? `“${rawQuery}” Arama Sonuçları` : selectedSystem ? `${selectedSystem.name} OBD Kodları` : kategori ? `${categoryNames[kategori] || kategori} Kodları` : 'Tüm Arıza Kodları',
    metaDescription: metaDesc,
    canonicalUrl: searchCanonical,
    activeSearch: 'active',
    searchQuery: rawQuery,
    isSearchQuery: q ? 'true' : '',
    isNoIndex,
    isAllCodes,
    isActiveCategory: (!q && kategori && !validSystem) ? 'true' : '',
    isSystemFilter: selectedSystem ? 'true' : '',
    categoryName: categoryNames[kategori] || '',
    selectedSystemName: selectedSystem ? selectedSystem.name : '',
    systemOptions: availableSystems.map(option => ({ ...option, selected: option.key === validSystem ? 'selected' : '' })),
    selectedCategory: kategori,
    hasSelectedCategory: kategori ? 'true' : '',
    urlAll: allSuffix ? `/arama?${allSuffix}` : '/arama',
    urlP: `/arama?kategori=P${categorySuffix}`,
    urlB: `/arama?kategori=B${categorySuffix}`,
    urlC: `/arama?kategori=C${categorySuffix}`,
    urlU: `/arama?kategori=U${categorySuffix}`,
    activeAll: !kategori ? 'active' : '',
    activeP: kategori === 'P' ? 'active' : '',
    activeB: kategori === 'B' ? 'active' : '',
    activeC: kategori === 'C' ? 'active' : '',
    activeU: kategori === 'U' ? 'active' : '',
    resultCount,
    totalCount,
    ...filteredCounts,
    hasResults: resultCount > 0 ? 'true' : '',
    noResults: resultCount === 0 ? 'true' : '',
    results,
    hasPagination: totalPages > 1 ? 'true' : '',
    paginationHtml,
    page,
    totalPages,
    searchBreadcrumbJson,
    isPowertrainCategory: isPowertrainCategory ? 'true' : '',
    powertrainFeaturedCodes,
    powertrainIndexedCount: indexablePowertrainCodes.length,
    powertrainCollectionJson,
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
    'critical': 'Kritik Ciddiyet',
    'kritik': 'Kritik Ciddiyet',
  };

  const severityClassMap = {
    'low': 'düşük',
    'düşük': 'düşük',
    'medium': 'orta',
    'orta': 'orta',
    'high': 'yüksek',
    'yüksek': 'yüksek',
    'critical': 'kritik',
    'kritik': 'kritik'
  };
  const severityAssessment = buildSeverityAssessment(code);
  const mappedSeverity = severityClassMap[severityAssessment.level] || severityClassMap[code.severity] || 'düşük';

  // SEO-optimized title tags — match Turkish search intent exactly
  let pageTitle = `${code.code} Arıza Kodu Nedir? Nedenleri ve Çözümü`;
  let metaDescription = `${code.code} arıza kodu nedir? ${code.name}. ${severityAssessment.label} ciddiyet; araç kullanımı, muayene etkisi, belirtiler, nedenler ve teşhis adımları.`;
  let displayCodeName = code.name;
  let canonicalUrl = `https://www.obdkodu.com/kod/${code.code}`;
  let displayDescription = code.description;

  if (brandObj && !modelObj) {
    pageTitle = `${brandObj.name} ${code.code} Arıza Kodu — Nedenleri ve Çözümü`;
    metaDescription = `${brandObj.name} aracınızda ${code.code} arıza kodu mu çıktı? ${code.name} — belirtileri, nedenleri ve kesin çözüm adımları burada.`;
    displayCodeName = `${brandObj.name} ${code.code} - ${code.name}`;
    canonicalUrl = `https://www.obdkodu.com/kod/${code.code}/${brandObj.slug}`;
    displayDescription = `Eğer ${brandObj.name} marka aracınızda ${code.code} arıza kodunu görüyorsanız, ${code.description}`;
  } else if (brandObj && modelObj) {
    pageTitle = `${brandObj.name} ${modelObj.name} ${code.code} Arıza Kodu Çözümü`;
    metaDescription = `${brandObj.name} ${modelObj.name} aracınızda ${code.code} arıza kodu mu çıktı? ${code.name} — nedenleri ve çözüm rehberi.`;
    displayCodeName = `${brandObj.name} ${modelObj.name} ${code.code} - ${code.name}`;
    canonicalUrl = `https://www.obdkodu.com/kod/${code.code}/${brandObj.slug}/${modelObj.slug}`;
    displayDescription = `Eğer ${brandObj.name} ${modelObj.name} aracınızda ${code.code} arıza kodunu görüyorsanız, ${code.description}`;
  }

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

  const relatedSystemGuide = getSystemGuideForCode(code);

  // === SERVER-SIDE JSON-LD GENERATION (SEO) ===
  const severityText = `${severityAssessment.label} Ciddiyet`;
  const isHigh = ['high', 'critical'].includes(severityAssessment.level);
  const diagnosticSteps = buildDiagnosticSteps(code);
  const faqs = buildFaqs(code, severityAssessment);

  const faqSchemaJson = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": { "@type": "Answer", "text": item.answer }
    }))
  });

  const techArticleJson = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": `${code.code} - ${code.name}`,
    "description": metaDescription,
    "url": canonicalUrl,
    "inLanguage": "tr-TR",
    "datePublished": "2026-06-12",
    "dateModified": SITEMAP_LASTMOD,
    "author": { "@type": "Organization", "name": "OBD Kodları Editoryal Ekibi", "url": "https://www.obdkodu.com/kaynaklar-ve-metodoloji" },
    "publisher": {
      "@type": "Organization",
      "name": "OBD Kodları",
      "url": "https://www.obdkodu.com",
      "logo": { "@type": "ImageObject", "url": "https://www.obdkodu.com/images/logo.png" }
    },
    "about": { "@type": "DefinedTerm", "name": code.code, "description": code.name },
    "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
    "citation": [
      "https://saemobilus.sae.org/standards/j2012_199203-diagnostic-trouble-code-definitions",
      "https://www.iso.org/standard/66369.html",
      "https://github.com/foerbsnavi/obdex"
    ],
    "keywords": [code.code, `${code.code} arıza kodu`, code.affectedSystem, "OBD-II", `${severityAssessment.label} ciddiyet`],
    "proficiencyLevel": "Beginner"
  });

  const howToSchemaJson = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `${code.code} Arıza Kodu Nasıl Teşhis Edilir?`,
    "description": `${code.code} (${code.name}) için güvenli ve ölçüme dayalı teşhis sırası.`,
    "step": diagnosticSteps.map((step, idx) => ({
      "@type": "HowToStep",
      "position": idx + 1,
      "name": step.title,
      "text": step.text
    }))
  });

  // Build JSON-LD BreadcrumbList — extended for brand/model
  const breadcrumbItems = [
    { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": "https://www.obdkodu.com/" },
    { "@type": "ListItem", "position": 2, "name": categoryName, "item": `https://www.obdkodu.com/arama?kategori=${code.category}` }
  ];
  if (brandObj && modelObj) {
    breadcrumbItems.push({ "@type": "ListItem", "position": 3, "name": code.code, "item": `https://www.obdkodu.com/kod/${code.code}` });
    breadcrumbItems.push({ "@type": "ListItem", "position": 4, "name": brandObj.name, "item": `https://www.obdkodu.com/kod/${code.code}/${brandObj.slug}` });
    breadcrumbItems.push({ "@type": "ListItem", "position": 5, "name": modelObj.name });
  } else if (brandObj) {
    breadcrumbItems.push({ "@type": "ListItem", "position": 3, "name": code.code, "item": `https://www.obdkodu.com/kod/${code.code}` });
    breadcrumbItems.push({ "@type": "ListItem", "position": 4, "name": brandObj.name });
  } else {
    breadcrumbItems.push({ "@type": "ListItem", "position": 3, "name": code.code });
  }
  const breadcrumbJson = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems
  });

  const definedTermJson = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "name": code.code,
    "description": code.name,
    "inDefinedTermSet": {
      "@type": "DefinedTermSet",
      "name": "OBD-II Arıza Kodları",
      "url": "https://www.obdkodu.com/arama"
    },
    "url": canonicalUrl
  });
  const webPageJson = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": pageTitle,
    "url": canonicalUrl,
    "inLanguage": "tr-TR",
    "dateModified": SITEMAP_LASTMOD,
    "isPartOf": { "@type": "WebSite", "name": "OBD Kodları", "url": "https://www.obdkodu.com" },
    "mainEntity": { "@type": "DefinedTerm", "name": code.code }
  });
  const isReferenceOnly = code.sourceQuality === 'reference-only';

  const html = render('detail', {
    pageTitle,
    metaDescription,
    canonicalUrl,
    isNoIndex: isIndexableCode(code) ? '' : 'true',
    activeSearch: 'active',
    ...code,
    name: displayCodeName,
    description: displayDescription,
    categoryName: categoryName,
    severityText,
    severity: mappedSeverity,
    riskLevel: severityAssessment.level,
    riskEmoji: severityAssessment.emoji,
    riskHeadline: severityAssessment.headline,
    riskAction: severityAssessment.action,
    vehicleUsable: severityAssessment.drivable,
    continueRisk: severityAssessment.continueRisk,
    inspectionImpact: severityAssessment.inspection,
    fuelImpact: severityAssessment.fuelImpact,
    damageRisk: severityAssessment.damageRisk,
    riskMethodologyNote: severityAssessment.methodologyNote,
    diagnosticSteps,
    faqs,
    isHighSeverity: isHigh ? 'true' : '',
    isNotHighSeverity: !isHigh ? 'true' : '',
    isReferenceOnly: isReferenceOnly ? 'true' : '',
    isEditorialGuide: isReferenceOnly ? '' : 'true',
    contentStatus: isReferenceOnly ? 'Referans kayıt — ayrıntılı teşhis üretici verisiyle doğrulanmalı' : 'Türkçe editoryal rehber',
    hasSourceTitle: code.titleEn ? 'true' : '',
    hasDashboardLight,
    dlName,
    dlDesc,
    dlImg,
    dlSvg,
    dlIsEV,
    dlNoImage,
    dlGlowClass,
    hasSystemGuide: relatedSystemGuide ? 'true' : '',
    systemGuideName: relatedSystemGuide ? relatedSystemGuide.name : '',
    systemGuideUrl: relatedSystemGuide ? `/sistem/${relatedSystemGuide.slug}` : '',
    dateModified: SITEMAP_LASTMOD,
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
    // Server-side rendered JSON-LD (no template syntax leaks)
    faqSchemaJson,
    techArticleJson,
    howToSchemaJson,
    breadcrumbJson,
    definedTermJson,
    webPageJson,
    hasHowTo: howToSchemaJson ? 'true' : '',
  });
  sendHtml(res, 200, html);
}

function handleDashboardLightDetail(req, res, id) {
  const light = dashboardLightsData.find(l => l.id === id);
  if (!light) {
    return handle404(req, res);
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

  // === SERVER-SIDE JSON-LD FOR DASHBOARD LIGHTS ===
  const dlBreadcrumbJson = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": "https://www.obdkodu.com/" },
      { "@type": "ListItem", "position": 2, "name": "Gösterge İşaretleri", "item": "https://www.obdkodu.com/gosterge-paneli" },
      { "@type": "ListItem", "position": 3, "name": light.name }
    ]
  });

  const dlArticleJson = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": `${light.name} Neden Yanar?`,
    "description": `${light.name} neden yanar? ${light.description.substring(0, 120)}`,
    "url": `https://www.obdkodu.com/gosterge-paneli/${light.id}`,
    "inLanguage": "tr",
    "datePublished": "2026-01-01",
    "dateModified": SITEMAP_LASTMOD,
    "author": { "@type": "Organization", "name": "OBD Kodları", "url": "https://www.obdkodu.com" },
    "publisher": {
      "@type": "Organization",
      "name": "OBD Kodları",
      "url": "https://www.obdkodu.com",
      "logo": { "@type": "ImageObject", "url": "https://www.obdkodu.com/images/logo.png" }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": `https://www.obdkodu.com/gosterge-paneli/${light.id}` },
    "proficiencyLevel": "Beginner"
  });

  const context = {
    pageTitle: `${light.name} Neden Yanar?`,
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
    // Server-side JSON-LD
    dlBreadcrumbJson,
    dlArticleJson,
  };

  const html = render('dashboard-light-detail', context);
  sendHtml(res, 200, html, req);
}

// =========== BRAND HUB PAGES (SEO) ===========

function handleBrandHub(req, res) {
  // Build brands with stats
  const brandsWithStats = popularBrands.map(brand => {
    const brandModelsList = modelsList.filter(m => m.brandSlug === brand.slug);
    return {
      ...brand,
      modelCount: brandModelsList.length,
      hasModels: brandModelsList.length > 0 ? 'true' : '',
    };
  });

  // ItemList JSON-LD
  const itemListJson = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Araç Markaları — OBD Arıza Kodları",
    "numberOfItems": popularBrands.length,
    "itemListElement": popularBrands.map((brand, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": `${brand.name} Arıza Kodları`,
      "url": `https://www.obdkodu.com/marka/${brand.slug}`
    }))
  });

  const breadcrumbJson = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": "https://www.obdkodu.com/" },
      { "@type": "ListItem", "position": 2, "name": "Markalar" }
    ]
  });

  const html = render('brand-hub', {
    pageTitle: 'Araç Markası ve Modeline Göre OBD-II Rehberleri',
    metaDescription: `${popularBrands.length} araç markası ve yüzlerce model için OBD-II kod okuma, doğrulama ve güvenli teşhis rehberleri.`,
    canonicalUrl: 'https://www.obdkodu.com/marka',
    brands: brandsWithStats,
    totalBrands: popularBrands.length,
    totalCodes,
    itemListJson,
    breadcrumbJson,
  });
  sendHtml(res, 200, html);
}

function handleBrandDetail(req, res, brandSlug) {
  const brand = popularBrands.find(b => b.slug === brandSlug);
  if (!brand) return handle404(req, res);

  const brandModels = modelsList.filter(m => m.brandSlug === brand.slug);
  
  // Get popular codes for this brand (first 20 P codes as they're most common)
  const popularCodesForBrand = codes.filter(c => c.category === 'P').slice(0, 12);

  // Category counts for all codes
  const pCount = codes.filter(c => c.category === 'P').length;
  const bCount = codes.filter(c => c.category === 'B').length;
  const cCount = codes.filter(c => c.category === 'C').length;
  const uCount = codes.filter(c => c.category === 'U').length;

  // ItemList JSON-LD for brand codes
  const itemListJson = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${brand.name} OBD-II Arıza Kodları`,
    "numberOfItems": totalCodes,
    "itemListElement": popularCodesForBrand.map((code, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": `${code.code} - ${code.name}`,
      "url": `https://www.obdkodu.com/kod/${code.code}`
    }))
  });

  const breadcrumbJson = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": "https://www.obdkodu.com/" },
      { "@type": "ListItem", "position": 2, "name": "Markalar", "item": "https://www.obdkodu.com/marka" },
      { "@type": "ListItem", "position": 3, "name": brand.name }
    ]
  });

  const html = render('brand-detail', {
    pageTitle: `${brand.name} OBD-II Rehberi ve Arıza Kodları`,
    metaDescription: `${brand.name} araçlarda standart OBD-II kodlarını okuma, doğrulama, model seçimi ve güvenli teşhis adımları.`,
    canonicalUrl: `https://www.obdkodu.com/marka/${brand.slug}`,
    isNoIndex: 'true',
    brandName: brand.name,
    brandSlug: brand.slug,
    brandModels,
    hasModels: brandModels.length > 0 ? 'true' : '',
    popularCodes: popularCodesForBrand,
    systemGuides: systemGuides.slice(0, 8),
    totalCodes,
    pCount,
    bCount,
    cCount,
    uCount,
    itemListJson,
    breadcrumbJson,
  });
  sendHtml(res, 200, html);
}

function handleBrandModel(req, res, brandSlug, modelSlug) {
  const brand = popularBrands.find(item => item.slug === brandSlug);
  if (!brand) return handle404(req, res);

  const model = modelsList.find(item => item.brandSlug === brand.slug && item.slug === modelSlug);
  if (!model) return handle404(req, res);

  const commonCodeIds = [
    'P0171', 'P0420', 'P0300', 'P0301', 'P0335', 'P0011',
    'P0455', 'P0128', 'P0700', 'U0100', 'C0035', 'B0001'
  ];
  const commonCodes = commonCodeIds
    .map(codeId => codes.find(code => code.code === codeId))
    .filter(Boolean);
  const siblingModels = modelsList
    .filter(item => item.brandSlug === brand.slug && item.slug !== model.slug)
    .slice(0, 18);
  const canonicalUrl = `${SITEMAP_BASE_URL}/marka/${brand.slug}/${model.slug}`;

  const itemListJson = serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': `${brand.name} ${model.name} için sık karşılaşılan OBD-II kodları`,
    'numberOfItems': commonCodes.length,
    'itemListElement': commonCodes.map((code, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': `${code.code} - ${code.name}`,
      'url': `${SITEMAP_BASE_URL}/kod/${code.code}`
    }))
  });

  const breadcrumbJson = serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Ana Sayfa', 'item': `${SITEMAP_BASE_URL}/` },
      { '@type': 'ListItem', 'position': 2, 'name': 'Markalar', 'item': `${SITEMAP_BASE_URL}/marka` },
      { '@type': 'ListItem', 'position': 3, 'name': brand.name, 'item': `${SITEMAP_BASE_URL}/marka/${brand.slug}` },
      { '@type': 'ListItem', 'position': 4, 'name': model.name }
    ]
  });

  const html = render('brand-model', {
    pageTitle: `${brand.name} ${model.name} Arıza Kodları ve OBD-II Rehberi`,
    metaDescription: `${brand.name} ${model.name} arıza kodlarını nasıl okuyacağınızı, OBD-II cihazıyla doğrulama adımlarını ve sık görülen kodları inceleyin.`,
    canonicalUrl,
    isNoIndex: 'true',
    brandName: brand.name,
    brandSlug: brand.slug,
    modelName: model.name,
    commonCodes,
    systemGuides: systemGuides.slice(0, 8),
    siblingModels,
    hasSiblingModels: siblingModels.length > 0 ? 'true' : '',
    itemListJson,
    breadcrumbJson
  });
  sendHtml(res, 200, html);
}

function handleSystemHub(req, res) {
  const itemListJson = serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'Araç Sistemlerine Göre OBD-II Arıza Kodları',
    'numberOfItems': systemGuides.length,
    'itemListElement': systemGuides.map((guide, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': guide.name,
      'url': `${SITEMAP_BASE_URL}/sistem/${guide.slug}`
    }))
  });
  const breadcrumbJson = serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Ana Sayfa', 'item': `${SITEMAP_BASE_URL}/` },
      { '@type': 'ListItem', 'position': 2, 'name': 'Sistem Rehberleri' }
    ]
  });

  const html = render('system-hub', {
    pageTitle: 'Araç Sistemlerine Göre OBD-II Arıza Kodları',
    metaDescription: 'Ateşleme, yakıt, turbo, EGR, DPF, şanzıman, ABS, airbag ve CAN Bus arıza kodlarını sistem bazında inceleyin.',
    canonicalUrl: `${SITEMAP_BASE_URL}/sistem`,
    activeSystems: 'active',
    systemGuides,
    totalSystems: systemGuides.length,
    itemListJson,
    breadcrumbJson
  });
  sendHtml(res, 200, html);
}

function handleSystemDetail(req, res, systemSlug) {
  const guide = systemGuides.find(item => item.slug === systemSlug);
  if (!guide) return handle404(req, res);

  const matchingCodes = getCodesForSystemGuide(guide);
  const visibleCodes = matchingCodes.slice(0, 72);
  const canonicalUrl = `${SITEMAP_BASE_URL}/sistem/${guide.slug}`;
  const itemListJson = serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': guide.name,
    'numberOfItems': visibleCodes.length,
    'itemListElement': visibleCodes.map((code, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': `${code.code} - ${code.name}`,
      'url': `${SITEMAP_BASE_URL}/kod/${code.code}`
    }))
  });
  const breadcrumbJson = serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Ana Sayfa', 'item': `${SITEMAP_BASE_URL}/` },
      { '@type': 'ListItem', 'position': 2, 'name': 'Sistem Rehberleri', 'item': `${SITEMAP_BASE_URL}/sistem` },
      { '@type': 'ListItem', 'position': 3, 'name': guide.name }
    ]
  });
  const collectionJson = serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': guide.name,
    'description': guide.description,
    'url': canonicalUrl,
    'inLanguage': 'tr',
    'isPartOf': { '@type': 'WebSite', 'name': 'OBD Kodları', 'url': SITEMAP_BASE_URL }
  });

  const html = render('system-detail', {
    pageTitle: `${guide.name}: Belirtiler, Kontroller ve Kod Listesi`,
    metaDescription: `${guide.name} için belirtiler, güvenli teşhis sırası ve ${guide.codeCount} ilgili OBD-II kodu.`,
    canonicalUrl,
    activeSystems: 'active',
    ...guide,
    codes: visibleCodes,
    hasMoreCodes: matchingCodes.length > visibleCodes.length ? 'true' : '',
    hiddenCodeCount: Math.max(0, matchingCodes.length - visibleCodes.length),
    itemListJson,
    breadcrumbJson,
    collectionJson
  });
  sendHtml(res, 200, html);
}

function handleMethodology(req, res) {
  const breadcrumbJson = serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Ana Sayfa', 'item': `${SITEMAP_BASE_URL}/` },
      { '@type': 'ListItem', 'position': 2, 'name': 'Kaynaklar ve Editoryal Yöntem' }
    ]
  });
  const html = render('methodology', {
    pageTitle: 'Kaynaklar ve Editoryal Yöntem',
    metaDescription: 'OBD Kodları içeriklerinin hangi standartlara dayandığını, nasıl kontrol edildiğini ve teknik sınırlarını inceleyin.',
    canonicalUrl: `${SITEMAP_BASE_URL}/kaynaklar-ve-metodoloji`,
    breadcrumbJson,
    lastModified: SITEMAP_LASTMOD
  });
  sendHtml(res, 200, html);
}

function handleAbout(req, res) {
  const html = render('about', {
    pageTitle: 'OBD-II Nedir?',
    metaDescription: 'OBD-II (On-Board Diagnostics II) arıza teşhis sistemi hakkında bilgi. Kod yapısı, kategoriler ve ciddiyet seviyeleri.',
    canonicalUrl: 'https://www.obdkodu.com/hakkinda',
    activeAbout: 'active',
  });
  sendHtml(res, 200, html);
}

function handlePrivacy(req, res) {
  const html = render('privacy', {
    pageTitle: 'Gizlilik Politikası',
    metaDescription: 'obdkodu.com gizlilik politikası ve çerez (cookie) kullanım ilkeleri.',
    canonicalUrl: 'https://www.obdkodu.com/gizlilik-politikasi',
  });
  sendHtml(res, 200, html);
}

function handleTerms(req, res) {
  const html = render('terms', {
    pageTitle: 'Kullanım Koşulları',
    metaDescription: 'obdkodu.com kullanım koşulları ve yasal sorumluluk reddi beyanı.',
    canonicalUrl: 'https://www.obdkodu.com/kullanim-kosullari',
  });
  sendHtml(res, 200, html);
}

function handleContact(req, res) {
  const html = render('contact', {
    pageTitle: 'İletişim',
    metaDescription: 'Soru, görüş ve önerileriniz için obdkodu.com iletişim bilgileri.',
    canonicalUrl: 'https://www.obdkodu.com/iletisim',
  });
  sendHtml(res, 200, html);
}

function handleDashboardLights(req, res) {
  /* Process dashboard lights data */
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

  // ItemList JSON-LD for dashboard lights (SEO)
  const dlItemListJson = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Araç Gösterge Paneli İşaretleri",
    "numberOfItems": dashboardLightsData.length,
    "itemListElement": dashboardLightsData.map((dl, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": dl.name,
      "url": `https://www.obdkodu.com/gosterge-paneli/${dl.id}`
    }))
  });

  const dlListBreadcrumbJson = serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": "https://www.obdkodu.com/" },
      { "@type": "ListItem", "position": 2, "name": "Gösterge İşaretleri" }
    ]
  });

  const html = render('dashboard-lights', {
    pageTitle: 'Gösterge Paneli İşaretleri',
    metaDescription: 'Araç gösterge panelinde yanan motor arıza, ABS, ESP, Akü, Yağ basıncı, EV batarya, şarj sistemi gibi ikaz ışıklarının anlamları ve ilgili OBD arıza kodları.',
    canonicalUrl: 'https://www.obdkodu.com/gosterge-paneli',
    activeDashboard: 'active',
    lights: classicLights,
    evLights: evLights,
    hasEvLights: evLights.length > 0 ? 'true' : '',
    dlItemListJson,
    dlListBreadcrumbJson,
  });
  sendHtml(res, 200, html);
}

function handleApiSearch(req, res, query) {
  const q = (query.q || '').trim().toLowerCase();
  const limit = Math.min(12, Math.max(1, parseInt(query.limit, 10) || 10));

  if (!q || q.length < 2) return sendJson(res, 200, []);
  const tokens = q.split(/\s+/).filter(Boolean);
  const results = codes
    .map(code => {
      const codeValue = code.code.toLowerCase();
      const nameValue = code.name.toLowerCase();
      const haystack = [code.code, code.name, code.description, code.affectedSystem, code.titleEn].join(' ').toLowerCase();
      if (!tokens.every(token => haystack.includes(token))) return null;
      let score = 0;
      if (codeValue === q || codeValue === `p${q}`) score += 100;
      else if (codeValue.startsWith(q) || codeValue.endsWith(q)) score += 70;
      if (nameValue.startsWith(q)) score += 40;
      else if (nameValue.includes(q)) score += 20;
      if (code.sourceQuality !== 'reference-only') score += 10;
      return { code, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.code.code.localeCompare(b.code.code))
    .slice(0, limit)
    .map(({ code }) => ({
      code: code.code,
      category: code.category,
      name: code.name,
      severity: code.severity,
      system: code.affectedSystem,
    }));

  sendJson(res, 200, results);
}

function handleApiComments(req, res) {
  sendJson(res, 410, {
    error: 'OBD Kodları üzerindeki kullanıcı yorumları kapatıldı.',
    communityUrl: 'https://otosoz.com'
  }, req);
}

function handle404(req, res) {
  // If the request was for a sitemap or xml file, do not return HTML
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname.toLowerCase().includes('sitemap') || pathname.endsWith('.xml')) {
    res.writeHead(404, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' });
    return res.end('404 Not Found: Sitemap or XML file does not exist.');
  }

  // Smart code suggestion from URL
  const codeMatch = pathname.match(/([PBCU]\d{4})/i);
  let suggestedCode = null;
  let suggestedUrl = '';
  if (codeMatch) {
    const searchCode = codeMatch[1].toUpperCase();
    // Try exact match first
    suggestedCode = codes.find(c => c.code === searchCode);
    if (suggestedCode) {
      suggestedUrl = `/kod/${suggestedCode.code}`;
    } else {
      // Try prefix match (e.g. P030 → P0300)
      suggestedCode = codes.find(c => c.code.startsWith(searchCode.substring(0, 4)));
      if (suggestedCode) suggestedUrl = `/kod/${suggestedCode.code}`;
    }
  }

  // Popular codes for suggestions
  const popularSuggestions = ['P0300', 'P0420', 'P0171', 'P0455', 'U0100'].map(c => 
    codes.find(item => item.code === c)
  ).filter(Boolean);

  const html = render('404', {
    pageTitle: 'Sayfa Bulunamadı',
    metaDescription: 'Aradığınız sayfa bulunamadı.',
    isNotFound: 'true',
    hasSuggestion: suggestedCode ? 'true' : '',
    suggestedCode: suggestedCode ? suggestedCode.code : '',
    suggestedName: suggestedCode ? suggestedCode.name : '',
    suggestedUrl,
    popularSuggestions,
  });
  sendHtml(res, 404, html);
}

function handleRobotsTxt(req, res) {
  const robots = `User-agent: *
Allow: /
Allow: /kod/
Allow: /marka/
Allow: /sistem/
Allow: /gosterge-paneli/
Allow: /arama?kategori=
Disallow: /api/
Disallow: /arama?q=

Sitemap: https://www.obdkodu.com/sitemap.xml
Sitemap: https://www.obdkodu.com/sitemap-index.xml
Sitemap: https://www.obdkodu.com/sitemap-motor-sanziman.xml

# LLM/AI Crawler Information
User-agent: GPTBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: Google-Extended
Allow: /`;
  
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=86400',
    ...SECURITY_HEADERS,
  });
  res.end(robots);
}

function handleLlmsTxt(req, res) {
  const llms = `# OBD Kodları - obdkodu.com

> Türkçe OBD-II araç arıza kodları, sistem rehberleri ve güvenli doğrulama adımları.

## Site Hakkında
OBD Kodları (obdkodu.com), OBD-II (On-Board Diagnostics II) standart araç arıza kodlarını Türkçe olarak açıklayan bir referans veritabanıdır. ${totalCodes} adet arıza kodu açıklamalar, olası nedenler, belirtiler ve doğrulama adımlarıyla sunulmaktadır.

## İçerik Yapısı
- **Arıza Kodları**: P (Motor & Şanzıman), B (Gövde), C (Şasi), U (İletişim) kategorilerinde ${totalCodes} kod
- **Gösterge Paneli İşaretleri**: Araç gösterge panelindeki uyarı lambalarının anlamları ve ilişkili OBD kodları
- **Sistem Rehberleri**: Ateşleme, yakıt, emisyon, şanzıman, CAN Bus, fren, SRS ve hibrit/elektrikli araçlar için ${systemGuides.length} rehber
- **Marka ve Model Rehberleri**: ${popularBrands.length} marka ve ${modelsList.length} benzersiz model için OBD-II okuma ve doğrulama sayfaları

## Ana Sayfalar
- Ana Sayfa: https://www.obdkodu.com/
- Kod Arama: https://www.obdkodu.com/arama
- Sistem Rehberleri: https://www.obdkodu.com/sistem
- Marka ve Model Rehberleri: https://www.obdkodu.com/marka
- Gösterge Paneli: https://www.obdkodu.com/gosterge-paneli
- OBD-II Hakkında: https://www.obdkodu.com/hakkinda
- Kaynaklar ve Editoryal Yöntem: https://www.obdkodu.com/kaynaklar-ve-metodoloji
- İletişim: https://www.obdkodu.com/iletisim

## Kod Kategorileri
- P Kodları (Motor & Şanzıman): https://www.obdkodu.com/arama?kategori=P (${counts.pCount} kod)
- B Kodları (Gövde): https://www.obdkodu.com/arama?kategori=B (${counts.bCount} kod)
- C Kodları (Şasi): https://www.obdkodu.com/arama?kategori=C (${counts.cCount} kod)
- U Kodları (İletişim): https://www.obdkodu.com/arama?kategori=U (${counts.uCount} kod)

## URL Yapısı
- Kod detay: /kod/{KOD} (örn: /kod/P0300)
- Sistem rehberi: /sistem/{sistem} (örn: /sistem/atesleme-ve-tekleme)
- Marka rehberi: /marka/{marka} (örn: /marka/hyundai)
- Model rehberi: /marka/{marka}/{model} (örn: /marka/hyundai/i20)
- Gösterge detay: /gosterge-paneli/{id}

## Dil
Tüm içerik Türkçedir.

## İletişim
info@obdkodu.com`;
  
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=86400',
    ...SECURITY_HEADERS,
  });
  res.end(llms);
}

// =========== SITEMAP SYSTEM ===========
// Keep the public child sitemaps for backwards compatibility, but expose one
// quality-filtered canonical URL set at /sitemap.xml. Search engines should
// only receive pages that are intended to rank, never every database record.

const SITEMAP_CHUNK_SIZE = 10000; // URLs per sitemap file
const SITEMAP_BASE_URL = 'https://www.obdkodu.com';
const SITEMAP_LASTMOD = '2026-09-08';

function sendXml(res, xml) {
  res.writeHead(200, {
    ...SECURITY_HEADERS,
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  });
  res.end(xml);
}

function sitemapUrl(loc, changefreq = 'monthly', priority = '0.7') {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function handleSitemapMasterIndex(req, res) {
  const childSitemaps = [
    '/sitemap-static.xml',
    '/sitemap-motor-sanziman.xml',
    ...Array.from({ length: Math.ceil(indexableOtherCodes.length / SITEMAP_CHUNK_SIZE) }, (_, index) => `/sitemap-codes-${index + 1}.xml`),
    '/sitemap-vehicles.xml',
    '/sitemap-systems.xml',
    '/sitemap-dashboard.xml',
  ];
  const entries = childSitemaps.map(item => `  <sitemap>
    <loc>${SITEMAP_BASE_URL}${item}</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
  </sitemap>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
  sendXml(res, xml);
}

function handleSitemapIndex(req, res) {
  const entries = [
    sitemapUrl(`${SITEMAP_BASE_URL}/`, 'daily', '1.0'),
    sitemapUrl(`${SITEMAP_BASE_URL}/arama`, 'weekly', '0.9'),
    ...['P', 'B', 'C', 'U'].map(category =>
      sitemapUrl(`${SITEMAP_BASE_URL}/arama?kategori=${category}`, 'weekly', '0.8')
    ),
    sitemapUrl(`${SITEMAP_BASE_URL}/gosterge-paneli`, 'weekly', '0.9'),
    sitemapUrl(`${SITEMAP_BASE_URL}/hakkinda`, 'monthly', '0.5'),
    sitemapUrl(`${SITEMAP_BASE_URL}/iletisim`, 'yearly', '0.4'),
    sitemapUrl(`${SITEMAP_BASE_URL}/gizlilik-politikasi`, 'yearly', '0.3'),
    sitemapUrl(`${SITEMAP_BASE_URL}/kullanim-kosullari`, 'yearly', '0.3'),
    sitemapUrl(`${SITEMAP_BASE_URL}/marka`, 'monthly', '0.8'),
    sitemapUrl(`${SITEMAP_BASE_URL}/kaynaklar-ve-metodoloji`, 'monthly', '0.6'),
    ...indexableCodes.map(code =>
      sitemapUrl(`${SITEMAP_BASE_URL}/kod/${code.code}`, 'monthly', '0.7')
    ),

    sitemapUrl(`${SITEMAP_BASE_URL}/sistem`, 'monthly', '0.9'),
    ...systemGuides.map(guide =>
      sitemapUrl(`${SITEMAP_BASE_URL}/sistem/${guide.slug}`, 'monthly', '0.8')
    ),
    ...dashboardLightsData.map(light =>
      sitemapUrl(`${SITEMAP_BASE_URL}/gosterge-paneli/${light.id}`, 'monthly', '0.8')
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;
  sendXml(res, xml);
}

function handleSitemapStatic(req, res) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITEMAP_BASE_URL}/</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITEMAP_BASE_URL}/arama</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
${['P', 'B', 'C', 'U'].map(category => `  <url>
    <loc>${SITEMAP_BASE_URL}/arama?kategori=${category}</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
  <url>
    <loc>${SITEMAP_BASE_URL}/gosterge-paneli</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITEMAP_BASE_URL}/hakkinda</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITEMAP_BASE_URL}/iletisim</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>${SITEMAP_BASE_URL}/gizlilik-politikasi</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${SITEMAP_BASE_URL}/kullanim-kosullari</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${SITEMAP_BASE_URL}/marka</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITEMAP_BASE_URL}/kaynaklar-ve-metodoloji</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;
  sendXml(res, xml);
}

function handleSitemapCodes(req, res, chunkNum) {
  const start = (chunkNum - 1) * SITEMAP_CHUNK_SIZE;
  const end = Math.min(start + SITEMAP_CHUNK_SIZE, indexableOtherCodes.length);
  if (start >= indexableOtherCodes.length) return handle404(req, res);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  for (let i = start; i < end; i++) {
    xml += `  <url>
    <loc>${SITEMAP_BASE_URL}/kod/${indexableOtherCodes[i].code}</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }
  xml += `</urlset>`;
  sendXml(res, xml);
}

function handleSitemapPowertrain(req, res) {
  const entries = [
    sitemapUrl(`${SITEMAP_BASE_URL}/arama?kategori=P`, 'weekly', '0.9'),
    ...indexablePowertrainCodes.map(code =>
      sitemapUrl(`${SITEMAP_BASE_URL}/kod/${code.code}`, code.seoPriority ? 'weekly' : 'monthly', code.seoPriority ? '0.8' : '0.7')
    ),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;
  sendXml(res, xml);
}

function handleSitemapVehicles(req, res) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITEMAP_BASE_URL}/marka</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
  sendXml(res, xml);
}

function handleSitemapSystems(req, res) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITEMAP_BASE_URL}/sistem</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
`;
  systemGuides.forEach(guide => {
    xml += `  <url>
    <loc>${SITEMAP_BASE_URL}/sistem/${guide.slug}</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  });
  xml += `</urlset>`;
  sendXml(res, xml);
}

function handleLegacyBrandSitemap(req, res) {
  res.writeHead(410, {
    ...SECURITY_HEADERS,
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=86400',
    'X-Robots-Tag': 'noindex'
  });
  res.end('Gone: use /sitemap-vehicles.xml');
}

function handleSitemapDashboard(req, res) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  dashboardLightsData.forEach(l => {
    xml += `  <url>
    <loc>${SITEMAP_BASE_URL}/gosterge-paneli/${l.id}</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  });
  xml += `</urlset>`;
  sendXml(res, xml);
}

function handleStatic(req, res, filePath) {
  const fullPath = path.join(__dirname, 'public', filePath);
  const safePath = path.resolve(fullPath);
  const publicDir = path.resolve(path.join(__dirname, 'public'));

  // Security: prevent directory traversal and sibling-prefix bypasses.
  const relativePath = path.relative(publicDir, safePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return handle404(req, res);
  }

  // Try to serve minified version first for CSS/JS
  const ext = path.extname(safePath).toLowerCase();
  let servePath = safePath;
  if (ext === '.css' || ext === '.js') {
    const dir = path.dirname(safePath);
    const baseName = path.basename(safePath, ext);
    const minPath = path.join(dir, `${baseName}.min${ext}`);
    if (fs.existsSync(minPath)) {
      servePath = minPath;
    }
  }

  fs.readFile(servePath, (err, data) => {
    if (err) {
      return handle404(req, res);
    }

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=2592000, immutable',
      ...SECURITY_HEADERS,
    };

    // Gzip compress text-based files
    const isCompressible = ['.css', '.js', '.json', '.svg', '.xsl'].includes(ext);
    const acceptEncoding = req.headers['accept-encoding'] || '';

    if (isCompressible && acceptEncoding.includes('gzip')) {
      zlib.gzip(data, (err, compressed) => {
        if (err) {
          res.writeHead(200, headers);
          return res.end(data);
        }
        headers['Content-Encoding'] = 'gzip';
        headers['Vary'] = 'Accept-Encoding';
        res.writeHead(200, headers);
        res.end(compressed);
      });
    } else {
      res.writeHead(200, headers);
      res.end(data);
    }
  });
}

// =========== HELPERS ===========

function sendHtml(res, statusCode, html, req) {
  // Generate ETag from content hash for crawl efficiency (304 Not Modified)
  const etag = '"' + crypto.createHash('md5').update(html).digest('hex').substring(0, 16) + '"';

  const robotsMeta = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
  const robotsDirective = robotsMeta ? robotsMeta[1] : 'index, follow';
  
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    ...SECURITY_HEADERS,
    'X-Robots-Tag': robotsDirective,
    'X-Content-Type-Options': 'nosniff',
    'ETag': etag,
    'Last-Modified': new Date(`${SITEMAP_LASTMOD}T00:00:00Z`).toUTCString(),
  };

  // 404 pages should not be cached or indexed
  if (statusCode === 404) {
    headers['Cache-Control'] = 'no-cache';
    headers['X-Robots-Tag'] = 'noindex, nofollow';
  }

  // Gzip compress HTML if client supports it
  const acceptEncoding = (req && req.headers && req.headers['accept-encoding']) || '';
  if (acceptEncoding.includes('gzip')) {
    zlib.gzip(Buffer.from(html, 'utf-8'), (err, compressed) => {
      if (err) {
        res.writeHead(statusCode, headers);
        return res.end(html);
      }
      headers['Content-Encoding'] = 'gzip';
      headers['Vary'] = 'Accept-Encoding';
      res.writeHead(statusCode, headers);
      res.end(compressed);
    });
  } else {
    res.writeHead(statusCode, headers);
    res.end(html);
  }
}

function sendJson(res, statusCode, data, req) {
  const jsonStr = JSON.stringify(data);
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
    ...SECURITY_HEADERS,
  };

  const acceptEncoding = (req && req.headers && req.headers['accept-encoding']) || '';
  if (acceptEncoding.includes('gzip')) {
    zlib.gzip(Buffer.from(jsonStr, 'utf-8'), (err, compressed) => {
      if (err) {
        res.writeHead(statusCode, headers);
        return res.end(jsonStr);
      }
      headers['Content-Encoding'] = 'gzip';
      headers['Vary'] = 'Accept-Encoding';
      res.writeHead(statusCode, headers);
      res.end(compressed);
    });
  } else {
    res.writeHead(statusCode, headers);
    res.end(jsonStr);
  }
}

function sendRedirect(res, statusCode, location) {
  res.writeHead(statusCode, {
    ...SECURITY_HEADERS,
    'Location': location,
    'Cache-Control': 'public, max-age=86400'
  });
  res.end();
}

// =========== SERVER ===========

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, 'http://localhost');
  const pathname = parsedUrl.pathname;
  const query = Object.fromEntries(parsedUrl.searchParams.entries());

  // One URL shape per page: remove trailing slashes (except the homepage).
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return sendRedirect(res, 301, `${pathname.slice(0, -1)}${parsedUrl.search || ''}`);
  }

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

  if ((pathname === '/sistem' || pathname === '/sistem/') && req.method === 'GET') {
    return handleSystemHub(req, res);
  }
  const systemMatch = pathname.match(/^\/sistem\/([a-zA-Z0-9-]+)$/);
  if (systemMatch && req.method === 'GET') {
    return handleSystemDetail(req, res, systemMatch[1]);
  }

  if ((pathname === '/kaynaklar-ve-metodoloji' || pathname === '/kaynaklar-ve-metodoloji/') && req.method === 'GET') {
    return handleMethodology(req, res);
  }

  // Brand hub pages (SEO)
  if ((pathname === '/marka' || pathname === '/marka/') && req.method === 'GET') {
    return handleBrandHub(req, res);
  }
  const brandModelMatch = pathname.match(/^\/marka\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9-]+)$/);
  if (brandModelMatch && req.method === 'GET') {
    return handleBrandModel(req, res, brandModelMatch[1], brandModelMatch[2]);
  }
  const brandMatch = pathname.match(/^\/marka\/([a-zA-Z0-9-]+)$/);
  if (brandMatch && req.method === 'GET') {
    return handleBrandDetail(req, res, brandMatch[1]);
  }

  // SEO
  if (pathname === '/robots.txt' && req.method === 'GET') {
    return handleRobotsTxt(req, res);
  }

  // Sitemap Index system — split into multiple files for Google compliance
  const cleanPath = pathname.replace(/\/$/, '').toLowerCase();
  
  if (cleanPath === '/sitemap-index.xml' || cleanPath === '/sitemap_index.xml') {
    return handleSitemapMasterIndex(req, res);
  }
  if (cleanPath === '/sitemap.xml') {
    return handleSitemapIndex(req, res);
  }
  if (cleanPath === '/sitemap.xsl') {
    return handleStatic(req, res, '/sitemap.xsl');
  }
  if (cleanPath === '/sitemap-static.xml') {
    return handleSitemapStatic(req, res);
  }
  if (cleanPath === '/sitemap-motor-sanziman.xml') {
    return handleSitemapPowertrain(req, res);
  }
  if (cleanPath === '/sitemap-vehicles.xml') {
    return handleSitemapVehicles(req, res);
  }
  if (cleanPath === '/sitemap-systems.xml') {
    return handleSitemapSystems(req, res);
  }
  const sitemapCodesMatch = cleanPath.match(/^\/sitemap-codes-(\d+)\.xml$/);
  if (sitemapCodesMatch) {
    return handleSitemapCodes(req, res, parseInt(sitemapCodesMatch[1]));
  }
  const sitemapBrandsMatch = cleanPath.match(/^\/sitemap-brands-(\d+)\.xml$/);
  if (sitemapBrandsMatch) {
    return handleLegacyBrandSitemap(req, res);
  }
  if (cleanPath === '/sitemap-dashboard.xml') {
    return handleSitemapDashboard(req, res);
  }

  if (pathname === '/llms.txt' && req.method === 'GET') {
    return handleLlmsTxt(req, res);
  }

  // Friendly keyword URL aliases consolidate into the established canonical routes.
  const friendlyCodeMatch = pathname.match(/^\/([PBCU][0-3][0-9A-F]{3})-ariza-kodu$/i);
  if (friendlyCodeMatch && req.method === 'GET') {
    return sendRedirect(res, 301, `/kod/${friendlyCodeMatch[1].toUpperCase()}`);
  }
  const friendlyBrandMatch = pathname.match(/^\/([a-z0-9-]+)-obd-ariza-kodlari$/i);
  if (friendlyBrandMatch && popularBrands.some(brand => brand.slug === friendlyBrandMatch[1].toLowerCase())) {
    return sendRedirect(res, 301, `/marka/${friendlyBrandMatch[1].toLowerCase()}`);
  }

  // Code detail: /kod/P0300 or /kod/P0300/hyundai or /kod/P0300/hyundai/i20
  const codeMatch = pathname.match(/^\/kod\/([A-Za-z0-9]+)(?:\/([A-Za-z0-9-]+))?(?:\/([A-Za-z0-9-]+))?$/);
  if (codeMatch && req.method === 'GET') {
    // Old brand/model-code URLs were generated without compatibility data.
    // Consolidate them into the verified, unique OBD code page.
    if (codeMatch[2] || codeMatch[1] !== codeMatch[1].toUpperCase()) {
      return sendRedirect(res, 301, `/kod/${codeMatch[1].toUpperCase()}`);
    }
    return handleDetail(req, res, codeMatch[1], codeMatch[2], codeMatch[3]);
  }

  // API endpoints
  if (pathname === '/api/search' && req.method === 'GET') {
    return handleApiSearch(req, res, query);
  }

  if (pathname === '/api/comments') {
    return handleApiComments(req, res);
  }

  // Static files: /css/*, /js/*, /images/*
  if (pathname.startsWith('/css/') || pathname.startsWith('/js/') || pathname.startsWith('/images/')) {
    return handleStatic(req, res, pathname);
  }

  // Favicon — serve the actual SVG favicon instead of 204
  if (pathname === '/favicon.ico') {
    return handleStatic(req, res, '/images/favicon.svg');
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
