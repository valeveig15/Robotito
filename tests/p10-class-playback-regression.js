"use strict";
const assert=require("node:assert/strict");
require("../nlu-temporal.js");
const planner=require("../semantic-planner.js"),{select}=require("../class-playback.js");
let checks=0;const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++;};
const now=new Date(2026,10,17,12),yesterday=new Date(2026,10,16,10).getTime();
const records=[{id:"a",owner:"Ada",subject:"Physics",topic:"Waves",startedAt:yesterday},
 {id:"b",owner:"Bea",subject:"Physics",topic:"Waves",startedAt:yesterday},
 {id:"c",owner:"Ada",subject:"Physics",topic:"Waves",startedAt:now.getTime()}];
for(const [language,text] of [["es","Reproducí la clase de ayer"],["en","Play yesterday's class recording"],["pt","Reproduza a aula de ontem"],["fr","Joue l’enregistrement du cours de hier"],["it","Riproduci la lezione di ieri"],["de","Spiele die Aufnahme vom Unterricht von gestern ab"]]){
 const plan=planner.plan(text,{language,now});
 eq(plan.intent,"class-playback",language+" structured playback intent");
 eq(plan.shouldExecute&&plan.mayReadClass,true,language+" authorizes scoped playback");
 eq(select(text,records,{owner:"Ada",language,now}).rows.map(x=>x.id),["a"],language+" actual owner and date filter");
}
eq(select("Play the Physics class from yesterday",records,{owner:"Ada",now}).rows.map(x=>x.id),["a"],"Subject is constrained");
eq(select("Play the Chemistry class from yesterday",records,{owner:"Ada",now}).rows,[],"Unknown subject cannot play an unrelated recording");
eq(select("Play class from 2026-02-30",records,{owner:"Ada",now}).rows,[],"Invalid date cannot broaden lookup");
for(const text of ["No reproduzcas la clase de ayer","Don't play yesterday's class","Ne joue pas le cours de hier","Non riprodurre la lezione di ieri","Spiele die Aufnahme nicht","Mi hermana dijo 'reproducí la clase de ayer'","What does 'play yesterday's class' mean?"]){
 const plan=planner.plan(text,{now});eq(plan.intent==="class-playback"&&plan.shouldExecute&&plan.mayReadClass,false,"No playback: "+text);
}
eq(planner.plan("Repetí después de mí: reproducí la clase de ayer").intent,"repeat","Literal content does not become playback");
console.log("P10 date-selected class playback:",checks,"checks");
