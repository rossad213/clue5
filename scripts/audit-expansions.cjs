'use strict';
// Run with: node scripts/audit-expansions.cjs
// This checks the full library and enforces stricter quality rules on new cases.
const fs=require('node:fs');
const root=require('node:path').resolve(__dirname,'..');
const daily=require(root+'/server/daily-pool.cjs');
const moreDaily=require(root+'/server/daily-expansion.cjs');
const practiceSource=fs.readFileSync(root+'/data/practice.js','utf8');
const marker='.concat(';
const start=practiceSource.indexOf(marker);
if(start<0)throw Error('Practice library format changed');
const practice=JSON.parse(practiceSource.slice(start+marker.length).trim().replace(/\\);\\s*$/,''));
const norm=x=>String(x).normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/gi,' ').toLowerCase().trim().replace(/\\s+/g,' ');
const errors=[],warnings=[];
const cases=[...daily,...moreDaily,...practice],seen=new Map(),clueSeen=new Map();
for(const [i,c] of cases.entries()){
 if(!Array.isArray(c)||c.length!==4||!Array.isArray(c[2])||c[2].length!==5){errors.push('Malformed case #'+i);continue}
 const [answer,cat,clues,aliases]=c;
 const key=norm(answer);
 if(seen.has(key))errors.push('Duplicate answer: '+answer+' also in '+seen.get(key));else seen.set(key,i);
 if(!cat||cat==='Arts & Entertainment'||cat==='Person'||cat==='Place')warnings.push('Generic category: '+answer+' / '+cat);
 if(!Array.isArray(aliases))errors.push('Aliases must be array: '+answer);
 const variants=[answer,...aliases].map(norm).filter(x=>x.length>=4);
 for(const [j,clue] of clues.entries()){
  const t=norm(clue);
  if(t.length<15)errors.push('Too short: '+answer+' / '+(j+1));
  if(variants.some(v=>(' '+t+' ').includes(' '+v+' ')))errors.push('Answer or alias leaked: '+answer+' clue '+(j+1));
  if(j<4&&/^(i am|i was) (the|a|an) [a-z ]{3,}$/.test(t)&&t.length<55)warnings.push('Potentially direct: '+answer+' clue '+(j+1));
  if(clues.slice(0,j).some(x=>norm(x)===t))errors.push('Repeated clue within '+answer);
  if(clueSeen.has(t)&&clueSeen.get(t)!==answer)warnings.push('Same clue used by '+answer+' and '+clueSeen.get(t));
  clueSeen.set(t,answer);
 }
}
console.log(JSON.stringify({daily:daily.length,moreDaily:moreDaily.length,practice:practice.length,total:cases.length,errors:errors.slice(0,100),errorCount:errors.length,warnings:warnings.slice(0,100),warningCount:warnings.length},null,2));
if(errors.length)process.exitCode=1;
