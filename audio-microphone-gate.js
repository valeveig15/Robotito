(function(root){
"use strict";
// An active app/session does not guarantee a usable microphone track.
// Revoked, ended, OS-muted or explicitly disabled audio tracks must not
// contribute samples to the optional sound model. No device IDs collected.
function create({stream,onChange=()=>{}}={}){
 const raw=stream?.getAudioTracks?.();
 const tracks=raw&&typeof raw[Symbol.iterator]==="function"?Array.from(raw):[];
 let disposed=false;
 const status=()=>{
  if(disposed)return "stopped";
  if(tracks.some(t=>t?.readyState==="live"&&t.enabled!==false&&t.muted!==true))
   return "live";
  if(tracks.some(t=>t?.readyState==="live"))return "muted";
  return "ended";
 };
 const notify=()=>{if(!disposed)onChange(status());};
 for(const track of tracks)for(const kind of ["ended","mute","unmute"])
  track?.addEventListener?.(kind,notify);
 function dispose(){
  if(disposed)return;
  disposed=true;
  for(const track of tracks)for(const kind of ["ended","mute","unmute"])
   track?.removeEventListener?.(kind,notify);
 }
 return {status,isLive:()=>status()==="live",dispose};
}
root.ROBOTITO_AUDIO_MICROPHONE_GATE={create};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_AUDIO_MICROPHONE_GATE;
})(typeof window!=="undefined"?window:globalThis);
