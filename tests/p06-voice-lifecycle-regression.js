"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const voice=require("../voice-system.js");
const source=fs.readFileSync(require.resolve("../script.js"),"utf8");
const start=source.indexOf("function stopSpeaking("),end=source.indexOf("function readingDisplayTime(",start);
assert.ok(start>=0&&end>start);
let checks=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
function fixture(){
 const state={started:true,captureEpoch:1,languageMode:"es",voiceEnabled:true,voicePitch:.65,voiceRate:.82,voiceStyle:"natural"};
 const history=[],pauses=[],spoken=[],jobs=new Map(),fault={};let now=0,next=0,cancelled=0;
 const clock={set:(fn,delay)=>{const id=++next;jobs.set(id,{fn,at:now+delay});return id;},clear:id=>jobs.delete(id),
  advance(ms){const until=now+ms;for(;;){const job=[...jobs].filter(([,x])=>x.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!job)break;now=job[1].at;jobs.delete(job[0]);job[1].fn();}now=until;}};
 const synth={getVoices(){if(fault.voices)throw Error("unavailable");return [{voiceURI:"es-local",lang:"es-UY",localService:true}];},
  cancel(){cancelled++;if(fault.cancel)throw Error("cancel");},resume(){if(fault.resume)throw Error("resume");},
  speak(u){if(fault.speak)throw Error("speak");spoken.push(u);}};
 const browser={speechSynthesis:synth,ROBOTITO_VOICE_SYSTEM:voice,localStorage:{getItem:()=>null},
  RobotitoLocalASR:{active:true,pause:value=>pauses.push(value)}};
 class Utterance{constructor(text){if(fault.construct)throw Error("construct");this.text=text;}}
 const document={hidden:false};
 const api=new Function("state","window","document","speechSynthesis","SpeechSynthesisUtterance","isSpeechMuted",
  "cleanSpeechText","responseLanguage","detectGeneratedSpeechLanguage","voiceMatchesLanguage","chooseDefaultVoice",
  "isMobileSpeech","discardRecognition","setListenState","languageLocale","clamp","restartRecognitionAfterSpeech",
  "setVoicePlaybackStatus","setTimeout","clearTimeout",source.slice(start,end)+"return {speakResponse,stopSpeaking};")(
  state,browser,document,synth,Utterance,()=>Boolean(fault.muted),String,()=>"es",()=>"und",()=>false,()=>null,
  ()=>true,()=>{},()=>{},()=>"es-UY",(n,a,b)=>Math.max(a,Math.min(b,n)),()=>{},s=>history.push(s),clock.set,clock.clear);
 return {state,history,pauses,spoken,clock,jobs,fault,document,...api,cancelled:()=>cancelled};
}
for(const fault of ["voices","cancel","construct","resume","speak"]){
 const t=fixture();t.fault[fault]=true;
 eq(t.speakResponse("Hola"),false,fault+": failure reported");
 eq(Boolean(t.state.speaking),false,fault+": no stuck speaking state");
 t.clock.advance(1000);eq(t.pauses.at(-1)!==true,true,fault+": recognizer not left paused");
 eq(t.history.at(-1),"failed",fault+": recoverable feedback");
 eq(t.jobs.size,0,fault+": no orphan timer");
}
{
 const t=fixture();t.speakResponse("Hola");eq(t.pauses,[true],"Pause ASR before playback");
 t.clock.advance(15000);eq(t.state.speaking,false,"Missing start event times out");eq(t.history.at(-1),"timeout");
 t.clock.advance(320);eq(t.pauses,[true,false],"Timeout resumes listening");eq(t.cancelled(),2,"Timeout cancels stuck queue");
 t.spoken[0].onstart();t.spoken[0].onend();eq(t.history.at(-1),"timeout","Late events cannot resurrect timed-out voice");
 eq(t.jobs.size,0);
}
{
 const t=fixture();t.speakResponse("Hola");const old=t.spoken[0];old.onstart();
 t.speakResponse("Otra frase");old.onend();old.onerror({error:"not-allowed"});
 eq(t.state.speaking,true,"Old utterance cannot terminate new playback");
 eq(t.history.at(-1),"preparing");
 t.clock.advance(320);eq(t.pauses.includes(false),false,"Old resume cannot unpause new speech");
 const last=t.spoken[1];last.onstart();t.stopSpeaking();eq(t.state.speaking,false,"Explicit stop settles current utterance");
 last.onend();t.clock.advance(320);eq(t.history.at(-1),"stopped");eq(t.jobs.size,0);
}
for(const [error,status] of [["not-allowed","blocked"],["network","failed"],["interrupted","stopped"],["canceled","stopped"]]){
 const t=fixture();t.speakResponse("Hola");t.spoken[0].onerror({error});t.spoken[0].onend();
 eq(t.history.at(-1),status,"Actionable error "+error);t.clock.advance(320);eq(t.pauses,[true,false],"Exactly one recovery "+error);
}
for(const flag of ["speechBlocked","voiceSampleCaptureActive","voiceSamplePlaybackActive","enrollmentActive","captureSuspended"]){
 const t=fixture();t.speakResponse("Hola");t.spoken[0].onend();t.state[flag]=true;t.clock.advance(320);
 eq(t.pauses,[true],"Do not restart listening during "+flag);
}
{
 const t=fixture();t.state.voiceEnabled=false;eq(t.speakResponse("Hola"),false);
 eq(t.speakResponse("Hola",null,{preview:true}),true,"Explicit preview works with automatic voice off");t.stopSpeaking();
 t.state.classMode=true;eq(t.speakResponse("Hola",null,{preview:true}),false,"Class remains silent");eq(t.history.at(-1),"muted");
 t.state.classMode=false;t.fault.muted=true;eq(t.speakResponse("Hola",null,{preview:true}),false,"Requested silence preserved");
 t.fault.muted=false;t.state.voiceSampleCaptureActive=true;eq(t.speakResponse("Hola",null,{preview:true}),false,"No TTS into recording");eq(t.history.at(-1),"recording");
}
{
 const t=fixture();t.speakResponse("Hola");t.spoken[0].onstart();t.clock.advance(15000);eq(t.history.at(-1),"timeout","Missing end event recovers");
 t.state.captureEpoch++;t.clock.advance(320);eq(t.pauses,[true],"Old capture epoch never restarts microphone");
}
// Exercise the production permission gate used by both PCM capture paths.
{
 const gateStart=source.indexOf("const allowedToCapture=()=>"),gateEnd=source.indexOf(";",gateStart);
 const state={started:true,audioContext:{}};
 const allowed=new Function("state","ctx","microphoneGate","soundModelToggle","soundModel","document",
  source.slice(gateStart,gateEnd+1)+"return allowedToCapture;")(
  state,state.audioContext,{isLive:()=>true},{checked:true},{getStatus:()=>({state:"ready"})},{hidden:false});
 eq(allowed(),true,"Consented sound classification normally receives PCM");
 for(const flag of ["voiceSampleCaptureActive","voiceSamplePlaybackActive"]){
  state[flag]=true;eq(allowed(),false,flag+": personal sample never enters the sound classifier");state[flag]=false;
 }
 eq(allowed(),true,"Classifier resumes after the private sample");
}
const pool=[{voiceURI:"remote",lang:"es-ES",localService:false,name:"Neural"},{voiceURI:"local",lang:"es-UY",localService:true},
 {voiceURI:"local",lang:"es-UY",localService:true},{voiceURI:"",lang:"es-ES"},{voiceURI:"en",lang:"en-US"}];
