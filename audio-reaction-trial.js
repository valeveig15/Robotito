// Private, opt-in P03 field counts for REAL avatar actions. This does not
// record audio, confidence scores, transcripts, device identities or times.
(function(root){
"use strict";
const EVENT_KINDS=Object.freeze(["clap","laugh","cry","cough","sneeze","impact","music"]);
const ACTIONS=Object.freeze(["clap","smile","comfort","notice","bless"]);
const counts=keys=>Object.fromEntries(keys.map(k=>[k,0]));
function create({clock=()=>typeof performance!=="undefined"?performance.now():Date.now()}={}){
 let active=false,from=0,lastDance=false,summary=null;
 let detected=counts(EVENT_KINDS),applied=counts(ACTIONS),
  preventedByContext=0,notAppliedAfterDetection=0,danceStarts=0,danceStops=0;
 function clear(){
  active=false;summary=null;lastDance=false;from=0;
  detected=counts(EVENT_KINDS);applied=counts(ACTIONS);
  preventedByContext=0;notAppliedAfterDetection=0;danceStarts=0;danceStops=0;
 }
 function start(){
  if(active)return false;
  clear();const now=clock();
  if(!Number.isFinite(now)||now<0)return false;
  from=now;active=true;return true;
 }
 function observeEvent(kind,{action=null,suppressed=false}={}){
  if(!active||!EVENT_KINDS.includes(kind)||typeof suppressed!=="boolean")return false;
  detected[kind]++;
  if(suppressed)preventedByContext++;
  else if(ACTIONS.includes(action))applied[action]++;
  else notAppliedAfterDetection++;
  return true;
 }
 function observeDance(actualDancing){
  if(!active||typeof actualDancing!=="boolean")return false;
  if(actualDancing&&!lastDance)danceStarts++;
  if(!actualDancing&&lastDance)danceStops++;
  lastDance=actualDancing;
  return true;
 }
 function stop(){
  if(!active)return false;
  const now=clock();active=false;
  summary={
   schemaVersion:1,kind:"robotito-p03-local-avatar-reaction-trial",
   durationSeconds:Number.isFinite(now)&&now>=from?
    Math.round((now-from)/100)/10:null,
   detectedEventsByKind:{...detected},
   avatarActionsByType:{...applied},
   preventedByContext,notAppliedAfterDetection,danceStarts,danceStops,
   noAudioRecordedByThisTool:true,noAudioExportedByThisTool:true,
   independentModelCalibrationVerified:false,
   physicalMicrophoneIndependentlyVerified:false,
   actualHumanSoundAccuracyEstablished:false,
   interpretation:"Local counts of event callbacks and actual avatar actions, not detection accuracy, ground-truth false alarms or acoustic onset latency"
  };
  lastDance=false;
  return true;
 }
 function report(){return summary?JSON.parse(JSON.stringify(summary)):null;}
 function status(){return {active,canExport:!active&&!!summary};}
 return {start,stop,clear,observeEvent,observeDance,report,status};
}
function attachControls({isReady=()=>true}={}){
 const trial=create(),doc=root.document;
 if(!doc)return trial;
 const get=id=>doc.getElementById(id);
 const startBtn=get("reactionTrialStart"),stopBtn=get("reactionTrialStop"),
  exportBtn=get("reactionTrialExport"),clearBtn=get("reactionTrialClear"),
  label=get("reactionTrialStatus");
 if(!startBtn||!stopBtn||!exportBtn||!clearBtn||!label)return trial;
 const update=(message)=>{
  const status=trial.status();
  startBtn.disabled=status.active;
  stopBtn.disabled=!status.active;
  exportBtn.disabled=!status.canExport;
  label.textContent=message;
 };
 startBtn.addEventListener("click",()=>{
  if(!isReady()){update("Iniciá Robotito y autorizá su micrófono antes de registrar reacciones.");return;}
  if(trial.start())update("Registro local activo. No guarda sonidos ni palabras.");
 });
 stopBtn.addEventListener("click",()=>{
  trial.stop();
  update("Registro detenido. Podés descargar solo los recuentos o borrarlos.");
 });
 clearBtn.addEventListener("click",()=>{
  trial.clear();update("Registro descartado. No queda ningún informe.");
 });
 exportBtn.addEventListener("click",()=>{
  const report=trial.report();if(!report)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)+"\\n"],
   {type:"application/json"}));
  const link=doc.createElement("a");
  link.href=url;link.download="robotito-avatar-reaction-trial.json";
  doc.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
  update("Informe local descargado, sin grabaciones ni identificadores.");
 });
 const privacyDiscard=()=>{
  trial.clear();update("Pestaña oculta o abandonada: registro descartado.");
 };
 doc.addEventListener("visibilitychange",()=>{
  if(doc.hidden)privacyDiscard();
 });
 root.addEventListener("pagehide",privacyDiscard);
 update("Registro apagado. Solo se inicia con tu autorización.");
 return trial;
}
root.ROBOTITO_AUDIO_REACTION_TRIAL={create,attachControls};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_AUDIO_REACTION_TRIAL;
})(typeof window!=="undefined"?window:globalThis);
