"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const i18n=require("../i18n.js");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const start=source.indexOf("function asrMessage(key){");
const end=source.indexOf("function setupSpeechRecognition(",start);
assert.ok(start>=0&&end>start,"Production SpeechRecognition handlers available");
const engine=new Function("window","state","recognitionLanguage","isIOSSpeech",
 "isMobileSpeech","setListenState","$","chooseSpeechAlternative","queueRecognitionChunk",
 "clearTimeout","setTimeout","discardRecognition","document","console",
 source.slice(start,end)+"return {createSpeechRecognition,startListeningCycle};");
let checks=0;
const eq=(a,b,label)=>{assert.equal(a,b,label);checks++;};
function setup(lang,available=true){
 const states=[],transcript={textContent:""},queued=[];
 const state={languageMode:lang,started:true,recognitionWanted:true,
  speechBlocked:false,speaking:false,speechRetryCount:0,
  speechRestartTimer:null,recognition:null};
 class FakeRecognition{
  start(){this.onstart?.();}
 }
 const window={SpeechRecognition:available?FakeRecognition:undefined,ROBOTITO_I18N:i18n};
 const runtime=engine(window,state,()=>i18n.locale(lang),()=>false,()=>true,
  (message,category)=>states.push([message,category]),
  selector=>selector==="#transcript"?transcript:null,
  result=>result?.[0],text=>queued.push(text),()=>{},
  ()=>1,()=>{},{hidden:false},{warn:()=>{}});
 return {runtime,state,states,transcript,queued};
}
for(const lang of i18n.languages){
 const {runtime,state,states,transcript,queued}=setup(lang);
 runtime.startListeningCycle();
 const r=state.recognition;
 eq(r.lang,i18n.locale(lang),lang+": correct ASR language");
 eq(states[0][0],i18n.t("asrStarting",lang),lang+": starting");
 eq(states.at(-1)[0],i18n.t("asrListening",lang),lang+": listening");
 r.onspeechstart();
 eq(states.at(-1)[0],i18n.t("asrHeard",lang),lang+": hearing");
 r.onspeechend();
 eq(states.at(-1)[0],i18n.t("asrListening",lang),lang+": silence");
 r.onresult({resultIndex:0,results:[Object.assign([{transcript:"recognized"}],{isFinal:true})]});
 eq(queued[0],"recognized",lang+": recognition delivered");
 r.onerror({error:"audio-capture"});
 eq(states.at(-1)[0],i18n.t("asrRecoverMic",lang),lang+": mic recovery");
 r.onerror({error:"network"});
 eq(states.at(-1)[0],i18n.t("asrRecover",lang),lang+": error recovery");
 r.onend();
 eq(states.at(-1)[0],i18n.t("asrReconnect",lang),lang+": reconnect");
 const blocked=setup(lang);
 blocked.runtime.startListeningCycle();
 blocked.state.recognition.onerror({error:"not-allowed"});
 eq(blocked.states.at(-1)[0],i18n.t("asrMicBlocked",lang),lang+": blocked");
 eq(blocked.transcript.textContent,i18n.t("asrMicHelp",lang),lang+": permission help");
 eq(blocked.state.speechBlocked,true,lang+": recognition blocked");
 const unsupported=setup(lang,false);
 unsupported.runtime.startListeningCycle();
 eq(unsupported.states.at(-1)[0],i18n.t("asrNoCompatible",lang),lang+": no engine");
 eq(unsupported.transcript.textContent,i18n.t("asrBrowserHelp",lang),lang+": browser advice");
}
console.log("P04 actual native browser-ASR event lifecycle:",checks,"checks");
