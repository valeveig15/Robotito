// Explicit, local review of consented microphone samples. Never a TTS voice.
(function(root){
"use strict";
function init({state,$,uiSet,stopSpeaking,setVoicePlaybackStatus,isSpeechMuted,discardRecognition,restartRecognitionAfterSpeech}){
 const audio=$("#voiceSampleAudio"),panel=$("#voiceSamplePlayback");
 let url=null,view=0,sample=null,capture,pausedCapture=null;
 const consent=()=>$("#voiceSampleConsent")?.checked===true;
 const message=(source,data={})=>uiSet($("#voiceSampleStatus"),source,data);
 const status=name=>{
  const special={stopping:"Terminando la grabación…",deleting:"Eliminando muestra…",deleteError:"No pude eliminar la muestra. Volvé a intentar.",interrupted:"Se interrumpió el micrófono. La muestra se descartó."};
  if(special[name])message(special[name]);
  else uiSet($("#voiceSampleStatus"),root.ROBOTITO_I18N.t("voiceSample"+name[0].toUpperCase()+name.slice(1),"es"));
  updateButtons();
  if(["saved","deleted","discarded","error"].includes(name)&&!capture?.getStatus().active)void refresh();
 };
 function updateButtons(){
  const phase=capture?.getStatus().phase||"idle",busy=phase!=="idle";
  const wasBusy=Boolean(state.voiceSampleCaptureActive);
  state.voiceSampleCaptureActive=busy;
  if(busy&&!wasBusy)pauseCapture("recording");
  if(!busy&&wasBusy){
   resumeCapture("recording");
   if(state.voicePlaybackStatus==="recording")setVoicePlaybackStatus("idle");
  }
  const third=$("#voiceSampleThirdParty").checked;
  $("#voiceSampleName").disabled=!third;
  $("#recordVoiceSample").disabled=busy||!consent()||(third&&!$("#voiceSampleName").value.trim());
  $("#stopVoiceSample").disabled=phase!=="recording";
  $("#cancelVoiceSample").disabled=!["requesting","recording","stopping","saving"].includes(phase);
  $("#deleteVoiceSample").disabled=phase==="deleting";
 }
 function pauseCapture(reason){
  if(!pausedCapture)pausedCapture={reason,epoch:state.captureEpoch};
  root.RobotitoLocalASR?.pause?.(true);discardRecognition();
 }
 function resumeCapture(reason){
  if(!pausedCapture||pausedCapture.reason!==reason)return;
  const previous=pausedCapture;pausedCapture=null;state.voiceSamplePlaybackActive=false;
  if(state.captureEpoch!==previous.epoch)return;
  if(state.started&&!document.hidden&&!state.captureSuspended&&!state.enrollmentActive&&!state.speaking&&!state.speechBlocked&&!state.voiceSampleCaptureActive){
   root.RobotitoLocalASR?.pause?.(false);restartRecognitionAfterSpeech();
  }
 }
 function stopPlayback(){try{audio?.pause();}catch{}resumeCapture("playback");}
 function clearPlayer(){
  stopPlayback();if(audio){audio.removeAttribute("src");audio.load();}
  if(url)URL.revokeObjectURL(url);url=null;if(panel)panel.hidden=true;
 }
 async function refresh(){
  const mine=++view;
  try{
   const loaded=await root.ROBOTITO_VOICE_SYSTEM.loadProfile();
   if(mine!==view)return;
   clearPlayer();sample=loaded;
   if(!loaded){uiSet($("#voiceSampleDetails"),"No hay una muestra guardada.");return;}
   if(!loaded.blob){message(loaded.unverified?"La muestra anterior no tiene consentimiento registrado. Podés eliminarla.":"No se encontró el audio de la muestra. Podés eliminar su registro.");return;}
   url=URL.createObjectURL(loaded.blob);audio.src=url;panel.hidden=false;
   uiSet($("#voiceSampleDetails"),"Muestra guardada el {date}.",lang=>({date:new Date(loaded.record.data.createdAt||loaded.record.timestamp).toLocaleString(root.ROBOTITO_I18N.locale(lang))}));
  }catch{if(mine===view)message("No pude leer la muestra guardada. Volvé a intentar.");}
 }
 capture=root.ROBOTITO_VOICE_SAMPLE_CAPTURE.create({getConsent:consent,
  save:(blob,details)=>root.ROBOTITO_VOICE_SYSTEM.saveProfileFromRecording(blob,details),
  remove:()=>root.ROBOTITO_VOICE_SYSTEM.deleteProfile(),onStatus:status});
 state.cancelVoiceSample=()=>{capture.cancel();updateButtons();};
 state.stopVoiceSamplePlayback=stopPlayback;
 for(const id of ["voiceSampleConsent","voiceSampleThirdParty","voiceSampleName"]){
  $("#"+id).addEventListener(id==="voiceSampleName"?"input":"change",()=>{
   if(capture.getStatus().active)capture.cancel();stopPlayback();updateButtons();
  });
 }
 $("#recordVoiceSample").addEventListener("click",async()=>{
  if(!root.MediaRecorder||!root.navigator.mediaDevices?.getUserMedia){message("Este navegador no permite grabar muestras de voz.");return;}
  if(!consent())return;
  stopSpeaking();stopPlayback();++view;
  const third=$("#voiceSampleThirdParty").checked,name=$("#voiceSampleName").value.trim();
  await capture.start({subject:third?"other":"self",explicitConsent:true,consentLabel:third?name:"self"});updateButtons();
 });
 $("#stopVoiceSample").addEventListener("click",()=>{capture.stop();updateButtons();});
 $("#cancelVoiceSample").addEventListener("click",()=>{capture.cancel();updateButtons();});
 $("#deleteVoiceSample").addEventListener("click",async()=>{
  ++view;clearPlayer();sample=null;
  try{await capture.removeSample();}catch{/* Capture reports deletion failure. */}updateButtons();
 });
 audio?.addEventListener("play",()=>{
  if(!sample?.blob||state.classMode||isSpeechMuted()||capture.getStatus().active||document.hidden){stopPlayback();message("La reproducción de la muestra está pausada en este modo.");return;}
  stopSpeaking();state.voiceSamplePlaybackActive=true;pauseCapture("playback");
 });
 for(const event of ["pause","ended","error"])audio?.addEventListener(event,()=>{
  if(event==="pause"&&!audio.paused||event==="ended"&&!audio.ended||event==="error"&&!audio.error)return;
  resumeCapture("playback");if(event==="error"&&url)message("No se pudo reproducir esta muestra en el navegador.");
 });
 document.addEventListener("visibilitychange",()=>{if(document.hidden){capture.cancel();stopPlayback();updateButtons();}});
 root.addEventListener("pagehide",()=>{++view;capture.cancel();clearPlayer();});
 root.addEventListener("pageshow",event=>{if(event.persisted)void refresh();});
 updateButtons();void refresh();
 return {refresh,stopPlayback};
}
root.ROBOTITO_VOICE_SAMPLE_UI={init};
})(typeof window!=="undefined"?window:globalThis);
