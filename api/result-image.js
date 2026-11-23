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

/* Embedded copy of the existing Clue5 folder logo. No network request or public-file dependency. */
const FOLDER_ICON=Buffer.from('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','base64');
function readIcon(png){
 let w=0,h=0,depth=0,type=0,palette=null,alpha=null,parts=[];
 for(let p=8;p<png.length;){
  const len=png.readUInt32BE(p),key=png.toString('ascii',p+4,p+8),data=png.subarray(p+8,p+8+len);
  if(key==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);depth=data[8];type=data[9];}
  if(key==='PLTE')palette=data;
  if(key==='tRNS')alpha=data;
  if(key==='IDAT')parts.push(data);
  p+=12+len;
 }
 if(depth!==8||![2,3,6].includes(type)||w>1000||h>1000||!w||!h)throw Error('Unsupported icon PNG');
 const channels=type===3?1:type===2?3:4, stride=w*channels, raw=zlib.inflateSync(Buffer.concat(parts));
 const pixels=Buffer.alloc(w*h*4),prev=Buffer.alloc(stride);let at=0;
 for(let y=0;y<h;y++){
  const filter=raw[at++],scan=Buffer.from(raw.subarray(at,at+stride));at+=stride;
  for(let i=0;i<stride;i++){
   const a=i>=channels?scan[i-channels]:0,b=prev[i],c=i>=channels?prev[i-channels]:0;
   let v=0;
   if(filter===1)v=a;else if(filter===2)v=b;else if(filter===3)v=(a+b)>>1;
   else if(filter===4){const q=a+b-c,da=Math.abs(q-a),db=Math.abs(q-b),dc=Math.abs(q-c);v=da<=db&&da<=dc?a:db<=dc?b:c;}
   else if(filter!==0)throw Error('Unsupported PNG filter');
   scan[i]=(scan[i]+v)&255;
  }
  for(let x=0;x<w;x++){
   const si=x*channels,di=(y*w+x)*4;
   if(type===3){const ix=scan[si];pixels[di]=palette[ix*3];pixels[di+1]=palette[ix*3+1];pixels[di+2]=palette[ix*3+2];pixels[di+3]=alpha&&ix<alpha.length?alpha[ix]:255;}
   else {pixels[di]=scan[si];pixels[di+1]=scan[si+1];pixels[di+2]=scan[si+2];pixels[di+3]=channels===4?scan[si+3]:255;}
  }
  scan.copy(prev);
 }
 return {w,h,pixels};
}
const BRAND_ICON=readIcon(FOLDER_ICON);

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
 // Display the real Clue5 folder artwork, preserving the existing dynamic results.
 const iconSize=224,iconX=90,iconY=159;
 const {w:iw,h:ih,pixels:ip}=BRAND_ICON;
 for(let yy=0;yy<iconSize;yy++)for(let xx=0;xx<iconSize;xx++){
  const sx=Math.min(iw-1,Math.floor(xx*iw/iconSize)),sy=Math.min(ih-1,Math.floor(yy*ih/iconSize));
  const si=(sy*iw+sx)*4,a=ip[si+3]/255;
  if(a===0)continue;
  const dx=iconX+xx,dy=iconY+yy,di=(dy*W+dx)*4;
  for(let c=0;c<3;c++)pixels[di+c]=Math.round(ip[si+c]*a+pixels[di+c]*(1-a));
  pixels[di+3]=255;
 }
 rect(370,110,3,320,[166,109,48]);


 const colors={yellow:[244,182,18],green:[25,178,48],black:[41,42,43]};
 for(let i=0;i<5;i++){
  let col=i>=x.clue?colors.black:x.won&&i===x.clue-1?colors.green:colors.yellow;
  rounded(413+i*103,265,85,78,12,[126,88,47]);rounded(417+i*103,269,77,70,10,col);
 }




 // Smooth, proportional sans-serif lettering, using compact outline-inspired strokes.
 // Draw at 3x resolution and downsample for anti-aliased text.
 const FONT_LINES={
 A:['M0 10 L5 0 L10 10','M2 6 L8 6'],
 B:['M0 0 L0 10','M0 0 L6 0 Q10 0 10 2.5 Q10 5 6 5 L0 5','M0 5 L6 5 Q10 5 10 7.5 Q10 10 6 10 L0 10'],
 C:['M10 1 Q0 -2 0 5 Q0 12 10 9'],
 D:['M0 0 L0 10 L5 10 Q10 10 10 5 Q10 0 5 0 Z'],
 E:['M10 0 L0 0 L0 10 L10 10','M0 5 L8 5'],
 F:['M0 10 L0 0 L10 0','M0 5 L8 5'],
 G:['M10 1 Q0 -2 0 5 Q0 12 10 9 L10 5 L6 5'],
 H:['M0 0 L0 10','M10 0 L10 10','M0 5 L10 5'],
 I:['M0 0 L8 0','M4 0 L4 10','M0 10 L8 10'],
 J:['M10 0 L10 7 Q10 12 3 10 Q0 9 0 7'],
 K:['M0 0 L0 10','M10 0 L0 5 L10 10'],
 L:['M0 0 L0 10 L10 10'],
 M:['M0 10 L0 0 L5 6 L10 0 L10 10'],
 N:['M0 10 L0 0 L10 10 L10 0'],
 O:['M5 0 Q10 0 10 5 Q10 10 5 10 Q0 10 0 5 Q0 0 5 0 Z'],
 P:['M0 10 L0 0 L6 0 Q10 0 10 3 Q10 6 6 6 L0 6'],
 Q:['M5 0 Q10 0 10 5 Q10 10 5 10 Q0 10 0 5 Q0 0 5 0 Z','M6 7 L11 11'],
 R:['M0 10 L0 0 L6 0 Q10 0 10 3 Q10 6 6 6 L0 6','M6 6 L10 10'],
 S:['M10 1 Q0 -2 0 3 Q0 5 5 5 Q10 5 10 7 Q10 12 0 9'],
 T:['M0 0 L10 0','M5 0 L5 10'],
 U:['M0 0 L0 7 Q0 10 5 10 Q10 10 10 7 L10 0'],
 V:['M0 0 L5 10 L10 0'],
 W:['M0 0 L2.5 10 L5 4 L7.5 10 L10 0'],
 X:['M0 0 L10 10','M10 0 L0 10'],
 Y:['M0 0 L5 5 L10 0','M5 5 L5 10'],
 Z:['M0 0 L10 0 L0 10 L10 10'],
 0:['M5 0 Q10 0 10 5 Q10 10 5 10 Q0 10 0 5 Q0 0 5 0 Z'],
 1:['M1 2 L5 0 L5 10','M1 10 L9 10'],
 2:['M0 2 Q0 0 5 0 Q10 0 10 3 Q10 5 5 7 L0 10 L10 10'],
 3:['M0 1 Q10 -2 10 3 Q10 5 5 5 Q10 5 10 8 Q10 12 0 9'],
 4:['M8 10 L8 0 L0 7 L10 7'],
 5:['M10 0 L0 0 L0 5 Q10 3 10 7 Q10 12 0 9'],
 6:['M9 0 Q0 0 0 5 Q0 10 5 10 Q10 10 10 7 Q10 4 5 4 Q0 4 0 7'],
 7:['M0 0 L10 0 L3 10'],
 8:['M5 0 Q10 0 10 2.5 Q10 5 5 5 Q0 5 0 2.5 Q0 0 5 0 Z','M5 5 Q10 5 10 7.5 Q10 10 5 10 Q0 10 0 7.5 Q0 5 5 5 Z'],
 9:['M10 5 Q10 0 5 0 Q0 0 0 3 Q0 6 5 6 Q10 6 10 3','M10 4 Q10 10 2 10'],
 '-':['M0 5 L7 5'],
 '/':['M8 0 L0 10'],
 '.':['M0 10 L1 10'],
 '?':['M0 2 Q0 0 5 0 Q10 0 10 3 Q10 5 5 7','M5 10 L5 10'],
 '!':['M5 0 L5 7','M5 10 L5 10']
 };
 const parsePath=path=>{const t=path.match(/[MLQZ]|-?[0-9]+(?:[.][0-9]+)?/g),segs=[];let i=0,x=0,y=0,startX=0,startY=0;while(i<t.length){const cmd=t[i++];if(cmd==='M'){x=Number(t[i++]);y=Number(t[i++]);startX=x;startY=y;}else if(cmd==='L'){let nx=Number(t[i++]),ny=Number(t[i++]);segs.push([x,y,nx,ny]);x=nx;y=ny;}else if(cmd==='Q'){let cx=Number(t[i++]),cy=Number(t[i++]),nx=Number(t[i++]),ny=Number(t[i++]);let px=x,py=y;for(let k=1;k<=12;k++){let a=k/12,b=1-a,tx=b*b*x+2*b*a*cx+a*a*nx,ty=b*b*y+2*b*a*cy+a*a*ny;segs.push([px,py,tx,ty]);px=tx;py=ty;}x=nx;y=ny;}else if(cmd==='Z'){segs.push([x,y,startX,startY]);x=startX;y=startY;}}return segs;};
 const pathCache={};for(const [c,paths] of Object.entries(FONT_LINES))pathCache[c]=paths.flatMap(parsePath);
 const softText=(str,x,y,size,color,maxWidth=760,weight=0.92)=>{
  const unit=size/12,spacing=size*0.20,lineWidth=unit*weight,letterWidth=unit*10+spacing;
  const text=String(str).toUpperCase();let advance=0;
  for(const ch of text){
   const cw=ch===' '?size*.38:ch==='I'?size*.92:ch==='1'?size*.78:ch==='.'?size*.24:ch==='/'?size*.65:ch==='-'?size*.65:letterWidth;
   if(advance+cw>maxWidth)break;
   const segs=pathCache[ch]||[];
   if(segs.length){
    const minX=Math.max(0,Math.floor(x+advance-lineWidth)),maxX=Math.min(W,Math.ceil(x+advance+10*unit+lineWidth));
    const minY=Math.max(0,Math.floor(y-lineWidth)),maxY=Math.min(H,Math.ceil(y+10*unit+lineWidth));
    for(let yy=minY;yy<maxY;yy++)for(let xx=minX;xx<maxX;xx++){
     let dist=1e9;const px=(xx+.5-x-advance)/unit,py=(yy+.5-y)/unit;
     for(const [ax,ay,bx,by] of segs){const dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy,t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/len)),d=Math.hypot(px-ax-t*dx,py-ay-t*dy);if(d<dist)dist=d;}
     const alpha=Math.max(0,Math.min(1,(weight/2-dist)*unit+.5));
     if(alpha>0){const idx=(yy*W+xx)*4;for(let k=0;k<3;k++)pixels[idx+k]=Math.round(color[k]*alpha+pixels[idx+k]*(1-alpha));pixels[idx+3]=255;}
    }
   }
   advance+=cw;
  }
 };
 softText('CLUE5',413,82,87,[255,243,218],750,1.10);
 softText((x.daily?'DAILY':'PRACTICE')+'  '+x.day,414,192,36,[220,177,127],760,.80);
 softText(x.won?'CASE SOLVED':'CASE CLOSED',413,393,64,[255,236,205],760,1.1);
 softText(String(x.score)+' PTS  '+x.level,413,477,42,[255,196,75],760,.95);
 softText(String(x.used)+'/6 INCORRECT GUESSES',413,536,30,[235,215,195],760,.75);

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
