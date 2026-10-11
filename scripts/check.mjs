import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
if(!fs.existsSync(root)) throw new Error('Önce npm run build çalıştırın.');
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.name.endsWith('.html'))files.push(full);}}
walk(root);
const errors=[];
const titles=new Map();
const descriptions=new Map();
for(const file of files){
 const html=fs.readFileSync(file,'utf8');
 const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
 const description=html.match(/<meta name="description" content="([^"]+)"/)?.[1];
 if(!title || titles.has(title))errors.push(`${file}: eksik veya tekrar eden title`);
 if(!description || descriptions.has(description))errors.push(`${file}: eksik veya tekrar eden description`);
 titles.set(title,file); descriptions.set(description,file);
 if((html.match(/<h1(?:\s|>)/g)||[]).length!==1)errors.push(`${file}: H1 sayısı 1 değil`);
 if(html.includes('<ul class="check-list"></ul>'))errors.push(`${file}: boş belirti listesi`);
 if(!/<html lang="tr">/.test(html))errors.push(`${file}: lang yok`);
 if(!/<link rel="canonical" href="https:\/\/www\.obdkodu\.com\//.test(html))errors.push(`${file}: canonical yok`);
 if(!/<meta name="description"/.test(html))errors.push(`${file}: description yok`);
 for(const match of html.matchAll(/href="(\/[^"]*)"/g)){
  const href=match[1].split(/[?#]/)[0];
  if(!href || href==='/404/')continue;
  const target=path.resolve(root,'.'+href);
  if(target!==root && !target.startsWith(root+path.sep)){errors.push(`${file}: geçersiz yol ${href}`);continue;}
  if(!fs.existsSync(target) && !fs.existsSync(path.join(target,'index.html')))errors.push(`${file}: bozuk bağlantı ${href}`);
 }
 const ld=[...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)];
 if(ld.length!==1)errors.push(`${file}: JSON-LD eksik veya fazla`);
 for(const x of ld){try{JSON.parse(x[1]);}catch{errors.push(`${file}: JSON-LD geçersiz`);}}
}
const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
if(urls.length!==files.length-1)errors.push(`sitemap ${urls.length}, indexable ${files.length-1}`);
if(!fs.existsSync(path.join(root,'assets/og.png')))errors.push('Sosyal paylaşım görseli eksik');
for(const u of urls)if(!u.startsWith('https://www.obdkodu.com/'))errors.push(`Sitemap URL: ${u}`);
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`OK: ${files.length-1} indexable sayfa, ${urls.length} sitemap URL, iç bağlantılar ve JSON-LD doğrulandı.`);
