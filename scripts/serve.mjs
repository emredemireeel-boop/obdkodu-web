import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const port=Number(process.env.PORT || 4173);
http.createServer((req,res)=>{
  let pathname;
  try { pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch {res.writeHead(400).end('Bad request');return;}
  const requested=path.resolve(root,'.'+pathname);
  if (requested!==root && !requested.startsWith(root+path.sep)) {res.writeHead(403).end('Forbidden');return;}
  let file=requested;
  try {if (fs.statSync(file).isDirectory()) file=path.join(file,'index.html');} catch { /* handled below */ }
  if (!fs.existsSync(file)) {file=path.join(root,'404.html');res.statusCode=404;}
  res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(port,()=>console.log(`Local: http://localhost:${port}`));
