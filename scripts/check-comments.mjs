import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'obd-comments-'));
const port = 3101 + crypto.randomInt(1000, 5000);
const password = 'temporary-test-password';
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(password, salt, 64).toString('hex');
const base = `http://127.0.0.1:${port}`;
const fixtures = Array.from({length:11}, (_, i) => ({type:'add',comment:{id:String(10000000+i),code:'P0420',firstName:'Deneme',lastName:'Sürücü',brand:'Hyundai',model:'i20',year:'2017',symptom:`Katalizör ışığı yandı ve ölçüm ${i} kaydedildi.`,solution:'Egzoz hattı kontrol edildi.',note:'',createdAt:new Date(Date.now()-i*1000).toISOString()}}));
fs.writeFileSync(path.join(dir,'events.jsonl'), fixtures.map(x => JSON.stringify(x)).join('\n')+'\n');
const child = spawn(process.execPath, ['server/comments.mjs'], {cwd:path.resolve(''),env:{...process.env,COMMENT_DATA_DIR:dir,COMMENT_PORT:String(port),COMMENT_ADMIN_SALT:salt,COMMENT_ADMIN_HASH:hash,COMMENT_SESSION_KEY:crypto.randomBytes(32).toString('hex')},stdio:'ignore'});
try {
  let ready = false;
  for (let i=0;i<60;i++) { try { await fetch(`${base}/ariza-kodlari/p0420/`); ready=true; break; } catch { await new Promise(resolve => setTimeout(resolve,100)); } }
  assert(ready, 'comments server did not start');
  const first = await fetch(`${base}/ariza-kodlari/p0420/`);
  const firstHtml = await first.text();
  assert.equal(first.status,200);
  assert.equal((firstHtml.match(/class="comment-card"/g)||[]).length,10);
  assert(firstHtml.includes('?yorum-sayfa=2#deneyimler'));
  assert(firstHtml.includes('"@type":"Comment"'));
  assert(!firstHtml.includes('<!--COMMENTS_SLOT-->'));
  const secondHtml = await (await fetch(`${base}/ariza-kodlari/p0420/?yorum-sayfa=2`)).text();
  assert.equal((secondHtml.match(/class="comment-card"/g)||[]).length,1);
  assert(secondHtml.includes('href="https://www.obdkodu.com/ariza-kodlari/p0420/?yorum-sayfa=2"'));
  const bad = await fetch(`${base}/yorumlar/ekle`, {method:'POST',body:new URLSearchParams({code:'P0171',firstName:'Test',lastName:'Sürücü',brand:'Ford',model:'Focus',symptom:'Bu sorun için https://spam.example adresine gidin.',consent:'yes'}),redirect:'manual'});
  assert.equal(bad.status,400);
  const good = await fetch(`${base}/yorumlar/ekle`, {method:'POST',body:new URLSearchParams({code:'P0171',firstName:'Ayşe',lastName:'Yılmaz',brand:'Ford',model:'Focus',symptom:'Rölantide dalgalanma başladı ve P0171 kodu okundu.',solution:'Vakum kaçağı ölçülerek giderildi.',consent:'yes'}),redirect:'manual'});
  assert.equal(good.status,303);
  const location = good.headers.get('location');
  const addedHtml = await (await fetch(`${base}/ariza-kodlari/p0171/`)).text();
  assert(addedHtml.includes('Ayşe Yılmaz'));
  assert(addedHtml.includes('Vakum kaçağı ölçülerek giderildi.'));
  const id = /#yorum-(\d{8})/.exec(location)?.[1];
  assert(id);
  const denied = await fetch(`${base}/yorum-yonetimi/sil`,{method:'POST',body:new URLSearchParams({id}),redirect:'manual'});
  assert.equal(denied.status,403);
  const login = await fetch(`${base}/yorum-yonetimi/giris`,{method:'POST',body:new URLSearchParams({password}),redirect:'manual'});
  assert.equal(login.status,303);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const admin = await (await fetch(`${base}/yorum-yonetimi/`,{headers:{cookie}})).text();
  assert(admin.includes('name="id" value="'+id+'"'));
  assert(admin.includes('noindex,nofollow'));
  const csrf = /name="csrf" value="([a-f0-9]{64})"/.exec(admin)?.[1];
  assert(csrf);
  const deleted = await fetch(`${base}/yorum-yonetimi/sil`,{method:'POST',headers:{cookie},body:new URLSearchParams({id,csrf}),redirect:'manual'});
  assert.equal(deleted.status,303);
  const after = await (await fetch(`${base}/ariza-kodlari/p0171/`)).text();
  assert(!after.includes('Ayşe Yılmaz'));
  console.log('OK: SSR yorumlar, 10 kayıtlık sayfalama, filtre, JSON-LD, yönetici girişi ve silme.');
} finally {
  child.kill();
  fs.rmSync(dir,{recursive:true,force:true});
}
