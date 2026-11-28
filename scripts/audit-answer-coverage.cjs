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
 'The Titanic|Titanic Sinking',
 'Fall of the Berlin Wall|The Berlin Wall',
 'Electric light bulb|Light bulb'
]);
const owners=new Map(),collisions=new Set();
let total=0,explicit=0,accepted=0,spellingChecks=0;
const officialKeys=new Map();
for(const [,pool] of groups)for(const c of pool){
 const k=matcher.key(c[0]);
 if(!officialKeys.has(k))officialKeys.set(k,new Set());
 officialKeys.get(k).add(c[0]);
}
function typoVariant(answer){
 // Use a single transposition in a descriptive word. Avoid numbers,
 // initials and short words, where a typo could be a different subject.
 const parts=answer.split(/(\s+)/);
 for(let i=0;i<parts.length;i++){
  const word=parts[i];
  if(!/^[A-Za-z]{6,}$/.test(word))continue;
  const pivot=Math.min(2,word.length-3);
  if(word[pivot]===word[pivot+1])continue;
  const swapped=word.slice(0,pivot)+word[pivot+1]+word[pivot]+word.slice(pivot+2);
  const guess=parts.map((v,j)=>j===i?swapped:v).join('');
  if(officialKeys.has(matcher.key(guess)))continue;
  return guess;
 }
 return null;
}
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
   answer.replace(/\s+/g,'   '),
   'I think it is '+answer,
   'My guess is '+answer,
   'Is it '+answer+'?'
  ];
  for(const guess of variants){
   assert(matcher.matches(guess,candidates),mode+' rejected variant '+JSON.stringify(guess)+' of '+answer);
   accepted++;
  }
  // Run an actual typo test for every safely eligible case.
  const typo=typoVariant(answer);
  if(typo){
   assert(matcher.matches(typo,candidates),mode+' rejected obvious transposition '+JSON.stringify(typo)+' for '+answer);
   spellingChecks++;
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
assert(total>=2179,'Expected original 2,179 cases; audit newly added cases as well');
assert.equal(matcher.matches('Taman Negara',['Taman Negara National Park',...(aliases['Taman Negara National Park']||[])]),true);
assert.equal(matcher.matches('Yellowstone',['Yellowstone National Park',...(aliases['Yellowstone National Park']||[])]),true);
for(const guess of ['National Park','Taman','a park','the mountain','yellow','not Yellowstone']){
 assert.equal(matcher.matches(guess,['Yellowstone National Park',...(aliases['Yellowstone National Park']||[])]),false,'Overbroad Yellowstone match: '+guess);
}
assert.equal(matcher.matches('the movie Gravity',['Gravity film']),true);
assert.equal(matcher.matches('the book Dracula',['Dracula novel']),true);
assert.equal(matcher.matches('the movie Gravity',['Gravity']),false);
assert.equal(matcher.matches('the movie Parasite',['Parasite film']),true);
assert.equal(matcher.matches('the book Dracula',['Dracula']),false);
assert.equal(matcher.matches('I guess World War III',['World War II']),false);
assert.equal(matcher.matches('World War III',['World War II']),false);
assert.equal(matcher.matches('2009 Financial Crisis',['2008 Financial Crisis']),false);
console.log(JSON.stringify({casesAudited:total,alternateFormattingChecks:accepted,obviousTypoChecks:spellingChecks,casesWithExplicitCuratedOrCaseAliases:explicit,casesWithoutExplicitSemanticAliases:total-explicit,knownAmbiguousAnswerPairs:[...collisions],newCollisions:0,note:'Verified translations and nicknames must be curated; lack of an alias is not itself an error.'},null,2));
