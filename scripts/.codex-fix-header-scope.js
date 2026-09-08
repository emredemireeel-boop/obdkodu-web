const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '.codex-security-update.js');
let content = fs.readFileSync(target, 'utf8');
const before = `/^(\\s*)'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',$/gm`;
const after = `/^((?: {4}| {6}))'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',$/gm`;
if (!content.includes(before)) throw new Error('Broad header regex not found');
content = content.replace(before, after);
fs.writeFileSync(target, content, 'utf8');
