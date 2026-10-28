(function(root){
"use strict";
// AudioWorklet-less browsers must not use repeated AnalyserNode snapshots:
// polling an FFT buffer from requestAnimationFrame repeats or skips PCM.
// ScriptProcessorNode is deprecated but yields sequential non-overlapping
// 2048-sample input buffers on browsers where it remains available.
// This fallback is installed ONLY after explicit sound-model consent.
function create({context,source,isAllowed,forward,reset,clock=Date.now}={}){
 if(!context||!source||typeof isAllowed!=="function"||
    typeof forward!=="function"||typeof reset!=="function")
  throw Error("Fallback capture requires context, source and privacy callbacks");
 let node=null,silentGain=null,wasAllowed=false,lastAt=null;
 const clear=()=>{wasAllowed=false;lastAt=null;reset();};
 function stop(){
  const previous=node,gain=silentGain;
  node=null;silentGain=null;
  if(previous){
   previous.onaudioprocess=null;
   try{source.disconnect(previous);}catch{}
   try{previous.disconnect();}catch{}
  }
  if(gain)try{gain.disconnect();}catch{}
  clear();
 }
 function start(){
  if(node)return true;
  if(typeof context.createScriptProcessor!=="function"||
     typeof context.createGain!=="function"||!context.destination)return false;
  const processor=context.createScriptProcessor(2048,1,1);
  const gain=context.createGain();
  gain.gain.value=0; // Never play the captured microphone to the speakers.
  processor.onaudioprocess=event=>{
   if(node!==processor)return;
   // ScriptProcessor callbacks run on the main thread: a frozen UI cannot
   // keep transferring buffers. Each callback rechecks every suppression.
   if(!isAllowed()){
    if(wasAllowed)clear();
    return;
   }
   const now=clock();
   if(!Number.isFinite(now)||now<0){clear();return;}
   if(lastAt!==null&&(now<lastAt||now-lastAt>500)){
    // Do not mix audio buffered before/after a suspended callback.
    clear();lastAt=now;wasAllowed=true;return;
   }
   lastAt=now;wasAllowed=true;
   const samples=event?.inputBuffer?.getChannelData?.(0);
   if(samples?.length===2048)forward(samples,context.sampleRate);
  };
  node=processor;silentGain=gain;
  try{
   source.connect(processor);
   processor.connect(gain);
   gain.connect(context.destination);
  }catch(error){stop();throw error;}
  return true;
 }
 return {start,stop,isActive:()=>!!node};
}
root.ROBOTITO_AUDIO_SCRIPT_FALLBACK={create};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_AUDIO_SCRIPT_FALLBACK;
})(typeof window!=="undefined"?window:globalThis);
