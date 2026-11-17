// Same secure daily-case endpoint as the main Clue5 site.
const MAIN='https://clue-five-wheat.vercel.app';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Unsupported request'});
 if(req.method==='POST'&&JSON.stringify(req.body||{}).length>5500)return res.status(413).json({error:'Payload too large'});
 try{
  const upstream=await fetch(MAIN+'/api/daily',{method:req.method,headers:req.method==='POST'?{'Content-Type':'application/json'}:{},body:req.method==='POST'?JSON.stringify(req.body||{}):undefined,cache:'no-store'});
  const json=await upstream.json();
  return res.status(upstream.status).json(json);
 }catch{return res.status(502).json({error:'Daily service unavailable'});}
}
