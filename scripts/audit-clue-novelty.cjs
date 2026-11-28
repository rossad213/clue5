'use strict';
// Heuristic editorial report: a clue should add new, useful information.
// Low-novelty findings are review candidates, not definitive semantic judgments.
const fs=require('node:fs'),path=require('node:path');
const base=require('../server/daily-pool.cjs');
const expansion=require('../server/daily-expansion.cjs');
const source=fs.readFileSync(path.resolve(__dirname,'../data/practice.js'),'utf8');
const marker='.concat(';
if(!source.includes(marker))throw Error('Practice data format changed');
const practice=JSON.parse(source.slice(source.indexOf(marker)+marker.length).trim().replace(/\\);\\s*$/,''));
const pools=[['Daily original',base],['Daily expansion',expansion],['Unlimited',practice]];
const ignore=new Set('a an the and or but i me my mine we our ours you your yours they them their theirs it its is are was were be been being as at by for from in into on of out over to under with without about above after before between through across among which who what when where why how while though than this that these those many much most more often usually known called found used made also still only some not one two each near around both other another during centuries early later'.split(' '));
function key(w){return w.replace(/(?:ies)$/,'y').replace(/(?:ing|ed|es|s)$/,'')}
function words(s){return [...new Set(String(s).toLowerCase().normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').split(/\\s+/).filter(w=>w.length>=4&&!ignore.has(w)).map(key))]}
const flagged=[];let checked=0;
for(const [pool,records] of pools)for(const c of records){
 checked++;if(!Array.isArray(c[2])||c[2].length!==5)throw Error('Invalid clue count: '+c[0]);
 const seen=new Set(words(c[2][0]));
 for(let i=1;i<5;i++){
  const clueTokens=words(c[2][i]);const newTokens=clueTokens.filter(w=>!seen.has(w));
  // Very few distinct new content words often correlates with empty/repeated facts.
  if(newTokens.length<2)flagged.push({pool,answer:c[0],clue:i+1,newTerms:newTokens.length,text:c[2][i]});
  clueTokens.forEach(w=>seen.add(w));
 }
}
const marrakesh=expansion.find(c=>c[0]==='Marrakesh');
if(!marrakesh||!marrakesh[2][2].includes('underground irrigation'))throw Error('Marrakesh clue 3 lost its distinctive historical fact');
console.log(JSON.stringify({casesChecked:checked,cluesChecked:checked*5,editorialReviewCount:flagged.length,reviewCandidates:flagged,note:'Lexical novelty is a screening signal only; overlapping topics expressed in different words still require human review.'},null,2));
