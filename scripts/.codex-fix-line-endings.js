const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '.codex-security-update.js');
const content = fs.readFileSync(target, 'utf8');
const fixed = content.replace(/\\r\\n/g, '\\n');
if (fixed === content) throw new Error('No escaped CRLF sequences found');
fs.writeFileSync(target, fixed, 'utf8');
