"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const kit=require("./generative-kit.js");
const planner=require("../semantic-planner.js");
const temporal=require("../nlu-temporal.js");
const i18n=require("../i18n.js");
const voice=require("../voice-system.js");
const audio=require("../audio-perception.js");
const weather=require("../weather-forecast.js");
const seed=process.env.ROBOTITO_TEST_SEED||17;
const scale=Number(process.env.ROBOTITO_PROP_SCALE||1);
if(!Number.isInteger(scale)||scale<1||scale>5)throw Error("ROBOTITO_PROP_SCALE must be 1..5");
let checks=0,propertyRuns=0;
function eq(actual,expected,label){assert.deepEqual(actual,expected,label);checks++;}
function ok(condition,label){assert.ok(condition,label);checks++;}
async function property(spec){
 const report=await kit.checkProperty({...spec,seed,runs:spec.runs*scale});
 propertyRuns+=report.checked;return report;
}
const locales=["es","en","pt","fr","it","de"];
const concepts=["permutación","clima","libro","profesora","impulso","densidad","enzimas"];
const templates={
 es:{definition:"¿Qué es {topic}?",teacher:"¿Qué dijo la profesora sobre {topic}?",statement:"La profesora dijo que estudiamos {topic}",exercise:"Explicame paso a paso el ejercicio {number} de {topic}",negated:"No me expliques {topic}"},
 en:{definition:"What is {topic}?",teacher:"What did the teacher say about {topic}?",statement:"The teacher said that we studied {topic}",exercise:"Explain step by step exercise {number} about {topic}",negated:"Don't explain {topic}"},
 pt:{definition:"O que é {topic}?",teacher:"O que a professora disse sobre {topic}?",statement:"A professora disse que estudamos {topic}",exercise:"Explique passo a passo o exercicio {number} de {topic}",negated:"Não explique {topic}"},
 fr:{definition:"C'est quoi {topic}?",teacher:"Qu'a dit le professeur sur {topic}?",statement:"Le professeur a dit que nous étudions {topic}",exercise:"Explique étape par étape l'exercice {number} de {topic}",negated:"N'explique pas {topic}"},
 it:{definition:"Che cos'è {topic}?",teacher:"Cosa ha detto il professore su {topic}?",statement:"Il professore ha detto che studiamo {topic}",exercise:"Spiega passo passo l'esercizio {number} di {topic}",negated:"Non spiegare {topic}"},
 de:{definition:"Was ist {topic}?",teacher:"Was sagte der Lehrer über {topic}?",statement:"Der Lehrer sagte wir lernen {topic}",exercise:"Erkläre Schritt für Schritt Aufgabe {number} in {topic}",negated:"Erkläre {topic} nicht"}
};
const beforeContext={
 weather:"¿Cómo va a estar el clima mañana?",
 task:"Tengo tareas mañana",
 academic:"¿Qué dijo la profesora sobre impulso?"
};
function sourceContext(kind,now){
 let ctx=planner.createContext();
 if(beforeContext[kind])ctx=planner.advance(ctx,planner.plan(beforeContext[kind],{now}));
 return ctx;
}
function sentence({language,mode,concept,number,depth,punctuation}){
 const key=mode==="class"?"teacher":mode==="statement"?"statement":
   mode==="exercise"?"exercise":mode==="negative"?"negated":"definition";
 let text=templates[language][key].replaceAll("{topic}",concept).replaceAll("{number}",String(number));
 if(depth==="detailed"&&["class","definition"].includes(mode))text+=" en profundidad";
 if(depth==="brief"&&mode==="class")text+=" en una frase";
 if(mode==="statement"||mode==="negative")return text+(punctuation==="extra"?"!":".");
 return text+(punctuation==="extra"?"?":"");
}
(async()=>{
 const factors={
   language:locales,channel:["typed","spoken"],mode:["definition","class","statement","exercise","negative"],
   context:["empty","weather","task","academic"],concept:concepts,
   number:[1,4,27,95],depth:["normal","brief","detailed"],punctuation:["regular","extra"]
 };
 const criticalTriples=[
   ["language","channel","mode"],["mode","context","concept"],
   ["mode","number","depth"],["language","mode","punctuation"]
 ];
 const cases=kit.coveringArray(factors,{seed,criticalTriples,maxCases:1500,candidates:32});
 const coverage=kit.coverageReport(cases,factors,{criticalTriples});
 ok(coverage.complete,"all pairwise and critical triples covered");
 eq(coverage.targets,785,"all 465 pairs and 320 critical triples enumerated");
 const anchor=new Date("2026-10-24T12:00:00");
 for(const row of cases){
   const input=sentence(row);
   const opts={language:row.language,channel:row.channel,context:sourceContext(row.context,anchor),now:anchor};
   const frame=planner.plan(input,opts);
   const fields={definition:["definition","general",true,false],
     class:["class-question","classes",true,true],
     statement:[null,null,false,false],
     exercise:["exercise","materials",true,true],
     negative:[null,null,false,false]}[row.mode];
   if(fields[0])eq(frame.intent,fields[0],"intent "+JSON.stringify(row));
   if(fields[1])eq(frame.source,fields[1],"source "+JSON.stringify(row));
   eq(frame.shouldExecute,fields[2],"execute "+JSON.stringify(row));
   eq(frame.mayReadClass,fields[3],"readClass "+JSON.stringify(row));
   if(row.mode==="statement")eq(frame.speechAct,"statement","reported statement "+JSON.stringify(row));
   if(row.mode==="exercise"){
     eq(frame.entities.exerciseNumber,row.number,"exercise identity "+JSON.stringify(row));
     eq(frame.depth,"step-by-step","pedagogic depth "+JSON.stringify(row));
   }
   const otherChannel=planner.plan(input,{...opts,channel:row.channel==="typed"?"spoken":"typed"});
   eq([otherChannel.intent,otherChannel.source,otherChannel.shouldExecute,otherChannel.mayReadClass],
     [frame.intent,frame.source,frame.shouldExecute,frame.mayReadClass],
     "spoken/typed semantic equivalence "+JSON.stringify(row));
 }
 console.log("Covering matrix:",cases.length,"rows /",coverage.covered,"verified pair/triple targets");

 await property({name:"normalization-metamorphic",runs:1800,
   generate:r=>{
     const language=r.pick(locales),concept=r.pick(concepts),mode=r.pick(["definition","class","statement","exercise"]);
     const base=sentence({language,concept,mode,number:r.int(1,100),depth:"normal",punctuation:"regular"});
     return {base,shift:r.pick(["upper","spaces","trim","normal"])};
   },
   check:({base,shift})=>{
     const input=shift==="upper"?base.toUpperCase():
       shift==="spaces"?base.replace(/ /g,"  "):
       shift==="trim"?" \t "+base+"  ":base;
     const original=planner.plan(base),changed=planner.plan(input);
     eq([changed.intent,changed.source,changed.shouldExecute,changed.mayReadClass,changed.entities.exerciseNumber],
       [original.intent,original.source,original.shouldExecute,original.mayReadClass,original.entities.exerciseNumber],
       "case/whitespace invariance");
   }
 });

 await property({name:"relative-date-property",runs:850,
   generate:r=>({
     year:r.int(2020,2035),month:r.int(0,11),day:r.int(1,27),
     direction:r.pick([-2,-1,0,1]),
     language:r.pick(locales)
   }),
   check:({year,month,day,direction,language})=>{
     const inputs={
       es:["anteayer","ayer","hoy","mañana"],en:["day before yesterday","yesterday","today","tomorrow"],
       pt:["anteontem","ontem","hoje","amanhã"],fr:["avant hier","hier","aujourd'hui","demain"],
       it:["l'altro ieri","ieri","oggi","domani"],de:["vorgestern","gestern","heute","morgen"]
     };
     const now=new Date(year,month,day,12),expected=new Date(now);
     expected.setHours(0,0,0,0);expected.setDate(expected.getDate()+direction);
     const input=inputs[language][direction+2],actual=temporal.resolve(input,{now,language});
     ok(actual!==null,"relative date parsed "+input);
     eq(actual.startDate,temporal.iso(expected),"relative day "+input);
     eq(actual.precision,"day","daily granularity");
     ok(actual.end>actual.start,"positive interval");
   }
 });

 await property({name:"weather-date-evidence",runs:400,
   generate:r=>({days:r.int(2,7),dateIndex:r.int(0,1),
     first:r.int(-10,32),rain:r.int(0,75),language:r.pick(locales)}),
   check:({days,dateIndex,first,rain,language})=>{
     const base=new Date("2026-10-24T12:00:00");
     const dates=Array.from({length:days},(_,i)=>{
       const date=new Date(base);date.setDate(date.getDate()+i);
       return temporal.iso(date);
     });
     const daily={
       time:dates,temperature_2m_max:dates.map((_,i)=>first+i*2),
       temperature_2m_min:dates.map((_,i)=>first-8+i),
       precipitation_probability_max:dates.map((_,i)=>rain+i),
       weather_code:dates.map((_,i)=>i%4)
     };
     const hourly={time:[],temperature_2m:[],precipitation_probability:[],weather_code:[]};
     for(let d=0;d<days;d++)for(let hour=19;hour<=23;hour++){
       hourly.time.push(dates[d]+"T"+hour+":00");
       hourly.temperature_2m.push(first+d+hour-19);
       hourly.precipitation_probability.push(rain+d+hour-19);
       hourly.weather_code.push(d);
     }
     const data={current:{time:dates[0]+"T12:00",temperature_2m:first-1,apparent_temperature:first-2,weather_code:0},daily,hourly};
     const index=dateIndex%days;
     const chosen=weather.choose(data,{date:dates[index]});
     eq(chosen.high,first+index*2,"daily maximum must use selected date");
     eq(chosen.isCurrent,index===0,"historical current observations not future");
     const night=weather.choose(data,{date:dates[index],daypart:"night"});
     eq(night.timeSource,"hourly","night uses hourly data");
     eq(night.rain,rain+index+4,"night peak precipitation");
     ok(!/NaN|undefined/.test(weather.describe(night,{language})),"localized forecast has no invented numbers");
     eq(weather.choose(data,{date:"2099-12-31"}),null,"unavailable date not invented");
   }
 });

 await property({name:"audio-noise-suppression",runs:100,
   generate:r=>({volume:r.int(4,25)/100,flat:r.int(78,99)/100,
     rhythm:r.int(1,20),interrupted:r.bool(),duration:r.int(60,100)}),
   check:({volume,flat,rhythm,interrupted,duration})=>{
     const observed=[],detector=audio.create({onEvent:e=>observed.push(e),clock:()=>0});
     for(let i=0;i<duration;i++){
       const now=100+i*50;
       const frame={rms:volume,flat,harmonic:.02,zcr:.37,low:50,mid:60,high:20,centroid:.5};
       const outcome=detector.process(frame,{now,suppress:interrupted&&i>duration/2&&i<duration/2+3});
       ok(!outcome.events.some(e=>["music","sneeze"].includes(e.kind)),"steady noise never music/sneeze");
       if(interrupted&&i===Math.floor(duration/2)+1)eq(outcome.events.length,0,"suppressed sound has no events");
     }
     ok(!observed.some(e=>["music","sneeze"].includes(e.kind)),"callback no noise false positive");
     detector.reset();
     eq(detector.getStatus().musicEvidence,0,"detector resets musical evidence");
   }
 });

 await property({name:"voice-locale-safety",runs:700,
   generate:r=>({style:r.pick(Object.keys(voice.styles)),language:r.pick(locales),
     pitch:r.int(-25,50)/10,rate:r.int(-25,50)/10,priority:r.bool()}),
   check:({style,language,pitch,rate,priority})=>{
     const cfg=voice.settings(style,pitch,rate);
     ok(cfg.pitch>=.5&&cfg.pitch<=2&&Number.isFinite(cfg.pitch),"clamped pitch");
     ok(cfg.rate>=.5&&cfg.rate<=2&&Number.isFinite(cfg.rate),"clamped rate");
     ok(cfg.volume>=0&&cfg.volume<=1,"safe volume");
     const voices=[{lang:"es-UY",voiceURI:"es"},{lang:"fr-FR",voiceURI:"fr"},
       {lang:"en-US",voiceURI:"en"},{lang:"de-DE",voiceURI:"de"},
       {lang:"pt-BR",voiceURI:"pt"},{lang:"it-IT",voiceURI:"it"}];
     const selected=voice.selectVoice(voices,language,priority?language:undefined);
     ok(selected&&selected.lang.toLowerCase().startsWith(language),"voice obeys response language");
     ok(i18n.locale(language).startsWith(language),"locale consistent");
   }
 });

 const sandbox={};sandbox.window=sandbox;vm.runInNewContext(
   fs.readFileSync(path.join(__dirname,"..","emotional-dialogue.js"),"utf8"),sandbox);
 const emotional=sandbox.ROBOTITO_EMOTION_DIALOGUE;
 await property({name:"emotion-and-quoted-text",runs:450,
   generate:r=>({phrase:r.pick([
     ["te quiero mucho","affection"],["me caes mal","rejection"],["perdón robotito, te traté mal","apology"],
     ["qué significa te quiero",null],["Me gusta Bambi",null],["tranquilo, no hay ningún monstruo","reassurance"]]),
     style:r.pick(["plain","upper","extra-space","question"])}),
   check:({phrase:[raw,expected],style})=>{
     const text=style==="upper"?raw.toUpperCase():style==="extra-space"?raw.replace(/ /g,"  "):
       style==="question"?raw+"!":raw;
     eq(emotional.classify(text)?.id||null,expected,"emotion classification invariant");
   }
 });

 let context=planner.createContext();
 const focusSamples=["¿Cómo va a estar el clima mañana?","¿Y de noche?","Tengo tareas mañana",
   "¿Y de noche?","¿Qué es permutación?","La profesora habló de impulso","No me muestres apuntes"];
 for(let i=0;i<5000;i++){
   const input=focusSamples[i%focusSamples.length];
   const frame=planner.plan(input,{context});
   context=planner.advance(context,frame);
   ok(context.turns.length<=20,"conversation memory bounded on long session");
   if(frame.negative)ok(!frame.mayReadClass,"negated long-session source isolation");
 }
 console.log("Robotito behavior properties:",propertyRuns,"generated cases,",checks,
   "assertions, seed:",seed);
})().catch(error=>{console.error(error);process.exitCode=1;});
