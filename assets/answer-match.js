'use strict';
// Shared, conservative Clue5 answer matcher. Used by both server Daily and browser Practice.
// Accepts formatting variants, safe equivalent word forms and obvious typos.
// Unanticipated factual synonyms require review; do not guess semantic equivalence.
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.CLUE5_ANSWER_MATCH=api;
})(typeof window!=='undefined'?window:null,function(){
 function words(value){
  return String(value||'').toLowerCase().normalize('NFKD')
   .replace(/[\u0300-\u036f]/g,'')
   .replace(/&/g,' and ')
   .replace(/\bmt\.?\s+(?=[a-z])/g,'mount ')
   .replace(/\bst\.?\s+(?=[a-z])/g,'saint ')
   .replace(/\bno\.?\s+(?=\d)/g,'number ')
   .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
 }
 function key(value){return words(value).replace(/^(the|a|an) /,'').replace(/ /g,'');}
 function distance(a,b,cap){
  if(Math.abs(a.length-b.length)>cap)return false;
  let previous=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
   const row=[i];let minimum=i;
   for(let j=1;j<=b.length;j++){row[j]=Math.min(row[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));minimum=Math.min(minimum,row[j]);}
   if(minimum>cap)return false;
   previous=row;
  }
  return previous[b.length]<=cap;
 }
 function swap(a,b){
  if(a.length!==b.length||a.length<5)return false;
  let i=0;while(i<a.length&&a[i]===b[i])i++;
  return i<a.length-1&&a[i]===b[i+1]&&a[i+1]===b[i]&&a.slice(i+2)===b.slice(i+2);
 }
 // Keyword profiles are generated from every official answer and its vetted aliases.
 // Reorder complete identifying words, never match just one word or a subset.
 // Function words are ignored only for this order-independent check.
 const NOISE_WORDS=new Set(['the','a','an','of','in','on','at','for','to','and']);
 function keywordProfile(text){
  return words(text).split(' ').filter(token=>token&&!NOISE_WORDS.has(token)).sort();
 }
 function keywordMatch(guess,candidate){
  const q=keywordProfile(guess),a=keywordProfile(candidate);
  return a.length>=2&&q.length===a.length&&a.some(token=>token.length>=4)&&q.every((token,i)=>token===a[i]);
 }
 function matches(guess,candidates){
  const q=key(guess);
  if(!q)return false;
  for(const item of candidates){
   const a=key(item);
   if(!a)continue;
   if(q===a||keywordMatch(guess,item))return true;
   // Preserve Roman numeral identity, especially in wars, monarchs and sequels.
   // A one-character difference between II and III must never count as a typo.
   const romans=s=>words(s).split(' ').filter((v,i,arr)=>/^(?:ii|iii|iv|vi|vii|viii|ix|xi|xii)$/.test(v)||(/^(?:i|v|x)$/.test(v)&&i>0&&i===arr.length-1)).join('|');
   if(romans(guess)!==romans(item))continue;
   // Never fuzzy-match distinct years, dates, numbered sequels or similar numeric facts.
   if((q.match(/[0-9]+/g)||[]).join('|')!==(a.match(/[0-9]+/g)||[]).join('|'))continue;
   if(swap(q,a))return true;
   if(q.length>=6&&a.length>=6&&distance(q,a,q.length>=11&&a.length>=11?2:1))return true;
  }
  return false;
 }
 return {matches,key,words,keywordProfile};
});
