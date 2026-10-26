"use strict";
// Combinatorial and property-based test layer; deterministic, isolated, reproducible.
// Domain oracles test invariants, not optimistic assumptions about all human language.
const assert=require("node:assert/strict");
const {makeRandom,pairwise,sample,checkProperty}=require("./generative-matrix-kit.js");
const planner=require("../semantic-planner.js");
const temporal=require("../nlu-temporal.js");
const voice=require("../voice-system.js");
const audio=require("../audio-perception.js");
const seed=Number(process.env.ROBOTITO_TEST_SEED||17);
const rng=makeRandom(seed);
let checks=0;
function yes(test,msg){assert.ok(test,msg);checks++;}
function same(a,b,msg){assert.deepEqual(a,b,msg);checks++;}
const params={
 template:["¿Qué es %s?","Definime %s","What is %s?","Define %s","O que é %s?"],
 concept:["permutación","fotosíntesis","libro","clima","profesora"],
 prefix:["","Por favor, ","Robotito, "],
 suffix:[""," ","!"," ..."],
 channel:["text","voice"],
};
const coverage=pairwise(params,{seed});
same(coverage.coveredPairs,coverage.totalPairs,"All 2-way factor combinations covered");
yes(coverage.cases.length<coverage.candidateCount,"Pairwise is smaller than Cartesian product");
checks+=checkProperty("definitions preserve source permissions",coverage.cases,row=>{
 const sentence=row.prefix+row.template.replace("%s",row.concept)+row.suffix;
 const result=planner.plan(sentence,{channel:row.channel});
 assert.equal(result.source,"general",sentence);
 assert.equal(result.mayReadClass,false,sentence);
 assert.equal(result.shouldExecute,true,sentence);
 assert.ok(result.confidence>=0&&result.confidence<=1,sentence);
},{seed});
const randomCases=sample(seed+1,params,1600);
checks+=checkProperty("randomized semantic permission isolation",randomCases,row=>{
 const phrase=row.prefix+row.template.replace("%s",row.concept)+row.suffix;
 const result=planner.plan(phrase,{channel:row.channel});
 assert.equal(result.mayReadClass,false,phrase);
 assert.notEqual(result.source,"classes",phrase);
},{seed:seed+1});
// A metamorphic invariant: punctuation and honorific address may alter style,
// but never grant access to private class transcripts or trigger an unrelated domain.
const subjects=["permutación","gravedad","fotosíntesis","enzimas","el libro","clima"];
checks+=checkProperty("contrastive prompt invariance",Array.from({length:360},()=>({
 subject:rng.pick(subjects),prefix:rng.pick(["","Robotito, ","Che, "]),suffix:rng.pick(["","!","??"]),
})),row=>{
 const a=planner.plan("¿Qué es "+row.subject+"?");
 const b=planner.plan(row.prefix+"¿Qué es "+row.subject+"?"+row.suffix);
 assert.equal(a.mayReadClass,false);
 assert.equal(b.mayReadClass,false);
 assert.equal(b.source,a.source);
},{seed});
// Generate conversation streams with interruptions, class records, tasks,
// time references, language changes and overlapping topics.
const turns=["¿Cómo va a estar el clima mañana?","¿Y de noche?","Tengo tareas mañana",
 "¿Qué es una profesora?","La profesora dijo que mañana tenemos examen.",
 "¿Qué dijo la profesora sobre impulso?","¿Qué es la energía?","Hola Robotito",
 "No me muestres mis apuntes","Perdón, era el ejercicio 5",
 "¿Y el otro?","¿Qué es un libro?","Explícame paso a paso el ejercicio 3 de Física"];
for(let scenario=0;scenario<40;scenario++){
 let context=planner.createContext();
 for(let turn=0;turn<180;turn++){
  const phrase=rng.pick(turns);
  const result=planner.plan(phrase,{context,language:rng.pick(["es","en","pt","fr","de","it"])});
  yes(result.actions.length>=1&&result.actions.length<=8,"Bounded action plan");
  yes(result.confidence>=0&&result.confidence<=1,"Bounded confidence");
  if(result.shouldExecute===false)yes(result.mayReadClass===false,"Comment cannot retrieve class");
  if(/^(?:La profesora dijo|No me muestres)/.test(phrase))same(result.mayReadClass,false,"Source denial");
  if(turn%29===0){context=planner.createContext();continue;} // reopening a transient session
  context=planner.advance(context,result);
  yes(context.turns.length<=20,"Conversation history remains bounded");
 }
}
for(let i=0;i<150;i++){
 const month=rng.int(12),day=1+rng.int(25),now=new Date(2026,month,day,12,30,0);
 const today=new Date(now);today.setHours(0,0,0,0);
 const prev=new Date(today);prev.setDate(prev.getDate()-1);
 const next=new Date(today);next.setDate(next.getDate()+1);
 const y=temporal.resolve("ayer",{now}),t=temporal.resolve("mañana",{now});
 same(y.startDate,[prev.getFullYear(),String(prev.getMonth()+1).padStart(2,"0"),String(prev.getDate()).padStart(2,"0")].join("-"),"Yesterday with month boundary");
 same(t.startDate,[next.getFullYear(),String(next.getMonth()+1).padStart(2,"0"),String(next.getDate()).padStart(2,"0")].join("-"),"Tomorrow with month boundary");
}
for(let i=0;i<320;i++){
 const style=rng.pick(Object.keys(voice.styles)),basePitch=.5+rng.next()*1.5,baseRate=.5+rng.next()*1.5;
 const v=voice.settings(style,basePitch,baseRate);
 yes(v.pitch>=.5&&v.pitch<=2&&v.rate>=.5&&v.rate<=2,"Voice synthesis limits");
}
// Acoustic adversarial streams; no environmental noise should fabricate a sneeze.
// This exercises generated spectra, repeated interruptions and resumed detectors.
for(let session=0;session<16;session++){
 const detector=audio.create({clock:()=>0});let timestamp=1000;
 for(let t=0;t<120;t++){
  const interrupted=t%31===0;
  const kind=rng.pick(["vacuum","traffic","quiet"]);
  const f={rms:kind==="quiet"?.002:.09+rng.next()*.045,
   flat:kind==="quiet"?.1:.84+rng.next()*.14,
   harmonic:.02+rng.next()*.09,low:30+rng.next()*10,mid:50+rng.next()*10,
   high:20+rng.next()*9,zcr:.2+rng.next()*.08};
  const result=detector.process(f,{now:timestamp,suppress:interrupted});
  yes(!result.events.some(e=>e.kind==="sneeze"),"Noise must not invent sneeze");
  yes(!result.events.some(e=>e.kind==="music"),"Non-tonal ambient noise must not trigger music");
  timestamp+=49;
  if(t%47===0)detector.reset();
 }
}
// All property suites must replay identically for the same seed.
const seqA=sample(seed,{x:[1,2,3],y:["a","b","c"]},70);
const seqB=sample(seed,{x:[1,2,3],y:["a","b","c"]},70);
same(seqA,seqB,"Identical seed produces identical random cases");
console.log("Robotito property/combinatorial checks:",checks,
 "seed:",seed,"pairwise:",coverage.cases.length+"/"+coverage.candidateCount,
 "pairs:",coverage.coveredPairs+"/"+coverage.totalPairs);
