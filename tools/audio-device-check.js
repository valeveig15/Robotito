(function(){
"use strict";
// Local, opt-in microphone hardware diagnostics. No recording, PCM export,
// network requests, ML inference, browser identifiers, or persistence.
const el=id=>document.getElementById(id);
const state={phase:"idle",epoch:0,closed:false,stream:null,context:null,
 source:null,analyser:null,buffer:null,raf:0,requestAt:0,runAt:0,
 permissionMs:null,frames:0,activeFrames:0,peak:0,report:null,
 declaredDevice:"unspecified",declaredEnvironment:"quiet"};
const errorNames=new Set(["NotAllowedError","NotFoundError","NotReadableError",
 "AbortError","SecurityError","OverconstrainedError"]);
const round=n=>Math.round(n*1000)/1000;
function announce(message){el("state").textContent=message;}
function ui(){
 const busy=state.phase!=="idle";
 el("start").disabled=busy||state.closed;
 el("stop").disabled=!busy;
 el("download").disabled=!state.report;
 el("deviceClass").disabled=busy;
 el("environment").disabled=busy;
}
function stopTracks(stream){
 if(!stream)return true;
 let stopped=true;
 for(const track of stream.getTracks()){
  try{track.stop();}catch{stopped=false;}
  if(track.readyState!=="ended")stopped=false;
 }
 return stopped;
}
function cleanup(){
 if(state.raf){cancelAnimationFrame(state.raf);state.raf=0;}
 try{state.source?.disconnect();}catch{}
 try{state.analyser?.disconnect();}catch{}
 state.source=null;state.analyser=null;state.buffer=null;
 const closed=stopTracks(state.stream);
 state.stream=null;
 if(state.context){
  const context=state.context;state.context=null;
  // Do not await teardown: track.stop() is synchronous, and callbacks
  // from old streams must never write into a newer diagnostic session.
  try{Promise.resolve(context.close()).catch(()=>{});}catch{}
 }
 el("levelMeter").value=0;
 return closed;
}
function blank(message){
 state.epoch++;cleanup();state.phase="idle";state.report=null;
 state.permissionMs=null;state.runAt=0;state.frames=0;state.activeFrames=0;state.peak=0;
 for(const id of ["heardLevel","checkedMute","checkedReconnect"])el(id).checked=false;
 el("levelText").textContent="Sin mediciones.";
 el("result").textContent="";
 ui();announce(message);
}
function makeReport(status,closed,error=null){
 const seconds=state.runAt?Math.max(0,(performance.now()-state.runAt)/1000):0;
 return {schemaVersion:1,kind:"robotito-p03-local-microphone-check",
  deviceClass:state.declaredDevice,environment:state.declaredEnvironment,
  status,permissionElapsedMs:state.permissionMs,
  captureSeconds:round(seconds),sampledFrames:state.frames,
  framesWithRelativeLevel:state.activeFrames,peakRelativeLevel:round(state.peak),
  microphoneTracksStopped:closed,
  errorName:error,noAudioRecorded:true,noAudioExported:true,
  physicalHardwareVerifiedAutomatically:false};
}
function finish(reason,error=null){
 if(state.phase==="idle")return;
 const wasRequesting=state.phase==="requesting";
 state.epoch++;
 const tracksClosed=cleanup();
 state.phase="idle";
 state.report=makeReport(reason,tracksClosed,error);
 state.runAt=0;
 ui();
 announce(wasRequesting?"Solicitud cancelada o rechazada. El micrófono está inactivo.":
  "Prueba detenida. Pistas del micrófono cerradas: "+(tracksClosed?"sí":"no confirmado")+".");
 el("result").textContent="Resultado local: "+reason+
  ". Descargá el JSON si querés conservar estos datos sin audio.";
}
function measure(token){
 if(state.phase!=="running"||token!==state.epoch||document.hidden)return;
 state.analyser.getFloatTimeDomainData(state.buffer);
 let sum=0;
 for(const sample of state.buffer)sum+=sample*sample;
 const rms=Math.sqrt(sum/state.buffer.length);
 state.frames++;
 if(rms>=.02)state.activeFrames++;
 state.peak=Math.max(state.peak,rms);
 const level=Math.min(100,Math.round(rms*350));
 el("levelMeter").value=level;
 el("levelText").textContent="Nivel relativo: "+level+"/100 · Ventanas analizadas: "+state.frames+
  " · Con actividad detectable: "+state.activeFrames;
 state.raf=requestAnimationFrame(()=>measure(token));
}
async function start(){
 if(state.phase!=="idle"||state.closed)return;
 if(!el("consent").checked){
  announce("Confirmá el consentimiento antes de solicitar el micrófono.");return;
 }
 if(document.hidden||!navigator.mediaDevices?.getUserMedia||
    typeof window.AudioContext!=="function"){
  announce("El micrófono o el procesamiento de audio no están disponibles en este navegador.");return;
 }
 // No previous result may be silently reused for a different device.
 blank("Solicitando permiso del micrófono…");
 state.phase="requesting";state.requestAt=performance.now();
 state.declaredDevice=el("deviceClass").value;
 state.declaredEnvironment=el("environment").value;
 const token=++state.epoch;
 ui();
 let stream=null;
 try{
  stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
  if(token!==state.epoch||state.closed||document.hidden||!el("consent").checked){
   stopTracks(stream);return;
  }
  state.stream=stream;state.permissionMs=Math.round(performance.now()-state.requestAt);
  const tracks=stream.getAudioTracks();
  if(!tracks.length||tracks.every(t=>t.readyState!=="live"))
   throw Error("No live microphone track");
  for(const track of tracks){
   track.addEventListener("ended",()=>{
    if(token===state.epoch&&state.phase==="running")
     finish("microphone-track-ended");
   });
  }
  const context=new AudioContext();
  state.context=context;
  const source=context.createMediaStreamSource(stream);
  const analyser=context.createAnalyser();
  analyser.fftSize=2048;
  source.connect(analyser); // Never connect to speakers or MediaRecorder.
  state.source=source;state.analyser=analyser;
  state.buffer=new Float32Array(analyser.fftSize);
  await context.resume();
  if(token!==state.epoch||state.closed||document.hidden||!el("consent").checked){
   // The old grant may resolve after a new test has begun. Never clean up
   // the new test's tracks from this stale asynchronous continuation.
   stopTracks(stream);
   try{source.disconnect();analyser.disconnect();}catch{}
   try{await context.close();}catch{}
   return;
  }
  state.phase="running";state.runAt=performance.now();
  ui();announce("Micrófono activo solo para medir el nivel. Detené la prueba al terminar.");
  measure(token);
 }catch(error){
  if(token!==state.epoch){stopTracks(stream);return;}
  if(stream&&!state.stream)state.stream=stream;
  state.permissionMs=Math.round(performance.now()-state.requestAt);
  const safeName=errorNames.has(error?.name)?error.name:"Unavailable";
  finish("permission-or-capture-error",safeName);
 }
}
function exportReport(){
 if(!state.report||state.phase!=="idle")return;
 const report={...state.report,manualObservations:{
  visibleLevelChange:el("heardLevel").checked,
  muteBehaviorChecked:el("checkedMute").checked,
  disconnectReconnectChecked:el("checkedReconnect").checked
 }};
 const blob=new Blob([JSON.stringify(report,null,2)+"\n"],{type:"application/json"});
 const url=URL.createObjectURL(blob);
 const link=document.createElement("a");
 link.href=url;link.download="robotito-microphone-field-check.json";
 document.body.append(link);link.click();link.remove();
 // Object URLs contain report JSON only; never PCM.
 setTimeout(()=>URL.revokeObjectURL(url),30000);
 el("result").textContent="Informe local descargado. No contiene audio.";
}
el("start").addEventListener("click",start);
el("stop").addEventListener("click",()=>{
 if(state.phase==="requesting")finish("permission-request-canceled");
 else finish("user-stopped");
});
el("consent").addEventListener("change",()=>{
 if(!el("consent").checked)blank("Consentimiento retirado. Mediciones descartadas y micrófono cerrado.");
 else ui();
});
el("download").addEventListener("click",exportReport);
el("reset").addEventListener("click",()=>{
 blank("Resultados borrados. Micrófono inactivo.");
 for(const id of ["heardLevel","checkedMute","checkedReconnect"])el(id).checked=false;
});
document.addEventListener("visibilitychange",()=>{
 if(document.hidden&&state.phase!=="idle")
  blank("Pestaña oculta: micrófono cerrado y mediciones descartadas.");
});
window.addEventListener("pagehide",()=>{
 state.closed=true;
 blank("Página abandonada: micrófono cerrado y mediciones descartadas.");
});
window.addEventListener("pageshow",()=>{state.closed=false;ui();});
ui();
})();
