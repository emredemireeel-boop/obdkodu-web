const { spawn } = require('child_process');
const http = require('http');

const port = '3101';
const child = spawn(process.execPath, ['server.js'], {
  cwd: require('path').resolve(__dirname, '..'),
  env: { ...process.env, PORT: port },
  stdio: 'ignore',
});

const stop = (code) => {
  child.kill();
  process.exitCode = code;
};

const timer = setTimeout(() => {
  console.error('Sitemap verification timed out.');
  stop(1);
}, 10000);

setTimeout(() => {
  http.get(`http://127.0.0.1:${port}/sitemap.xml`, (response) => {
    let body = '';
    response.setEncoding('utf8');
    response.on('data', (chunk) => {
      body += chunk;
    });
    response.on('end', () => {
      clearTimeout(timer);
      const urlCount = (body.match(/<url>/g) || []).length;
      const isUrlSet = body.includes('<urlset') && !body.includes('<sitemapindex');
      console.log(JSON.stringify({
        status: response.statusCode,
        contentType: response.headers['content-type'],
        urlCount,
        isUrlSet,
        bytes: Buffer.byteLength(body),
      }));
      stop(response.statusCode === 200 && isUrlSet && urlCount > 0 ? 0 : 1);
    });
  }).on('error', (error) => {
    clearTimeout(timer);
    console.error(error);
    stop(1);
  });
}, 2500);
