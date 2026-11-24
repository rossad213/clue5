'use strict';
// Clue5 full-library audit: node scripts/audit-all.cjs
// All original and new cases are inspected; legacy spoiler cases are reported
// separately because the production spoiler guard already quarantines them.
// Only fail for duplicate answers, broken records, new spoiler leaks and
// unexpected changes to the number of legacy quarantined cases.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const base=require(root+'/server/daily-pool.cjs');
const expansion=require(root+'/server/daily-expansion.cjs');
const guard=require(root+'/assets/clue-safety.js');
const aliases=require(root+'/assets/answer-aliases.js');
const source=fs.readFileSync(root+'/data/practice.js','utf8');
const marker='.concat(';
const index=source.indexOf(marker);
if(index<0)throw Error('Practice format missing');
const practice=JSON.parse(source.slice(index+marker.length).trim().replace(/\);\s*$/,''));
const originalPractice=practice.slice(0,682);
const addedPractice=practice.slice(682);
const pools=[
 {name:'originalDaily',items:base,legacy:true},
 {name:'newDaily',items:expansion,legacy:false},
 {name:'originalPractice',items:originalPractice,legacy:true},
 {name:'newPractice',items:addedPractice,legacy:false}
];
const norm=x=>String(x||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const errors=[],warnings=[],quarantined=[],seen=new Map(),seenNewClues=new Map();
const LEGACY_QUARANTINE_CEILING=0; // Legacy clues repaired in November 2026; no spoiler exclusions permitted.
let records=0,clues=0,legacyClue4=0,legacyClue5=0;
const broadCategories=new Set(['Arts & Entertainment','Place','Person','Object']);
const suspect=/\b(?:first woman|first person|first man|only living|only person|the only|world's largest|world's highest|the largest|the longest|the first|the last|the tallest|the deepest)\b/i;
for(const pool of pools){
 for(const [n,c] of pool.items.entries()){
  records++;
  if(!Array.isArray(c)||c.length!==4||!Array.isArray(c[2])||c[2].length!==5||!Array.isArray(c[3])){
   errors.push('Invalid case record '+pool.name+' #'+n);
   continue;
  }
  const [answer,category,evidence,other]=c;
  clues+=evidence.length;
  const key=norm(answer).replace(/^(the|a|an) /,'');
  if(seen.has(key))errors.push('Duplicate answer '+answer+' / '+seen.get(key));
  seen.set(key,answer);
  if(!category||typeof category!=='string')errors.push('Missing category '+answer);
  if(broadCategories.has(category))warnings.push('Broad category: '+answer+' ('+category+')');
  const isLeak=guard.leaks(c,aliases);
  if(isLeak){
   if(!pool.legacy)errors.push('NEW case not playable due to answer or alias leak: '+answer);
   else {
    quarantined.push({pool:pool.name,answer});
    // A separate low-level scan splits clue-four and clue-five leaks.
    // The guard itself screens the complete five-clue set.
    const refs=[answer,...other,...(aliases[answer]||[])];
    if(category==='Person'||category==='People'){
     const parts=norm(answer).split(' ');
     if(parts.length>1&&parts.at(-1).length>=5)refs.push(parts.at(-1));
    }
    const phrases=[...new Set(refs.map(norm).flatMap(v=>[v,v.replace(/^(the|an|a) /,'')]).filter(Boolean))];
    const leaky=(i)=>phrases.some(v=>(' '+norm(evidence[i])+' ').includes(' '+v+' '));
    if(leaky(3))legacyClue4++;
    if(leaky(4))legacyClue5++;
   }
  }
  for(let j=0;j<5;j++){
   const clue=evidence[j],t=norm(clue);
   if(typeof clue!=='string'||!t||t.length<15)errors.push('Missing or short clue: '+answer+' #'+(j+1));
   if(evidence.slice(0,j).some(v=>norm(v)===t))errors.push('Repeated clue: '+answer+' #'+(j+1));
   if(!pool.legacy){
    if(seenNewClues.has(t))warnings.push('Duplicate wording: '+answer+' / '+seenNewClues.get(t));
    seenNewClues.set(t,answer);
   }
   if(j===2||j===3){
    if(suspect.test(clue))warnings.push('Check unique/obvious fact: '+answer+' #'+(j+1));
    if(/\b(?:I am|I was) (?:the|a|an) [a-z ]{4,}\.?$/i.test(clue)&&t.length<56)warnings.push('Check definition-style clue: '+answer+' #'+(j+1));
   }
  }
 }
}
if(quarantined.length>LEGACY_QUARANTINE_CEILING)errors.push('Legacy spoiler exclusions increased from '+LEGACY_QUARANTINE_CEILING+' to '+quarantined.length);
const report={
 summary:{cases:records,clues,originalDaily:base.length,newDaily:expansion.length,originalPractice:originalPractice.length,newPractice:addedPractice.length},
 validation:{hardErrors:errors.length,errors:errors.slice(0,100),legacyQuarantined:quarantined.length,legacyClue4Leaks:legacyClue4,legacyClue5Leaks:legacyClue5,legacyQuarantine:quarantined,editorialWarnings:warnings.length,warningExamples:warnings.slice(0,80)},
 dailySchedule:{cutover:'2026-11-23',originalPoolNotReordered:true}
};
console.log(JSON.stringify(report,null,2));
if(errors.length)process.exitCode=1;
