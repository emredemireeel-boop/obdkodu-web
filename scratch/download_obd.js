const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://raw.githubusercontent.com/mytrile/obd-trouble-codes/master/obd-trouble-codes.json';
const scratchPath = path.join('c:\\Users\\GAMER\\Desktop\\Projelerim\\obdkodu-web\\scratch\\raw.json');

// Ensure scratch dir exists
const scratchDir = path.dirname(scratchPath);
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Successfully downloaded! Total codes found:', parsed.length || Object.keys(parsed).length);
      fs.writeFileSync(scratchPath, JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Error parsing JSON:', e.message);
      // Let's print the first 100 chars to see what we got
      console.log('Data received:', data.substring(0, 100));
    }
  });
}).on('error', err => console.log('Network Error:', err.message));
