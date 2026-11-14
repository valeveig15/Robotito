"use strict";
const assert=require("node:assert/strict");
const {webcrypto}=require("node:crypto");
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const api=require("../custom-rules.js");
const all=new Map();let now=1000000,spoken=[],highfives=0,moods=[];
const store={
 async get(key,fallback){return all.has(key)?structuredClone(all.get(key)):fallback;},
 async updatePersonalRules(owner,{expectedRevision,value}){
  const key="robotito.custom-rules.v1:"+encodeURIComponent(owner),
   current=all.get(key)||{revision:0,rules:[]};
  if(current.revision!==expectedRevision)throw Error("stale revision");
  all.set(key,structuredClone(value));return true;
 }
};
const env={foreground:true,classMode:false,sleeping:false,muted:false,
 speaking:false,permissionDenied:false,personPresent:true,dayNightMode:"day"};
const effects={owner:()=>"local",language:()=>"es",render:()=>{},
 say:async text=>spoken.push(text),mood:async mood=>moods.push(mood),
 highfive:async()=>{highfives++;},status:()=>{}};
let checks=0;
function ok(cond,label){assert.ok(cond,label);checks++;}
function equal(a,b,label){assert.deepEqual(a,b,label);checks++;}
(async()=>{
 const rules=api.create({store,owner:"local",effects,now:()=>now});
 await rules.load();
 equal(api.parse("Si digo hola, decí buen día")?.when.type,"speech","Spanish natural trigger");
 equal(api.parse("Si digo hola, decí buen día")?.do.text,"buen día","Exact action payload");
 equal(api.parse("if I say hello, say good morning")?.do.text,"good morning","English example");
 equal(api.parse("cuando son las 18:00, recordame estudiar")?.when.hhmm,"18:00","Clock trigger");
 equal(api.parse("si escuchas aplausos, choca los cinco")?.when.kind,"clap","Calibrated sound trigger");
 equal(api.parse("cuando no hay nadie, sonreí")?.when.type,"absence","Camera absence trigger");
 equal(api.parse("si digo hola y es de noche, decí buenas noches")?.guards[0],"night",
  "Guard applies explicitly");
 equal(api.parse("no ejecutes esto"),null,"Negated non-rule is ignored");
 equal(api.parse("si digo hola, abre un sitio web"),null,"Arbitrary web action rejected");
 equal(api.parse("si digo hola, ejecutá JavaScript"),null,"Arbitrary code rejected");
 await rules.add("si digo hola, decí buen día",{priority:2});
 equal(rules.list().length,1,"Rule persisted");
 equal((await rules.emit({type:"speech",phrase:"hola"},env)).length,1,"First matching event fires");
 equal(spoken.at(-1),"buen día","Local speech action executes");
 equal((await rules.emit({type:"speech",phrase:"hola"},env)).length,0,
  "Duplicate within cooldown is suppressed");
 now+=60000;
 await rules.add("si digo hola, decí buenos días",{priority:4});
 equal((await rules.emit({type:"speech",phrase:"hola"},env)).length,1,"Priority winner selected");
 equal(spoken.at(-1),"buenos días","Higher priority response wins");
 equal((await rules.emit({type:"speech",phrase:"hola"},{...env,classMode:true})).length,0,
  "Class mode suppresses custom actions");
 equal((await rules.emit({type:"speech",phrase:"hola"},{...env,foreground:false})).length,0,
  "Hidden tab suppresses custom actions");
 equal((await rules.emit({type:"speech",phrase:"hola"},{...env,speaking:true})).length,0,
  "Robotito speech cannot trigger its own rules");
 const winner=rules.list().find(r=>r.priority===4);
 await rules.toggle(winner.id,false);
 now+=60000;
 equal((await rules.emit({type:"speech",phrase:"hola"},env)).length,1,
  "Disabling high priority permits lower priority rule");
 equal(spoken.at(-1),"buen día","Lower priority executes after disable");
 await rules.edit(winner.id,"si digo adiós, sonreí");
 await rules.toggle(winner.id,true);
 equal((await rules.emit({type:"speech",phrase:"adios"},env)).length,1,
  "Edited rule trigger works");
 equal(moods.at(-1),"happy","Allowlisted mood action executes");
 const stale=api.create({store,owner:"local",effects,now:()=>now});
 await stale.load();
 await rules.add("si me acaricias, choca los cinco");
 await assert.rejects(()=>stale.add("si digo mañana, decí hola"),/stale/i);checks++;
 const other=api.create({store,owner:"Bruno",
  effects:{...effects,owner:()=>"Bruno"},now:()=>now});
 await other.load();
 equal(other.list().length,0,"Owner isolation");
 equal((await other.emit({type:"speech",phrase:"hola"},env)).length,0,
  "Other user cannot consume another owner's rule");
 await rules.remove(winner.id);
 ok(!rules.list().some(r=>r.id===winner.id),"Delete removes rule");
 await rules.add("si digo hola, choca los cinco",{priority:5});
 now+=60000;
 await rules.emit({type:"speech",phrase:"hola"},env);
 equal(highfives,1,"High-five action preserved with allowlist");
 equal(api.message("foreground","es").includes("pestaña"),true,
  "Foreground-only limits are disclosed");
 console.log("P11 safe foreground custom rule engine:",checks,"checks");
})().catch(error=>{console.error(error);process.exitCode=1;});
