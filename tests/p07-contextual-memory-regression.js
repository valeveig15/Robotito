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
  ["ce qu'on a dit hier","fr","conversations","alice-conversation"],
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
 const planner=require("../semantic-planner.js");
 for(const [language,text] of [["es","Recordame qué hablamos ayer"],["en","What did we talk about yesterday?"],["pt","O que falamos ontem?"],["fr","Rappelle-moi ce qu'on a dit hier"],["it","Ricordami cosa abbiamo detto ieri"],["de","Erinnere mich, was haben wir gestern besprochen?"]]){
  const plan=planner.plan(text,{language,now:when});
  eq(plan.source,"memories",language+" planner authorizes recall");
  eq(plan.shouldExecute,true,language+" planner executes request");
  const found=await memory.search(text,{plan,owner:"Alice",language,now:when});
  eq(found.rows[0]?.id,"alice-conversation",language+" real plan reaches stored conversation");
 }
 for(const text of ["No me recuerdes lo de ayer","Don't remind me what we discussed yesterday","Ne me rappelle pas ce qu'on a dit hier","Non ricordarmi cosa abbiamo detto ieri","Erinnere mich nicht","¿Qué significa 'lo de ayer'?","Mi hermana dijo 'recordame lo de ayer'","Mostrame un gato","Buscá una imagen de un perro"]){
  const plan=planner.plan(text,{now:when});const before=queries.length;
  await memory.search(text,{plan,owner:"Alice",now:when});
  eq(queries.length,before,text+" cannot authorize private retrieval");
 }
 eq(memory.intent("Recordame mis libros").type,"books","Owned library remains distinct from recommendations");
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
 for(const [language,text] of [["es","hace una semana"],["en","one week ago"],["pt","há uma semana"],
  ["fr","il y a une semaine"],["it","una settimana fa"],["de","vor einer Woche"]]){
  eq(temporal.resolve(text,{language,now:when})?.start,week.start,language+" week-ago calendar date");
 }
 records.push({id:"midnight",owner:"Alice",type:"memories",timestamp:new Date(2026,9,24).getTime(),data:{text:"Today, not yesterday"}});
 eq((await memory.search("lo de ayer",{owner:"Alice",now:when})).rows.some(r=>r.id==="midnight"),false,"Next midnight excluded");
 for(let i=0;i<150;i++)records.push({id:"recent-"+i,owner:"Alice",type:"memories",timestamp:at(-1,i),data:{text:"Sin información del tema solicitado"}});
 records.push({id:"old-short-topic",owner:"Alice",type:"memories",timestamp:at(-8),data:{text:"Estudiamos ADN en el laboratorio"}});
 eq((await memory.search("Recordame lo de la última vez sobre ADN",{owner:"Alice",now:when})).rows[0]?.id,"old-short-topic","Finds short topic beyond first 100 rows");
 eq((await memory.search("Recordame lo de ayer sobre sol",{owner:"Alice",now:when})).rows.length,0,"Short missing topic never replaced with unrelated text");
 eq((await memory.search("Recordame lo del 2026-10-17",{owner:"Alice",now:when})).rows[0]?.id,"alice-week","Explicit ISO date");
 eq((await memory.search("Recordame lo del 31/02/2026",{owner:"Alice",now:when})).rows.length,0,"Invalid calendar date does not retrieve unrelated memories");
 eq(temporal.resolve("lunes,",{now:when,language:"es"})?.start,new Date(2026,9,19).getTime(),"Weekday punctuation");
 console.log("P07 contextual memory recall and owner isolation:",checks,"checks");
})().catch(e=>{console.error(e);process.exitCode=1;});
