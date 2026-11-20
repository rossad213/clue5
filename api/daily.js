'use strict';
const crypto=require('node:crypto');
const baseCases=require('../server/daily-pool.cjs');
const expansionCases=require('../server/daily-expansion.cjs');
const cases=[...baseCases,...expansionCases];
const answerAliases=require('../assets/answer-aliases.js');
const spoilerGuard=require('../assets/clue-safety.js');
const answerMatch=require('../assets/answer-match.js');
// Preserve all published Daily assignments through November 19, 2026.
// Introduce the new bank starting November 20, so players see new material
// without reshuffling previously published cases or archived sessions.
const baseSafeCases=spoilerGuard.clean(baseCases,answerAliases);
const expansionSafeCases=spoilerGuard.clean(expansionCases,answerAliases);
const secret=process.env.CLUE5_DAILY_SECRET;
const START='2026-11-15';
const EXPANSION_START='2026-11-20';
const validDay=(day,today)=>typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&day>=START&&day<=today&&new Date(day+'T12:00:00Z').toISOString().slice(0,10)===day;
const n=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const signed=s=>crypto.createHmac('sha256',secret).update(s).digest();
const dateKey=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const ordinal=s=>{const [y,m,d]=s.split('-').map(Number);return Math.floor(Date.UTC(y,m-1,d)/86400000)};
function schedule(pool){
 const categories=[...new Set(pool.map(c=>c[1]==='Person'?'People':c[1]==='Place'?'Geography':c[1]==='Event'?'History & Events':c[1]))];
 const buckets=Object.fromEntries(categories.map(g=>[g,[]]));
 for(const c of pool){let g=c[1]==='Person'?'People':c[1]==='Place'?'Geography':c[1]==='Event'?'History & Events':c[1];if(buckets[g])buckets[g].push(c);}
 for(const g of categories)buckets[g].sort((a,b)=>Buffer.compare(signed('case:'+a[0]),signed('case:'+b[0])));
 const quota=Object.fromEntries(categories.map(g=>[g,pool.length*buckets[g].length/pool.length]));
 const count=Object.fromEntries(categories.map(g=>[g,0]));
 const seq=[],recent=[];
 while(seq.length<pool.length){
  let eligible=categories.filter(g=>count[g]<buckets[g].length&&!recent.slice(-4).includes(g));
  if(!eligible.length)eligible=categories.filter(g=>count[g]<buckets[g].length);
  eligible.sort((a,b)=>(count[a]+0.5)/quota[a]-(count[b]+0.5)/quota[b]||a.localeCompare(b));
  if(!eligible.length)break;
  const g=eligible[0];seq.push(buckets[g][count[g]++]);recent.push(g);
 }
 return seq;
}
let baseOrder,futureOrder;
function select(day){
 if(!baseOrder)baseOrder=schedule(baseSafeCases);
 if(!baseOrder.length)throw new Error('Empty base daily schedule');
 if(day<EXPANSION_START){
  const offset=ordinal(day)-ordinal(START);
  return baseOrder[((offset%baseOrder.length)+baseOrder.length)%baseOrder.length];
 }
 if(!futureOrder)futureOrder=[...schedule(expansionSafeCases),...baseOrder];
 const offset=ordinal(day)-ordinal(EXPANSION_START);
 return futureOrder[((offset%futureOrder.length)+futureOrder.length)%futureOrder.length];
}
function encrypt(obj){
 const iv=crypto.randomBytes(12),key=crypto.createHash('sha256').update(secret).digest(),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
 const body=Buffer.concat([cipher.update(JSON.stringify(obj)),cipher.final()]);
 return Buffer.concat([iv,cipher.getAuthTag(),body]).toString('base64url');
}
function decrypt(value){
 const data=Buffer.from(String(value||''),'base64url');if(data.length<30||data.length>3000)throw new Error('Invalid session');
 const key=crypto.createHash('sha256').update(secret).digest(),dec=crypto.createDecipheriv('aes-256-gcm',key,data.subarray(0,12));dec.setAuthTag(data.subarray(12,28));
 return JSON.parse(Buffer.concat([dec.update(data.subarray(28)),dec.final()]).toString('utf8'));
}
function match(guess,c){
 const q=n(guess);if(!q)return false;
 const options=[c[0],...(c[3]||[]),...(answerAliases[c[0]]||[])];const plain=c[0].replace(/^(the|a|an)\s+/i,'');if(plain!==c[0])options.push(plain);
 if(c[1]==='People'||c[1]==='Person'){
  const words=c[0].split(/\s+/);const last=words[words.length-1];
  if(last.length>=5&&!cases.some(x=>x!==c&&(x[1]==='People'||x[1]==='Person')&&x[0].split(/\s+/).at(-1).toLowerCase()===last.toLowerCase()))options.push(last);
 }
 return answerMatch.matches(guess,options);
}
function hint(answer){
 const label=answer.replace(/^(the|a|an)\s+/i,'').replace(/[^a-zA-Z0-9\s-]/g,' ').trim(),words=label.split(/\s+/).filter(Boolean);
 const initials=words.map(w=>w[0].toUpperCase()).join(' · ');
 return words.length===1?'Final evidence: The name begins with '+initials+' and has '+label.replace(/[^a-zA-Z0-9]/g,'').length+' letters.':'Final evidence: The answer has '+words.length+' words, with initials '+initials+'.';
}
function cluesFor(c){return c[2].slice();}
// Display-specific subcategories. Preserve the stored category for stable daily scheduling.
const categoryGroups={"Paintings & Art":["The Starry Night","The Last Supper","Girl with a Pearl Earring","Guernica","American Gothic","The Birth of Venus","The Thinker","The Kiss by Klimt"],"Classical Music":["Beethoven's Fifth Symphony","Beethoven's Ninth Symphony","The Four Seasons"],"Books & Literature":["Romeo and Juliet","Hamlet","Othello","Frankenstein novel","Moby-Dick","The Great Gatsby","To Kill a Mockingbird","1984 novel","Fahrenheit 451","The Catcher in the Rye","The Hobbit","The Hunger Games","The Lion the Witch and the Wardrobe","Alice's Adventures in Wonderland"],"Fictional Characters":["Sherlock Holmes","Hercule Poirot","Miss Marple","Black Panther","Iron Man","Captain America","Thor","Hulk"],"Movie Characters":["Indiana Jones","Yoda","R2-D2","E.T. the Extra-Terrestrial"],"Movies":["Jurassic Park","Jaws","Titanic film","The Matrix","Inception","Interstellar","Back to the Future","The Sound of Music","The Godfather","Pulp Fiction","Forrest Gump"],"Musicians & Bands":["The Rolling Stones","Queen band","Elvis Presley","Whitney Houston","Aretha Franklin","Madonna","Lady Gaga","Kendrick Lamar"]};
const categoryLabels=Object.fromEntries(Object.entries(categoryGroups).flatMap(([group,names])=>names.map(name=>[name,group])));
function displayCategory(c){return categoryLabels[c[0]]||c[1];}
function answerObj(session,c){
 const complete=session.done;
 return {day:session.day,category:displayCategory(c),caseLabel:'DAILY DOSSIER',clue:session.clue,used:session.used,done:complete,won:session.won,score:session.score,clues:cluesFor(c).slice(0,session.clue),answer:complete?c[0]:null,playedOn:complete?(session.playedOn||session.day):null,late:complete&&(session.playedOn||session.day)!==session.day,token:encrypt(session)};
}
function respond(res,status,obj){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store, private, max-age=0');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(obj));}
module.exports=async function handler(req,res){
 if(!secret||secret.length<32)return respond(res,503,{error:'Daily puzzles not configured'});
 if(req.method!=='GET'&&req.method!=='POST')return respond(res,405,{error:'Method not allowed'});
 try{
  const today=dateKey();let session;
  if(req.method==='GET'){
   const day=String(req.query?.day||today);
   if(!validDay(day,today))return respond(res,400,{error:'Archived cases are available only from launch through today'});
   session={day,clue:1,used:0,done:false,won:false,score:0};
  }
  else{
   const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
   if(!['restore','guess','reveal','giveup'].includes(body.action))return respond(res,400,{error:'Unknown action'});
   session=decrypt(body.token);
   const wasDone=!!session?.done;
   if(!session||!validDay(session.day,today)||!Number.isInteger(session.clue)||session.clue<1||session.clue>5||!Number.isInteger(session.used)||session.used<0||session.used>6||typeof session.done!=='boolean')return respond(res,409,{error:'Session unavailable for this date'});
   if(!session.done){
    if(body.action==='guess'){
      if(typeof body.guess!=='string'||body.guess.length<1||body.guess.length>80)return respond(res,400,{error:'Enter a guess up to 80 characters'});
      if(match(body.guess,select(session.day))){session.done=true;session.won=true;session.score=120-session.clue*20;}
      else{session.used++;if(session.used>=6){session.done=true;session.won=false;session.score=0;}}
    }else if(body.action==='reveal'){session.clue=Math.min(5,session.clue+1);}
    else if(body.action==='giveup'){session.done=true;session.won=false;session.score=0;}
   }
   if(session.done&&!session.playedOn)session.playedOn=wasDone?session.day:today;
  }
  return respond(res,200,answerObj(session,select(session.day)));
 }catch(err){return respond(res,400,{error:'Invalid or expired daily session. Refresh to begin a new session.'});}
};
