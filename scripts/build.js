/**
 * build.js — CSS ve JS minification script
 * Harici bağımlılık gerektirmez, basit regex-tabanlı küçültme yapar.
 * Kullanım: node scripts/build.js
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// ============ CSS Minifier ============
function minifyCSS(css) {
  return css
    // Yorumları kaldır
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Birden fazla boşluğu tek boşluğa düşür
    .replace(/\s+/g, ' ')
    // Seçiciler ve kurallar arasındaki gereksiz boşlukları kaldır
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*,\s*/g, ',')
    // Son noktalı virgülü kaldır (her blokta)
    .replace(/;}/g, '}')
    .trim();
}

// ============ JS Minifier ============
function minifyJS(js) {
  // Satır satır işle — tek satırlık yorumları kaldır
  let lines = js.split('\n');
  let result = [];
  let inMultiLineComment = false;
  
  for (let line of lines) {
    if (inMultiLineComment) {
      const endIdx = line.indexOf('*/');
      if (endIdx !== -1) {
        inMultiLineComment = false;
        line = line.substring(endIdx + 2);
      } else {
        continue;
      }
    }
    
    // Çok satırlı yorumları kaldır (tek satırda başlayıp biten)
    line = line.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Çok satırlı yorum başlangıcı
    const startIdx = line.indexOf('/*');
    if (startIdx !== -1) {
      inMultiLineComment = true;
      line = line.substring(0, startIdx);
    }
    
    // Tek satırlık yorumları kaldır (string içindekiler hariç — basit kontrol)
    // Sadece satır başından itibaren // ile başlayan veya kod sonrası // olan yorumlar
    line = line.replace(/\/\/(?!['"]).*/g, (match, offset, str) => {
      // Basit kontrol: string içinde mi?
      const before = str.substring(0, offset);
      const singleQuotes = (before.match(/'/g) || []).length;
      const doubleQuotes = (before.match(/"/g) || []).length;
      const backticks = (before.match(/`/g) || []).length;
      if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0) {
        return match; // String içindeyse kaldırma
      }
      return '';
    });
    
    line = line.trim();
    if (line) {
      result.push(line);
    }
  }
  
  return result.join('\n')
    // Birden fazla boşluğu tek boşluğa düşür (satır içi)
    .replace(/  +/g, ' ')
    .trim();
}

// ============ Build ============
function build() {
  console.log('🔧 Build başlatılıyor...\n');

  // CSS
  const cssDir = path.join(publicDir, 'css');
  const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css') && !f.endsWith('.min.css'));
  
  for (const file of cssFiles) {
    const inputPath = path.join(cssDir, file);
    const outputName = file.replace('.css', '.min.css');
    const outputPath = path.join(cssDir, outputName);
    
    const original = fs.readFileSync(inputPath, 'utf-8');
    const minified = minifyCSS(original);
    fs.writeFileSync(outputPath, minified, 'utf-8');
    
    const savedPercent = ((1 - minified.length / original.length) * 100).toFixed(1);
    console.log(`  ✅ CSS: ${file} → ${outputName}`);
    console.log(`     ${(original.length / 1024).toFixed(1)}KB → ${(minified.length / 1024).toFixed(1)}KB (${savedPercent}% küçültme)`);
  }

  // JS
  const jsDir = path.join(publicDir, 'js');
  const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.endsWith('.min.js'));
  
  for (const file of jsFiles) {
    const inputPath = path.join(jsDir, file);
    const outputName = file.replace('.js', '.min.js');
    const outputPath = path.join(jsDir, outputName);
    
    const original = fs.readFileSync(inputPath, 'utf-8');
    const minified = minifyJS(original);
    fs.writeFileSync(outputPath, minified, 'utf-8');
    
    const savedPercent = ((1 - minified.length / original.length) * 100).toFixed(1);
    console.log(`  ✅ JS:  ${file} → ${outputName}`);
    console.log(`     ${(original.length / 1024).toFixed(1)}KB → ${(minified.length / 1024).toFixed(1)}KB (${savedPercent}% küçültme)`);
  }

  console.log('\n🎉 Build tamamlandı!');
}

build();
