const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '.codex-security-update.js');
let content = fs.readFileSync(target, 'utf8');
const before = "  const expected = label === 'code comments context' ? 2 : (label === 'dashboard comments context' ? 0 : 1);";
const after = "  const expected = label === 'code comments context' || label === 'stylesheet version first' ? 2 : (label === 'dashboard comments context' || label === 'stylesheet version second' ? 0 : 1);";
if (!content.includes(before)) throw new Error('Expected-count expression not found');
content = content.replace(before, after);
fs.writeFileSync(target, content, 'utf8');
