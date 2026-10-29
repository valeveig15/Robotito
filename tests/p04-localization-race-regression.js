"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const sayStart=source.indexOf("function say(text, ms=3000, spokenLang=null){");
const sayEnd=source.indexOf("function sayInLanguage(",sayStart);
const langStart=source.indexOf("function setLanguageMode(mode){");
const langEnd=source.indexOf("function chooseStartupLanguage(",langStart);
assert.ok(sayStart>0&&sayEnd>sayStart&&langStart>0&&langEnd>langStart);
let checks=0;const eq=(a,b,msg)=>{assert.equal(a,b,msg);checks++};
function setup(){
 const flags=new Set(["hidden"]),bubble={textContent:"",classList:{
  add:name=>flags.add(name),remove:name=>flags.delete(name)}};
 const select={value:"es"},dom={documentElement:{lang:"es"}};
 const state={languageMode:"es",nextResponseLanguage:null,speechBubbleToken:0,
   pendingSpeechLocalization:false,started:false};
 const storage=new Map(),commits=[],requests=[];
 const $=id=>id==="#speechBubble"?bubble:id==="#languageMode"?select:null;
 const later=()=>new Promise(resolve=>requests.push(resolve));
 const say=new Function("state","responseLanguage","$","window",
 "speechNeedsLocalization","localizeGeneratedSpeech","commitSpeechMessage",
 source.slice(sayStart,sayEnd)+"return say;")(
 state,()=>state.nextResponseLanguage||state.languageMode,$,
 {ROBOTITO_I18N:{t:()=> "Preparing response…"}},
 ()=>true,later,(text,ms,language,token)=>{
  if(token===state.speechBubbleToken){commits.push({text,language});state.pendingSpeechLocalization=false;}
 });
 const setLang=new Function("window","state","document","$","localStorage",
 "populateVoiceSelect","isMobileSpeech","discardRecognition","startListeningCycle",
 source.slice(langStart,langEnd)+"return setLanguageMode;")(
 {ROBOTITO_I18N:{supported:l=>["es","en","pt","fr","it","de"].includes(l),
  apply:()=>{}},RobotitoLocalASR:{active:false}},
 state,dom,$,{setItem:(k,v)=>storage.set(k,v)},()=>{},()=>false,()=>{},()=>{});
 return {state,bubble,flags,requests,commits,storage,setLang,say};
}
(async()=>{
 const a=setup();
 a.say("Texto largo de respuesta");eq(a.requests.length,1,"Translation started");
 eq(a.state.pendingSpeechLocalization,true,"Pending tracked");
 a.setLang("de");
 eq(a.state.languageMode,"de","Language switched");
 eq(a.state.pendingSpeechLocalization,false,"Pending canceled");
 eq(a.flags.has("hidden"),true,"Old preparing bubble hidden");
 a.requests[0]("Antwort in alter Sitzung");await Promise.resolve();await Promise.resolve();
 eq(a.commits.length,0,"Late reply must not appear");
 const b=setup();
 b.say("Primer texto");b.say("Segundo texto");
 eq(b.requests.length,2,"Two translations in flight");
 b.requests[0]("old");await Promise.resolve();
 eq(b.commits.length,0,"First response superseded");
 b.requests[1]("new");await Promise.resolve();
 eq(b.commits.at(-1)?.text,"new","Newest response wins");
 const c=setup();c.say("Pending text");
 c.setLang("xx");
 eq(c.state.languageMode,"es","Invalid language rejected");
 c.requests[0]("answer");await Promise.resolve();
 eq(c.commits.length,1,"Rejected language does not cancel valid reply");
 console.log("Robotito P04 async locale switch:",checks,"checks");
})().catch(err=>{console.error(err);process.exitCode=1;});
