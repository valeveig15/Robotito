"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const audio=fs.readFileSync(path.join(__dirname,"..","class-audio.js"),"utf8");
const verification=fs.readFileSync(path.join(__dirname,"..","class-verification.js"),"utf8");
const main=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
const grab=(src,start,end)=>{
 const i=src.indexOf(start),j=src.indexOf(end,i);
 assert.ok(i>=0&&j>i,"Production function boundaries must exist");
 return src.slice(i,j);
};
const audioCycle=grab(audio,"  async function start(","  function isRecording()");
let saved=0,rendered=0;
const track={readyState:"live",clone(){return {readyState:"live",stop(){}};}};
const state={started:true,captureEpoch:1,captureRevision:1,stream:{getAudioTracks:()=>[track]}};
class Recorder{
 constructor(){this.state="inactive";this.mimeType="audio/webm";}
 start(){this.state="recording";queueMicrotask(()=>this.ondataavailable?.({data:new Blob(["audio"])}));}
 stop(){this.state="inactive";queueMicrotask(()=>this.onstop?.());}
}
const audioRuntime=new Function("state","window","document","navigator","MediaStream","MediaRecorder","crypto",
 "pickMimeType","render","setLiveStatus","putChunk","chunksFor","saveRecording","clearChunks",
 "let active=null,captureRequest=0;\n"+audioCycle+"\nreturn {start,stop};")(
 state,{MediaRecorder:Recorder},{hidden:false},{storage:{persist:async()=>true}},
 class{constructor(tracks){this.getTracks=()=>tracks;}},Recorder,{randomUUID:()=>"p12-fixture"},()=>"audio/webm",
 async()=>{rendered++;},()=>{},async()=>{throw Error("quota exceeded");},
 async()=>[{blob:new Blob(["audio"])}],async()=>{saved++;},async()=>{});
const sourceBlock=grab(verification,"  async function captureClassLine(","  async function startClassMode()");
const classroom={classSubject:"Biología",classTopic:"Células",classSessionId:"one",
 classLines:[],voiceProfiles:{me:[],teacher:[],classmate:[]},lastSpeakerConfidence:.24,verifyClassWeb:true};
let resolveVerification=null;
const capture=new Function("state","averageRecentVoiceFeature","recentVoicePrint","recognizeVoicePerson",
 "classifySpeaker","correctAcademicTranscript","crypto","save","renderClassTranscript",
 "$","uiSet","verifyTranscript","learnSpeaker","Date",sourceBlock+"\nreturn captureClassLine;")(
 classroom,()=>({}),()=>null,()=>null,()=>"classmate",
 t=>({text:t,changes:[]}),{randomUUID:()=>"p13-fixture"},()=>{},()=>{},
 ()=>null,()=>{},()=>new Promise(resolve=>{resolveVerification=resolve;}),()=>{},Date);
(async()=>{
 assert.equal((await audioRuntime.start("Biología")).ok,true);
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(await audioRuntime.stop(),null,"Missing persisted chunk must not be marked saved");
 assert.equal(saved,0,"Partial recording must not be stored as complete");
 const pending=capture("Texto original");
 assert.equal(classroom.classLines.length,1);
 classroom.classLines[0].correctedText="Corrección manual de la estudiante";
 resolveVerification({text:"Verificación web antigua",status:"verified",sources:[],changes:[]});
 await pending;
 assert.equal(classroom.classLines[0].correctedText,"Corrección manual de la estudiante",
  "Slow web verification never overwrites the edited transcript");
 assert.equal(classroom.classLines[0].verificationStatus,"checking",
  "Stale result never claims it verified the new transcript");
 assert.match(main,/if\(e\.sourceType==="material"\)score\+=1\.6/,
  "Uploaded material gets an explicit ranking boost after relevance overlap");
 assert.ok(main.indexOf('if(overlap===0)return 0;')<main.indexOf('if(e.sourceType==="material")score+=1.6;'),
  "Unrelated material cannot become evidence just by being uploaded");
 console.log("P12/P13/P14 class integrity regression: passed");
})().catch(error=>{console.error(error);process.exitCode=1;});
