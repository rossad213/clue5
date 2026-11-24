'use strict';
// Scan official answers against the allowed answers for every *other* case.
// Prevent the matcher from accepting unrelated case names because they happen
// to differ by one or two characters. These are public case identities only.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const matcher=require('../assets/answer-match.js');
const aliases=require('../assets/answer-aliases.js');
const base=require('../server/daily-pool.cjs');
const expansion=require('../server/daily-expansion.cjs');
const src=fs.readFileSync(path.resolve(__dirname,'../data/practice.js'),'utf8');
const p='.concat(';
assert(src.includes(p),'Unsupported practice library format');
const practice=JSON.parse(src.slice(src.indexOf(p)+p.length).trim().replace(/\);\s*$/,''));
const cases=[...base,...expansion,...practice].map(c=>({
 answer:c[0],choices:[c[0],...c[3],...(aliases[c[0]]||[])]
}));
const reviewedSharedIdentities=new Set([
 'Fall of the Berlin Wall|The Berlin Wall',
 'The Titanic|Titanic Sinking',
 'Electric light bulb|Light bulb'
]);
const sameIdentity=(a,b)=>reviewedSharedIdentities.has([a,b].sort().join('|'));
const variants=cases.map(c=>({
 ...c,keys:c.choices.map(matcher.key),
 words:c.choices.map(x=>matcher.keywordProfile(x).join('|'))
}));
const problems=[];
let checked=0;
for(const guessCase of cases){
 const guess=guessCase.answer;
 const gKey=matcher.key(guess);
 const profile=matcher.keywordProfile(guess).join('|');
 for(const target of variants){
  if(guess===target.answer||sameIdentity(guess,target.answer))continue;
  // Exact matching, typo tolerance and keyword reorder require identical
  // identifier keys, equal word profiles, or a maximum two-character delta.
  const plausible=target.keys.some(k=>Math.abs(k.length-gKey.length)<=2)
   || target.words.includes(profile);
  if(!plausible)continue;
  checked++;
  if(matcher.matches(guess,target.choices)){
   problems.push({guess,wrongCase:target.answer});
   if(problems.length>=50)break;
  }
 }
 if(problems.length>=50)break;
}
assert.deepEqual(problems,[],'Official case answers accepted for unrelated cases: '
 +JSON.stringify(problems));
console.log('Cross-case identity audit passed: '+cases.length+' cases; '+checked
 +' candidate comparisons; zero unreviewed cross-case matches.');
