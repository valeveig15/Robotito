"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const i18n=require("../i18n.js"),voice=require("../voice-system.js");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
let checks=0;
function eq(actual,expected,label){assert.equal(actual,expected,label);checks++;}
function ok(value,label){assert.ok(value,label);checks++;}
const langs=["es","en","pt","fr","it","de"];
const voices=langs.map(code=>({lang:code+"-"+({es:"UY",en:"US",pt:"BR",fr:"FR",it:"IT",de:"DE"}[code]),
 voiceURI:"local-"+code,name:"Voice "+code}));
eq(i18n.languages.join(","),langs.join(","),"Six supported languages");
for(const lang of langs){
 ok(i18n.supported(lang),"Valid language "+lang);
 ok(i18n.locale(lang).startsWith(lang),"Locale "+lang);
 ok(i18n.t("voiceUnavailable",lang).length>10,"Missing voice warning "+lang);
 eq(voice.selectVoice(voices,lang,"local-es")?.voiceURI,"local-"+lang,
  "Preferred voice in other language cannot override "+lang);
 const utter=voice.configureUtterance({}, {language:lang,voices,voiceURI:"local-es"});
 ok(utter.lang.toLowerCase().startsWith(lang),"Speech locale "+lang);
 eq(utter.voice?.voiceURI,"local-"+lang,"Speech voice "+lang);
}
eq(voice.selectVoice([voices[0]],"fr"),null,"No cross-language voice fallback");
const noFrench=voice.configureUtterance({}, {language:"fr",voices:[voices[0]]});
eq(noFrench.voice,undefined,"Do not select Spanish voice for French utterance");
eq(noFrench.lang,"fr-FR","Keep explicit French locale when unavailable");
const alt=[{lang:"pt-PT",voiceURI:"pt-1",name:"Plain"},
 {lang:"pt-BR",voiceURI:"pt-2",name:"Neural Voice"}];
eq(voice.selectVoice(alt,"pt","pt-1")?.voiceURI,"pt-1","Preserve matching user preference");
eq(voice.selectVoice(alt,"pt","local-es")?.voiceURI,"pt-2","Prefer natural compatible voice");
for(const style of Object.keys(voice.styles)){
 const values=voice.settings(style,NaN,Infinity);
 ok(Number.isFinite(values.pitch)&&Number.isFinite(values.rate),
  "Invalid user input cannot make NaN Web Speech values: "+style);
}
const start=source.indexOf("async function startSenses()");
const end=source.indexOf("const mobile=isMobileSpeech();",start);
ok(start>0&&end>start,"Find real startup guard");
const guard=source.slice(start,end).replace("async function startSenses(){","");
const runGuard=new Function("window","state","toast",guard+"return true;");
for(const lang of langs){
 eq(runGuard({ROBOTITO_I18N:i18n},{started:false,languageMode:lang},()=>{}),
  true,"Can start senses in "+lang);
}
let warned=false;
eq(runGuard({ROBOTITO_I18N:i18n},{started:false,languageMode:"unknown"},
 ()=>{warned=true;}),undefined,"Invalid language rejected");
eq(warned,true,"Invalid language must explain failure");
eq(runGuard({ROBOTITO_I18N:i18n},{started:true,languageMode:"fr"},
 ()=>{}),undefined,"Double start prevented");
const voiceBegin=source.indexOf("function chooseDefaultVoice(");
const voiceEnd=source.indexOf("function populateVoiceSelect(){",voiceBegin);
ok(voiceBegin>=0&&voiceEnd>voiceBegin,"Locate legacy voice selector");
const choose=new Function("normalizeText","responseLanguage",
 source.slice(voiceBegin,voiceEnd)+"return chooseDefaultVoice;")(
 x=>String(x||"").toLowerCase(),()=> "es");
eq(choose([voices[0]],"fr"),null,"Legacy selection must not substitute Spanish for French");
eq(choose(voices,"de")?.voiceURI,"local-de","German selection in legacy adapter");
ok(source.includes("if(voices.length&&!chosen)return false;"),
 "Unavailable language voices must not be spoken with a different accent");
ok(html.includes('data-i18n="pitch"')&&!html.includes(">Gravedad <input"),
 "Old Gravedad label replaced with localized Tono");
ok(html.includes('data-i18n="speed"'),"Speed control localized");
ok(html.includes('data-start-language="de"'),"German remains in initial language choices");
ok(html.includes('data-i18n="highfive"'),"Chocar los cinco remains in the interface");
console.log("Robotito P04 startup and voice locale regression:",checks,"checks");
