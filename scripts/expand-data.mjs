import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import curatedGuides from '../data/curated-guides.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const legacy=path.resolve(root,'../obdkodu-web/data');
const oldCodes=JSON.parse(fs.readFileSync(path.join(legacy,'obd-codes.json'),'utf8'));
const overrides=JSON.parse(fs.readFileSync(path.join(legacy,'code-guide-overrides.json'),'utf8'));
const source=JSON.parse(fs.readFileSync(path.join(legacy,'obdex-generic.json'),'utf8'));
const guideCodes=new Set(JSON.parse(fs.readFileSync(path.join(root,'data/guides.json'),'utf8')).map(x=>x.code));
const curatedMap=new Map(curatedGuides.map(x=>[x.code,x]));
const extraGuideCodes=['B0001','B0010','C0035','P0011','P0102','P0113','P0115','P0138','P0141','P0174','P0299','P0303','P0304','P0340','P0446','P2096','U0100','P2503','P2452','P0671','P0672','C0176','C1089','U0167','P204F'];
for(const c of extraGuideCodes)guideCodes.add(c);
guideCodes.delete('C0544'); // Legacy translation conflicts with OBDex generic definition.

const titleFixes={
  P0016:'Krank ve eksantrik mili konumu uyumsuzluğu (Bank 1 Sensör A)',
  P0017:'Krank ve eksantrik mili konumu uyumsuzluğu (Bank 1 Sensör B)',
  P0420:'Katalizör sistemi verimliliği eşik altında (Bank 1)',
  P0430:'Katalizör sistemi verimliliği eşik altında (Bank 2)',
  P0442:'EVAP sisteminde küçük kaçak',
  P0455:'EVAP sisteminde büyük kaçak',
  P0300:'Rastgele veya çoklu silindir teklemesi',
  P0128:'Soğutma suyu sıcaklığı termostat eşiğinin altında',
  P0101:'MAF sensörü devresi aralık veya performans sorunu',
  P0171:'Hava yakıt karışımı çok fakir (Bank 1)',
  P0700:'Şanzıman kontrol sistemi arıza bildirimi'
  ,P2096:'Katalizör sonrası yakıt düzeltme sistemi çok fakir (Bank 1)'
  ,P0102:'MAF sensörü devresi düşük giriş'
  ,P0141:'Oksijen sensörü ısıtıcı devresi arızası (Bank 1 Sensör 2)'
  ,P0299:'Turboşarj basıncı beklenen düzeyin altında'
  ,P2503:'Şarj sistemi gerilimi düşük'
  ,C0544:'Fren basınç sensörü B devresi açık'
};
const legacyMap=new Map();
for(const x of oldCodes){
  if(!/^[PBCU][0-9A-F]{4}$/.test(x.code||'')||!x.name)continue;
  const current=legacyMap.get(x.code);
  if(!current || (x.description||'').length>(current.description||'').length)legacyMap.set(x.code,x);
}
for(const x of overrides)legacyMap.set(x.code,{...legacyMap.get(x.code),...x});

const catalogMap=new Map();
for(const x of source.records){
  if(!/^[PBCU][0-9A-F]{4}$/.test(x.code||''))continue;
  catalogMap.set(x.code,{code:x.code,name:x.titleEn,category:x.code[0],system:'',lang:'en',scope:'generic'});
}
for(const x of legacyMap.values()){
  const prior=catalogMap.get(x.code);
  catalogMap.set(x.code,{code:x.code,name:curatedMap.get(x.code)?.name||titleFixes[x.code]||x.name,category:x.code[0],system:curatedMap.get(x.code)?.affectedSystem||x.affectedSystem||'',lang:'tr',scope:prior?'generic':'legacy'});
}
const catalog=[...catalogMap.values()].sort((a,b)=>a.code.localeCompare(b.code));
const guides=[...guideCodes].map(code=>legacyMap.get(code)).filter(Boolean).map(x=>({...x,name:titleFixes[x.code]||x.name})).sort((a,b)=>a.code.localeCompare(b.code));
fs.writeFileSync(path.join(root,'data/catalog.json'),JSON.stringify(catalog));
fs.writeFileSync(path.join(root,'data/guides.json'),JSON.stringify(guides,null,2));
fs.writeFileSync(path.join(root,'data/SOURCES.md'),`# Veri kaynakları\n\n- OBDex genel OBD-II veri seti: https://github.com/foerbsnavi/obdex — CC0-1.0. Kullanılan sürüm: ${source.meta.revision}. ${source.records.length.toLocaleString('en-US')} genel kod.\n- Yerel eski obdkodu-web projesi: Türkçe adlar ve ayrıntılı rehber başlangıcı. Bu veriler OBDex dışındaki üreticiye özgü veya yerel kayıtlar da içerir; marka/model doğrulaması gerekir.\n- Türkçe kaydı bulunmayan genel OBDex kodlarının İngilizce kaynak adı korunur. Bu kayıtlar otomatik ayrı SEO sayfası oluşturmaz.\n- Ayrıntılı rehberler, önceki projeden seçilmiş ${guides.length} kod ve bu projede yeniden yazılmış ${curatedGuides.length} kod olmak üzere ${guides.length+curatedGuides.length} kod için üretilir. Hiçbiri kesin parça teşhisi olarak sunulmaz.\n`);
console.log(`catalog=${catalog.length}, generic=${source.records.length}, guides=${guides.length+curatedGuides.length}, Turkish=${catalog.filter(x=>x.lang==='tr').length}`);
