// ===================================
// OBD Kodları Web Sitesi - Node.js Server
// Saf Node.js, framework kullanılmıyor
// ===================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const zlib = require('zlib');
const crypto = require('crypto');
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
  { name: 'Jeep', slug: 'jeep' },
  { name: 'Kia', slug: 'kia' },
  { name: 'Mazda', slug: 'mazda' },
  { name: 'Mercedes', slug: 'mercedes' },
  { name: 'Mitsubishi', slug: 'mitsubishi' },
  { name: 'Nissan', slug: 'nissan' },
  { name: 'Opel', slug: 'opel' },
  { name: 'Peugeot', slug: 'peugeot' },
  { name: 'Renault', slug: 'renault' },
  { name: 'Seat', slug: 'seat' },
  { name: 'Skoda', slug: 'skoda' },
  { name: 'Suzuki', slug: 'suzuki' },
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
  // Pick popular codes (The 12 most searched codes — reduced for faster page load)
  const popular = [
    'P0171', 'P0420', 'P0300', 'P0301', 'P0335', 'P0011',
    'P0174', 'P0455', 'P0128', 'P0700', 'U0100', 'C0035'
  ].map(c => codes.find(item => item.code === c)).filter(Boolean);

  // WebSite schema — enables Google Sitelinks Search Box
  const webSiteSchemaJson = JSON.stringify({
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
  const orgSchemaJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "OBD Kodları",
    "url": "https://www.obdkodu.com",
    "logo": "https://www.obdkodu.com/images/logo.png",
    "description": "Türkiye'nin en kapsamlı OBD-II arıza kodu veritabanı. 3500+ arıza kodu, detaylı açıklamalar ve çözüm önerileri.",
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
    metaDescription: 'Araç arıza kodlarını anında sorgulayın. 3500+ OBD-II arıza kodu, detaylı açıklamalar, olası nedenler ve adım adım çözüm rehberleri. Ücretsiz OBD kodu arama.',
    canonicalUrl: 'https://www.obdkodu.com/',
    activeHome: 'active',
    totalCodes,
    ...counts,
    popularCodes: popular,
    popularBrands,
    webSiteSchemaJson,
    orgSchemaJson,
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

  // Build canonical URL for search page
  let searchCanonical = 'https://www.obdkodu.com/arama';
  if (kategori && !q) searchCanonical += `?kategori=${kategori}`;

  // SEO: noindex for user search queries (thin/duplicate content)
  const isNoIndex = q ? 'true' : '';

  // isAllCodes: when there's no query and no category filter
  const isAllCodes = (!q && !kategori) ? 'true' : '';

  // Category-specific meta descriptions for better SEO
  const categoryMetaMap = {
    P: `OBD-II P (Powertrain) kategorisi arıza kodları listesi. Motor ve şanzıman ile ilgili ${filteredCounts.pFilterCount} adet arıza kodu.`,
    B: `OBD-II B (Body) kategorisi arıza kodları listesi. Hava yastığı, klima ve gövde sistemleri ile ilgili ${filteredCounts.bFilterCount} adet arıza kodu.`,
    C: `OBD-II C (Chassis) kategorisi arıza kodları listesi. ABS, direksiyon ve şasi ile ilgili ${filteredCounts.cFilterCount} adet arıza kodu.`,
    U: `OBD-II U (Network) kategorisi arıza kodları listesi. CAN bus ve modüller arası iletişim ile ilgili ${filteredCounts.uFilterCount} adet arıza kodu.`,
  };
  const metaDesc = q
    ? `"${q}" araması için ${filtered.length} OBD-II arıza kodu bulundu.`
    : (kategori ? categoryMetaMap[kategori] : `Türkiye'nin en kapsamlı OBD-II arıza kodları veritabanı. ${totalCount} arıza kodu detaylı açıklamalar ve çözüm önerileri ile.`);

  // BreadcrumbList JSON-LD for search/category pages
  const searchBreadcrumbItems = [
    { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": "https://www.obdkodu.com/" }
  ];
  if (kategori && !q) {
    searchBreadcrumbItems.push({ "@type": "ListItem", "position": 2, "name": "Arıza Kodları", "item": "https://www.obdkodu.com/arama" });
    searchBreadcrumbItems.push({ "@type": "ListItem", "position": 3, "name": categoryNames[kategori] || kategori });
  } else {
    searchBreadcrumbItems.push({ "@type": "ListItem", "position": 2, "name": "Arıza Kodları" });
  }
  const searchBreadcrumbJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": searchBreadcrumbItems
  });

  const html = render('search', {
    pageTitle: q ? `"${q}" Arama Sonuçları` : (kategori ? `${categoryNames[kategori] || kategori} Kodları` : 'Tüm Arıza Kodları'),
    metaDescription: metaDesc,
    canonicalUrl: searchCanonical,
    activeSearch: 'active',
    searchQuery: query.q || '',
    isSearchQuery: q ? 'true' : '',
    isNoIndex,
    isAllCodes,
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
    searchBreadcrumbJson,
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

  // SEO-optimized title tags — match Turkish search intent exactly
  let pageTitle = `${code.code} Arıza Kodu Nedir? Nedenleri ve Çözümü`;
  let metaDescription = `${code.code} arıza kodu nedir? ${code.name}. Belirtileri, olası nedenleri ve adım adım çözüm yöntemleri. ${code.description.substring(0, 120)}`;
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

  // === SERVER-SIDE JSON-LD GENERATION (SEO) ===
  const severityText = severityTextMap[code.severity] || code.severity;
  const isHigh = (code.severity === 'yüksek' || code.severity === 'high');
  
  // FAQ Answer — rendered server-side to avoid template syntax in JSON-LD
  const severityAnswer = isHigh
    ? 'Bu kod Yüksek (Kritik) ciddiyet seviyesine sahiptir. Motor bileşenlerinde veya sürüş güvenliğinde acil bir tehdit oluşturabileceğinden, aracınızı derhal yetkili bir servise çekmeniz tavsiye edilir.'
    : `Bu kod ${severityText} ciddiyet seviyesindedir. Aracınızın performansını veya emisyon değerlerini etkileyebilir. Mümkün olan en kısa sürede kontrol ettirmeniz tavsiye edilir.`;

  const solutionsText = (code.solutions || []).join(' ');

  // Build JSON-LD FAQ Schema (clean, no template syntax)
  const faqSchemaJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `${code.code} arıza kodu tam olarak nedir?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${code.code} (${code.name}) arıza kodu, aracınızın ${code.affectedSystem} sisteminde meydana gelen bir anormalliği işaret eder. ${code.description}`
        }
      },
      {
        "@type": "Question",
        "name": `${code.code} kodu ne kadar ciddi, aracı sürmeye devam edebilir miyim?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": severityAnswer
        }
      },
      {
        "@type": "Question",
        "name": `${code.code} hatası nasıl çözülür?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${code.code} arızasını çözmek için başlıca adımlar şunlardır: ${solutionsText}`
        }
      }
    ]
  });

  // Build JSON-LD TechArticle Schema
  const techArticleJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": `${code.code} - ${code.name}`,
    "description": metaDescription,
    "url": canonicalUrl,
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
    "about": { "@type": "Thing", "name": code.affectedSystem },
    "mainEntityOfPage": { "@type": "WebPage", "@id": canonicalUrl },
    "proficiencyLevel": "Beginner"
  });

  // Build JSON-LD HowTo Schema (solution steps)
  let howToSchemaJson = '';
  if (code.solutions && code.solutions.length > 0) {
    howToSchemaJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": `${code.code} Arıza Kodu Nasıl Çözülür?`,
      "description": `${code.code} (${code.name}) arıza kodunun çözüm adımları.`,
      "step": code.solutions.map((sol, idx) => ({
        "@type": "HowToStep",
        "position": idx + 1,
        "text": sol
      }))
    });
  }

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
  const breadcrumbJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems
  });

  const html = render('detail', {
    pageTitle,
    metaDescription,
    canonicalUrl,
    activeSearch: 'active',
    ...code,
    name: displayCodeName,
    description: displayDescription,
    categoryName: categoryName,
    severityText,
    severity: mappedSeverity,
    isHighSeverity: isHigh ? 'true' : '',
    isNotHighSeverity: !isHigh ? 'true' : '',
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
    paginationHtml: paginationHtml,
    // Server-side rendered JSON-LD (no template syntax leaks)
    faqSchemaJson,
    techArticleJson,
    howToSchemaJson,
    breadcrumbJson,
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

  // === SERVER-SIDE JSON-LD FOR DASHBOARD LIGHTS ===
  const dlBreadcrumbJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": "https://www.obdkodu.com/" },
      { "@type": "ListItem", "position": 2, "name": "Gösterge İşaretleri", "item": "https://www.obdkodu.com/gosterge-paneli" },
      { "@type": "ListItem", "position": 3, "name": light.name }
    ]
  });

  const dlArticleJson = JSON.stringify({
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
    comments: paginatedComments,
    hasComments: formattedComments.length > 0 ? 'true' : '',
    noComments: formattedComments.length === 0 ? 'true' : '',
    commentCount: formattedComments.length,
    paginationHtml: paginationHtml,
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
  const itemListJson = JSON.stringify({
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

  const breadcrumbJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": "https://www.obdkodu.com/" },
      { "@type": "ListItem", "position": 2, "name": "Markalar" }
    ]
  });

  const html = render('brand-hub', {
    pageTitle: 'Araç Markalarına Göre Arıza Kodları',
    metaDescription: `${popularBrands.length} popüler araç markası için OBD-II arıza kodları. Volkswagen, Ford, Renault, Hyundai ve daha fazlası.`,
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
  const itemListJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${brand.name} OBD-II Arıza Kodları`,
    "numberOfItems": totalCodes,
    "itemListElement": popularCodesForBrand.map((code, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": `${brand.name} ${code.code} - ${code.name}`,
      "url": `https://www.obdkodu.com/kod/${code.code}/${brand.slug}`
    }))
  });

  const breadcrumbJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": "https://www.obdkodu.com/" },
      { "@type": "ListItem", "position": 2, "name": "Markalar", "item": "https://www.obdkodu.com/marka" },
      { "@type": "ListItem", "position": 3, "name": brand.name }
    ]
  });

  const html = render('brand-detail', {
    pageTitle: `${brand.name} Arıza Kodları`,
    metaDescription: `${brand.name} araçlarda en sık karşılaşılan OBD-II arıza kodları listesi. ${totalCodes} arıza kodu detaylı açıklamalar ve çözüm önerileri ile.`,
    canonicalUrl: `https://www.obdkodu.com/marka/${brand.slug}`,
    brandName: brand.name,
    brandSlug: brand.slug,
    brandModels,
    hasModels: brandModels.length > 0 ? 'true' : '',
    popularCodes: popularCodesForBrand,
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
  const dlItemListJson = JSON.stringify({
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

  const dlListBreadcrumbJson = JSON.stringify({
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
  // Smart code suggestion from URL
  const pathname = url.parse(req.url).pathname || '';
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
Allow: /gosterge-paneli/
Allow: /arama?kategori=
Disallow: /api/
Disallow: /arama?q=

# Crawl-delay (be polite but not too slow)
Crawl-delay: 1

Sitemap: https://www.obdkodu.com/sitemap-index.xml

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
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  });
  res.end(robots);
}

function handleLlmsTxt(req, res) {
  const llms = `# OBD Kodları - obdkodu.com

> Türkiye'nin en kapsamlı OBD-II araç arıza kodları veritabanı.

## Site Hakkında
OBD Kodları (obdkodu.com), OBD-II (On-Board Diagnostics II) standart araç arıza kodlarını Türkçe olarak açıklayan bir referans veritabanıdır. ${totalCodes} adet arıza kodu detaylı açıklamalar, olası nedenler, belirtiler ve çözüm önerileri ile birlikte sunulmaktadır.

## İçerik Yapısı
- **Arıza Kodları**: P (Motor & Şanzıman), B (Gövde), C (Şasi), U (İletişim) kategorilerinde ${totalCodes} kod
- **Gösterge Paneli İşaretleri**: Araç gösterge panelindeki uyarı lambalarının anlamları ve ilişkili OBD kodları
- **Marka Özel Sayfalar**: ${popularBrands.length} popüler marka için arıza kodu sayfaları

## Ana Sayfalar
- Ana Sayfa: https://www.obdkodu.com/
- Kod Arama: https://www.obdkodu.com/arama
- Gösterge Paneli: https://www.obdkodu.com/gosterge-paneli
- OBD-II Hakkında: https://www.obdkodu.com/hakkinda
- İletişim: https://www.obdkodu.com/iletisim

## Kod Kategorileri
- P Kodları (Motor & Şanzıman): https://www.obdkodu.com/arama?kategori=P (${counts.pCount} kod)
- B Kodları (Gövde): https://www.obdkodu.com/arama?kategori=B (${counts.bCount} kod)
- C Kodları (Şasi): https://www.obdkodu.com/arama?kategori=C (${counts.cCount} kod)
- U Kodları (İletişim): https://www.obdkodu.com/arama?kategori=U (${counts.uCount} kod)

## URL Yapısı
- Kod detay: /kod/{KOD} (örn: /kod/P0300)
- Marka özel: /kod/{KOD}/{marka} (örn: /kod/P0300/hyundai)
- Model özel: /kod/{KOD}/{marka}/{model} (örn: /kod/P0300/hyundai/i20)
- Gösterge detay: /gosterge-paneli/{id}

## Dil
Tüm içerik Türkçedir.

## İletişim
info@obdkodu.com`;
  
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=86400',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  });
  res.end(llms);
}

// =========== SITEMAP INDEX SYSTEM ===========
// Google limits: max 50,000 URLs per sitemap, max 50MB per file.
// We split into multiple sitemaps referenced from a sitemap index.

const SITEMAP_CHUNK_SIZE = 10000; // URLs per sitemap file
const SITEMAP_BASE_URL = 'https://www.obdkodu.com';
const SITEMAP_LASTMOD = '2026-07-12'; // Updated date — update when content changes

function sendXml(res, xml) {
  res.writeHead(200, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  });
  res.end(xml);
}

// Pre-compute brand-code pairs chunked into sitemap groups
const brandCodePairs = [];
popularBrands.forEach(brand => {
  codes.forEach(c => {
    brandCodePairs.push({ code: c.code, brandSlug: brand.slug });
  });
});
const brandChunkCount = Math.ceil(brandCodePairs.length / SITEMAP_CHUNK_SIZE);
const codeChunkCount = Math.ceil(codes.length / SITEMAP_CHUNK_SIZE);

function handleSitemapIndex(req, res) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITEMAP_BASE_URL}/sitemap-static.xml</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
  </sitemap>
`;

  // Code sitemaps
  for (let i = 1; i <= codeChunkCount; i++) {
    xml += `  <sitemap>
    <loc>${SITEMAP_BASE_URL}/sitemap-codes-${i}.xml</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
  </sitemap>
`;
  }

  // Brand sitemaps
  for (let i = 1; i <= brandChunkCount; i++) {
    xml += `  <sitemap>
    <loc>${SITEMAP_BASE_URL}/sitemap-brands-${i}.xml</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
  </sitemap>
`;
  }

  // Dashboard lights sitemap
  if (dashboardLightsData.length > 0) {
    xml += `  <sitemap>
    <loc>${SITEMAP_BASE_URL}/sitemap-dashboard.xml</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
  </sitemap>
`;
  }

  xml += `</sitemapindex>`;
  sendXml(res, xml);
}

function handleSitemapStatic(req, res) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
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
${popularBrands.map(b => `  <url>
    <loc>${SITEMAP_BASE_URL}/marka/${b.slug}</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;
  sendXml(res, xml);
}

