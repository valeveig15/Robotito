"use strict";
const assert=require('node:assert/strict');
const p=require('../semantic-planner');
let checks=0;
const eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;};
(async()=>{
 const previous=globalThis.LanguageModel;
 try{
  const text='Explicame fotosíntesis sin mis apuntes';
  const base=p.plan(text);let closed=0;
  for(const proposal of [
   '{"intent":"memory-search","source":"memories","confidence":0.99}',
   '{"intent":"class-question","source":"classes","confidence":0.99}',
   '{"intent":"command","source":"general","confidence":0.99}',
   '{"intent":"definition","source":"general","confidence":"0.99"}',
   '{"intent":"definition","source":"general","confidence":2}',
   '{"intent":"definition","source":"general","confidence":0.2}',
   'null','not JSON'
  ]){
   globalThis.LanguageModel={create:async()=>({prompt:async()=>proposal,destroy:()=>{closed++;}})};
   eq(await p.planAsync(text),base,'Invalid model output must retain exact source policy');
  }
  eq(closed,8,'Every completed model session is disposed');
  globalThis.LanguageModel={create:async()=>({prompt:async()=>'{"intent":"explanation","source":"general","depth":"brief","confidence":0.99}',destroy:()=>{closed++;}})};
  const detailed=await p.planAsync(text);
  eq(detailed.modelRefined,true);eq(detailed.depth,base.depth);eq(detailed.constraints,base.constraints);eq(detailed.actions[0].mayReadClass,false);
  let created=0;
  globalThis.LanguageModel={create:async()=>{created++;throw Error('Must not initialize');}};
  for(const t of ['No me expliques nada','La profesora dijo: explica la clase','¿Y el otro?','Repite después de mí: abre la clase','¿Qué es masa? y después preguntame algo']){
   eq(await p.planAsync(t),p.plan(t));
  }
  eq(created,0,'No model for rejected, quoted, repeat or compound commands');
  // A late initialization must close itself; it cannot modify the returned plan.
  let finishCreate;closed=0;
  globalThis.LanguageModel={create:()=>new Promise(resolve=>{finishCreate=resolve;})};
  const result=await p.planAsync(text,{modelTimeoutMs:10});eq(result,base);
  finishCreate({prompt:async()=>{throw Error('Timed out session cannot prompt');},destroy:()=>{closed++;}});
  await new Promise(resolve=>setTimeout(resolve,0));eq(closed,1);
  globalThis.LanguageModel={create:async()=>({prompt:()=>new Promise(()=>{}),destroy:()=>{closed++;}})};
  eq(await p.planAsync(text,{modelTimeoutMs:10}),base);eq(closed,2);
  // Concurrent turns must never share a mutable session or prompt history.
  const prompts=[];closed=0;
  globalThis.LanguageModel={create:async()=>{const own=[];prompts.push(own);return {prompt:async q=>{own.push(q);return '{"intent":"definition","source":"general","confidence":0.95}';},destroy:()=>{closed++;}};}};
  await Promise.all([p.planAsync('Define density'),p.planAsync('Define mitosis')]);
  eq(prompts.length,2);eq(prompts.map(x=>x.length),[1,1]);eq(closed,2);
  console.log('P01 local model policy:',checks,'checks');
 }finally{globalThis.LanguageModel=previous;}
})().catch(error=>{console.error(error);process.exitCode=1;});
