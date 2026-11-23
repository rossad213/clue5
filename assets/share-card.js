/* Clue5 spoiler-free result card. Uses the game's completed result, never the answer. */
(()=>{
'use strict';
const URL='https://clue5.io';
const RANK=['','LEGENDARY','MASTER','SENIOR','DETECTIVE','ROOKIE'];
function level(s){return s.won?(RANK[Math.min(5,Math.max(1,Number(s.clue)||5))]||'DETECTIVE'):'UNSOLVED'}
const squareColors={yellow:['#ffe37c','#f5b500'],green:['#4ff55b','#087d17'],black:['#353535','#070707']};
function text(ctx,str,x,y,size=32,color='#f7f0e7',weight=600){
  ctx.font=weight+' '+size+'px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  ctx.fillStyle=color;ctx.fillText(String(str),x,y);
}
function roundRect(ctx,x,y,w,h,r){
  const a=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+a,y);
  ctx.arcTo(x+w,y,x+w,y+h,a);ctx.arcTo(x+w,y+h,x,y+h,a);
  ctx.arcTo(x,y+h,x,y,a);ctx.arcTo(x,y,x+w,y,a);ctx.closePath();
}
function logo(){
 return new Promise(resolve=>{
  const img=new Image();
  img.onload=()=>resolve(img);
  img.onerror=()=>resolve(null);
  img.src='/favicon.png';
 });
}
async function render(s){
 const W=1600,H=570,canvas=document.createElement('canvas');
 canvas.width=W;canvas.height=H;
 const c=canvas.getContext('2d');
 c.clearRect(0,0,W,H);
 // Broad, mobile-friendly message shape without decorative clutter.
 roundRect(c,18,18,W-36,H-36,66);
 const bg=c.createLinearGradient(18,18,W,H);
 bg.addColorStop(0,'#422012');bg.addColorStop(.45,'#190e0c');bg.addColorStop(1,'#2c160e');
 c.fillStyle=bg;c.fill();
 c.lineWidth=5;c.strokeStyle='#d68e3f';c.stroke();
 c.save();roundRect(c,22,22,W-44,H-44,61);c.clip();
 const glow=c.createRadialGradient(260,260,0,260,260,500);
 glow.addColorStop(0,'rgba(255,155,27,.17)');glow.addColorStop(1,'rgba(255,155,27,0)');
 c.fillStyle=glow;c.fillRect(20,20,W-40,H-40);
 c.restore();
 const icon=await logo();
 if(icon){
  roundRect(c,68,99,365,365,32);c.fillStyle='#25110b';c.fill();
  c.strokeStyle='#a3672a';c.lineWidth=3;c.stroke();
  c.save();roundRect(c,80,111,341,341,22);c.clip();
  c.drawImage(icon,80,111,341,341);c.restore();
 }else{
  text(c,'CLUE',98,283,64,'#fff0ce',800);text(c,'5',286,370,118,'#ffc13c',900);
 }
 c.fillStyle='rgba(229,174,97,.6)';c.fillRect(479,100,3,364);
 const left=530;
 text(c,'CLUE5',left,132,79,'#fff6e9',900);
 text(c,(s.daily?'Daily':'Practice')+'  •  '+(s.day||''),left+440,126,42,'#e3cbb2',500);
 c.fillStyle='#edb44f';c.fillRect(left+5,152,278,5);
 const clue=Math.max(0,Math.min(5,Number(s.clue)||0));
 for(let i=0;i<5;i++){
  const status=i>=clue?'black':(s.won&&i===clue-1?'green':'yellow');
  const x=left+i*118,y=195,w=96,h=96;
  roundRect(c,x,y,w,h,16);
  const grad=c.createLinearGradient(0,y,0,y+h);
  grad.addColorStop(0,squareColors[status][0]);grad.addColorStop(1,squareColors[status][1]);
  c.fillStyle=grad;c.fill();c.lineWidth=3;c.strokeStyle=status==='black'?'#555':'#f7da82';c.stroke();
 }
 text(c,s.won?'🏆 CASE SOLVED':'CASE CLOSED',left+634,275,48,s.won?'#ffe2a0':'#eee0cd',800);
 const points=Number.isFinite(Number(s.score))?Math.max(0,Math.round(Number(s.score))):0;
 text(c,points+' pts',left,371,53,'#fff4e3',750);
 text(c,'•',left+245,369,42,'#cf974d',600);
 text(c,level(s),left+296,370,52,'#ffca49',850);
 text(c,'•',left+585,369,42,'#cf974d',600);
 text(c,Math.max(0,Math.min(6,Number(s.used)||0))+'/6 incorrect guesses',left+640,368,36,'#f5e7d5',500);
 c.fillStyle='rgba(217,156,72,.6)';c.fillRect(left,412,995,2);
 text(c,'Play at '+URL,left+20,480,44,'#fff8e9',750);
 const dataURL=canvas.toDataURL('image/png');
 return {canvas,dataURL,blob:await new Promise(ok=>canvas.toBlob(ok,'image/png'))};
}
function resultLink(s){
 const payload={
  d:String(s.day||''),
  w:Boolean(s.won),t:Boolean(s.daily),
  c:Number(s.clue),u:Number(s.used),p:Number(s.score)
 };
 // Only public spoiler-free result values; never include the case answer or session token.
 const encoded=btoa(JSON.stringify(payload)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
 return URL+'/result?r='+encoded;
}
async function share(s){
 const url=resultLink(s);
 // Prioritize the device's native sharing options, preserving rich URL previews.
 if(typeof navigator.share==='function'){
  try{await navigator.share({title:'Clue5 Case Report',url});return 'shared'}
  catch(error){if(error?.name==='AbortError')return 'cancelled';console.warn('Native share failed',error)}
 }
 // Copy Link fallback for unsupported devices and failed native shares.
 if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){
  try{await navigator.clipboard.writeText(url);return 'copied-link'}
  catch(error){console.warn('Copy Link failed',error)}
 }
 return {manual:url};
}
window.Clue5ShareCard={render,share,resultLink,url:URL};
})();
