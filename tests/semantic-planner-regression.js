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
const singleCorrection=planner.plan("No, mejor decime la definición");
assert.equal(singleCorrection.actions.length,1);count++;
assert.equal(singleCorrection.intent,"definition");count++;
const correctionSequence=planner.plan("No abras el libro, mejor explicame la teoría");
assert.equal(correctionSequence.actions.length,2);count++;
assert.equal(correctionSequence.actions[0].shouldExecute,false);count++;
assert.equal(correctionSequence.actions[1].shouldExecute,true);count++;
const preservedHighFive=planner.plan("Chocá los cinco y después haceme una pregunta");
assert.equal(preservedHighFive.actions.length,2);count++;
assert.equal(preservedHighFive.actions[0].shouldExecute,true);count++;
assert.equal(preservedHighFive.actions[1].intent,"quiz");count++;
// Generative 50+ variants per topic: courtesy, vocatives, punctuation,
// paraphrase and conditional morphology must preserve definition intent.
for(const question of ["Che cos'è enzimas?","Che cos'è massa?",
 "Che cos'è la fotosintesi?","Che, Robotito, qué es permutación?"]){
 const answer=planner.plan(question,{language:/\bcos/i.test(question)?"it":"es"});
 assert.equal(answer.intent,"definition",question);count++;
 assert.equal(answer.shouldExecute,true,question);count++;
}
const definitionForms=[
 "qué es","que es","decime qué es","explicame qué es",
 "me podés decir qué es","podés explicarme qué es","quisiera saber qué es",
 "no entiendo qué es","necesito saber qué es","cuál es la definición de",
 "dame la definición de","definime","definí","definí brevemente",
 "podrías definir","explicá brevemente qué significa","qué significa",
 "significa","cómo definirías","me explicas qué significa"
];
let generated=0;
for(const subject of ["permutación","masa","fotosíntesis"])
 for(const courtesy of ["","por favor ","Robotito, "])
  for(const form of definitionForms)
   for(const punctuation of ["","?"]){
    const query=courtesy+form+" "+subject+punctuation;
    const frame=planner.plan(query);
    assert.equal(frame.intent,"definition",query);count++;
    assert.equal(frame.source,"general",query);count++;
    assert.equal(frame.shouldExecute,true,query);count++;
    assert.equal(frame.mayReadClass,false,query);count++;
    generated++;
   }
assert.equal(generated,360);count++;
// A follow-up reuses only a known conversational antecedent.
const priorFrame=planner.plan("¿Qué es fotosíntesis?");
const previousContext=planner.advance(planner.createContext(),priorFrame);
for(const [utterance,kind,target] of [
 ["¿Y en portugués?","language","pt"],["And in English?","language","en"],
 ["Et en français?","language","fr"],["e em português?","language","pt"],
 ["más breve","brief"],["explicalo más breve","brief"],
 ["más en profundidad","detailed"],["desarrollalo","detailed"],
 ["como para un examen","exam"],["¿y con un ejemplo?","example"]]){
 const follow=planner.plan(utterance,{context:previousContext});
 assert.equal(follow.intent,"follow-up",utterance);count++;
 assert.equal(follow.followUp.kind,kind,utterance);count++;
 assert.equal(follow.followUp.targetLanguage,target,utterance);count++;
 assert.equal(follow.shouldExecute,true,utterance);count++;
 assert.equal(follow.mayReadClass,false,utterance);count++;
 assert.equal(planner.advance(previousContext,follow).focus.intent,priorFrame.intent,utterance);count++;
 const isolated=planner.plan(utterance);
 assert.equal(isolated.shouldExecute,false,utterance);count++;
 assert.equal(isolated.needsClarification,true,utterance);count++;
}
for(const request of ["Explicame masa en italiano","¿Qué es masa?","No choques los cinco",
 "La profesora dijo '¿Y en portugués?'"]){
 const frame=planner.plan(request,{context:previousContext});
 assert.notEqual(frame.intent,"follow-up",request);count++;
}
const exam=planner.plan("Explicame fotosíntesis para un examen");
assert.equal(exam.depth,"exam");count++;

