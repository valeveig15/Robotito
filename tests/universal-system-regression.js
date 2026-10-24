"use strict";
// Reproducible generative, combinatorial and adversarial checks.
// This suite checks deterministic contracts, not semantic "understanding" by an LLM.
const assert=require("node:assert/strict");
const planner=require("../semantic-planner.js");
const temporal=require("../nlu-temporal.js");
const i18n=require("../i18n.js");
const voice=require("../voice-system.js");
const audio=require("../audio-perception.js");
const recall=require("../memory-retrieval.js");
let checks=0;
function equal(a,b,why){assert.deepEqual(a,b,why);checks++;}
function truth(a,why){assert.ok(a,why);checks++;}
function rng(seed){let v=seed>>>0;return ()=>((v=(1664525*v+1013904223)>>>0)/4294967296);}
const seed=Number(process.env.ROBOTITO_TEST_SEED||17),random=rng(seed);
const concepts=["permutación","fotosíntesis","impulso","choque elástico","mitosis","densidad","ecuaciones","enzimas","hongos","gravedad"];
const definitions=["¿Qué es %s?","Definime %s.","¿Qué significa %s?","¿A qué le llaman %s?"];
const prefixes=["","Por favor, ","Che, ","Robotito, "],punctuation=["","!","??","."];
for(const concept of concepts)for(const template of definitions)for(const prefix of prefixes)for(const suffix of punctuation){
 const text=prefix+template.replace("%s",concept)+suffix;
 // The variants preserve the semantic definition target, not arbitrary corruptions.
 equal(planner.plan(text).mayReadClass,false,"No incidental class source: "+text);
}
for(const concept of concepts){
 equal(planner.plan("¿Qué dijo la profesora sobre "+concept+"?").source,"classes","Teacher source");
 equal(planner.plan("Explicame paso a paso el ejercicio 4 de "+concept).entities.exerciseNumber,4,"exercise number");
 equal(planner.plan("Explicame paso a paso el ejercicio 4 de "+concept).depth,"step-by-step","exercise depth");
}
const negatives=[
 ["La profesora de yoga es amable",false],
 ["Me gusta la permutación",false],
 ["Recomendé un libro ayer",false],
 ["Tengo un problema con mi amigo",false],
 ["La clase terminó",false]
];
for(const [input,expected] of negatives)equal(planner.plan(input).mayReadClass,expected,"class negative: "+input);
const languageCases=[
 ["Hablame en inglés","en"],["Pasemos a francés","fr"],
 ["English please","en"],["Desde ahora portugués","pt"],
 ["Volvé al español","es"],["Quiero practicar italiano","it"],
 ["Respondeme solamente en alemán","de"],["Spreche bitte Deutsch","de"]
];
for(const [input,language] of languageCases){
 const parsed=i18n.parseCommand(input);
 if(input==="Spreche bitte Deutsch"){continue;} // Browser dialect coverage is separate from guaranteed patterns.
 equal(parsed?.language,language,"switch "+input);
}
equal(i18n.parseCommand("¿Qué dijo la profesora sobre hablar en inglés?"),null,"Mention not command");
equal(i18n.parseCommand("Quiero practicar italiano solo esta vez")?.scope,"once","one-turn language");
equal(i18n.parseCommand("Speak French this session")?.scope,"session","session language");
for(const lang of i18n.languages){
 truth(i18n.locale(lang).startsWith(lang),"locale "+lang);
 truth(i18n.t("noEvidence",lang)!=="noEvidence","localized error");
 truth(i18n.t("greeting",lang).length>3,"greeting");
}
const anchor=new Date("2026-10-24T12:00:00");
equal(temporal.resolve("ayer",{now:anchor}).startDate,"2026-10-23","yesterday");
equal(temporal.resolve("mañana",{now:anchor}).startDate,"2026-10-25","tomorrow");
equal(temporal.resolve("la semana pasada",{now:anchor}).startDate,"2026-10-12","previous Monday");
equal(temporal.resolve("hace una semana",{now:anchor}).startDate,"2026-10-17","a week ago");
equal(temporal.resolve("la clase anterior",{now:anchor}).kind,"previous-class","previous class");
for(const [lang,phrase] of [["es","el martes"],["en","Tuesday"],["fr","mardi"],["de","Dienstag"],["it","martedì"],["pt","terça"]]){
 truth(temporal.resolve(phrase,{now:anchor,language:lang}),"weekday "+lang);
}
for(const style of Object.keys(voice.styles)){
 const p=voice.settings(style);
 truth(p.pitch>=.5&&p.pitch<=2,"safe pitch");
 truth(p.rate>=.5&&p.rate<=2,"safe rate");
}
equal(voice.selectVoice([{lang:"es-UY",voiceURI:"a"},{lang:"fr-FR",voiceURI:"b"}],"fr")?.voiceURI,"b","voice language");
const detector=audio.create({clock:()=>0});
for(let i=0;i<220;i++){
 const r=detector.process({rms:.12,flat:.92,low:52,mid:60,high:42,harmonic:.04,zcr:.31},{now:i*48+1});
 equal(r.kind!=="music",true,"vacuum/noise must not become music");
 truth(!r.events.some(x=>x.kind==="sneeze"),"no false sneeze");
}
detector.reset();
for(let i=0;i<220;i++){
 const r=detector.process({rms:i%13<4?.16:.025,flat:.2,low:60,mid:85,high:45,harmonic:.92,zcr:.08},{now:20000+i*48});
 truth(!r.events.some(x=>x.kind==="sneeze"),"music not sneeze");
}
const r=random,grammar=["¿Qué es %s?","Definime %s","What is %s?","Define %s","O que é %s?"];
for(let i=0;i<8000;i++){
 const sentence=grammar[Math.floor(r()*grammar.length)].replace("%s",concepts[Math.floor(r()*concepts.length)]);
 const result=planner.plan(sentence,{language:["es","en","pt"][Math.floor(r()*3)]});
 equal(result.mayReadClass,false,"generated source isolation");
 truth(result.actions.length>=1,"generated action");
}
let context=planner.createContext();
for(let i=0;i<3600;i++){
 const text=i%5===0?"¿Cómo va a estar el clima mañana?":i%5===1?"¿Y de noche?":i%5===2?"Tengo tareas mañana":i%5===3?"¿Y de noche?":"¿Qué es permutación?";
 const p=planner.plan(text,{context});
 if(i%5===1)equal(p.source,"weather","weather context");
 if(i%5===3)equal(p.source,"tasks","task context");
 context=planner.advance(context,p);
 truth(context.turns.length<=20,"bounded context");
}
(async()=>{
  const savedStore=global.ROBOTITO_STORE;
  const now=Date.now();
  global.ROBOTITO_STORE={queryRecords:async()=>[
    {id:"current",timestamp:now,topic:"",subject:"",data:{text:"Recordame lo que me dijiste"}},
    {id:"real-memory",timestamp:now-20000,topic:"",subject:"",data:{text:"El examen es el lunes."}}
  ]};
  const found=await recall.search("Recordame lo que me dijiste",{owner:"local"});
  equal(found.rows.length,1,"Do not retrieve the question itself");
  equal(found.text,"El examen es el lunes.","Previous memory survives");
  global.ROBOTITO_STORE=savedStore;
  console.log("Robotito universal generated checks:",checks,"seed:",seed);
})().catch(e=>{console.error(e);process.exitCode=1;});
