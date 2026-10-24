// Structured planning layer. No retrieval happens until a source has been authorized.
// The planner is deterministic and extensible; it does not pretend to be a trained LLM.
(function(root){
"use strict";
const LANG={es:/\b(?:que|como|ayer|manana|profesora|explicame|ejercicio)\b/,en:/\b(?:what|how|yesterday|teacher|explain|exercise)\b/,pt:/\b(?:qual|ontem|amanha|professora|explique|exercicio)\b/,fr:/\b(?:quoi|hier|demain|professeur|explique|exercice)\b/,it:/\b(?:cosa|ieri|domani|professore|spiega|esercizio)\b/,de:/\b(?:was|gestern|morgen|lehrer|erklar|aufgabe)\b/};
const patterns={
 exercise:/\b(?:ejercici[oa]|problema|exercise|problem|exerc[ií]cio|exercice|esercizio|aufgabe)\b/i,
 class:/\b(?:clase|profesor(?:a)?|profe|apuntes|transcripci[oó]n|class|teacher|lecture|aula|professora|cours|professeur|lezione|unterricht|lehrer)\b/i,
 definition:/\b(?:qu[eé] (?:es|significa|ser[ií]a)|defin(?:ime|[ei]|ici[oó]n)|qu[eé] vendr[ií]a a ser|a qu[eé] le llaman|what (?:is|does)|define|o que [ée]|defina|c'est quoi|was ist|che cos'[eè])\b/i,
 explain:/\b(?:explic(?:ame|[aá])|entender|desarroll(?:a|ame)|explain|understand|explique|expliquer|spiega|erkl[aä]r)\b/i,
 compare:/\b(?:compar(?:a|[aá]me|aci[oó]n)|diferencia|compare|difference|diff[eé]rence|vergleich|differenza)\b/i,
 summary:/\b(?:resum(?:[ií]|en|ime)|sintetiz|summar|r[eé]sum|riassum|zusammenfass)\b/i,
 example:/\b(?:ejemplo|example|exemplo|exemple|esempio|beispiel)\b/i,
 weather:/\b(?:clima|tiempo meteorol[oó]gico|weather|previs[aã]o do tempo|m[eé]t[eé]o|wetter)\b/i,
 task:/\b(?:tarea|deberes|pendiente|task|homework|tarefa|devoirs|compiti|hausaufgabe)\b/i,
 book:/\b(?:libro|lectura|book|livro|livre|romanzo|buch)\b/i,
 date:/\b(?:fecha|calendario|date|data|datum)\b/i,
 time:/\b(?:hora|horario|time|schedule|heure|orario|uhrzeit)\b/i,
 correction:/\b(?:correg(?:[ií]|ime)|revis(?:[aá]|ame)|correct|corrig|korrigier)\b/i,
};
const step=/\b(?:paso a paso|todos los pasos|step by step|passo a passo|[eé]tape par [eé]tape|schritt f[uü]r schritt)\b/i;
const short=/\b(?:breve|r[aá]pid(?:o|amente)|en una frase|solo la definici[oó]n|brief|quickly|one sentence|resumidamente|kurz)\b/i;
const long=/\b(?:en profundidad|en detalle|detallad|deeply|in depth|ausf[uü]hrlich|approfondit)\b/i;
const relative=/\b(?:hoy|ayer|anteayer|ma[nñ]ana|anoche|semana pasada|[uú]ltima vez|today|yesterday|tomorrow|last week|ontem|amanh[aã]|hier|demain|gestern|morgen)\b/i;
function normalize(input){return String(input??"").normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g,"").replace(/\s+/g," ").trim();}
function fold(input){return normalize(input).toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function detectLanguage(input,fallback="es"){const s=fold(input);let best=fallback,score=0;for(const [code,re] of Object.entries(LANG)){const hits=s.match(new RegExp(re.source,"gi"))||[];if(hits.length>score){best=code;score=hits.length;}}return best;}
function temporal(text,now=new Date()){const q=fold(text);const d=new Date(now);d.setHours(0,0,0,0);let days=null;if(/\b(?:anteayer)\b/.test(q))days=-2;else if(/\b(?:ayer|yesterday|ontem|hier|gestern|ieri)\b/.test(q))days=-1;else if(/\b(?:hoy|today|hoje|aujourd'hui|oggi|heute)\b/.test(q))days=0;else if(/\b(?:manana|tomorrow|amanha|demain|domani|morgen)\b/.test(q))days=1;if(days===null)return null;d.setDate(d.getDate()+days);return {kind:"day",date:d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};}
function createContext(){return {version:1,turns:[],focus:null};}
function plan(raw,{context=createContext(),language,now=new Date()}={}){
 const text=normalize(raw),q=fold(text),previous=context?.focus||null;
 const lang=language||detectLanguage(text,previous?.language||"es");
 let intent="conversation",source="none",score=.52;
 if(!text)return {intent:"empty",source:"none",confidence:1,actions:[],language:lang,entities:{},depth:"normal",needsClarification:false};
 const explicit={class:patterns.class.test(q),exercise:patterns.exercise.test(q),weather:patterns.weather.test(q),task:patterns.task.test(q),book:patterns.book.test(q)};
 if(explicit.exercise){intent="exercise";source="materials";score=.9;}
 else if(explicit.class){intent="class-question";source="classes";score=.9;}
 else if(explicit.weather){intent="weather";source="weather";score=.91;}
 else if(explicit.task){intent="task";source="tasks";score=.85;}
 else if(explicit.book){intent="book";source="books";score=.81;}
 else if(patterns.correction.test(q)){intent="correction";source="conversation";score=.85;}
 else if(patterns.compare.test(q)){intent="comparison";source="general";score=.87;}
 else if(patterns.summary.test(q)){intent="summary";source="general";score=.84;}
 else if(patterns.definition.test(q)){intent="definition";source="general";score=.91;}
 else if(patterns.explain.test(q)){intent="explanation";source="general";score=.86;}
 else if(patterns.example.test(q)){intent="example";source="general";score=.79;}
 else if(patterns.date.test(q)){intent="date";source="calendar";score=.8;}
 else if(patterns.time.test(q)){intent="time";source="clock";score=.8;}
 else if(/\b(?:y de noche|and at night|e a noite|et le soir|und nachts|y manana|and tomorrow)\b/.test(q)&&previous){intent=previous.intent;source=previous.source;score=.83;}
 let depth=step.test(q)?"step-by-step":short.test(q)?"brief":long.test(q)?"detailed":intent==="definition"?"brief":"normal";
 const num=q.match(/\b(?:ejercicio|exercise|exercicio|exercice|esercizio|aufgabe)\s*(?:n(?:[uú]mero|ro)?\.?\s*)?(\d+)\b/);
 const entities={exerciseNumber:num?Number(num[1]):null,date:temporal(q,now)};
 // A class transcript containing a topic word is not sufficient to grant class access.
 const mayReadClass=source==="classes"||source==="materials";
 const clauseParts=text.split(/\s+(?:y despu[eé]s|despu[eé]s|and then|e depois|puis|poi)\s+/i);
 const actions=clauseParts.map((part,index)=>({index,text:part,intent:index===0?intent:"follow-up-action"}));
 const needsClarification=Boolean((intent==="conversation"&&/^\s*(?:eso|ese|aquello|el otro|y eso)\s*[?.!]*$/i.test(q)&&!previous));
 return {intent,source,confidence:score,language:lang,depth,entities,actions,mayReadClass,needsClarification,topic:text,contextual:Boolean(previous&&!Object.values(explicit).some(Boolean))};
}
function advance(context,planned){const next={version:1,turns:[...(context?.turns||[]).slice(-19),{intent:planned.intent,source:planned.source,language:planned.language,entities:planned.entities}],focus:{intent:planned.intent,source:planned.source,language:planned.language,entities:planned.entities}};return next;}
root.ROBOTITO_SEMANTIC_PLANNER={normalize,detectLanguage,temporal,createContext,plan,advance};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_SEMANTIC_PLANNER;
})(typeof window!=="undefined"?window:globalThis);
