"use strict";
const assert=require("node:assert/strict");
const {createEngine,parseInstruction}=require("../temporal-rules.js");
const data=new Map();const storage={
 getItem:k=>data.get(k)||null,
 setItem:(k,v)=>data.set(k,v)
};
let now=Date.now(),log=[],writes=0;
const e=createEngine({storage,now:()=>now,onChange:()=>writes++});
const eq=(a,b,msg)=>assert.deepEqual(a,b,msg);
eq(parseInstruction("En 5 minutos decime tomar agua"),
 {kind:"once",ms:300000,text:"tomar agua"},"Spanish relative delay");
eq(parseInstruction("Cada 10 minutos por 3 veces decime estirar"),
 {kind:"repeat",ms:600000,count:3,text:"estirar"},"Finite repetitions");
eq(parseInstruction("Si digo hola robotito, decí buen día"),
 {kind:"phrase",trigger:"hola robotito",text:"buen día"},"Declarative conditional");
eq(parseInstruction("Todos los días a las 14:30 decime estudiar"),
 {kind:"daily",time:"14:30",text:"estudiar"},"Local daily schedule");
eq(parseInstruction("In 5 minutes remind me to drink water"),
 {kind:"once",ms:300000,text:"to drink water"},"English language sample");
eq(parseInstruction("Em 5 minutos lembre-me de beber água"),
 {kind:"once",ms:300000,text:"de beber água"},"Portuguese language sample");
eq(parseInstruction("Dans 5 minutes dis-moi de boire de l'eau"),
 {kind:"once",ms:300000,text:"de boire de l'eau"},"French language sample");
eq(parseInstruction("Tra 5 minuti dimmi di bere acqua"),
 {kind:"once",ms:300000,text:"di bere acqua"},"Italian language sample");
eq(parseInstruction("In 5 Minuten sag mir, Wasser zu trinken"),
 {kind:"once",ms:300000,text:"Wasser zu trinken"},"German language sample");
eq(parseInstruction("Every day at 14:30 say study"),
 {kind:"daily",time:"14:30",text:"study"},"English daily phrase");
eq(parseInstruction("Ogni giorno a 14:30 di' studiare"),
 {kind:"daily",time:"14:30",text:"studiare"},"Italian daily phrase");
eq(parseInstruction("En 5000 horas decime x"),null,"Unbounded delays rejected");
eq(parseInstruction("Cada 5 minutos por 99 veces decime x"),null,"Unbounded repetitions rejected");
eq(parseInstruction("si digo x, borrá los datos"),null,
 "Unrecognized destructive conditional is never converted to code");
eq(parseInstruction("en 5 minutos ejecutá JavaScript"),null,"Arbitrary commands rejected");
const when=e.create({kind:"once",ms:3000,text:"tomar agua"},"local");
eq(e.list("Ada").length,0,"Other owner's data never displayed");
eq(e.tick({owner:"Ada",emit:t=>log.push(t)}),0,"Other owner cannot execute due reminder");
now+=2999;
eq(e.tick({owner:"local",emit:t=>log.push(t)}),0,"Not before due time");
now+=1;
eq(e.tick({owner:"local",visible:false,emit:t=>log.push(t)}),0,"Hidden tab remains silent");
eq(e.tick({owner:"local",emit:t=>log.push(t)}),1,"Due reminder fires once");
eq(log,["tomar agua"],"Correct literal message");
eq(e.tick({owner:"local",emit:t=>log.push(t)}),0,"No accidental duplicate");
eq(e.list("local").length,0,"One-off reminder removed after firing");
const batch=e.create({kind:"repeat",ms:2000,count:3,text:"moverse"},"local");
for(let i=0;i<3;i++){now+=2000;eq(e.tick({owner:"local",emit:t=>log.push(t)}),1,
 "Bounded repeat fires at each interval");}
eq(log.filter(x=>x==="moverse").length,3,"Three repetitions, no fourth");
eq(e.list("local").length,0,"Completed series removed");
const stale=e.create({kind:"once",ms:1000,text:"viejo"},"local");
now+=500000;eq(e.tick({owner:"local",emit:t=>log.push(t)}),0,
 "Missed reminders never fire hours later");
eq(e.list("local").length,0,"Expired task is persisted as removed");
const phrase=e.speech("Si digo buenas noches, decí dulces sueños",
 {owner:"Ada",emit:t=>log.push(t)});
eq(phrase.handled,true,"Rule creation recognized");
eq(e.speech("BUENAS NOCHES",{owner:"local",emit:t=>log.push(t)}).handled,false,
 "Unverified owner cannot trigger someone else's rule");
eq(e.speech("BUENAS NOCHES",{owner:"Ada",emit:t=>log.push(t)}).triggered,phrase.created.id,
 "Same profile triggers normalized rule");
eq(log.at(-1),"dulces sueños","Conditional produces only literal response");
eq(e.speech("dulces sueños",{owner:"Ada",emit:t=>log.push(t)}).handled,false,
 "Output text does not create an unbounded trigger loop");
assert.throws(()=>e.create({kind:"phrase",trigger:"x",text:"x"},"local"),/recursive/i);
const second=createEngine({storage,now:()=>now});
eq(second.list("Ada").length,1,"Valid rule persists across reload");
eq(second.cancel(phrase.created.id,"local"),false,"Other owner cannot cancel rule");
eq(second.cancel(phrase.created.id,"Ada"),true,"Own profile may cancel");
eq(second.list("Ada").length,0,"Cancel removes rule");
e.reload();
const local=e.create({kind:"once",ms:2500,text:"secret"},"Ada");
const local2=e.create({kind:"once",ms:2500,text:"local reminder"},"local");
eq(e.clear("Ada"),1,"Clear only selected owner");
eq(e.list("local").length,1,"Other owner's reminder retained");
eq(e.speech("cancelar todas las reglas",{owner:"local"}).needsConfirmation,true,
 "Voice cancel asks for confirmation instead of clearing automatically");
eq(e.list("local").length,1,"No erasure without explicit confirmation");
for(let i=0;i<39;i++)e.create({kind:"phrase",trigger:"clave"+i,text:"texto"+i},"local");
assert.throws(()=>e.create({kind:"phrase",trigger:"extra",text:"extra2"},"local"),/Maximum/);
console.log("P10/P11 safe foreground timing, finite repeats, per-owner rules and cancellation: passed");
