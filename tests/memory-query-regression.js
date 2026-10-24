"use strict";
const assert=require("node:assert/strict");
const memory=require("../memory-query.js");
const temporal=require("../nlu-temporal.js");
globalThis.ROBOTITO_TEMPORAL=temporal;
const now=new Date("2026-10-24T12:00:00");
const midnight=new Date("2026-10-23T12:00:00").getTime();
const data=[
 {type:"conversations",owner:"vale",timestamp:midnight,
  data:{text:"Ayer hablé de impulso y energía en Matemática"}},
 {type:"conversations",owner:"otro",timestamp:midnight,
  data:{text:"Información privada de otra persona"}},
 {type:"conversations",owner:"vale",timestamp:new Date("2026-10-22T12:00:00").getTime(),
  data:{text:"Antes hablamos de biología"}},
 {type:"memories",owner:"vale",timestamp:midnight,
  data:{text:"Ayer comí pizza"}},
 {type:"conversations",owner:"local",timestamp:midnight,
  data:{text:"Grabación de usuario no identificado"}},
];
const store={queryRecords:async({type,owner,after,before})=>data.filter(r=>r.type===type&&r.owner===owner&&
  (after===undefined||r.timestamp>=after)&&(before===undefined||r.timestamp<=before))};
(async()=>{
 const result=await memory.retrieve("¿Qué dije ayer sobre impulso?",{owner:"vale",language:"es",now,store});
 assert.equal(result.type,"conversations");
 assert.equal(result.rows.length,1);
 assert.ok(result.answer.includes("impulso"));
 assert.ok(!result.answer.includes("Información privada"));
 const none=await memory.retrieve("¿Qué dije ayer sobre dinosaurios?",{owner:"vale",language:"es",now,store});
 assert.equal(none.rows.length,0);
 const found=await memory.retrieve("¿Qué recordás de ayer?",{owner:"vale",language:"es",now,store});
 assert.equal(found.rows.length,1);
 const foreign=await memory.retrieve("¿Qué dije ayer?",{owner:"otro",language:"es",now,store});
 assert.equal(foreign.rows.length,1);
 assert.ok(!foreign.answer.includes("impulso"));
 console.log("Structured-memory privacy regression: 8 assertions passed");
})().catch(error=>{console.error(error);process.exitCode=1;});