"use strict";
const assert=require("node:assert/strict");
const memory=require("../memory-retrieval.js");
const temporal=require("../nlu-temporal.js");
const when=new Date(2026,9,24,12,0,0);
const at=(days,minutes=0)=>{const d=new Date(when);d.setHours(12,0,0,0);d.setDate(d.getDate()+days);return d.getTime()+minutes*60000;};
const records=[
 {id:"alice-yesterday",type:"memories",owner:"Alice",timestamp:at(-1),
  data:{text:"Estudié impulso y cantidad de movimiento"}},
 {id:"alice-week",type:"memories",owner:"Alice",timestamp:at(-7),
  data:{text:"Fui al museo de ciencias"}},
 {id:"alice-class",type:"classes",owner:"Alice",timestamp:at(-1),
  data:{text:"Clase de biología sobre células"}},
 {id:"alice-conversation",type:"conversations",owner:"Alice",timestamp:at(-1),
  data:{text:"We discussed conservation of momentum"}},
 {id:"local-yesterday",type:"memories",owner:"local",timestamp:at(-1),
  data:{text:"Anonymous data from a different visitor"}},
 {id:"bob-yesterday",type:"memories",owner:"Bob",timestamp:at(-1),
  data:{text:"Secret from Bob"}},
 {id:"alice-current-utterance",type:"memories",owner:"Alice",timestamp:at(-1,100),
  data:{text:"lo de ayer"}}
];
const queries=[];
globalThis.ROBOTITO_STORE={queryRecords:async opts=>{
 queries.push({...opts});
 return records.filter(r=>r.type===opts.type&&r.owner===opts.owner&&
  (opts.after==null||r.timestamp>=opts.after)&&
  (opts.before==null||r.timestamp<=opts.before))
  .sort((a,b)=>b.timestamp-a.timestamp).slice(0,opts.limit);
}};
globalThis.ROBOTITO_TEMPORAL=temporal;
let checks=0;
function eq(a,b,reason){assert.deepEqual(a,b,reason);checks++;}
(async()=>{
 const examples=[
  ["lo de ayer","es","memories","alice-yesterday"],
  ["o de ontem","pt","memories","alice-yesterday"],
  ["ce qu'on a dit hier","fr","memories","alice-yesterday"],
  ["quello di ieri","it","memories","alice-yesterday"],
  ["das von gestern","de","memories","alice-yesterday"],
  ["what we discussed yesterday","en","conversations","alice-conversation"],
  ["lo de ayer en clase","es","classes","alice-class"],
  ["Recordame mis recuerdos de hace una semana","es","memories","alice-week"]
 ];
 for(const [text,language,type,id] of examples){
  const got=await memory.search(text,{owner:"Alice",language,now:when});
  eq(got.handled,true,language+" contextual recall recognized");
  eq(got.type,type,language+" type selected correctly");
  eq(got.rows[0]?.id,id,language+" resolved stored original, not other profile");
  eq(got.rows.every(r=>r.owner==="Alice"),true,language+" owner isolation");
  eq(queries.at(-1).owner,"Alice",language+" store query always scoped by owner");
 }
 const missing=await memory.search("lo de ayer sobre dinosaurios",{
  owner:"Alice",language:"es",now:when});
 eq(missing.rows.length,0,"No topic evidence must return empty results");
 const anonymous=await memory.search("lo de ayer",{owner:"local",language:"es",now:when});
 eq(anonymous.rows[0]?.id,"local-yesterday","Anonymous stays anonymous");
 const other=await memory.search("lo de ayer",{owner:"Bob",language:"es",now:when});
 eq(other.rows[0]?.id,"bob-yesterday","Known person never receives Alice's memory");
 eq(memory.intent("¿Qué dijo la profesora ayer?"),null,"Teacher's new question is not recall");
 eq(memory.intent("¿Qué pasó con el clima ayer?"),null,"Weather question is not recall");
 eq(memory.intent("¿Qué significa la última vez?"),null,"Definition does not retrieve memory");
 const week=temporal.resolve("hace una semana",{language:"es",now:when});
 const midpoint=new Date(week.start);
 eq(midpoint.getDate(),17,"Week-ago memory uses calendar date, not fabricated week");
 eq(week.end-week.start>=23*3600000,true,"Day boundary remains an inclusive date window");
 console.log("P07 contextual memory recall and owner isolation:",checks,"checks");
})().catch(e=>{console.error(e);process.exitCode=1;});