function handleSitemapCodes(req, res, chunkNum) {
  const start = (chunkNum - 1) * SITEMAP_CHUNK_SIZE;
  const end = Math.min(start + SITEMAP_CHUNK_SIZE, codes.length);
  if (start >= codes.length) return handle404(req, res);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  for (let i = start; i < end; i++) {
    xml += `  <url>
    <loc>${SITEMAP_BASE_URL}/kod/${codes[i].code}</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }
  xml += `</urlset>`;
  sendXml(res, xml);
}

function handleSitemapBrands(req, res, chunkNum) {
  const start = (chunkNum - 1) * SITEMAP_CHUNK_SIZE;
  const end = Math.min(start + SITEMAP_CHUNK_SIZE, brandCodePairs.length);
  if (start >= brandCodePairs.length) return handle404(req, res);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  for (let i = start; i < end; i++) {
    const pair = brandCodePairs[i];
    xml += `  <url>
    <loc>${SITEMAP_BASE_URL}/kod/${pair.code}/${pair.brandSlug}</loc>
    <lastmod>${SITEMAP_LASTMOD}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  }
  xml += `</urlset>`;
  sendXml(res, xml);
}

function handleSitemapDashboard(req, res) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
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

  // Security: prevent directory traversal
  if (!safePath.startsWith(publicDir)) {
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
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    };

    // Gzip compress text-based files
    const isCompressible = ['.css', '.js', '.json', '.svg'].includes(ext);
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
  
  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Robots-Tag': 'index, follow',
    'X-Content-Type-Options': 'nosniff',
    'ETag': etag,
    'Last-Modified': SITEMAP_LASTMOD + 'T00:00:00Z',
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
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
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

  // Brand hub pages (SEO)
  if ((pathname === '/marka' || pathname === '/marka/') && req.method === 'GET') {
    return handleBrandHub(req, res);
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
  if (pathname === '/sitemap.xml' || pathname === '/sitemap-index.xml') {
    return handleSitemapIndex(req, res);
  }
  if (pathname === '/sitemap-static.xml') {
    return handleSitemapStatic(req, res);
  }
  const sitemapCodesMatch = pathname.match(/^\/sitemap-codes-(\d+)\.xml$/);
  if (sitemapCodesMatch) {
    return handleSitemapCodes(req, res, parseInt(sitemapCodesMatch[1]));
  }
  const sitemapBrandsMatch = pathname.match(/^\/sitemap-brands-(\d+)\.xml$/);
  if (sitemapBrandsMatch) {
    return handleSitemapBrands(req, res, parseInt(sitemapBrandsMatch[1]));
  }
  if (pathname === '/sitemap-dashboard.xml') {
    return handleSitemapDashboard(req, res);
  }

  if (pathname === '/llms.txt' && req.method === 'GET') {
    return handleLlmsTxt(req, res);
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
