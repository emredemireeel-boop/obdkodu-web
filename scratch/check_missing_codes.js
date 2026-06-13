const fs = require('fs');
const path = require('path');

const obdData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/obd-codes.json'), 'utf-8'));
const lightsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/dashboard-lights.json'), 'utf-8'));

const existingCodes = new Set(obdData.map(c => c.code.toUpperCase()));
const missingCodes = new Set();

lightsData.forEach(light => {
  if (light.exampleCodes) {
    light.exampleCodes.forEach(code => {
      if (!existingCodes.has(code.toUpperCase())) {
        missingCodes.add(code.toUpperCase());
      }
    });
  }
});

console.log(JSON.stringify(Array.from(missingCodes)));
