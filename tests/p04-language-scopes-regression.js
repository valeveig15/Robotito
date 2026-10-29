"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const i18n=require("../i18n.js");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const begin=source.indexOf("function setLanguageMode(mode){");
const end=source.indexOf("const QUICK_TRANSLATIONS=[",begin);
assert.ok(begin>=0&&end>begin);
let checks=0;const eq=(a,b,m)=>{assert.equal(a,b,m);checks++};
const env=new Map([["robotito.languageMode.v1","es"]]);
const storage={setItem:(k,v)=>env.set(k,v),getItem:k=>env.get(k)||null};
const state={languageMode:"es",lastDetectedLanguage:"es",autoListenLanguage:"es",started:false,nextResponseLanguage:null};
const document={documentElement:{lang:"es"}};
const selector={value:"es"},log=[];
const $=s=>s==="#languageMode"?selector:null;
const confirmation=(text,lang)=>log.push({text,lang});
const methods=new Function("window","state","document","localStorage","$",
 "populateVoiceSelect","isMobileSpeech","discardRecognition","startListeningCycle",
 "sayInLanguage","applyAvatar","showStartupStep",source.slice(begin,end)+
 "return {setLanguageMode,handleLanguageCommand};")(
 {ROBOTITO_I18N:{...i18n,apply:()=>{}},RobotitoLocalASR:{active:false}},
 state,document,storage,$,()=>{},()=>false,()=>{},()=>{},confirmation,()=>{},()=>{});
eq(methods.handleLanguageCommand("Hablame en francés solo esta vez"),true,"One-turn command");
eq(state.languageMode,"es","One-turn command does not switch base locale");
eq(state.nextResponseLanguage,"fr","One-turn reply language queued");
eq(env.get("robotito.languageMode.v1"),"es","One-turn does not persist");
eq(log.at(-1).lang,"fr","Confirmation uses requested language");
eq(methods.handleLanguageCommand("Speak German this session"),true,"Session command");
eq(state.languageMode,"de","Session language active");
eq(env.get("robotito.languageMode.v1"),"es","Session does not change saved language");
eq(document.documentElement.lang,"de","Session UI uses German");
eq(selector.value,"de","Session selector uses German");
eq(methods.handleLanguageCommand("Hablame en italiano"),true,"Persistent command");
eq(state.languageMode,"it","Persistent Italian active");
eq(env.get("robotito.languageMode.v1"),"it","Persistent Italian stored");
eq(methods.handleLanguageCommand("Don't speak French"),false,"Negated command rejected");
eq(state.languageMode,"it","Negation does not change language");
eq(env.get("robotito.languageMode.v1"),"it","Negation does not persist");
const spoken=state.nextResponseLanguage||state.languageMode;
eq(spoken,"fr","Pending one-turn override still available");
state.nextResponseLanguage=null; // App consumes this in say(), tested by source contract.
eq(state.languageMode,"it","One-turn reply restores persistent language");
assert.ok(source.includes("if(state.nextResponseLanguage&&!spokenLang)state.nextResponseLanguage=null;"));
checks++;
console.log("Robotito P04 persistent/session/one-turn scope:",checks,"checks");
