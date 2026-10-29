"use strict";
// Deterministic, bounded semantic audit. Every sample has an explicit oracle.
// There is no claim of measuring ungenerated phrases or human comprehension.
const fs=require("node:fs");
const planner=require("../semantic-planner.js");
const languages=["es","en","pt","fr","it","de"];
const frames={
 es:{definition:"¿Qué es {topic}?",class:"¿Qué dijo la profesora sobre {topic}?",statement:"La profesora dijo que estudiamos {topic}",exercise:"Explicame paso a paso el ejercicio {number} de {topic}",negative:"No me expliques {topic}"},
 en:{definition:"What is {topic}?",class:"What did the teacher say about {topic}?",statement:"The teacher said that we studied {topic}",exercise:"Explain step by step exercise {number} about {topic}",negative:"Don't explain {topic}"},
 pt:{definition:"O que é {topic}?",class:"O que a professora disse sobre {topic}?",statement:"A professora disse que estudamos {topic}",exercise:"Explique passo a passo o exercicio {number} de {topic}",negative:"Não explique {topic}"},
 fr:{definition:"C'est quoi {topic}?",class:"Qu'a dit le professeur sur {topic}?",statement:"Le professeur a dit que nous étudions {topic}",exercise:"Explique étape par étape l'exercice {number} de {topic}",negative:"N'explique pas {topic}"},
 it:{definition:"Che cos'è {topic}?",class:"Cosa ha detto il professore su {topic}?",statement:"Il professore ha detto che studiamo {topic}",exercise:"Spiega passo passo l'esercizio {number} di {topic}",negative:"Non spiegare {topic}"},
 de:{definition:"Was ist {topic}?",class:"Was sagte der Lehrer über {topic}?",statement:"Der Lehrer sagte wir lernen {topic}",exercise:"Erkläre Schritt für Schritt Aufgabe {number} in {topic}",negative:"Erkläre {topic} nicht"}
};
const expected={
 definition:{intent:"definition",source:"general",shouldExecute:true,mayReadClass:false},
 class:{intent:"class-question",source:"classes",shouldExecute:true,mayReadClass:true},
 statement:{speechAct:"statement",shouldExecute:false,mayReadClass:false},
 exercise:{intent:"exercise",source:"materials",shouldExecute:true,mayReadClass:true,depth:"step-by-step"},
 negative:{shouldExecute:false,mayReadClass:false}
};
function positiveInt(name,fallback,max){const x=Number(process.env[name]??fallback);if(!Number.isSafeInteger(x)||x<0||x>max)throw Error(name+" must be integer in range 0.."+max);return x;}
const seed=positiveInt("ROBOTITO_AUDIT_SEED",17,2147483647);
const batch=positiveInt("ROBOTITO_AUDIT_BATCH",0,99999);
const perLanguage=positiveInt("ROBOTITO_AUDIT_CASES",60,10000);
if(perLanguage<1)throw Error("ROBOTITO_AUDIT_CASES must be positive");
const langs=(process.env.ROBOTITO_AUDIT_LANGUAGES||languages.join(",")).split(",").filter(Boolean);
if(!langs.length||langs.some(x=>!languages.includes(x))||new Set(langs).size!==langs.length)
 throw Error("Language selection must use unique es,en,pt,fr,it,de");
const topics=["impulso","permutación","fotosíntesis","mitosis","densidad","enzimas"];
const families=Object.keys(expected);
function random32(n){let v=n>>>0;v^=v<<13;v^=v>>>17;v^=v<<5;return v>>>0;}
function inputFor(language,family,index){
 let n=random32((seed^Math.imul(batch+1,0x9e3779b1)^Math.imul(index+1,0x85ebca6b)^Math.imul(languages.indexOf(language)+1,0xc2b2ae35))>>>0);
 const topic=topics[n%topics.length];
 n=random32(n);
 const number=[1,4,27,95][n%4];
 let base=frames[language][family].replaceAll("{topic}",topic).replaceAll("{number}",String(number));
 const variant=(n>>>3)%6;
 if(variant===1)base=base.toUpperCase();
 if(variant===2)base="  "+base+"  ";
 if(variant===3)base=base.replaceAll(" ","  ");
 if(variant===4)base=base.toLowerCase();
 if(variant===5)base="\t"+base+"\t";
 return {base,topic,number,variant};
}
const totals=Object.fromEntries(langs.map(x=>[x,{cases:0,checks:0,errors:0,families:Object.fromEntries(families.map(f=>[f,{cases:0,errors:0}]))}]));
const examples=[];
for(const lang of langs)for(let i=0;i<perLanguage;i++){
 const family=families[(i+batch)%families.length];
 const row=inputFor(lang,family,i);
 const stats=totals[lang],byFamily=stats.families[family];
 stats.cases++;byFamily.cases++;
 let actual;
 try{actual=planner.plan(row.base,{language:lang,channel:i%2?"spoken":"typed"});}
 catch(e){stats.errors++;byFamily.errors++;if(examples.length<16)examples.push({lang,family,input:row.base,error:String(e)});continue;}
 let bad=[];
 for(const [key,value] of Object.entries(expected[family])){
  stats.checks++;
  if(actual[key]!==value)bad.push({key,wanted:value,actual:actual[key]});
 }
 if(family==="exercise"){stats.checks++;if(actual.entities?.exerciseNumber!==row.number)bad.push({key:"exerciseNumber",wanted:row.number,actual:actual.entities?.exerciseNumber});}
 if(bad.length){
  stats.errors++;byFamily.errors++;
  if(examples.length<16)examples.push({lang,family,input:row.base,bad});
 }
}
const report={schemaVersion:1,source:"generated deterministic regression, not a real-user corpus",
 seed,batch,perLanguage,perLanguageErrorRates:Object.fromEntries(langs.map(l=>[l,{
  cases:totals[l].cases,checks:totals[l].checks,errors:totals[l].errors,
  errorRate:totals[l].errors/totals[l].cases,byFamily:totals[l].families
 }])),examples};
console.log(JSON.stringify(report));
if(process.env.ROBOTITO_AUDIT_REPORT)fs.writeFileSync(process.env.ROBOTITO_AUDIT_REPORT,JSON.stringify(report,null,2)+"\n");
if(examples.length)process.exitCode=1;
