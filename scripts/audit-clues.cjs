#!/usr/bin/env node
// Clue5 editorial audit. Run: node scripts/audit-clues.cjs
// Only Node built-ins; checks case structure, exact repetition, and near-duplicates.
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const files=fs.readdirSync(path.join(__dirname,"..","data")).filter(x=>x.endsWith(".js")).sort();
const sandbox={window:{CLUE5_ADDITIONS:[]}};
for(const file of files)vm.runInNewContext(fs.readFileSync(path.join(__dirname,"..","data",file),"utf8"),sandbox,{filename:file});
const cases=sandbox.window.CLUE5_ADDITIONS;
const normalize=s=>s.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const stop=new Set("i me my mine we our the a an is are was were be being been to of for and or but at in on from with by as this that these those who where when which what how it its them their than most more many some only not one into across through among".split(" "));
const words=s=>new Set(normalize(s).split(" ").filter(x=>x.length>2&&!stop.has(x)));
const seenAnswers=new Map(),seenClues=new Map(),errors=[],near=[];
for(const c of cases){
 if(!Array.isArray(c)||c.length<3||typeof c[0]!=="string"||!Array.isArray(c[2])||c[2].length!==5){
 errors.push("Invalid five-clue structure: "+JSON.stringify(c)?.slice(0,100));continue;
 }
 const answer=normalize(c[0]);
 if(seenAnswers.has(answer))errors.push("Duplicate answer: "+c[0]);
 seenAnswers.set(answer,true);
 c[2].forEach((clue,index)=>{
   if(typeof clue!=="string"||clue.length<20){errors.push("Short/invalid clue "+c[0]+" clue "+(index+1));return}
   const k=normalize(clue);
   const others=seenClues.get(k)||[];
   for(const other of others)errors.push("Identical clue: "+c[0]+" / "+other+" — "+clue);
   others.push(c[0]);seenClues.set(k,others);
 });
}
for(let level=0;level<5;level++){
 const arr=cases.map(c=>({name:c[0],clue:c[2][level],tokens:words(c[2][level])}));
 for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){
  const a=arr[i],b=arr[j];if(a.tokens.size<3||b.tokens.size<3)continue;
  let overlap=0;for(const word of a.tokens)if(b.tokens.has(word))overlap++;
  const ratio=overlap/Math.max(a.tokens.size,b.tokens.size);
  if(ratio>=0.8 && normalize(a.clue)!==normalize(b.clue))near.push({level:level+1,ratio:+ratio.toFixed(2),a:a.name,b:b.name,clueA:a.clue,clueB:b.clue});
 }
}
console.log("Clue5 editorial audit | "+cases.length+" additional cases | "+files.length+" data modules");
console.log("Exact duplicate/structural issues: "+errors.length);
errors.slice(0,40).forEach(x=>console.log("ERROR: "+x));
console.log("Near-identical clue pairs for editorial review: "+near.length);
near.slice(0,25).forEach(x=>console.log("REVIEW clue "+x.level+" ("+x.ratio+"): "+x.a+" vs "+x.b+" | "+x.clueA+" / "+x.clueB));
if(errors.length)process.exitCode=1;
