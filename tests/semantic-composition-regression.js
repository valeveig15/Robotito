"use strict";
const assert=require("node:assert/strict");
const planner=require("../semantic-planner.js");
let checks=0;
function verify(raw,expected,options={}){
 const actual=planner.plan(raw,options);
 for(const [field,value] of Object.entries(expected)){
  assert.deepEqual(actual[field],value,"Semantic frame "+field+" for "+raw);
  checks++;
 }
 return actual;
}
const statementCases=[
 "La profesora explicó permutaciones en clase.",
 "El profesor dijo que mañana tenemos examen.",
 "La profesora dijo '¿qué es un choque elástico?'",
 "Me gusta el libro de álgebra.",
 "Hoy escuché música.",
 "Recomendé un libro ayer."
];
for(const sentence of statementCases){
 const f=planner.plan(sentence);
 assert.equal(f.speechAct,"statement",sentence);checks++;
 assert.equal(f.shouldExecute,false,sentence);checks++;
 assert.equal(f.mayReadClass,false,sentence);checks++;
}
const requests=[
 ["¿Qué es permutación?","definition","general"],
 ["Definime permutación","definition","general"],
 ["No entiendo qué es una permutación","definition","general"],
 ["¿Qué significa clima?","definition","general"],
 ["¿Qué es un libro?","definition","general"],
 ["¿Qué es una profesora?","definition","general"],
 ["¿Qué dijo la profesora sobre permutaciones?","class-question","classes"],
 ["¿Qué vimos en clase?","class-question","classes"],
 ["Buscá en mis apuntes la fórmula","class-question","classes"],
 ["According to my class, explain entropy","class-question","classes"],
 ["Na minha aula, o que vimos?","class-question","classes"],
 ["Robotito, ¿podés explicarme las permutaciones?","explanation","general"],
 ["¿Cuál es la diferencia entre mitosis y meiosis?","comparison","general"],
 ["Necesito saber cómo funciona la gravedad","explanation","general"]
];
for(const [raw,intent,source] of requests){
 const f=verify(raw,{intent,source,shouldExecute:true,needsClarification:false});
 assert.ok(f.speechAct==="question"||f.speechAct==="request",raw);checks++;
}
for(const raw of ["No me expliques el libro","Don't show my class notes","No me muestres lo que dijo la profesora"]){
 const f=planner.plan(raw);
 assert.equal(f.shouldExecute,false,raw);checks++;
 assert.equal(f.mayReadClass,false,raw);checks++;
}
const weather=planner.plan("¿Cómo va a estar el clima mañana?");
let history=planner.advance(planner.createContext(),weather);
const night=planner.plan("¿Y de noche?",{context:history});
verify("¿Y de noche?",{intent:"weather",source:"weather"},{context:history});
assert.equal(night.entities.daypart,"night");checks++;
assert.equal(night.references.usesPrevious,true);checks++;
const tasks=planner.plan("Tengo tareas mañana");
history=planner.advance(planner.createContext(),tasks);
verify("¿Y de noche?",{intent:"task",shouldExecute:true},{context:history});
verify("¿Y de noche?",{needsClarification:true});
verify("¿Y el otro?",{needsClarification:true});
const exercise=planner.plan("Explicame paso a paso el ejercicio 3 de Física");
history=planner.advance(planner.createContext(),exercise);
verify("Perdón, era el ejercicio 5",{intent:"exercise",shouldExecute:true},{context:history});
assert.equal(planner.plan("Perdón, era el ejercicio 5",{context:history}).entities.exerciseNumber,5);checks++;
const newDefinition=planner.plan("No, mejor decime la definición",{context:history});
assert.equal(newDefinition.intent,"definition");checks++;
assert.equal(newDefinition.speechAct,"request");checks++;
assert.equal(newDefinition.negative,false);checks++;
const sequence=planner.plan("Explicame rápidamente qué dijo la profesora ayer sobre impulso y después haceme una pregunta para ver si entendí.");
assert.equal(sequence.actions.length,2);checks++;
assert.equal(sequence.actions[0].intent,"class-question");checks++;
assert.equal(sequence.actions[1].intent,"quiz");checks++;
assert.equal(sequence.actions[0].source,"classes");checks++;
assert.equal(sequence.actions[1].source,"conversation");checks++;
assert.equal(sequence.actions[0].depth,"brief");checks++;
const compound=planner.plan("¿Qué es permutación? y después preguntame algo para practicar");
assert.equal(compound.actions[0].intent,"definition");checks++;
assert.equal(compound.actions[1].intent,"quiz");checks++;
for(const connector of ["y después","y luego","después","and then"]){
 const q="Explicame permutación "+connector+" preguntame algo";
 assert.equal(planner.plan(q).actions.length,2,q);checks++;
}
const unrelated=planner.plan("¿Qué es permutación?");
assert.equal(unrelated.source,"general");checks++;
assert.equal(unrelated.mayReadClass,false);checks++;
assert.ok(planner.advance(planner.createContext(),unrelated).turns.length===1);checks++;
let longContext=planner.createContext();
for(let i=0;i<3000;i++){
 const frame=planner.plan(i%2?"¿Qué es permutación?":"Tengo tareas mañana",{context:longContext});
 longContext=planner.advance(longContext,frame);
 assert.ok(longContext.turns.length<=20);checks++;
}
(async()=>{
 const root=globalThis;
 const previousModel=root.LanguageModel;
 let calls=0;
 root.LanguageModel={create:async()=>({prompt:async()=>{calls++;return '{"intent":"class-question","source":"classes","depth":"detailed","confidence":0.99}';}})};
 const normal=await planner.planAsync("¿Podés decirme cómo funciona el universo?");
 assert.equal(normal.mayReadClass,false);checks++;
 assert.notEqual(normal.source,"classes");checks++;
 const quoted=await planner.planAsync("La profesora dijo que estudiaremos biología.");
 assert.equal(quoted.shouldExecute,false);checks++;
 assert.equal(calls,1,"A quoted statement must never be handed to the local model");checks++;
 root.LanguageModel=previousModel;
 console.log("Semantic composition regression:",checks,"checks passed");
})().catch(err=>{console.error(err);process.exitCode=1;});
