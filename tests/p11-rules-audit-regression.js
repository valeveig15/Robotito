"use strict";
const assert=require("node:assert/strict"),{createEngine,parseInstruction,parseManagement}=require("../temporal-rules.js");
let checks=0;const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++;};
for(const text of ["En 2 segundos recuérdame Léa <libro>","In 2 seconds remind me Léa <libro>","Em 2 segundos lembre-me Léa <libro>","Dans 2 secondes dis-moi Léa <libro>","Tra 2 secondi dimmi Léa <libro>","In 2 Sekunden sag mir Léa <libro>"])
 eq(parseInstruction(text),{kind:"once",ms:2000,text:"Léa <libro>"},"Accents and literal content: "+text);
for(const text of ["Todos los días a las 14:30 decí Léa","Every day at 14:30 say Léa","Todo dia às 14:30 diga Léa","Tous les jours à 14:30 dis Léa","Ogni giorno alle 14:30 di Léa","Jeden Tag um 14:30 sage Léa"])
 eq(parseInstruction(text),{kind:"daily",time:"14:30",text:"Léa"},"Natural daily schedule: "+text);
for(const text of ["Si oís palmas y ves una persona, decí hola","If you hear claps and you see a person, say hola","Se ouvir palmas e ver uma pessoa, diga hola","Si tu entends applaudissements et tu vois une personne, dis hola","Se senti applausi e vedi una persona, di hola","Wenn du hörst Klatschen und du siehst eine Person, sage hola"])
 eq(parseInstruction(text),{kind:"event",conditions:["audio:clap","vision:person"],operator:"all",holdMs:0,text:"hola"},"Composed consented conditions: "+text);
eq(parseInstruction("Si escuchas una tos, decí salud"),null,"Unapproved human sound reaction remains unavailable");
eq(parseInstruction("Si ves una persona y no ves a nadie, decí hola"),null,"Contradictory all-conditions rejected");
for(const text of ["Mostrame mis reglas","Show my rules","Mostre minhas regras","Liste mes règles","Elenca le regole","Zeige meine Regeln"])eq(parseManagement(text)?.action,"list","Rule query: "+text);
let clock=100000,raw="[]",writes=0;
const e=createEngine({storage:{getItem:()=>raw,setItem:(_,v)=>{raw=v;writes++;}},now:()=>clock});
const log=[];
for(let i=0;i<5;i++)e.create({kind:"once",ms:1000,text:"message "+i,priority:i},"Ada");
clock+=1000;eq(e.tick({owner:"Ada",emit:t=>log.push(t)}),3,"First bounded batch");
eq(e.list("Ada").length,2,"Remaining due reminders are retained");
eq(e.tick({owner:"Ada",emit:t=>log.push(t)}),2,"Second batch delivers remaining messages");
eq(log,["message 4","message 3","message 2","message 1","message 0"],"Priority ordering without loss");
const saved=e.create({kind:"phrase",trigger:"hola",text:"hello"},"Ada");
eq(e.speech("Desactivá la regla 1",{owner:"Ada"}).updated.enabled,false,"Disable by natural command");
eq(e.speech("hola",{owner:"Ada"}).handled,false,"Disabled rule cannot fire");
eq(e.speech("Cambiá la regla 1 para decir Léa <libro>",{owner:"Ada"}).updated.text,"Léa <libro>","Edit preserves original literal text");
eq(e.speech("Activá la regla 1",{owner:"Ada"}).updated.enabled,true,"Enable by natural command");
eq(e.speech("hola",{owner:"Ada",emit:t=>log.push(t)}).triggered,saved.id,"Enabled rule fires");
eq(e.speech("hola",{owner:"Ada",emit:t=>log.push(t)}).suppressed,true,"Cooldown prevents repetition");
eq(e.update(saved.id,"Bea",{text:"stolen"}),false,"Other owners cannot edit");
e.create({kind:"phrase",trigger:"a",text:"b"},"Ada");assert.throws(()=>e.create({kind:"phrase",trigger:"b",text:"a"},"Ada"),/recursive/);checks++;
const before=writes;e.speech("Si digo adiós, decí hasta luego",{owner:"Ada"});
eq(writes,before,"Conversation-created rules stay in RAM");
const conditions=e.create(parseInstruction("Cuando no veas a nadie durante 3 segundos, decí vuelvo enseguida"),"Ada");
const observe=(kind,options={})=>e.observe({kind,at:clock,epoch:1,verified:true,permission:true,...options},{owner:"Ada",emit:t=>log.push(t)});
eq(observe("vision:empty"),0,"No absence from a single image");
clock+=1000;eq(observe("vision:empty"),0,"No premature absence");
clock+=1000;eq(observe("vision:empty",{permission:false}),0,"Revoked permission discards evidence");
for(let i=0;i<3;i++){clock+=1000;eq(observe("vision:empty"),0,"Absence restarts after consent loss");}
clock+=1000;eq(observe("vision:empty"),1,"Continuous, fresh absence can trigger");
clock+=1000;eq(observe("vision:empty"),0,"Condition remains latched instead of repeating");
clock+=1000;eq(observe("vision:person"),0,"Presence resets absence");
clock+=10000;eq(observe("vision:empty"),0,"Stale evidence does not satisfy duration");
eq(observe("audio:cough"),0,"Unapproved sound cannot be injected into rules");
eq(e.speech("Mostrame mis reglas",{owner:"Bea"}).listed,[],"Queries do not disclose another person's rules");
eq(e.speech("Borrá la regla 99",{owner:"Ada"}).missing,true,"A missing rule number is reported");
console.log("P11 management, events, permissions and simultaneous reminders:",checks,"checks");
