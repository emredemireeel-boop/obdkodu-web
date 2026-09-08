const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '.codex-security-update.js');
const lines = fs.readFileSync(target, 'utf8').split('\n');
let linkFixes = 0;
let badgeFixes = 0;

const fixed = lines.map(line => {
  if (line.includes("    link.href = ")) {
    linkFixes += 1;
    return "    link.href = '/kod/' + encodeURIComponent(code);\\r";
  }
  if (line.includes("    badge.className = ")) {
    badgeFixes += 1;
    return "    badge.className = 'code-badge category-' + category;\\r";
  }
  return line;
}).join('\n');

if (linkFixes !== 1 || badgeFixes !== 1) {
  throw new Error(`Unexpected patch counts: link=${linkFixes}, badge=${badgeFixes}`);
}

fs.writeFileSync(target, fixed, 'utf8');
