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
// Interactive gestures remain executable, but narration or refusal is data.
for(const gesture of ["chocá los cinco","choca los cinco","chocame los cinco",
  "robotito chocame los cinco","por favor chocá los cinco","high five","high-five","dame cinco"]){
 check(gesture,{shouldExecute:true,speechAct:"request"});
}
for(const narration of ["ayer chocamos los cinco","la profesora dijo high five",
  "él me dijo high five","me gusta high five","no choca los cinco"]){
 check(narration,{shouldExecute:false,speechAct:"statement"});
}
// Point 01: negation scope, multilingual prohibitions and quotation safety.
const blocked=[
 "No choques los cinco","No me toques","No respondas a esta pregunta",
 "No me expliques la clase","No busques mis apuntes","No me muestres la foto",
 "Por favor no abras el libro","Por favor no toques el perro",
 "No quiero que me choques los cinco","Don't high five",
 "Don't show my class notes","Can you please not open the book?",
 "Ne montre pas mon cours","N'explique pas les permutations",
 "Não mostre a aula","Non mostrare il libro",
 "Bitte nicht zeigen","Erkläre Permutationen nicht"
];
for(const phrase of blocked)
 check(phrase,{shouldExecute:false,negative:true,mayReadClass:false});
for(const phrase of [
 "La profesora dijo que no haga el ejercicio","No te quiero",
 "No me gusta el libro","No me amas","Me gusta high five"
])
 check(phrase,{shouldExecute:false,negative:false});
for(const phrase of [
 "¿Qué significa 'no hagas eso'?","Explicame qué significa no hagas eso",
 "Explicame la fotosíntesis sin usar mis apuntes","No entiendo qué es la fotosíntesis",
 "No, mejor decime qué es un impulso","Chocá los cinco","High five",
 "Erkläre das Wort nicht"
])
 check(phrase,{shouldExecute:true,negative:false});
check("Explicame la fotosíntesis sin usar mis apuntes",
 {source:"general",mayReadClass:false});
// Point 01: reported questions and quoted commands must not execute.
for(const utterance of ["Mi hermana dijo 'buscá en mis apuntes'",
 "Ayer escuché al profesor preguntar '¿Qué es permutación?'",
 "Mi mamá dijo 'chocá los cinco'",
 "My teacher said 'show my class notes'",
 "El profesor comentó «resuelve el ejercicio 4»"]){
 check(utterance,{speechAct:"statement",shouldExecute:false,mayReadClass:false});
}
for(const question of ["¿Qué dijo el profesor sobre 'chocá los cinco'?",
 "O que a professora disse sobre impulso?","¿Qué es permutación?"])
 check(question,{shouldExecute:true});
for(const [base,follow,part] of [
 ["¿Cómo va a estar el clima mañana?","¿Y en la tarde?","afternoon"],
 ["¿Cómo va a estar el clima mañana?","¿Y por la mañana?","morning"],
 ["¿Cómo va a estar el clima mañana?","¿Y en la noche?","night"],
 ["How is the weather tomorrow?","And in the afternoon?","afternoon"]
]){
 const first=planner.plan(base),context=planner.advance(planner.createContext(),first);
 check(follow,{intent:first.intent,source:first.source,needsClarification:false},{context});
 assert.equal(planner.plan(follow,{context}).entities.daypart,part,follow);count++;
}
for(const q of ["¿Y en la tarde?","¿Y de noche?","¿Y el otro?"])
 check(q,{shouldExecute:false,needsClarification:true,mayReadClass:false});
const definition=planner.plan("¿Qué es permutación?");
let context=planner.advance(planner.createContext(),definition);
context=planner.advance(context,planner.plan("Mi hermana dijo 'chocá los cinco'"));
check("¿Y el otro?",{intent:"definition",needsClarification:true},{context});
// Sequencing applies only to the speaker's instruction, not quoted speech.
for(const reported of [
 "La profesora dijo 'chocá los cinco y después mostrame el libro'",
 'Mi hermana contó "buscá la clase y después choca los cinco"',
 'Dijo "no abras el libro y después mirá el video"'
]){
 check(reported,{shouldExecute:false,speechAct:"statement",mayReadClass:false});
 assert.equal(planner.plan(reported).actions.length,1,reported);count++;
}
const metalinguistic=planner.plan('Explícame por qué se dice "esto y después aquello"');
assert.equal(metalinguistic.actions.length,1);count++;
const correctionSequence=planner.plan("No abras el libro, mejor explicame la teoría");
assert.equal(correctionSequence.actions.length,2);count++;
assert.equal(correctionSequence.actions[0].shouldExecute,false);count++;
assert.equal(correctionSequence.actions[1].shouldExecute,true);count++;
const preservedHighFive=planner.plan("Chocá los cinco y después haceme una pregunta");
assert.equal(preservedHighFive.actions.length,2);count++;
assert.equal(preservedHighFive.actions[0].shouldExecute,true);count++;
assert.equal(preservedHighFive.actions[1].intent,"quiz");count++;
console.log("Structured-planner checks passed:",count);
