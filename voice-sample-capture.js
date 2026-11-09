// Local voice sample recording: explicit consent, safe stop and late-permission cancellation.
(function(root){
"use strict";
function create({requestStream=()=>root.navigator.mediaDevices.getUserMedia({audio:true}),
 recorderFactory=s=>new root.MediaRecorder(s),getConsent=()=>false,
 save=async()=>{},remove=async()=>{},onStatus=()=>{},
 schedule=(fn,ms)=>setTimeout(fn,ms),cancelSchedule=id=>clearTimeout(id)}={}){
 let generation=0,phase="idle",stream=null,recorder=null,timer=null,pending=null,deletion=null,disposed=false;
 const released=new WeakSet();
 const inform=name=>{try{onStatus(name);}catch{}};
 const release=s=>{try{s?.getTracks?.().forEach(t=>{if(!released.has(t)){released.add(t);t.stop();}});}catch{}};
 const clear=()=>{if(timer!==null)cancelSchedule(timer);timer=null;};
 const stop=()=>{
  if(phase!=="recording"||!recorder)return false;
  phase="stopping";clear();inform("stopping");
  const mine=generation;
  timer=schedule(()=>{if(mine===generation&&phase==="stopping"){cancel();inform("error");}},5000);
  try{recorder.stop();}catch{++generation;clear();release(stream);stream=null;recorder=null;phase="idle";inform("error");return false;}
  release(stream);
  return true;
 };
 const cancel=()=>{
  ++generation;clear();release(stream);
  if(recorder&&recorder.state!=="inactive")try{recorder.stop();}catch{}
  stream=null;recorder=null;
  if(!["saving","deleting"].includes(phase))phase="idle";
  inform("discarded");
 };
 async function start({subject="self",explicitConsent=false,consentLabel=""}={}){
  if(disposed||deletion||phase!=="idle"||!getConsent())return false;
  if(!["self","other"].includes(subject))return false;
  if(subject!=="self"&&(!explicitConsent||!String(consentLabel).trim()))return false;
  const mine=++generation;phase="requesting";inform("requesting");
  let grant;
  try{
   grant=await requestStream();
   if(mine!==generation||disposed||!getConsent()){
    release(grant);if(mine===generation)phase="idle";return false;
   }
   const tracks=grant.getAudioTracks?.()||grant.getTracks?.()||[];
   if(!tracks.length||tracks.some(t=>t.readyState==="ended"||t.enabled===false||t.muted===true))throw Error("No live microphone track");
   const obj=recorderFactory(grant),parts=[];
   stream=grant;recorder=obj;
   for(const track of tracks)for(const event of ["ended","mute"]){
    track.addEventListener?.(event,()=>{if(mine===generation&&phase==="recording"){cancel();inform("interrupted");}},{once:true});
   }
   obj.ondataavailable=e=>{
    if(mine===generation&&getConsent()&&e.data?.size)parts.push(e.data);
   };
   obj.onstop=()=>{
    // Ignore events from an old recorder before touching the current session.
    if(mine!==generation||recorder!==obj)return;
    if(phase!=="stopping"&&phase!=="recording")return;
    release(grant);stream=null;recorder=null;clear();
    if(disposed||!getConsent()){phase="idle";inform("discarded");return;}
    phase="saving";inform("saving");
    pending=(async()=>{
     let outcome="saved",stored=false;
     try{
      const blob=new Blob(parts,{type:obj.mimeType||"audio/webm"});
      if(blob.size<50)throw Error("Voice recording too short");
      await save(blob,{subject,explicitConsent:explicitConsent===true||subject==="self"&&getConsent()===true,consentLabel});
      stored=true;
      if(mine!==generation||disposed||!getConsent()){await remove();outcome="discarded";}
     }catch(e){
      outcome="error";
      if(stored&&(mine!==generation||disposed||!getConsent()))try{await remove();outcome="discarded";}catch{}
     }finally{if(phase!=="deleting")phase="idle";pending=null;inform(outcome);}
    })();
   };
   obj.onerror=()=>{if(mine===generation&&recorder===obj){cancel();inform("error");}};
   phase="recording";
   obj.start();
   if(mine===generation&&phase==="recording"){
    inform("recording");
    timer=schedule(()=>{if(mine===generation)stop();},3000);
   }
   return true;
  }catch(e){
   release(grant);
   if(mine===generation){
    clear();stream=null;recorder=null;phase="idle";inform("error");
   }
   return false;
  }
 }
 async function removeSample(){
  if(deletion)return deletion;
  cancel();const saving=pending;phase="deleting";inform("deleting");
  deletion=(async()=>{let outcome="deleted";
   try{if(saving)await saving;await remove();}
   catch(error){outcome="deleteError";throw error;}
   finally{phase="idle";deletion=null;inform(outcome);}
  })();return deletion;
 }
 function dispose(){disposed=true;cancel();}
 return {start,stop,cancel,removeSample,dispose,getStatus:()=>({phase,active:phase!=="idle"})};
}
root.ROBOTITO_VOICE_SAMPLE_CAPTURE={create};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_VOICE_SAMPLE_CAPTURE;
})(typeof window!=="undefined"?window:globalThis);
