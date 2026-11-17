'use strict';
// Shared compact, public, spoiler-free result payload used by result pages and previews.
// These are player-shared claims, not authenticated server-verifiable scores.
function parseResult(input){
  try{
    if(typeof input!=='string'||input.length>450||!/^[A-Za-z0-9_-]+$/.test(input))return null;
    const json=Buffer.from(input,'base64url').toString('utf8');
    if(json.length>350)return null;
    const x=JSON.parse(json);
    const d=String(x.d||'');
    if(!/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(d)||Number.isNaN(Date.parse(d+'T00:00:00Z')))return null;
    if(typeof x.w!=='boolean'||typeof x.t!=='boolean')return null;
    const clue=Number(x.c),used=Number(x.u),score=Number(x.p);
    if(!Number.isInteger(clue)||clue<1||clue>5||!Number.isInteger(used)||used<0||used>6||!Number.isInteger(score)||score<0||score>100)return null;
    if(x.w&&(score!==(120-clue*20)||used>=6))return null;
    if(!x.w&&score!==0)return null;
    return {day:d,won:x.w,daily:x.t,clue,used,score,level:x.w?(['','LEGENDARY','MASTER','SENIOR','DETECTIVE','ROOKIE'][clue]):'UNSOLVED'};
  }catch{return null}
}
function tiles(x){return Array.from({length:5},(_,i)=>i>=x.clue?'⬛':x.won&&i===x.clue-1?'🟩':'🟨').join('')}
module.exports={parseResult,tiles};
