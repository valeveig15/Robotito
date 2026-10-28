// Optional local sound classification. The pre-trained model is NOT an
// application-calibrated diagnostic detector: predictions are tentative and
// can never authorize cough/sneeze/cry/laugh reactions by themselves.
(function(root){
"use strict";
const WINDOW_SAMPLES=15600,STEP_SAMPLES=7800,TARGET_RATE=16000;
const MAX_INFERENCE_MS=2500;
const LABELS={
 sneeze:/\bsneez(?:e|ing)\b/i,
 cough:/\bcough(?:ing)?\b/i,
 laugh:/\b(?:laugh(?:ter|ing)?|giggl(?:e|ing))\b/i,
 cry:/\b(?:crying|sobbing|weeping|baby cry|whimper)\b/i,
 clap:/\b(?:clapp?ing|applause|hand clap)\b/i,
 music:/\b(?:music|musical instrument|singing)\b/i,
 voice:/\b(?:speech|conversation|narration|speaking)\b/i,
 impact:/\b(?:bang|knock|thump|slam|hammer)\b/i,
 noise:/\b(?:noise|static|hum|wind)\b/i
};
function mapCategories(categories){
 const score=Object.fromEntries(Object.keys(LABELS).map(k=>[k,0]));
 let strongest={kind:"unknown",score:0,label:""};
 for(const row of Array.isArray(categories)?categories:[]){
  const label=String(row?.categoryName||row?.displayName||"");
  const confidence=Number(row?.score);
  if(!Number.isFinite(confidence)||confidence<0||confidence>1)continue;
  for(const [kind,pattern]of Object.entries(LABELS)){
   if(pattern.test(label)){
    score[kind]=Math.max(score[kind],confidence);
    if(confidence>strongest.score)strongest={kind,score:confidence,label};
   }
  }
 }
 return {scores:score,candidate:strongest};
}
// Stateful band-limited resampling: retains fractional phase at every
// AudioWorklet boundary and filters frequencies above the 16 kHz Nyquist
// band before downsampling. This cannot reconstruct heavily clipped audio.
function createResampler(targetRate=TARGET_RATE){
 let inputRate=0,inputCount=0,nextPosition=0,previous=0,stages=[];
 function reset(){
  inputRate=0;inputCount=0;nextPosition=0;previous=0;stages=[];
 }
 function setup(rate){
  reset();inputRate=rate;
  if(rate<=targetRate)return;
  // Four-pole Butterworth low-pass at 6.72 kHz, with a conservative
  // transition band below the 8 kHz Nyquist limit.
  const omega=2*Math.PI*(targetRate*.42)/rate;
  for(const q of [.541196100146197,1.30656296487638]){
   const cosine=Math.cos(omega),alpha=Math.sin(omega)/(2*q),a0=1+alpha;
   stages.push({b0:((1-cosine)/2)/a0,b1:(1-cosine)/a0,
    b2:((1-cosine)/2)/a0,a1:(-2*cosine)/a0,
    a2:(1-alpha)/a0,z1:0,z2:0});
  }
 }
 function push(samples,rate,output){
  if(!Number.isFinite(rate)||rate<8000||rate>192000||
     !samples||typeof output!=="function"||!Number.isInteger(samples.length))return 0;
  if(rate!==inputRate)setup(rate);
  const stride=rate/targetRate;
  let emitted=0;
  for(let i=0;i<samples.length;i++){
   let sample=Number(samples[i]);
   sample=Number.isFinite(sample)?Math.max(-1,Math.min(1,sample)):0;
   for(const stage of stages){
    const y=stage.b0*sample+stage.z1;
    stage.z1=stage.b1*sample-stage.a1*y+stage.z2;
    stage.z2=stage.b2*sample-stage.a2*y;
    sample=y;
   }
   if(inputCount===0){
    output(sample);emitted++;nextPosition=stride;
   }else{
    // Linear interpolation is continuous across chunk boundaries;
    // the band-limit filter above removes most out-of-band aliasing.
    while(nextPosition<=inputCount+1e-9){
     const fraction=Math.max(0,Math.min(1,nextPosition-(inputCount-1)));
     output(previous+(sample-previous)*fraction);
     emitted++;nextPosition+=stride;
    }
   }
   previous=sample;
   inputCount++;
  }
  return emitted;
 }
 return {push,reset,getInputRate:()=>inputRate};
}
function create({workerFactory=()=>new root.Worker("audio-model-worker.js"),
 clock=()=>Date.now(),onUpdate=()=>{}}={}){
 let worker=null,state="off",statusMessage="",last=null,writeAt=0,filled=0,sinceLast=0;
 let sequence=0,minimumAcceptedId=0,pendingId=0,pendingAt=0,busy=false;
 let ring=new Float32Array(WINDOW_SAMPLES);
 const resampler=createResampler();
 const version="YAMNet AudioSet (uncalibrated for Robotito)";
 const publish=()=>{try{onUpdate(getStatus());}catch(e){console.warn("Sound model state",e);}};
 function getStatus(){
  const recent=last&&clock()-last.observedAt<=2600?last:null;
  return {state,message:statusMessage,version,calibrated:false,
    candidate:recent?{...recent.candidate}:null,scores:recent?{...recent.scores}:null};
 }
 function clearAudio(){
  if(!filled&&!last&&!busy&&!resampler.getInputRate())return;
  // Clear a session's PCM and reject a prediction whose samples predate
  // class mode, sleep, Robotito's own voice or an interrupted microphone.
  filled=0;sinceLast=0;writeAt=0;last=null;
  minimumAcceptedId=sequence+1;pendingId=0;pendingAt=0;busy=false;
  ring.fill(0);resampler.reset();publish();
 }
 function disable(){
  const previous=worker;worker=null;
  if(previous)try{previous.terminate();}catch{}
  state="off";statusMessage="";last=null;writeAt=0;filled=0;sinceLast=0;busy=false;
  ring=new Float32Array(WINDOW_SAMPLES);minimumAcceptedId=sequence+1;
  pendingId=0;pendingAt=0;resampler.reset();publish();
 }
 function enable(){
  if(state==="loading"||state==="ready")return true;
  if(worker)disable(); // Retry must terminate the old failed worker.
  if(typeof workerFactory!=="function")return false;
  let created;
  try{created=workerFactory();}
  catch(error){state="error";statusMessage=String(error?.message||error);publish();return false;}
  if(!created||typeof created.postMessage!=="function"){
   state="error";statusMessage="Worker unavailable";publish();return false;
  }
  worker=created;state="loading";statusMessage="";publish();
  const fail=message=>{
   if(worker!==created)return;
   worker=null;try{created.terminate();}catch{}
   state="error";statusMessage=String(message).slice(0,200);
   busy=false;last=null;filled=0;sinceLast=0;ring.fill(0);resampler.reset();publish();
  };
  created.onmessage=event=>{
   if(worker!==created)return;
   const data=event?.data||{};
   if(data.type==="ready"){state="ready";statusMessage="";publish();}
   else if(data.type==="result"){
    // Delayed results from a prior class/sleep interval must not unlock a
    // newer in-flight classification, nor appear fresh when they are stale.
    if(!Number.isInteger(data.id)||data.id!==pendingId)return;
    busy=false;pendingId=0;
    const elapsed=clock()-pendingAt;pendingAt=0;
    if(data.id<minimumAcceptedId||data.id<= (last?.id||0)||
       elapsed<0||elapsed>MAX_INFERENCE_MS)return;
    const mapped=mapCategories(data.categories);
    last={id:data.id,observedAt:clock(),...mapped};publish();
   }else if(data.type==="error")fail(data.message||"Model unavailable");
  };
  created.onerror=()=>fail("Model worker error");
  try{created.postMessage({type:"init"});}
  catch(error){disable();state="error";statusMessage=String(error);publish();return false;}
  return true;
 }
 function pushPCM(samples,inputRate){
  if(state!=="ready"||!worker||!samples||!Number.isFinite(inputRate)
    ||inputRate<8000||inputRate>192000||samples.length<128)return;
  // AudioWorklet delivers contiguous source-rate PCM. Reusing a
  // fractional offset per chunk used to duplicate/drop samples at 44.1/48k.
  // This streaming low-pass resampler keeps fractional phase across chunks.
  if(resampler.getInputRate()&&resampler.getInputRate()!==inputRate)clearAudio();
  resampler.push(samples,inputRate,value=>{
   ring[writeAt]=value;
   writeAt=(writeAt+1)%WINDOW_SAMPLES;
   filled=Math.min(WINDOW_SAMPLES,filled+1);sinceLast++;
  });
  // Do not keep the queue stuck forever when WASM inference hangs.
  if(busy&&clock()-pendingAt>MAX_INFERENCE_MS){
   const failed=worker;worker=null;try{failed?.terminate();}catch{}
   state="error";statusMessage="El clasificador no respondió a tiempo";
   last=null;filled=0;sinceLast=0;ring.fill(0);busy=false;
   pendingId=0;pendingAt=0;resampler.reset();publish();return;
  }
  if(filled<WINDOW_SAMPLES||sinceLast<STEP_SAMPLES||busy)return;
  const frame=new Float32Array(WINDOW_SAMPLES);
  for(let i=0;i<WINDOW_SAMPLES;i++)frame[i]=ring[(writeAt+i)%WINDOW_SAMPLES];
  busy=true;sinceLast=0;pendingAt=clock();pendingId=++sequence;
  try{worker.postMessage({type:"classify",id:pendingId,sampleRate:TARGET_RATE,samples:frame},[frame.buffer]);}
  catch(error){
   busy=false;state="error";statusMessage=String(error);
   const failed=worker;worker=null;try{failed?.terminate();}catch{}
   ring.fill(0);filled=0;last=null;pendingId=0;pendingAt=0;
   resampler.reset();publish();
  }
 }
 return {enable,disable,clearAudio,pushPCM,getStatus,calibrated:false,version};
}
root.ROBOTITO_SOUND_MODEL={create,createResampler,mapCategories,WINDOW_SAMPLES,TARGET_RATE};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_SOUND_MODEL;
})(typeof window!=="undefined"?window:globalThis);
