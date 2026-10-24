"use strict";
const assert=require("node:assert/strict");
const planner=require("../semantic-planner.js");
let count=0;
function check(input,expected,options={}){
 const result=planner.plan(input,options);
 for(const [key,val] of Object.entries(expected)){assert.deepEqual(result[key],val,input+" / "+key);count++;}
}
const concepts=["permutación","fotosíntesis","impulso","gravedad","mitosis"];
const templates=["¿Qué es %s?","Definime %s.","¿Qué significa %s?","¿A qué le llaman %s?"];
for(const concept of concepts)for(const template of templates){
 check(template.replace("%s",concept),{intent:"definition",source:"general",mayReadClass:false});
}
for(const concept of concepts){
 check("¿Qué dijo la profesora sobre "+concept+"?",{intent:"class-question",source:"classes",mayReadClass:true});
 check("Explicame paso a paso el ejercicio 4 de "+concept,{intent:"exercise",source:"materials",depth:"step-by-step"});
}
for(const word of ["hoy","ayer","anteayer","mañana","yesterday","tomorrow","ontem","demain","gestern"]){
 assert.ok(planner.temporal(word,new Date("2026-10-24T12:00:00")),word);count++;
}
check("Explicame rápido qué dijo la profesora ayer sobre impulso y después haceme una pregunta",{
 intent:"class-question",source:"classes",depth:"brief"
});
const compound=planner.plan("Explicame rápidamente qué dijo la profesora ayer sobre impulso y después haceme una pregunta");
assert.equal(compound.actions.length,2);count++;
const first=planner.plan("¿Cómo va a estar el clima mañana?");
const follow=planner.plan("¿Y de noche?",{context:planner.advance(planner.createContext(),first)});
assert.equal(follow.intent,"weather");count++;
assert.equal(follow.source,"weather");count++;
const task=planner.plan("Tengo tareas mañana");
const taskFollow=planner.plan("¿Y de noche?",{context:planner.advance(planner.createContext(),task)});
assert.equal(taskFollow.intent,"task");count++;
assert.equal(planner.plan("Eso").needsClarification,true);count++;
assert.equal(planner.plan("Me gusta permutación").mayReadClass,false);count++;
console.log("Structured-planner checks passed:",count);
