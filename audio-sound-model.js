// Optional local sound classification. The pre-trained model is NOT an
// application-calibrated diagnostic detector: predictions are tentative and
// can never authorize cough/sneeze/cry/laugh reactions by themselves.
(function(root){
"use strict";
const WINDOW_SAMPLES=15600,STEP_SAMPLES=7800,TARGET_RATE=16000;
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
function create({workerFactory=()=>new root.Worker("audio-model-worker.js",{type:"module"}),
 clock=()=>Date.now(),onUpdate=()=>{}}={}){
 let worker=null,state="off",statusMessage="",last=null,writeAt=0,filled=0,sinceLast=0;
 let sequence=0,busy=false,ring=new Float32Array(WINDOW_SAMPLES);
 const version="YAMNet AudioSet (uncalibrated for Robotito)";
 const publish=()=>{try{onUpdate(getStatus());}catch(e){console.warn("Sound model state",e);}};
 function getStatus(){
  const recent=last&&clock()-last.observedAt<=2600?last:null;
  return {state,message:statusMessage,version,calibrated:false,
    candidate:recent?{...recent.candidate}:null,scores:recent?{...recent.scores}:null};
 }
 function disable(){
  const previous=worker;worker=null;
  if(previous)try{previous.terminate();}catch{}
  state="off";statusMessage="";last=null;writeAt=0;filled=0;sinceLast=0;busy=false;
  ring=new Float32Array(WINDOW_SAMPLES);publish();
 }
 function enable(){
  if(state==="loading"||state==="ready")return true;
  if(typeof workerFactory!=="function")return false;
  let created;
  try{created=workerFactory();}
  catch(error){state="error";statusMessage=String(error?.message||error);publish();return false;}
  if(!created||typeof created.postMessage!=="function"){
   state="error";statusMessage="Worker unavailable";publish();return false;
  }
  worker=created;state="loading";statusMessage="";publish();
  created.onmessage=event=>{
   if(worker!==created)return;
   const data=event?.data||{};
   if(data.type==="ready"){state="ready";statusMessage="";publish();}
   else if(data.type==="result"){
    busy=false;
    if(!Number.isInteger(data.id)||data.id>sequence||data.id<= (last?.id||0))return;
    const mapped=mapCategories(data.categories);
    last={id:data.id,observedAt:clock(),...mapped};publish();
   }else if(data.type==="error"){
    statusMessage=String(data.message||"Model unavailable").slice(0,200);
    state="error";busy=false;publish();
   }
  };
  created.onerror=()=>{if(worker===created){state="error";statusMessage="Model worker error";busy=false;publish();}};
  try{created.postMessage({type:"init"});}
  catch(error){disable();state="error";statusMessage=String(error);publish();return false;}
  return true;
 }
 function pushPCM(samples,inputRate){
  if(state!=="ready"||!worker||!samples||!Number.isFinite(inputRate)
    ||inputRate<8000||inputRate>192000||samples.length<128)return;
  // Take the latest float time-domain analyser window and downsample to
  // 16kHz; no audio or transcript leaves the browser. A rolling window is
  // copied only at a bounded 0.49s hop to avoid pressure on the UI thread.
  const stride=inputRate/TARGET_RATE;
  for(let i=0;i<samples.length;i+=stride){
   const value=Number(samples[Math.floor(i)]);
   ring[writeAt]=Number.isFinite(value)?Math.max(-1,Math.min(1,value)):0;
   writeAt=(writeAt+1)%WINDOW_SAMPLES;
   filled=Math.min(WINDOW_SAMPLES,filled+1);sinceLast++;
  }
  if(filled<WINDOW_SAMPLES||sinceLast<STEP_SAMPLES||busy)return;
  const frame=new Float32Array(WINDOW_SAMPLES);
  for(let i=0;i<WINDOW_SAMPLES;i++)frame[i]=ring[(writeAt+i)%WINDOW_SAMPLES];
  busy=true;sinceLast=0;
  try{worker.postMessage({type:"classify",id:++sequence,sampleRate:TARGET_RATE,samples:frame},[frame.buffer]);}
  catch(error){busy=false;state="error";statusMessage=String(error);publish();}
 }
 return {enable,disable,pushPCM,getStatus,calibrated:false,version};
}
root.ROBOTITO_SOUND_MODEL={create,mapCategories,WINDOW_SAMPLES,TARGET_RATE};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_SOUND_MODEL;
})(typeof window!=="undefined"?window:globalThis);
