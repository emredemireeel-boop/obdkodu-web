const fs = require('fs');
const http = require('http');
http.get('http://localhost:3000/gosterge-paneli', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    fs.writeFileSync('scratch/test.html', data);
    console.log('Saved to scratch/test.html');
  });
});
