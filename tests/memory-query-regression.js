"use strict";
const assert=require("node:assert/strict");
const memory=require("../memory-retrieval.js");
globalThis.ROBOTITO_TEMPORAL=require("../nlu-temporal.js");
const now=new Date("2026-10-24T12:00:00");
const yesterday=new Date("2026-10-23T12:00:00").getTime();
const records=[
 {type:"conversations",owner:"vale",timestamp:yesterday,topic:"impulso",data:{text:"Ayer hablamos de impulso y energía"}},
 {type:"conversations",owner:"vale",timestamp:yesterday-1000,topic:"biología",data:{text:"Las células son interesantes"}},
 {type:"conversations",owner:"otro",timestamp:yesterday,topic:"impulso",data:{text:"Dato privado de otra persona"}},
 {type:"conversations",owner:"vale",timestamp:now.getTime(),topic:"",data:{text:"¿Qué dije ayer sobre impulso?"}},
 {type:"memories",owner:"vale",timestamp:yesterday,topic:"",data:{text:"Ayer comí pizza"}},
];
globalThis.ROBOTITO_STORE={queryRecords:async({type,owner,after,before})=>records.filter(r=>
 r.type===type&&r.owner===owner&&(after===undefined||r.timestamp>=after)&&(before===undefined||r.timestamp<=before))};
(async()=>{
 const found=await memory.search("¿Qué dije ayer sobre impulso?",{owner:"vale",language:"es",now});
 assert.equal(found.type,"conversations");
 assert.equal(found.rows.length,1);
 assert.ok(found.text.includes("impulso"));
 assert.ok(!found.text.includes("privado"));
 const absent=await memory.search("¿Qué dije ayer sobre dinosaurios?",{owner:"vale",language:"es",now});
 assert.equal(absent.rows.length,0,"Do not substitute an unrelated memory");
 const own=await memory.search("¿Qué dije ayer?",{owner:"otro",language:"es",now});
 assert.ok(!own.text.includes("células"),"Other person's records must not leak");
 const general=await memory.search("Recordame mis recuerdos de ayer",{owner:"vale",language:"es",now});
 assert.equal(general.type,"memories");
 assert.ok(general.text.includes("pizza"));
 console.log("Structured memory privacy regression: 8/8 passed");
})().catch(error=>{console.error(error);process.exitCode=1;});