// Local voice sample recording: explicit consent, safe stop and late-permission cancellation.
(function(root){
"use strict";
function create({requestStream=()=>root.navigator.mediaDevices.getUserMedia({audio:true}),
 recorderFactory=s=>new root.MediaRecorder(s),getConsent=()=>false,
 save=async()=>{},remove=async()=>{},onStatus=()=>{},
 schedule=(fn,ms)=>setTimeout(fn,ms),cancelSchedule=id=>clearTimeout(id)}={}){
 let generation=0,phase="idle",stream=null,recorder=null,timer=null,pending=null,disposed=false;
 const inform=name=>{try{onStatus(name);}catch{}};
 const release=s=>{try{s?.getTracks?.().forEach(t=>t.stop());}catch{}};
 const clear=()=>{if(timer!==null)cancelSchedule(timer);timer=null;};
 const stop=()=>{
  if(phase!=="recording"||!recorder)return false;
  phase="stopping";clear();
  try{recorder.stop();}catch{++generation;release(stream);stream=null;recorder=null;phase="idle";inform("error");return false;}
  return true;
 };
 const cancel=()=>{
  ++generation;clear();release(stream);
  if(recorder&&recorder.state!=="inactive")try{recorder.stop();}catch{}
  stream=null;recorder=null;
  if(phase!=="saving")phase="idle";
  inform("discarded");
 };
 async function start({subject="self",explicitConsent=false,consentLabel=""}={}){
  if(disposed||phase!=="idle"||!getConsent())return false;
  if(subject!=="self"&&(!explicitConsent||!String(consentLabel).trim()))return false;
  const mine=++generation;phase="requesting";inform("requesting");
  let grant;
  try{
   grant=await requestStream();
   if(mine!==generation||disposed||!getConsent()){
    release(grant);if(mine===generation)phase="idle";return false;
   }
   const obj=recorderFactory(grant),parts=[];
   stream=grant;recorder=obj;
   obj.ondataavailable=e=>{
    if(mine===generation&&getConsent()&&e.data?.size)parts.push(e.data);
   };
   obj.onstop=()=>{
    release(grant);if(stream===grant)stream=null;if(recorder===obj)recorder=null;clear();
    if(mine!==generation||disposed||!getConsent()){if(phase!=="saving")phase="idle";return;}
    phase="saving";inform("saving");
    pending=(async()=>{
     try{
      const blob=new Blob(parts,{type:obj.mimeType||"audio/webm"});
      if(blob.size<50)throw Error("Voice recording too short");
      await save(blob,{subject,explicitConsent,consentLabel});
      if(mine!==generation||disposed||!getConsent()){await remove();inform("discarded");}
      else inform("saved");
     }catch(e){
      if(mine!==generation||disposed||!getConsent())try{await remove();}catch{}
      else inform("error");
     }finally{phase="idle";pending=null;}
    })();
   };
   obj.onerror=()=>{cancel();inform("error");};
   obj.start();phase="recording";inform("recording");
   if(mine===generation&&phase==="recording")timer=schedule(()=>{if(mine===generation)stop();},3000);
   return true;
  }catch(e){
   release(grant);
   if(mine===generation){
    clear();stream=null;recorder=null;phase="idle";inform("error");
   }
   return false;
  }
 }
 async function removeSample(){cancel();if(pending)await pending;await remove();inform("deleted");}
 function dispose(){disposed=true;cancel();}
 return {start,stop,cancel,removeSample,dispose,getStatus:()=>({phase,active:phase!=="idle"})};
}
root.ROBOTITO_VOICE_SAMPLE_CAPTURE={create};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_VOICE_SAMPLE_CAPTURE;
})(typeof window!=="undefined"?window:globalThis);
