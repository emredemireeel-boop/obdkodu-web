const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, '..', 'views');

function loadTemplate(name) {
  const filePath = path.join(viewsDir, `${name}.html`);
  return fs.readFileSync(filePath, 'utf-8');
}

function render(templateName, data = {}) {
  let layout = loadTemplate('layout');
  let content = loadTemplate(templateName);

  // Process {{#each items}} ... {{/each}} loops
  content = processEach(content, data);
  layout = processEach(layout, data);

  // Process {{#if condition}} ... {{else}} ... {{/if}} conditionals
  content = processIf(content, data);
  layout = processIf(layout, data);

  // Insert content into layout
  layout = layout.replace('{{content}}', content);

  // Replace all {{variable}} and {{nested.variable}} placeholders
  layout = replacePlaceholders(layout, data);

  return layout;
}

function processEach(template, data) {
  const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  return template.replace(eachRegex, (match, key, inner) => {
    const items = getNestedValue(data, key);
    if (!Array.isArray(items)) return '';
    return items.map((item, index) => {
      let result = inner;
      if (typeof item === 'object') {
        // Process nested #if inside each
        result = processIf(result, { ...data, ...item, '@index': index });
        result = replacePlaceholders(result, { ...data, ...item, '@index': index });
      } else {
        result = result.replace(/\{\{this\}\}/g, item);
        result = result.replace(/\{\{@index\}\}/g, index);
      }
      return result;
    }).join('');
  });
}

function processIf(template, data) {
  const ifElseRegex = /\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g;
  template = template.replace(ifElseRegex, (match, key, ifContent, elseContent) => {
    const value = getNestedValue(data, key);
    return value ? processIf(ifContent, data) : processIf(elseContent, data);
  });

  const ifRegex = /\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  template = template.replace(ifRegex, (match, key, content) => {
    const value = getNestedValue(data, key);
    return value ? processIf(content, data) : '';
  });

  return template;
}

function replacePlaceholders(template, data) {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
    const value = getNestedValue(data, key);
    if (value === undefined || value === null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return escapeHtml(String(value));
  });
}

function getNestedValue(obj, key) {
  return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

function escapeHtml(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, c => map[c]);
}

module.exports = { render };
