'use strict';
// Clue5 editorial quality gate. Run: node scripts/audit-expansions.cjs
// Check all answers for duplicates; apply stricter rules to newly added cases.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const originalDaily=require(root+'/server/daily-pool.cjs');
const expansionDaily=require(root+'/server/daily-expansion.cjs');
const practiceText=fs.readFileSync(root+'/data/practice.js','utf8');
const start=practiceText.indexOf('.concat(');
if(start<0)throw Error('Practice format changed');
const practice=JSON.parse(practiceText.slice(start+8).trim().replace(/\);\s*$/,''));
const ORIGINAL_PRACTICE_COUNT=682;
const norm=x=>String(x||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const errors=[],warnings=[],all=[...originalDaily,...expansionDaily,...practice];
const newCases=[...expansionDaily,...practice.slice(ORIGINAL_PRACTICE_COUNT)];
const answers=new Map();
for(const c of all){
 if(!Array.isArray(c)||!Array.isArray(c[2])||c[2].length!==5){errors.push('Malformed case '+c?.[0]);continue}
 const n=norm(c[0]);
 if(answers.has(n))errors.push('Duplicate answer: '+c[0]+' and '+answers.get(n));
 else answers.set(n,c[0]);
}
const seenClues=new Map();
for(const [name,cat,clues,aliases] of newCases){
 if(!name||typeof cat!=='string'||!Array.isArray(aliases)){errors.push('Invalid fields for '+name);continue}
 if(['Arts & Entertainment','Person','Place','Object'].includes(cat))warnings.push('Broad category: '+name);
 const variants=[name,...aliases].map(norm).filter(x=>x.length>=4);
 for(let i=0;i<5;i++){
  const clue=clues[i],txt=norm(clue);
  if(typeof clue!=='string'||txt.length<20)errors.push('Unhelpfully short clue: '+name+' #'+(i+1));
  if(variants.some(v=>(' '+txt+' ').includes(' '+v+' ')))errors.push('Answer/alias revealed: '+name+' #'+(i+1));
  if(clues.slice(0,i).some(x=>norm(x)===txt))errors.push('Repeated clue: '+name+' #'+(i+1));
  if(seenClues.has(txt))warnings.push('Identical clue shared by '+name+' and '+seenClues.get(txt));
  seenClues.set(txt,name);
  if(i<4&&/^(i am|i was) (the|a|an) /.test(txt)&&txt.length<55)warnings.push('Early direct-definition risk: '+name+' #'+(i+1));
 }
}
console.log(JSON.stringify({originalDaily:originalDaily.length,addedDaily:expansionDaily.length,practiceTotal:practice.length,addedPractice:practice.length-ORIGINAL_PRACTICE_COUNT,checkedNew:newCases.length,errorCount:errors.length,errors:errors.slice(0,80),warningCount:warnings.length,warnings:warnings.slice(0,40)},null,2));
if(errors.length)process.exitCode=1;
