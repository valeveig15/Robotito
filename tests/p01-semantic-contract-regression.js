"use strict";
const assert=require('node:assert/strict');
const planner=require('../semantic-planner');
const {rows,expected,topics,contextFor}=require('./fixtures/p01-semantic-cases');
let cases=0,checks=0;const errors=[];
for(const [language,families] of Object.entries(rows))for(const [family,templates] of Object.entries(families))for(const template of templates){
 const text=template.replaceAll('{topic}',topics[language][0]);
 const f=planner.plan(text,{language,context:contextFor(language,family,topics[language][0])});cases++;
 for(const [key,value] of Object.entries(expected[family])){
  checks++;
  const actual=key.split(".").reduce((v,k)=>v?.[k],f);
  if(actual!==value)errors.push({language,family,text,key,want:value,actual});
 }
 if(family==='sourceExcluded'){
  checks++;if(!f.constraints?.excludedSources?.includes('classes'))errors.push({language,family,text,error:'Missing explicit source exclusion'});
 }
}
if(errors.length){console.error(JSON.stringify(errors,null,2));throw Error(errors.length+' semantic mismatches');}
// Identical references are ambiguous alone and meaningful after an authorized turn.
for(const language of Object.keys(rows)){
 const prior=planner.plan(rows[language].class[0].replace('{topic}',topics[language][0]),{language});
 let context=planner.advance(planner.createContext(),prior);
 for(const family of ['brief','detail','example']){
  const follow=planner.plan(rows[language][family][0],{language,context});
  assert.equal(follow.intent,'follow-up');assert.equal(follow.shouldExecute,true);assert.equal(follow.mayReadClass,false);checks+=3;
 }
 const weather=planner.plan('How is the weather tomorrow?',{language});
 context=planner.advance(planner.createContext(),weather);
 const night=planner.plan(rows[language].night[0],{language,context});
 assert.equal(night.intent,'weather');assert.equal(night.shouldExecute,true);assert.equal(night.entities.daypart,'night');checks+=3;
}
// Referential commands resolve only an authorized antecedent, including clitics.
for(const [language,text] of [["es","Resolvelo"],["en","Solve it"],["pt","Resolva isso"],["fr","Résous cela"],["it","Risolvilo"],["de","Löse das"]]){
 const context=contextFor(language,"repair","Física");
 const result=planner.plan(text,{language,context});
 assert.equal(result.intent,"exercise");assert.equal(result.entities.exerciseNumber,3);assert.equal(result.mayReadClass,true);checks+=3;
 assert.equal(planner.plan(text,{language}).needsClarification,true);checks++;
}
for(const text of ["Explicalo","Resumilo"]){
 assert.equal(planner.plan(text).needsClarification,true);checks++;
 const follow=planner.plan(text,{context:planner.advance(planner.createContext(),planner.plan("¿Qué es permutación?"))});
 assert.equal(follow.intent,"follow-up");assert.equal(follow.shouldExecute,true);checks+=2;
}
const quotedRepair=planner.plan('Explicame "otra cosa", quise decir densidad');
assert.equal(quotedRepair.correction.before,'Explicame "otra cosa",');assert.equal(quotedRepair.correction.after,'densidad');checks+=2;
assert.equal(planner.plan('Explique la densité',{language:'fr'}).language,'fr');checks++;
console.log('P01 semantic contracts:',cases,'reviewed phrases,',checks,'checks');
