"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const i18n=require("../i18n.js"),voice=require("../voice-system.js");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const voiceSource=fs.readFileSync(path.join(__dirname,"..","voice-system.js"),"utf8");
let count=0;
function eq(actual,wanted,reason){assert.deepEqual(actual,wanted,reason);count++;}
const start=source.indexOf("function speakResponse(text,forcedLang=null){"),
 end=source.indexOf("function readingDisplayTime(",start);
assert.ok(start>=0&&end>start,"Production TTS handler can be tested");
const state={classMode:false,voiceEnabled:true,voiceURI:"es-voice",voiceStyle:"natural",
 voicePitch:.65,voiceRate:.82,speaking:false,recentVoicePrints:[],languageMode:"es"};
const voiceOptions=[
 {name:"Spanish local",voiceURI:"es-voice",lang:"es-UY",localService:true},
 {name:"German default",voiceURI:"de-default",lang:"de-DE",localService:true},
 {name:"German preferred",voiceURI:"de-preferred",lang:"de-DE",localService:true},
 {name:"French preferred",voiceURI:"fr-preferred",lang:"fr-FR",localService:true}
];
const store=new Map();
const localStorage={getItem:key=>store.get(key)||null,setItem:(key,v)=>store.set(key,v)};
voice.savePreferredVoice(localStorage.getItem,localStorage.setItem,"de","de-preferred");
voice.savePreferredVoice(localStorage.getItem,localStorage.setItem,"fr","fr-preferred");
const spoken=[];
const synthesis={getVoices:()=>voiceOptions,cancel(){},speak:utter=>spoken.push(utter)};
const browser={speechSynthesis:synthesis,localStorage,ROBOTITO_VOICE_SYSTEM:voice,
 ROBOTITO_I18N:i18n,RobotitoLocalASR:{active:false}};
class Utterance{constructor(text){this.text=text;}}
const speak=new Function("state","window","speechSynthesis","SpeechSynthesisUtterance",
 "isSpeechMuted","cleanSpeechText","responseLanguage","detectGeneratedSpeechLanguage",
 "voiceMatchesLanguage","chooseDefaultVoice","isMobileSpeech","discardRecognition",
 "setListenState","languageLocale","clamp","restartRecognitionAfterSpeech",
 source.slice(start,end)+"return speakResponse;")(
 state,browser,synthesis,Utterance,()=>false,text=>String(text).trim(),()=>state.languageMode,()=> "und",
 (v,lang)=>!!v&&v.lang.toLowerCase().split("-")[0]===lang,
 (pool,lang)=>pool.find(v=>v.lang.startsWith(lang))||null,
 ()=>false,()=>{},()=>{},lang=>i18n.locale(lang),
 (x,min,max)=>Math.max(min,Math.min(max,x)),()=>{});
eq(speak("Guten Tag","de"),true,"One-time German response speaks");
eq(spoken.at(-1).voice.voiceURI,"de-preferred","German response uses saved German voice");
eq(state.voiceURI,"es-voice","German response does not replace selected Spanish voice");
eq(state.languageMode,"es","German response does not change UI language");
spoken.at(-1).onend?.();
eq(speak("Bonjour","fr"),true,"One-time French response speaks");
eq(spoken.at(-1).voice.voiceURI,"fr-preferred","French response uses its own saved voice");
spoken.at(-1).onend?.();
for(const style of Object.keys(voice.styles)){
 state.voiceStyle=style;
 eq(speak("Hola","es"),true,"Preview works for browser voice style "+style);
 const last=spoken.at(-1);
 eq(last.voice.voiceURI,"es-voice","Style "+style+" does not pretend to be another human voice");
 eq([last.pitch,last.rate,last.volume],
  Object.values(voice.settings(style,1,1)),
  "Style "+style+" maps to declared synthesis parameters");
 last.onend?.();
}
eq(voice.preferredVoiceForLanguage(localStorage.getItem,"de"),"de-preferred",
 "Playing in a foreign language never overwrites saved preferred voice");

// A recorded sample is natural microphone data with explicit consent, not a
// newly generated synthetic voice, nor a clone of the subject.
const actions=[];
const root={ROBOTITO_STORE:{putRecordWithBlob:(meta,blob,options)=>{
 actions.push({meta,blob,options});return Promise.resolve(meta);},
 deleteRecord:async id=>{actions.push({deleted:id});},
 deleteBlob:async id=>{actions.push({deletedBlob:id});}}};
const mod={exports:{}};
new Function("window","module","Blob",voiceSource)(root,mod,Blob);
(async()=>{
 const clip=new Blob([new Uint8Array(180)],{type:"audio/webm"});
 await mod.exports.saveProfileFromRecording(clip,{subject:"other",explicitConsent:true,consentLabel:"Consenting participant"});
 eq(actions[0].meta.data.recordedFromMicrophone,true,"Sample is marked as captured, not generated");
 eq(actions[0].meta.data.synthesized,false,"Microphone recording is not synthetic audio");
 eq(actions[0].meta.data.cloned,false,"Recording is not presented as a voice clone");
 eq(actions[0].meta.data.consentRecorded,true,"Consent metadata is stored with the sample");
 eq(actions[0].meta.data.consentLabel,"Consenting participant","Consent label kept");
 eq(actions[0].blob.size,180,"Audio stored atomically with metadata");
 await mod.exports.deleteProfile();
 eq(actions[1].deleted,"voice-profile-local","Delete recorded metadata");
 eq(actions[2].deletedBlob,"voice-sample-local","Delete corresponding audio data");
 const before=actions.length;
 let denied=false;
 try{await mod.exports.saveProfileFromRecording(clip,{
  subject:"other",explicitConsent:false,consentLabel:"Someone"});}
 catch{denied=true;}
 eq(denied,true,"Third-party sample refused without explicit consent");
 eq(actions.length,before,"No storage without consent");
 console.log("P06 preview, one-reply voice and recorded sample:",count,"checks");
})().catch(error=>{console.error(error);process.exitCode=1;});
