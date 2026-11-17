'use strict';
const zlib=require('node:zlib');
const {parseResult}=require('./result-data.cjs');
const W=1200,H=630;
const FONT={
'A':['01110','10001','10001','11111','10001','10001','10001'],
'B':['11110','10001','10001','11110','10001','10001','11110'],
'C':['01111','10000','10000','10000','10000','10000','01111'],
'D':['11110','10001','10001','10001','10001','10001','11110'],
'E':['11111','10000','10000','11110','10000','10000','11111'],
'F':['11111','10000','10000','11110','10000','10000','10000'],
'G':['01111','10000','10000','10111','10001','10001','01111'],
'H':['10001','10001','10001','11111','10001','10001','10001'],
'I':['11111','00100','00100','00100','00100','00100','11111'],
'J':['00111','00010','00010','00010','10010','10010','01100'],
'K':['10001','10010','10100','11000','10100','10010','10001'],
'L':['10000','10000','10000','10000','10000','10000','11111'],
'M':['10001','11011','10101','10101','10001','10001','10001'],
'N':['10001','11001','10101','10011','10001','10001','10001'],
'O':['01110','10001','10001','10001','10001','10001','01110'],
'P':['11110','10001','10001','11110','10000','10000','10000'],
'Q':['01110','10001','10001','10001','10101','10010','01101'],
'R':['11110','10001','10001','11110','10100','10010','10001'],
'S':['01111','10000','10000','01110','00001','00001','11110'],
'T':['11111','00100','00100','00100','00100','00100','00100'],
'U':['10001','10001','10001','10001','10001','10001','01110'],
'V':['10001','10001','10001','10001','10001','01010','00100'],
'W':['10001','10001','10001','10101','10101','10101','01010'],
'X':['10001','10001','01010','00100','01010','10001','10001'],
'Y':['10001','10001','01010','00100','00100','00100','00100'],
'Z':['11111','00001','00010','00100','01000','10000','11111'],
'0':['01110','10001','10011','10101','11001','10001','01110'],
'1':['00100','01100','00100','00100','00100','00100','01110'],
'2':['01110','10001','00001','00010','00100','01000','11111'],
'3':['11110','00001','00001','01110','00001','00001','11110'],
'4':['00010','00110','01010','10010','11111','00010','00010'],
'5':['11111','10000','10000','11110','00001','00001','11110'],
'6':['01111','10000','10000','11110','10001','10001','01110'],
'7':['11111','00001','00010','00100','01000','01000','01000'],
'8':['01110','10001','10001','01110','10001','10001','01110'],
'9':['01110','10001','10001','01111','00001','00001','11110'],
'-':['00000','00000','00000','11111','00000','00000','00000'],
'/':['00001','00001','00010','00100','01000','10000','10000'],
'.':['00000','00000','00000','00000','00000','01100','01100'],
':':['00000','01100','01100','00000','01100','01100','00000'],
' ':['00000','00000','00000','00000','00000','00000','00000']
};
const clamp=n=>Math.max(0,Math.min(255,n|0));
function crc32(b){let c=0xffffffff;for(const byte of b){c^=byte;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function chunk(type,data){const n=Buffer.alloc(4);n.writeUInt32BE(data.length);const key=Buffer.from(type);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([key,data])));return Buffer.concat([n,key,data,crc])}
function image(x){
 const pixels=Buffer.alloc(W*H*4);
 const put=(px,py,c)=>{if(px<0||py<0||px>=W||py>=H)return;const i=(py*W+px)*4;pixels[i]=c[0];pixels[i+1]=c[1];pixels[i+2]=c[2];pixels[i+3]=255};
 const rect=(ax,ay,w,h,c)=>{for(let py=Math.max(0,ay);py<Math.min(H,ay+h);py++)for(let px=Math.max(0,ax);px<Math.min(W,ax+w);px++)put(px,py,c)};
 const rounded=(ax,ay,w,h,r,c)=>{for(let py=Math.max(0,ay);py<Math.min(H,ay+h);py++)for(let px=Math.max(0,ax);px<Math.min(W,ax+w);px++){let dx=0,dy=0;if(px<ax+r)dx=ax+r-px;else if(px>=ax+w-r)dx=px-(ax+w-r-1);if(py<ay+r)dy=ay+r-py;else if(py>=ay+h-r)dy=py-(ay+h-r-1);if(dx*dx+dy*dy<=r*r)put(px,py,c)}};
 const draw=(str,px,py,scale,color,max=Infinity)=>{
  let width=0;for(const ch of String(str).toUpperCase()){if(width+6*scale>max)break;const a=FONT[ch]||FONT[' '];for(let row=0;row<7;row++)for(let col=0;col<5;col++)if(a[row][col]==='1')rect(px+width+col*scale,py+row*scale,scale,scale,color);width+=6*scale;}return width
 };
 // Rich espresso-colored background with warm diagonal glow.
 for(let y=0;y<H;y++)for(let px=0;px<W;px++){
  const glow=Math.max(0,1-Math.hypot(px-130,y-170)/750);
  put(px,y,[clamp(19+35*glow+px/W*9),clamp(11+11*glow),clamp(11+4*glow)]);
 }
 rounded(20,20,1160,590,48,[179,113,44]);rounded(25,25,1150,580,44,[31,16,12]);
 rounded(75,109,254,322,29,[150,90,31]);rounded(81,115,242,310,26,[60,29,14]);
 // Original-inspired orange case folder and large 5
 rounded(104,191,192,171,22,[231,139,13]);
 rounded(118,179,122,34,12,[250,180,36]);
 rounded(117,204,170,145,17,[255,188,51]);
 rounded(129,218,145,117,11,[129,40,13]);
 rounded(138,227,127,99,10,[255,213,118]);
 draw('5',179,239,11,[93,23,12]);
 rect(370,110,3,320,[166,109,48]);
 draw('CLUE5',412,78,13,[255,243,218]);
 draw((x.daily?'DAILY':'PRACTICE')+'  '+x.day,413,192,6,[220,177,127]);
 const colors={yellow:[244,182,18],green:[25,178,48],black:[41,42,43]};
 for(let i=0;i<5;i++){
  let col=i>=x.clue?colors.black:x.won&&i===x.clue-1?colors.green:colors.yellow;
  rounded(413+i*103,265,85,78,12,[126,88,47]);rounded(417+i*103,269,77,70,10,col);
 }
 draw(x.won?'CASE SOLVED':'CASE CLOSED',412,392,8,[255,236,205]);
 draw(String(x.score)+' PTS  '+x.level,412,474,6,[255,196,75],750);
 draw(String(x.used)+'/6 INCORRECT GUESSES',412,525,5,[235,215,195],760);
 const raw=Buffer.alloc(H*(W*4+1));for(let y=0;y<H;y++){const dst=y*(W*4+1);raw[dst]=0;pixels.copy(raw,dst+1,y*W*4,(y+1)*W*4)}
 const header=Buffer.alloc(13);header.writeUInt32BE(W,0);header.writeUInt32BE(H,4);header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw,{level:6})),chunk('IEND',Buffer.alloc(0))])
}
module.exports=async function(req,res){
 if(req.method!=='GET'&&req.method!=='HEAD')return res.status(405).end();
 const x=parseResult(typeof req.query?.r==='string'?req.query.r:'');
 if(!x)return res.status(404).end('Result not found');
 try{
  const png=image(x);
  res.setHeader('Content-Type','image/png');
  res.setHeader('Cache-Control','public, max-age=3600, s-maxage=86400');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(200).end(req.method==='HEAD'?undefined:png);
 }catch(e){console.error('Clue5 preview rendering failed',e);return res.status(500).end('Preview not available')}
};