eq(voice.compatibleVoiceCatalog(pool,"es").length,2,"No duplicate or unusable browser voices");
eq(voice.selectVoice(pool,"es").voiceURI,"local","Prefer local voice by default");
eq(voice.selectVoice(pool,"es","remote").voiceURI,"remote","Respect explicit remote choice");
eq(voice.settings("toString"),voice.settings("natural"),"Inherited property cannot become a style");
eq(voice.settings("deep",NaN,Infinity),voice.settings("deep"),"Corrupt multipliers normalize");
(async()=>{
 let record=null,blob=null,writes=0;
 const root={ROBOTITO_STORE:{getRecord:async()=>record,getBlob:async()=>blob,putRecordWithBlob:async()=>{writes++;}}};
 const mod={exports:{}};
 new Function("window","module","Blob",fs.readFileSync(require.resolve("../voice-system.js"),"utf8"))(root,mod,Blob);
 const api=mod.exports,clip=new Blob([new Uint8Array(150)],{type:"audio/wav"});
 eq(await api.loadProfile(),null,"Empty store is usable");
 record={blobId:"voice-sample-local",data:{}};blob=clip;
 eq((await api.loadProfile()).unverified,true,"Legacy sample without consent cannot play");
 record.data.consentRecorded=true;eq((await api.loadProfile()).blob,clip,"Consented local recording loads");
 blob=null;eq((await api.loadProfile()).blob,null,"Missing audio is detected");
 for(const [data,details] of [[clip,{}],[clip,{subject:"other",explicitConsent:true}],[clip,{subject:"unknown",explicitConsent:true}],
  [new Blob([new Uint8Array(150)],{type:"text/plain"}),{explicitConsent:true}],[new Blob([new Uint8Array(10)],{type:"audio/wav"}),{explicitConsent:true}]]){
  await assert.rejects(api.saveProfileFromRecording(data,details));checks++;
 }
 eq(writes,0,"Invalid/unauthorized samples never reach storage");
 await api.saveProfileFromRecording(clip,{subject:"self",explicitConsent:true});eq(writes,1,"Self recording requires explicit consent too");
 console.log("P06 voice lifecycle, errors and sample authorization:",checks,"checks");
})().catch(error=>{console.error(error);process.exitCode=1;});
