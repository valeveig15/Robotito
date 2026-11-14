"use strict";
const assert=require("node:assert/strict");
const commands=require("../temporal-commands.js");
const clock=require("../nlu-temporal.js");
const today=new Date(2026,10,14,12,0),yesterday=new Date(2026,10,13,10,0);
let checks=0,eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++;};
for(const [phrase,kind] of [
 ["poné la grabación de la clase de ayer","play-class"],
 ["play the class recording from yesterday","play-class"],
 ["mostre a gravação da aula de ontem","play-class"],
 ["joue l'enregistrement du cours d'hier","play-class"],
 ["riproduci la registrazione della lezione di ieri","play-class"],
 ["spiele die Aufnahme von gestern","play-class"],
 ["repetí después de mí","arm"],
 ["repeat after me: high five","say"],
 ["decí esto: hola","say"],
 ["mostrame el libro que me recomendaste hace una semana","show-book"]
])eq(commands.parse(phrase)?.action,kind,"Grammar "+phrase);
for(const negative of [
 "no pongas la grabación de ayer","qué significa decir esto","what is a recording?",
 "don't play the recording","no repitas después de mí"
])eq(commands.parse(negative),null,"Negated/academic wording cannot start actions: "+negative);
const say=[];const speak=t=>say.push(t);
(async()=>{
 const audio=[{id:"1",startedAt:yesterday.getTime(),subject:"Física",topic:"Impulso",
   blob:new Blob([new Uint8Array([5,6,7])],{type:"audio/webm"})}];
 const opts={owner:"Ada",lang:"es",clock,classAudio:{listRecordings:async()=>audio},
  store:{queryRecords:async()=>[]},speak,at:today,activeOwner:()=> "Ada"};
 eq(await commands.handle("poné la grabación de la clase de ayer",opts),true,
  "Real recorded class is found by yesterday's interval");
 eq(say.at(-1),commands.msg("found","es"),"Real audio is reported only when available");
 eq(await commands.handle("poné la grabación de la clase de anteayer",opts),true,"Missing date is handled");
 eq(say.at(-1),commands.msg("missing","es"),"No invented recording");
 eq(await commands.handle("repetí después de mí",opts),true,"Arms next phrase");
 eq(commands.hasPending("Ada",today.getTime()+500),true,"Pending literal scoped to owner");
 eq(commands.consumePending("choca los cinco",{owner:"Bruno",lang:"es",speak,at:today.getTime()+1000}),false,
  "A different person's phrase cannot consume Ada's repetition");
 eq(commands.consumePending("choca los cinco",{owner:"Ada",lang:"es",speak,at:today.getTime()+1000}),true,
  "Next phrase is consumed literally");
 eq(say.at(-1),"choca los cinco","Next phrase is not executed as a high-five command");
 eq(commands.hasPending("Ada",today.getTime()+500),false,"Repetition only once");
 await commands.handle("repetí después de mí",opts);
 eq(commands.consumePending("poné la grabación de ayer",{owner:"Ada",lang:"es",speak,
   at:today.getTime()+50000}),false,"Expired repetition cannot execute or echo");
 const record=(at,title,owner="Ada")=>({type:"recommendations",owner,timestamp:at,data:{title}});
 const store={queryRecords:async()=>[
  record(yesterday.getTime(),"Libro auténtico"),
  record(yesterday.getTime(),"Libro de otra persona","Bruno")
 ]};
 eq(await commands.handle("mostrame el libro que me recomendaste ayer",{...opts,store}),true,
   "Book lookup consults durable recommendation records");
 eq(say.at(-1),"Libro auténtico","Only exact owner and title is returned");
 const ownerChanged=await commands.handle("mostrame el libro que me recomendaste ayer",
  {...opts,store,activeOwner:()=> "Bruno"});
 eq(ownerChanged,true,"Async owner changes cancel disclosure");
 eq(say.at(-1),"Libro auténtico","No extra speech after user identity changed");
 eq(await commands.handle("poné la grabación de la clase de ayer",
  {...opts,classMode:true}),false,"Class Mode is never interrupted by playback");
 const period=clock.resolve("hace una semana",{now:today,language:"es"});
 eq(period.startDate,"2026-11-07","Relative one-week interval uses shared calendar");
 console.log("P10 temporal, playback and literal next-utterance:",checks,"checks");
})().catch(e=>{console.error(e);process.exitCode=1;});
