'use strict';
// Clue5 editorial progression audit.
// This deliberately measures textual repetition rather than claiming to
// know how difficult a clue will feel to a human player.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = require('../server/daily-pool.cjs');
const expansion = require('../server/daily-expansion.cjs');
const source = fs.readFileSync(path.resolve(__dirname,'../data/practice.js'),'utf8');
const marker = '.concat(';
assert(source.includes(marker),'Practice library format changed');
const practice = JSON.parse(source.slice(source.indexOf(marker)+marker.length).trim().replace(/\);\s*$/,''));
const pools = [
 ['Daily original',base],['Daily expansion',expansion],['Unlimited',practice]
];
const ignore = new Set('that with from into this their when which there while than have were them only about after before known called often both among because most many like'.split(' '));
function tokens(text){
 return String(text).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/)
  .filter(w=>w.length>=4&&!ignore.has(w));
}
const repeats = [];
const invalid = [];
let cases = 0;
for(const [pool,items] of pools){
 for(const record of items){
  cases++;
  const [answer,category,clues] = record;
  if(!Array.isArray(clues)||clues.length!==5){
   invalid.push(pool+': '+answer+' must have five clues');
   continue;
  }
  for(let i=0;i<5;i++){
   if(typeof clues[i]!=='string'||clues[i].trim().length<18)
    invalid.push(pool+': '+answer+' clue '+(i+1)+' is missing or too short');
   for(let j=i+1;j<5;j++){
    const first = new Set(tokens(clues[i]));
    const second = new Set(tokens(clues[j]));
    const overlap = [...first].filter(w=>second.has(w)).length;
    const proportion = overlap/Math.max(1,Math.min(first.size,second.size));
    if(overlap>=3&&proportion>=0.75)
     repeats.push({pool,answer,clues:[i+1,j+1],proportion});
   }
  }
 }
}
assert.equal(cases,2179,'Review library count and audit assumptions after adding cases');
assert.deepEqual(invalid,[],'Invalid or missing clues');
assert.deepEqual(repeats,[],'High-overlap clues need independent evidence');
console.log(JSON.stringify({
 casesChecked:cases,cluesChecked:cases*5,
 highConfidenceRepeatedCluePairs:repeats.length,
 note:'Automated word overlap does not establish subjective clue difficulty.'
},null,2));
