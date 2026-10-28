// Shared audio-window planner for labelled sound evaluation.
// Preserve clipped transients and tails; padding is silence, not synthetic proof.
(function(root){
"use strict";
const WINDOW_SAMPLES=15600,HOP_SAMPLES=7800;
function plan(length,{windowSamples=WINDOW_SAMPLES,hopSamples=HOP_SAMPLES}={}){
 if(!Number.isSafeInteger(length)||length<1||
    !Number.isSafeInteger(windowSamples)||windowSamples<1||
    !Number.isSafeInteger(hopSamples)||hopSamples<1||hopSamples>windowSamples)
  throw new Error("Audio evaluation needs a positive sample length and a valid window/hop");
 const windows=[];
 const add=start=>{
  const count=Math.min(windowSamples,length-start);
  const paddingStart=count<windowSamples?Math.floor((windowSamples-count)/2):0;
  windows.push({start,end:start+count,paddingStart,paddingEnd:windowSamples-count-paddingStart});
 };
 if(length<=windowSamples){add(0);return windows;}
 for(let start=0;start+windowSamples<=length;start+=hopSamples)add(start);
 // Always inspect the final sample, including a transient at the end.
 const tailStart=length-windowSamples;
 if(windows.at(-1).start<tailStart)add(tailStart);
 return windows;
}
function frame(samples,spec,windowSamples=WINDOW_SAMPLES){
 if(!samples||!spec||!Number.isSafeInteger(windowSamples)||windowSamples<1||
    spec.start<0||spec.end>samples.length||spec.start>=spec.end||
    spec.paddingStart<0||spec.paddingEnd<0||
    spec.paddingStart+spec.end-spec.start+spec.paddingEnd!==windowSamples)
   throw new Error("Invalid audio evaluation frame");
 const pcm=new Float32Array(windowSamples);
 pcm.set(samples.subarray(spec.start,spec.end),spec.paddingStart);
 return pcm;
}
root.ROBOTITO_AUDIO_EVALUATION_WINDOWS={plan,frame,WINDOW_SAMPLES,HOP_SAMPLES};
if(typeof module!=="undefined"&&module.exports)
 module.exports=root.ROBOTITO_AUDIO_EVALUATION_WINDOWS;
})(typeof window!=="undefined"?window:globalThis);
