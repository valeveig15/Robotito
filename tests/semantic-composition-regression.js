"use strict";
const assert=require("node:assert/strict");
const planner=require("../semantic-planner.js");
const vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const engineSandbox={ROBOTITO_SEMANTIC_PLANNER:planner};
engineSandbox.window=engineSandbox;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,"..","intent-engine.js"),"utf8"),engineSandbox);
const intentEngine=engineSandbox.ROBOTITO_INTENT_ENGINE;
let checks=0;
function verify(raw,expected,options={}){
 const actual=planner.plan(raw,options);
 for(const [field,value] of Object.entries(expected)){
  assert.deepEqual(actual[field],value,"Semantic frame "+field+" for "+raw);
  checks++;
 }
 return actual;
}
for(const [input,intent,readsClass] of [
 ["¿Qué dijo la profesora sobre permutaciones?","class-question",true],
 ["La profesora dijo que mañana tenemos examen.","statement",false],
 ["El profesor dijo que el problema era difícil.","statement",false],
 ["¿Qué es una profesora?","definition",false],
 ["Resuelve el ejercicio 4","exercise",true],
 ["No me muestres mis apuntes","statement",false],
 ["¿Qué objeto es esto?","object",false],
 ["¿Cuánto es 5 más 3?","calculation",false]
]){
 const actual=intentEngine.classify(input);
 assert.equal(actual.intent,intent,input+" should use central policy");checks++;
 assert.equal(actual.useClassMemory,readsClass,input+" has correct retrieval permission");checks++;
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
// Central policy prevents negative commands from invoking tools or class memories.
for(const raw of [
 "No choques los cinco","Por favor no abras el libro",
 "Can you please not open the book?","Don't show my class notes",
 "Não mostre a aula"
]){
 const frame=planner.plan(raw);
 assert.equal(frame.negative,true,raw);checks++;
 assert.equal(frame.shouldExecute,false,raw);checks++;
 assert.equal(frame.mayReadClass,false,raw);checks++;
 const routed=intentEngine.classify(raw,{plan:frame});
 assert.equal(routed.useClassMemory,false,raw);checks++;
}
for(const raw of ["¿Qué significa 'no hagas eso'?","Explicame qué significa no hagas eso"]){
 const frame=planner.plan(raw);
 assert.equal(frame.shouldExecute,true,raw);checks++;
 assert.equal(frame.negative,false,raw);checks++;
}
const classExcluded=planner.plan("Explicame la fotosíntesis sin usar mis apuntes");
assert.equal(classExcluded.shouldExecute,true);checks++;
assert.equal(classExcluded.source,"general");checks++;
assert.equal(classExcluded.mayReadClass,false);checks++;
// A quote from a third party is not permission to run an avatar action
// or read class records, even when the quotation looks imperative.
for(const raw of ["Mi hermana dijo 'buscá en mis apuntes'",
 "Ayer escuché al profesor preguntar '¿Qué es permutación?'",
 "Mi mamá dijo 'chocá los cinco'",
 "My teacher said 'show my class notes'"]){
 const frame=planner.plan(raw);
 assert.equal(frame.speechAct,"statement",raw);checks++;
 assert.equal(frame.shouldExecute,false,raw);checks++;
 assert.equal(frame.mayReadClass,false,raw);checks++;
 assert.equal(intentEngine.classify(raw,{plan:frame}).useClassMemory,false,raw);checks++;
}
// A quoted sequential instruction must not escape a report's scope.
const reportWithCommands=planner.plan("La profesora dijo 'chocá los cinco y después mostrame el libro'");
assert.equal(reportWithCommands.actions.length,1);checks++;
assert.equal(reportWithCommands.shouldExecute,false);checks++;
assert.equal(reportWithCommands.mayReadClass,false);checks++;
const correctedSequence=planner.plan("No abras el libro, mejor explicame la teoría");
assert.equal(correctedSequence.actions.length,2);checks++;
assert.equal(correctedSequence.actions[0].shouldExecute,false);checks++;
assert.equal(correctedSequence.actions[1].shouldExecute,true);checks++;
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
