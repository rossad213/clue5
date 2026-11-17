// Shared spoiler guard for every Clue5 puzzle surface.
// Never serve a case when any clue contains its answer or an accepted alias.
// Matching is word-boundary aware, case/accent/punctuation insensitive.
(function(root){
  'use strict';
  function words(text){return String(text??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');}
  function phrases(caseFile,aliases){
    const answer=caseFile[0],category=caseFile[1];
    const variants=[answer,...(Array.isArray(caseFile[3])?caseFile[3]:[]),...(aliases?.[answer]||[])];
    if(category==='Person'||category==='People'){
      const name=words(answer).split(' ');
      if(name.length>=2&&name.at(-1).length>=5)variants.push(name.at(-1));
    }
    const set=new Set();
    for(const variant of variants){
      const s=words(variant);
      if(!s)continue;
      for(const v of [s,s.replace(/^(the|an|a) /,'')]){
        if(v&&(/\d/.test(v)?v.length>=2:v.replace(/ /g,'').length>=3))set.add(v);
      }
    }
    return [...set];
  }
  function leaks(caseFile,aliases){
    if(!Array.isArray(caseFile)||typeof caseFile[0]!=='string'||!Array.isArray(caseFile[2])||caseFile[2].length!==5)return true;
    const forbidden=phrases(caseFile,aliases);
    return caseFile[2].some(clue=>{
      if(typeof clue!=='string'||!clue.trim())return true;
      const text=' '+words(clue)+' ';
      return forbidden.some(phrase=>text.includes(' '+phrase+' '));
    });
  }
  function clean(pool,aliases){return pool.filter(c=>!leaks(c,aliases));}
  const api={words,phrases,leaks,clean};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.CLUE5_SPOILER_GUARD=api;
})(typeof globalThis!=='undefined'?globalThis:this);
