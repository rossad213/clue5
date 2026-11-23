'use strict';
const {parseResult,tiles}=require('./result-data.cjs');
const ORIGIN='https://clue5.io';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
module.exports=async function resultHandler(req,res){
 if(req.method!=='GET'&&req.method!=='HEAD'){res.setHeader('Allow','GET, HEAD');return res.status(405).end()}
 const encoded=typeof req.query?.r==='string'?req.query.r:'';
 const x=parseResult(encoded);
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Cache-Control','public, max-age=300, s-maxage=3600');
 res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 res.setHeader('Content-Security-Policy',"default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
 if(!x)return res.status(404).end('<!doctype html><meta name="robots" content="noindex"><title>Clue5 Result Not Found</title><p>Invalid or unavailable Clue5 result. <a href="https://clue5.io">Play Clue5</a>.</p>');
 const status=x.won?'CASE SOLVED':'CASE CLOSED';
 const type=x.daily?'Daily':'Practice';
 const summary=x.won?`${x.score} pts • ${x.level}`:`UNSOLVED • ${x.score} pts`;
 const title=`CLUE5 ${type} • ${x.day} • ${status}`;
 const description=`${tiles(x)} — ${summary} • ${x.used}/6 incorrect guesses.${x.daily&&x.streak!==null?' Daily win streak: '+x.streak+'.':''} Can you crack it faster? Five clues. One mystery.`;
 const shareUrl=`${ORIGIN}/result?r=${encoded}`;
 const imageUrl=`${ORIGIN}/api/result-image?r=${encoded}`;
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
 <title>${esc(title)}</title><meta name="description" content="${esc(description)}">
 <meta name="robots" content="noindex,follow">
 <link rel="canonical" href="${esc(shareUrl)}">
 <meta property="og:type" content="website"><meta property="og:site_name" content="Clue5"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(shareUrl)}">
 <meta property="og:image" content="${esc(imageUrl)}"><meta property="og:image:secure_url" content="${esc(imageUrl)}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Spoiler-free Clue5 ${esc(type)} case result">
 <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(imageUrl)}">
 <style>*{box-sizing:border-box}body{margin:0;background:#110b09;color:#fff1df;font:16px system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:grid;place-items:center;padding:20px}main{width:min(100%,780px)}section{border:2px solid #bf7a32;border-radius:29px;padding:36px;background:linear-gradient(120deg,#412012,#1b0f0b 65%,#2d170e);box-shadow:0 18px 70px #0008}header{display:flex;align-items:center;gap:16px;margin-bottom:12px}header img{width:76px;height:76px;border-radius:15px}h1{font-size:clamp(30px,6vw,50px);margin:0;line-height:1.1}small{color:#e4c2a1;font-size:17px}.tiles{font-size:clamp(27px,5vw,46px);letter-spacing:3px;margin:24px 0}.status{font-size:clamp(24px,5vw,38px);font-weight:850}.score{color:#ffc753;font-size:clamp(20px,4vw,29px);font-weight:700;margin:14px 0}.guesses{color:#e3d6cb;font-size:20px;margin:12px 0 30px}a.play{display:inline-block;border-radius:22px;background:#eda925;padding:15px 26px;color:#220f06;text-decoration:none;font-weight:800;font-size:19px}footer{color:#bd9d83;font-size:12px;padding:17px 3px;text-align:center}a.play:focus-visible{outline:3px solid white;outline-offset:4px}</style></head>
 <body><main><section><header><img src="/favicon.png" alt="Clue5 folder logo"><div><h1>CLUE5</h1><small>${esc(type)} • ${esc(x.day)}</small></div></header><div class="tiles" aria-label="Five-clue result">${tiles(x)}</div><div class="status">${status}</div><div class="score">${esc(summary)}</div><div class="guesses">${x.used}/6 incorrect guesses${x.daily&&x.streak!==null?' • Daily win streak: '+x.streak:''}</div><p>CAN YOU CRACK IT FASTER?</p><a class="play" href="https://clue5.io">Play Clue5 →</a></section><footer>Player-shared result • Not independently verified • The answer is never displayed</footer></main></body></html>`;
 return res.status(200).end(req.method==='HEAD'?'':html);
};