const p01Cases={"es":["¿Qué es permutación?","¿Qué dijo la profesora sobre impulso?","No me expliques permutación"],"en":["What is permutation?","What did the teacher say about momentum?","Don't explain permutation"],"pt":["O que é permutação?","O que a professora disse sobre impulso?","Não explique permutação"],"fr":["C'est quoi permutation?","Qu'a dit le professeur sur impulsion?","N'explique pas permutation"],"it":["Che cos'è permutazione?","Cosa ha detto il professore su impulso?","Non spiegare permutazione"],"de":["Was ist Permutation?","Was sagte der Lehrer über Impuls?","Erkläre Permutation nicht"]};
const p01Expected=[
 {intent:"definition",source:"general",shouldExecute:true,mayReadClass:false},
 {intent:"class-question",source:"classes",shouldExecute:true,mayReadClass:true},
 {shouldExecute:false,mayReadClass:false}
];
let p01Runs=0;
for(const [language,phrases] of Object.entries(p01Cases)){
 for(let kind=0;kind<phrases.length;kind++){
  const unique=new Set();
  for(const prefix of ["","Robotito, ","por favor ","Robotito, por favor "])
   for(const spaces of [" ","  "])
    for(const caps of ["original","upper","lower"])
     for(const tail of [""," ","  "]){
      let sentence=prefix+phrases[kind];
      if(caps==="upper")sentence=sentence.toUpperCase();
      if(caps==="lower")sentence=sentence.toLowerCase();
      if(spaces==="  ")sentence=sentence.replace(/ /g,"  ");
      unique.add(" "+sentence+tail);
     }
  assert.ok(unique.size>=50,language+" / insufficient generated variants");count++;
  for(const utterance of [...unique].slice(0,50)){
   const actual=planner.plan(utterance,{language,channel:"typed"});
   for(const [field,want] of Object.entries(p01Expected[kind])){
    assert.deepEqual(actual[field],want,language+"/"+kind+" / "+utterance+" / "+field);count++;
   }
   const audio=planner.plan(utterance,{language,channel:"voice"});
   assert.deepEqual([actual.intent,actual.source,actual.shouldExecute,actual.mayReadClass],
     [audio.intent,audio.source,audio.shouldExecute,audio.mayReadClass],utterance+" typed/voice");count++;
   p01Runs++;
  }
 }
}
assert.equal(p01Runs,900);count++;
// Negation never authorizes the forbidden source; an independent instruction
// after it remains executable, and unresolved references ask for clarification.
for(const [utterance,lastIntent,lastSource] of [
 ["No me muestres el libro pero decime el clima","weather","weather"],
 ["No me digas los resultados, haceme una pregunta","quiz","conversation"],
 ["No busques en mis apuntes, explicame una permutación","explanation","general"],
 ["No quiero estudiar pero dame una definición","definition","general"],
 ["No me expliques el ejercicio 4, resolvelo","exercise","materials"]
]){
 const frame=planner.plan(utterance);
 assert.equal(frame.actions.length,2,utterance);count++;
 assert.equal(frame.actions[0].shouldExecute,false,utterance);count++;
 assert.equal(frame.actions[1].shouldExecute,true,utterance);count++;
 assert.equal(frame.actions[1].intent,lastIntent,utterance);count++;
 assert.equal(frame.actions[1].source,lastSource,utterance);count++;
}
const exerciseFrame=planner.plan("No me expliques el ejercicio 4, resolvelo");
assert.equal(exerciseFrame.actions[1].entities.exerciseNumber,4);count++;
check("No me expliques el ejercicio, resolvelo",{shouldExecute:false,needsClarification:true});
check("resolvelo",{shouldExecute:false,needsClarification:true});
check("La profesora dijo 'no me expliques y después mostrámelo'",{shouldExecute:false});
console.log("P01 acceptance matrix: "+p01Runs+" six-language variants; negation and clarification checks passed");
console.log("Structured-planner checks passed:",count);
