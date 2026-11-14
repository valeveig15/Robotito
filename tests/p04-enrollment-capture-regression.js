"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","script.js"),"utf8");
function extract(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a);return source.slice(a,b);}
const faceSource=extract("async function captureFaceEnrollment(","\nfunction collectNewVoiceSamples(");
const voiceSource=extract("async function captureEnrollmentVoice(){","\n// Fail closed on a profile collision.");
let checks=0;
const eq=(a,b,why)=>{assert.deepEqual(a,b,why);checks++;};
function faceFixture(mode="valid"){
 let now=10000,calls=0;
 const state={started:true,captureEpoch:1,captureRevision:1,enrollmentRevision:1};
 const document={hidden:false},consent={checked:true},camera={readyState:4,currentTime:0,videoWidth:640,videoHeight:480};
 const faceapi={TinyFaceDetectorOptions:class{},detectAllFaces:()=>({withFaceLandmarks(){return this;},
  async withFaceDescriptors(){
   calls++;
   if(mode==="replaced")state.captureEpoch++;
   if(mode==="resumed")state.captureRevision++;
   if(mode==="consent-rechecked")state.enrollmentRevision++;
   const descriptor=new Float32Array(128).fill(.01*calls);
   if(mode==="invalid")descriptor[0]=NaN;
   return [{descriptor,detection:{score:mode==="uncertain"?.3:.9,box:{width:150,height:150}}}];
  }})};
 const capture=new Function("state","document","$","camera","faceapi","enrollText","setEnrollProgress","waitMs",
  "descriptorDistance","Date",faceSource+"\nreturn captureFaceEnrollment;")(
  state,document,()=>consent,camera,faceapi,x=>x,()=>{},async ms=>{now+=ms;if(mode!=="frozen")camera.currentTime+=ms/1000;},
  (a,b)=>Math.hypot(...a.map((v,i)=>v-b[i])),{now:()=>now});
 return {capture,state,get calls(){return calls;}};
}
function voiceFixture(mode){
 let now=10000;
 const state={started:true,captureEpoch:1,captureRevision:1,enrollmentRevision:1,
  recognitionWanted:true,enrollmentActive:false,recentVoicePrints:[]};
 const document={hidden:false},consent={checked:true},timers=[],actions={restart:0};
 const capture=new Function("state","document","$","window","isMobileSpeech","discardRecognition","setEnrollProgress",
  "enrollText","waitMs","Date","collectNewVoiceSamples","setTimeout","startListeningCycle",voiceSource+"\nreturn captureEnrollmentVoice;")(
  state,document,()=>consent,{speechSynthesis:{cancel(){}}},()=>false,()=>{},()=>{},x=>x,
  async ms=>{
   now+=ms;
   if(mode==="stop"){state.started=false;state.captureEpoch++;state.recognitionWanted=false;}
   if(mode==="resumed")state.captureRevision++;
   if(mode==="revoked")consent.checked=false;
   if(mode==="consent-rechecked")state.enrollmentRevision++;
  },{now:()=>now},()=>{},fn=>{timers.push(fn);},()=>actions.restart++);
 return {capture,state,timers,actions};
}
(async()=>{
 const good=faceFixture();const samples=await good.capture();
 eq(samples.length,12,"Distinct current frames complete four enrollment positions");
 eq(good.calls,12,"Successful enrollment uses twelve camera inferences");
 for(const mode of ["replaced","resumed","consent-rechecked","invalid","uncertain","frozen"]){
  const f=faceFixture(mode);
  eq(await f.capture(),null,mode+": enrollment cannot return untrustworthy face samples");
  if(mode==="frozen")eq(f.calls,1,"Frozen frame is sampled only once");
 }
 for(const mode of ["stop","resumed","revoked","consent-rechecked"]){
  const f=voiceFixture(mode),result=await f.capture();
  eq(result.error,"canceled",mode+": voice enrollment exits promptly");
  eq(result.prints.length,0,mode+": interrupted voice samples are discarded");
  eq(f.state.enrollmentActive,false,mode+": enrollment flag restored");
  if(mode==="stop"){
   eq(f.state.recognitionWanted,false,"Canceled enrollment cannot change a newer session's listening preference");
   eq(f.timers.length,0,"Canceled capture cannot schedule an ASR restart");
  }else{
   f.state.captureEpoch++;f.timers.forEach(fn=>fn());
   eq(f.actions.restart,0,"Delayed enrollment restart cannot affect replacement capture");
  }
 }
 console.log("P04 interrupted face/voice enrollment:",checks,"checks");
})().catch(error=>{console.error(error);process.exitCode=1;});
