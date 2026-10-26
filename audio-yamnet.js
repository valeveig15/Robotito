// Optional, ON-DEVICE AudioSet/YAMNet inference. Downloaded only after opt-in.
// The pretrained model is experimental, not validated against this user's room.
// Microphone samples are processed locally and are not uploaded by this module.
(function(root){
"use strict";
const CDN="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@1.1.1/+esm";
const WASM="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@1.1.1/wasm";
const MODEL="https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite";
const KINDS=["clap","laugh","cry","cough","sneeze"];
const RECOGNIZED=[
 ["clap",/(?:applause|clapping|handclap)/i],
 ["laugh",/(?:laugh(?:ter|ing)?|giggl(?:e|ing)|chuckl(?:e|ing))/i],
 ["cry",/(?:cry(?:ing)?|sobbing|sob|whimper(?:ing)?|wail(?:ing)?)/i],
 ["cough",/(?:cough(?:ing)?)/i],
 ["sneeze",/(?:sneez(?:e|ing))/i]
];
const clamp=value=>Number.isFinite(Number(value))?Math.max(0,Math.min(1,Number(value))):0;
function categoryScores(results){
 const output=Object.fromEntries(KINDS.map(k=>[k,0]));
 if(!Array.isArray(results))return output;
 for(const item of results){
  for(const classification of (item?.classifications||[])){
   for(const category of (classification?.categories||[])){
    const label=String(category?.categoryName||category?.displayName||"");
    const score=clamp(category?.score);
    for(const [kind,match]of RECOGNIZED)if(match.test(label))output[kind]=Math.max(output[kind],score);
   }
  }
 }
 return output;
}
function create({
 importer=url=>import(url),clock=()=>Date.now(),schedule=fn=>setTimeout(fn,0),
 onStatus=()=>{},cdn=CDN,wasm=WASM,modelUrl=MODEL
}={}){
 let active=false,loading=false,task=null,processor=null,volume=null,connectedSource=null;
 let tokens=0,pieces=[],pieceSize=0,lastAt=0,lastInference=0,sequence=0,lastScores={};
 let error=null,pending=false,suspend=()=>false,sampleRate=48000,context=null;
 const adapter={
  calibrated:false,experimental:true,ready:false,version:"yamnet-audioset-pretrained-experimental-v1",
  predict(){
   return {scores:clock()-lastAt<=1800?{...lastScores}:{},
    sequence};
  }
 };
 function publish(state){
  try{onStatus(state,error);}catch(err){console.warn("Sound model status",err);}
 }
 function detach(){
  const currentProcessor=processor;
  if(currentProcessor){currentProcessor.onaudioprocess=null;try{currentProcessor.disconnect();}catch{}processor=null;}
  if(volume){try{volume.disconnect();}catch{}volume=null;}
  if(connectedSource){try{connectedSource.disconnect(currentProcessor);}catch{}connectedSource=null;}
  pieces=[];pieceSize=0;pending=false;active=false;adapter.ready=false;context=null;lastScores={};lastAt=0;
  sequence++;
 }
 function stop(){
  tokens++;
  const previousTask=task;task=null;
  detach();
  try{previousTask?.close?.();}catch(e){console.warn("Sound model close",e);}
  loading=false;publish("off");
 }
 function append(samples,maxSamples){
  pieces.push(Float32Array.from(samples));pieceSize+=samples.length;
  while(pieces.length>1&&pieceSize-pieces[0].length>=maxSamples){
   pieceSize-=pieces[0].length;pieces.shift();
  }
 }
 function latest(count){
  const out=new Float32Array(count);let cursor=count;
  for(let i=pieces.length-1;i>=0&&cursor>0;i--){
   const data=pieces[i],n=Math.min(cursor,data.length);
   out.set(data.subarray(data.length-n),cursor-n);cursor-=n;
  }
  return out;
 }
 async function start(ctx,source,{isSuppressed=()=>false}={}){
  if(active)return true;
  if(loading)return false;
  if(!ctx?.createScriptProcessor||!source?.connect){
   error=new Error("Audio processing is not available");
   publish("unavailable");return false;
  }
  const generation=++tokens;
  loading=true;error=null;suspend=isSuppressed;context=ctx;
  sampleRate=ctx.sampleRate||48000;publish("loading");
  let opened=null;
  try{
   const audio=await importer(cdn);
   if(!audio?.AudioClassifier||!audio?.FilesetResolver)
    throw Error("Audio classifier module is unavailable");
   const fileset=await audio.FilesetResolver.forAudioTasks(wasm);
   opened=await audio.AudioClassifier.createFromModelPath(fileset,modelUrl);
   if(tokens!==generation){try{opened.close?.();}catch{};return false;}
   task=opened;
   processor=ctx.createScriptProcessor(4096,1,1);
   volume=ctx.createGain();volume.gain.value=0;
   source.connect(processor);connectedSource=source;
   processor.connect(volume);volume.connect(ctx.destination);
   pieces=[];pieceSize=0;lastAt=0;lastInference=0;pending=false;
   active=true;adapter.ready=true;loading=false;publish("ready");
   processor.onaudioprocess=event=>{
    if(!active||!task)return;
    if(suspend()||ctx.state==="suspended"||root.document?.hidden){
     pieces=[];pieceSize=0;lastScores={};sequence++;return;
    }
    const samples=event.inputBuffer?.getChannelData?.(0);
    if(!samples?.length)return;
    const count=Math.max(15600,Math.round(sampleRate*.975));
    append(samples,count+4096);
    if(pieceSize<count||pending||clock()-lastInference<650)return;
    lastInference=clock();pending=true;
    const audioChunk=latest(count),targetTask=task;
    schedule(()=>{
     if(!active||targetTask!==task){pending=false;return;}
     try{
      const result=targetTask.classify(audioChunk,sampleRate);
      lastScores=categoryScores(result);lastAt=clock();sequence++;
     }catch(e){error=e;lastScores={};lastAt=0;sequence++;publish("error");}
     finally{pending=false;}
    });
   };
   return true;
  }catch(e){
   if(tokens!==generation)return false;
   error=e;loading=false;
   if(opened){try{opened.close?.();}catch{};}
   detach();publish("error");return false;
  }
 }
 function getStatus(){return {active,loading,ready:adapter.ready,error:error?.message||null,
  predictionAt:lastAt,sequence,scores:{...lastScores},sampleRate};}
 return {adapter,start,stop,getStatus};
}
root.ROBOTITO_YAMNET={create,categoryScores,CDN,WASM,MODEL};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_YAMNET;
})(typeof window!=="undefined"?window:globalThis);
