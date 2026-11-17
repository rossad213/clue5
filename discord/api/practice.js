// Select from the main Clue5's PUBLIC, spoiler-free practice pool; never access reserved daily cases.
import spoilerGuard from '../lib/clue-safety.cjs';
import answerAliases from '../lib/answer-aliases.cjs';
let cache=null,loaded=0;
async function pool(){
 if(cache&&Date.now()-loaded<600000)return cache;
 const r=await fetch('https://clue-five-wheat.vercel.app/data/practice.js');
 if(!r.ok)throw Error('Practice archive unavailable');
 const s=await r.text(),start=s.indexOf('.concat(');
 if(start<0)throw Error('Practice format not recognized');
 const array=s.slice(start+8).trim().replace(/\);\s*$/,'');
 const parsed=JSON.parse(array).filter(c=>Array.isArray(c)&&typeof c[0]==='string'&&Array.isArray(c[2])&&c[2].length===5);
 cache=spoilerGuard.clean(parsed,answerAliases);loaded=Date.now();return cache;
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'GET required'});
 try{
  const items=await pool();
  const n=Number(req.query?.exclude);
  let eligible=items.filter((_,i)=>i!==n);if(!eligible.length)eligible=items;
  const chosen=eligible[Math.floor(Math.random()*eligible.length)];
  return res.status(200).json({id:items.indexOf(chosen),answer:chosen[0],category:chosen[1],clues:chosen[2],aliases:chosen[3]||[]});
 }catch(err){return res.status(503).json({error:err.message});}
}
