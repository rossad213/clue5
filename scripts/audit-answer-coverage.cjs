'use strict';
// Comprehensive regression checks across every Daily and Unlimited case.
// Run: node scripts/audit-answer-coverage.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const matcher=require('../assets/answer-match.js');
const aliases=require('../assets/answer-aliases.js');
const base=require('../server/daily-pool.cjs');
const expansion=require('../server/daily-expansion.cjs');
const source=fs.readFileSync(path.resolve(__dirname,'../data/practice.js'),'utf8');
const marker='.concat(';
assert(source.includes(marker),'Practice library format changed');
const practice=JSON.parse(source.slice(source.indexOf(marker)+marker.length).trim().replace(/\);\s*$/,''));
const groups=[['Daily',base],['Daily Expansion',expansion],['Unlimited',practice]];
const knownLegacy=new Set([
 'Titanic Sinking|The Titanic',
 'Fall of the Berlin Wall|The Berlin Wall',
 'Electric light bulb|Light bulb'
]);
const owners=new Map(),collisions=new Set();
let total=0,explicit=0,accepted=0;
for(const [mode,pool] of groups){
 for(const [answer,category,clues,own] of pool){
  total++;
  const candidates=[answer,...own,...(aliases[answer]||[])];
  if(candidates.length>1)explicit++;
  // Every case supports alternative capitalization/spacing/punctuation, even
  // proper names without legitimate second names. Never invent false synonyms.
  const variants=[
   answer,
   answer.toUpperCase(),
   '  '+answer+'!  ',
   answer.replace(/\s+/g,'   ')
  ];
  for(const guess of variants){
   assert(matcher.matches(guess,candidates),mode+' rejected variant '+JSON.stringify(guess)+' of '+answer);
   accepted++;
  }
  for(const alias of candidates.slice(1)){
   assert(matcher.matches(alias,candidates),mode+' rejected explicit alternative '+alias+' of '+answer);
  }
  for(const term of candidates){
   const key=matcher.key(term);
   const previous=owners.get(key);
   if(previous&&previous!==answer){
    const pair=[previous,answer].sort().join('|');
    collisions.add(pair);
    assert(knownLegacy.has(pair),'New answer collision: '+pair+' via '+term);
   }else if(!previous)owners.set(key,answer);
  }
 }
}
assert.equal(total,2179,'Question library size changed; review audit assumptions when adding cases');
assert.equal(matcher.matches('Taman Negara',['Taman Negara National Park',...(aliases['Taman Negara National Park']||[])]),true);
assert.equal(matcher.matches('Yellowstone',['Yellowstone National Park',...(aliases['Yellowstone National Park']||[])]),true);
for(const guess of ['National Park','Taman','a park','the mountain','yellow']){
 assert.equal(matcher.matches(guess,['Yellowstone National Park',...(aliases['Yellowstone National Park']||[])]),false,'Overbroad Yellowstone match: '+guess);
}
assert.equal(matcher.matches('World War III',['World War II']),false);
assert.equal(matcher.matches('2009 Financial Crisis',['2008 Financial Crisis']),false);
console.log(JSON.stringify({casesAudited:total,alternateFormattingChecks:accepted,casesWithExplicitCuratedOrCaseAliases:explicit,knownAmbiguousAnswerPairs:[...collisions],newCollisions:0},null,2));
