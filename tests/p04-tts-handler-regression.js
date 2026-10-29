"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const i18n=require("../i18n.js"),voiceSystem=require("../voice-system.js");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const start=source.indexOf("function speakResponse(text,forcedLang=null){");
const end=source.indexOf("function readingDisplayTime(",start);
assert.ok(start>=0&&end>start,"Find production TTS handler");
let checks=0;const eq=(a,b,msg)=>{assert.equal(a,b,msg);checks++};
function runtime(code,voices){
 const state={classMode:false,voiceEnabled:true,voiceURI:"preferred-es",
  voiceStyle:"natural",voicePitch:.65,voiceRate:.82,speaking:false,recentVoicePrints:[],
  languageMode:code};
 const played=[],statuses=[];
 const synth={getVoices:()=>voices,cancel(){},speak:utter=>played.push(utter)};
 const browser={speechSynthesis:synth,ROBOTITO_I18N:i18n,
  ROBOTITO_VOICE_SYSTEM:voiceSystem,RobotitoLocalASR:{active:false}};
 class Utterance{constructor(text){this.text=text;}}
 const selector=(pool,lang)=>pool.find(v=>v.lang.toLowerCase().split("-")[0]===lang)||null;
 const speak=new Function("state","window","speechSynthesis","SpeechSynthesisUtterance",
  "isSpeechMuted","cleanSpeechText","responseLanguage","detectGeneratedSpeechLanguage",
  "voiceMatchesLanguage","chooseDefaultVoice","isMobileSpeech","discardRecognition",
  "setListenState","languageLocale","clamp","restartRecognitionAfterSpeech",
  source.slice(start,end)+"return speakResponse;")(
  state,browser,synth,Utterance,()=>false,x=>String(x).trim(),()=>code,()=> "und",
  (v,lang)=>!!v&&v.lang.toLowerCase().split("-")[0]===lang,selector,
  ()=>false,()=>{},text=>statuses.push(text),lang=>i18n.locale(lang),
  (x,min,max)=>Math.max(min,Math.min(max,x)),()=>{});
 return {state,speak,played,statuses};
}
// The property may exist while the browser has no speech engine.
const unsupportedState={classMode:false,voiceEnabled:true,speaking:false};
const unsupported=new Function("state","window","isSpeechMuted",
 source.slice(start,end)+"return speakResponse;")(
 unsupportedState,{speechSynthesis:undefined},()=>false);
eq(unsupported("Hello"),false,"Missing speech engine must not crash");
const codes=["es","en","pt","fr","it","de"];
const locales={es:"es-UY",en:"en-US",pt:"pt-BR",fr:"fr-FR",it:"it-IT",de:"de-DE"};
for(const code of codes){
 const none=runtime(code,[]);
 eq(none.speak("Generic message"),false,"No default foreign voice: "+code);
 eq(none.played.length,0,"Empty voice list must remain silent "+code);
 eq(none.state.speaking,false,"No stuck speaking status "+code);
 const other=runtime(code,[{name:"Wrong locale",lang:code==="es"?"en-US":"es-UY",voiceURI:"foreign"}]);
 eq(other.speak("Generic message"),false,"Reject cross-language voices "+code);
 eq(other.played.length,0,"Do not invoke speechSynthesis.speak on foreign voice "+code);
 const compatible=runtime(code,[{name:"Local voice",lang:locales[code],voiceURI:"compatible"}]);
 eq(compatible.speak("Generic message"),true,"Matching voice accepted "+code);
 eq(compatible.played.length,1,"Correctly enqueued speech "+code);
 eq(compatible.played[0].voice?.voiceURI,"compatible","Selected expected system voice "+code);
 eq(compatible.played[0].lang.toLowerCase().startsWith(code),true,"Correct speech locale "+code);
 eq(compatible.statuses.at(-1),i18n.t("voiceResponding",code),"Speaking status localized "+code);
 compatible.played[0].onend?.();
 eq(compatible.state.speaking,false,"Speaking completes "+code);
}
console.log("Robotito P04 actual TTS handler with synthetic voices:",checks,"checks");
