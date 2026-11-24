'use strict';
// Lightweight site regression checks for search indexing, navigation, ad
// placement, and optional account documentation. No external calls.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const pages=['index.html','how-to-play.html','privacy.html'];
const canonical={
 'index.html':'https://clue5.io/',
 'how-to-play.html':'https://clue5.io/how-to-play.html',
 'privacy.html':'https://clue5.io/privacy.html'
};
for(const page of pages){
 const html=read(page);
 assert.match(html,/<!doctype html>/i,page+' must be HTML');
 assert.ok(html.includes('rel="canonical" href="'+canonical[page]+'"'),page+' must have an official canonical URL');
 assert.equal((html.match(/id="clue5-bottom-ad"/g)||[]).length,1,page+' must have exactly one bottom ad container');
 assert.ok(html.indexOf('id="clue5-bottom-ad"')>html.lastIndexOf('</main>'),page+' bottom ad must follow the content');
 assert.ok(html.indexOf('id="clue5-bottom-ad"')<html.lastIndexOf('<footer'),page+' bottom ad must precede the footer');
 assert.ok(html.includes('/assets/adsense-config.js')&&html.includes('/assets/adsense.js'),page+' must load configured ad scripts');
 assert.ok(html.includes('ca-pub-2407321113806809'),page+' must include site verification');
 assert.ok(!html.includes('clue-five-wheat.vercel.app'),page+' must not reference the old production URL');
}
const robots=read('robots.txt');
const sitemap=read('sitemap.xml');
assert.ok(robots.includes('Sitemap: https://clue5.io/sitemap.xml'));
assert.ok(!robots.includes('clue-five-wheat.vercel.app'));
for(const url of Object.values(canonical))assert.ok(sitemap.includes('<loc>'+url+'</loc>'),url+' missing from sitemap');
assert.ok(!sitemap.includes('vercel.app'),'Sitemap should only list the canonical domain');
const home=read('index.html');
assert.equal((home.match(/id="clue5-sidebar-ad"/g)||[]).length,1,'Single desktop sidebar ad');
assert.ok(home.includes('min-width: 1100px')||read('assets/adsense.js').includes('min-width: 1100px'),'Sidebar ad must be desktop-only');
const help=read('how-to-play.html');
assert.ok(!help.includes('Accounts and automatic cross-device sync are not yet available'),'Outdated help information');
const privacy=read('privacy.html');
assert.ok(privacy.includes('desktop game sidebar'),'Privacy text should reflect ad locations');
const config=read('assets/adsense-config.js');
assert.ok(config.includes('bottomAdSlot')&&config.includes('sidebarAdSlot'),'Expected manually configured ad placements');
console.log('Clue5 site, SEO and advertising placement audit passed');
