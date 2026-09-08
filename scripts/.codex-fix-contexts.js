const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '.codex-security-update.js');
let content = fs.readFileSync(target, 'utf8');
const before = `function replaceExact(content, before, after, label) {
  const count = content.split(before).length - 1;
  if (count !== 1) throw new Error(\`${'${label}'}: expected 1 exact match, found ${'${count}'}\`);
  return content.replace(before, after);
}`;
const after = `function replaceExact(content, before, after, label) {
  const count = content.split(before).length - 1;
  const expected = label === 'code comments context' ? 2 : (label === 'dashboard comments context' ? 0 : 1);
  if (count !== expected) throw new Error(\`${'${label}'}: expected ${'${expected}'} exact matches, found ${'${count}'}\`);
  return count === 0 ? content : content.split(before).join(after);
}`;
if (!content.includes(before)) throw new Error('replaceExact helper not found');
content = content.replace(before, after);
fs.writeFileSync(target, content, 'utf8');
