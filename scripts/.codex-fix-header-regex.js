const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '.codex-security-update.js');
let content = fs.readFileSync(target, 'utf8');
const before = `  /^    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',$/gm,
  '    ...SECURITY_HEADERS,',`;
const after = `  /^(\\s*)'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',$/gm,
  (_, indent) => indent + '...SECURITY_HEADERS,',`;
if (!content.includes(before)) throw new Error('Header regex block not found');
content = content.replace(before, after);
fs.writeFileSync(target, content, 'utf8');
