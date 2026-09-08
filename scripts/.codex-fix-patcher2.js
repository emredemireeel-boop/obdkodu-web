const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '.codex-security-update.js');
let content = fs.readFileSync(target, 'utf8');

function replaceSegment(start, end, replacement, label) {
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end, startIndex + start.length);
  if (startIndex === -1 || endIndex === -1) throw new Error(`${label}: markers not found`);
  content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
}

replaceSegment(
  'link.href = ',
  ';\\r\\n    link.className',
  "link.href = '/kod/' + encodeURIComponent(code)",
  'link template literal'
);

replaceSegment(
  'badge.className = ',
  ';\\r\\n    badge.textContent',
  "badge.className = 'code-badge category-' + category",
  'badge template literal'
);

fs.writeFileSync(target, content, 'utf8');
