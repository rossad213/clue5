const handler=require('./daily');
const pool=require('../server/daily-pool.cjs');
function call(method,body){
 return new Promise(resolve=>{
  const res={statusCode:200,setHeader(){},end(data){let result;try{result=JSON.parse(data);}catch{result={error:String(data)}}resolve({status:this.statusCode,data:result});}};
  Promise.resolve(handler({method,body},res)).catch(error=>resolve({status:500,error:error.message}));
 });
}
module.exports=async function(req,res){
 if(req.method!=='GET'){res.statusCode=405;return res.end('Method not allowed');}
 try{
  const initial=await call('GET');
  const caseData=pool.find(c=>c[2][0]===initial.data?.clues?.[0]);
  const restored=await call('POST',{action:'restore',token:initial.data.token});
  const revealed=await call('POST',{action:'reveal',token:restored.data.token});
  const wrong=await call('POST',{action:'guess',token:revealed.data.token,guess:'___not_an_answer___'});
  const solved=await call('POST',{action:'guess',token:initial.data.token,guess:caseData?.[0]});
  const closed=await call('POST',{action:'giveup',token:initial.data.token});
  const bad=await call('POST',{action:'restore',token:'tampered'});
  const tests={dailyAvailable:initial.status===200&&initial.data.answer===null,restore:restored.status===200&&restored.data.clue===1,reveal:revealed.data?.clue===2&&revealed.data.clues.length===2,wrongGuess:wrong.data?.used===1&&!wrong.data?.done,correctGuess:solved.data?.done&&solved.data?.won&&solved.data.score===100&&solved.data.answer===caseData?.[0],giveUp:closed.data?.done&&!closed.data?.won&&typeof closed.data.answer==='string',rejectTampered:bad.status!==200};
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
  res.end(JSON.stringify({ok:Object.values(tests).every(Boolean),tests}));
 }catch(error){res.statusCode=500;res.end(JSON.stringify({ok:false,error:error.message}));}
};
