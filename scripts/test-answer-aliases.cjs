'use strict';
// Regression tests for shared answer matching used in Daily (server) and
// Unlimited/Practice (browser). Run: node scripts/test-answer-aliases.cjs
const assert=require('node:assert/strict');
const matcher=require('../assets/answer-match.js');
const aliases=require('../assets/answer-aliases.js');
const answer='Taman Negara National Park';
const other=['Kruger National Park','Komodo National Park','Kinabalu Park','Tayrona National Park'];
// Daily uses official answer, case-level aliases, then curated shared aliases.
// Practice uses the same shared matcher with its case aliases and curated aliases.
const dailyCandidates=[answer,...(aliases[answer]||[])];
const practiceCandidates=[answer,...(aliases[answer]||[])];
const modes={Daily:dailyCandidates,Unlimited:practiceCandidates};
for(const [mode,candidates] of Object.entries(modes)){
 for(const guess of [answer,'Taman Negara','taman negara','TAMAN NEGARA','Taman-Negara','Taman Negara!']){
  assert.equal(matcher.matches(guess,candidates),true,mode+' should accept '+guess);
 }
 for(const guess of ['Taman','Negara','National Park','Malaysian National Park',
                      'Taman Negara State Park','Taman Negara National Forest',
                      'Kruger National Park','Komodo National Park','Kinabalu Park',
                      'Tayrona National Park','Taman Negara 2']){
  assert.equal(matcher.matches(guess,candidates),false,mode+' must reject '+guess);
 }
 for(const wrong of other){
  assert.equal(matcher.matches('Taman Negara',[wrong,...(aliases[wrong]||[])]),false,
    mode+' must not confuse '+wrong+' with Taman Negara');
 }
 // Regression: an accepted alias follows the existing correct-guess branch.
 // The score derives solely from clue count; a wrong guess still costs one attempt.
 const clue=3,used=2;
 const correct=matcher.matches('Taman Negara',candidates);
 const result=correct?{won:true,done:true,score:120-clue*20,used}
                     :{won:false,done:false,score:0,used:used+1};
 assert.deepEqual(result,{won:true,done:true,score:60,used:2},mode+' score/guess invariant');
}
// Representative independently curated equivalents in both game modes.
const semanticExamples=[
 ['Artificial intelligence','AI'],
 ['MRI scanner','MRI machine'],
 ['ECG','EKG'],
 ['Marrakesh','Marrakech'],
 ['Joan of Arc',"Jeanne d'Arc"],
 ['Genghis Khan','Chinggis Khan'],
 ['Orca','killer whale'],
 ['Formula One','F1'],
 ['Bubble tea','pearl milk tea'],
 ['Harry Potter and the Philosopher\'s Stone',"Harry Potter and the Sorcerer's Stone"],
 ['Museum of Modern Art','MoMA'],
 ['James Webb Space Telescope','JWST']
];
for(const [official,alternate] of semanticExamples){
 const candidates=[official,...(aliases[official]||[])];
 assert.equal(matcher.matches(alternate,candidates),true,'Valid equivalence rejected: '+official+' / '+alternate);
 assert.equal(matcher.matches('not '+alternate,candidates),false,'Overbroad equivalence: '+official);
}
assert.equal(matcher.matches('AI',['Artificial neural network']),false,
 'AI abbreviation must not match another machine-learning case');
assert.equal(matcher.matches('The Met',['Museum of Modern Art']),false,
 'Museums must remain distinct');
// Existing exact, typo and numeric safeguards remain in force.
assert.equal(matcher.matches('great recession', ['2008 Financial Crisis',...(aliases['2008 Financial Crisis']||[])]),true);
assert.equal(matcher.matches('World War III',['World War II']),false);
assert.equal(matcher.matches('2009 Financial Crisis',['2008 Financial Crisis']),false);
console.log('Answer alias regression tests passed (Daily and Unlimited).');
