(function(){
"use strict";
// Developer-only local corpus collection. No fetch, XHR, storage, analytics,
// external scripts or YAMNet. Audio stays in RAM until explicit downloads.
const byId=id=>document.getElementById(id);
const state={blob:null,ext:"",duration:0,url:null,events:[],suppressions:[],
 recorder:null,stream:null,chunks:[],recording:false,pendingMic:false,
 importing:false,epoch:0,closed:false};
const MAX_BYTES=50*1024*1024;
const kinds=new Set(["clap","laugh","cry","cough","sneeze"]);
const extensions=new Set(["wav","webm","ogg","mp3","m4a","flac"]);
const devices=new Set(["unspecified","phone","tablet","built-in","headset","usb","recorder","other"]);
const splits=new Set(["development","validation","test","unspecified"]);
const status=(message,kind="")=>{
 const el=byId("status");el.textContent=message;el.className=kind;
};
const clipNumber=x=>Number(x.toFixed(4));
function updateControls(){
 const active=state.recording||state.pendingMic;
 const ready=!!state.blob&&!active&&!state.importing;
 byId("startRecording").disabled=active||state.closed;
 byId("stopRecording").disabled=!active;
 byId("discardAudio").disabled=(!state.blob&&!state.importing)||active;
 byId("audioFile").disabled=active;
 const exportable=ready&&byId("consent").checked;
 byId("downloadAudio").disabled=!exportable;
 byId("downloadManifest").disabled=!exportable;
}
function stopTracks(){
 if(state.stream){
  for(const track of state.stream.getTracks())try{track.stop();}catch{}
  state.stream=null;
 }
}
function clearExisting(){
 // Revokes an in-flight decode or earlier microphone request. Late async
 // completions must never restore audio after discard or consent withdrawal.
 state.epoch++;state.importing=false;
 byId("audioFile").value="";
 if(state.url){URL.revokeObjectURL(state.url);state.url=null;}
 state.blob=null;state.ext="";state.duration=0;
 state.events=[];state.suppressions=[];
 const player=byId("preview");player.pause();player.removeAttribute("src");player.hidden=true;
 byId("duration").textContent="Todavía no hay un audio cargado.";
 render("events");render("suppressions");updateControls();
}
function extension(name,mime){
 const ext=String(name||"").split(".").at(-1).toLowerCase();
 if(extensions.has(ext))return ext;
 if(/webm/.test(mime))return "webm";
 if(/ogg/.test(mime))return "ogg";
 if(/wav/.test(mime))return "wav";
 if(/mpeg|mp3/.test(mime))return "mp3";
 if(/mp4|m4a/.test(mime))return "m4a";
 if(/flac/.test(mime))return "flac";
 throw Error("Formato no identificado. Elegí WAV, WebM, OGG, MP3, M4A o FLAC.");
}
async function acceptAudio(blob,name,token){
 if(!(blob instanceof Blob)||blob.size===0||blob.size>MAX_BYTES)
  throw Error("El audio debe existir y pesar menos de 50 MB.");
 const ext=extension(name,blob.type);
 const decoder=new OfflineAudioContext(1,1,16000);
 let buffer;
 try{buffer=await decoder.decodeAudioData(await blob.arrayBuffer());}
 catch{throw Error("El navegador no puede decodificar este audio.");}
 if(!Number.isFinite(buffer.duration)||buffer.duration<=0)
  throw Error("El audio no tiene duración válida.");
 if(state.closed||token!==state.epoch||state.recording||state.pendingMic)return;
 clearExisting();
 state.blob=blob;state.ext=ext;state.duration=buffer.duration;
 state.url=URL.createObjectURL(blob);
 const player=byId("preview");player.src=state.url;player.hidden=false;
 byId("duration").textContent="Duración: "+buffer.duration.toFixed(3)+" s · "+
  (blob.size/1024).toFixed(1)+" KiB · "+ext.toUpperCase();
 updateControls();
 status("Audio listo para anotar. Se conserva solo en este navegador.","success");
}
function range(startText,endText){
 if(startText.trim()===""||endText.trim()==="")
  throw Error("Ingresá los dos límites de tiempo.");
 const start=Number(startText),end=Number(endText);
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||
    end>state.duration+1e-4)
  throw Error("El intervalo debe estar dentro de los "+state.duration.toFixed(3)+" s del audio.");
 return {startSeconds:clipNumber(start),endSeconds:clipNumber(end)};
}
function render(which){
 const rows=which==="events"?state.events:state.suppressions;
 const target=byId(which==="events"?"eventsList":"suppressionsList");
 target.replaceChildren();
 rows.forEach((entry,index)=>{
  const li=document.createElement("li"),span=document.createElement("span");
  span.textContent=(which==="events"?entry.kind+" · ":"Suprimido · ")+
   entry.startSeconds.toFixed(2)+" – "+entry.endSeconds.toFixed(2)+" s";
  const remove=document.createElement("button");
  remove.type="button";remove.className="secondary";remove.textContent="Quitar";
  remove.setAttribute("aria-label","Quitar intervalo "+(index+1));
  remove.addEventListener("click",()=>{rows.splice(index,1);render(which);});
  li.append(span,remove);target.append(li);
 });
}
function add(which){
 try{
  if(!state.blob||state.recording)throw Error("Primero cargá o terminá una grabación.");
  const start=byId(which==="events"?"eventStart":"suppressStart").value;
  const end=byId(which==="events"?"eventEnd":"suppressEnd").value;
  const item=range(start,end);
  if(which==="events"){
   const kind=byId("eventKind").value;
   if(!kinds.has(kind))throw Error("Etiqueta de sonido desconocida.");
   state.events.push({kind,...item});
  }else state.suppressions.push(item);
  render(which);status("Intervalo agregado.","success");
 }catch(error){status(error.message,"error");}
}
function exportData(){
 if(!state.blob||state.recording)throw Error("No hay audio listo para exportar.");
 if(!byId("consent").checked)throw Error("Primero confirmá los derechos y el consentimiento.");
 const id=byId("sessionId").value.trim(),environment=byId("environment").value.trim(),
  sourceGroup=byId("sourceGroup").value.trim(),
  rights=byId("rights").value,split=byId("evaluationSplit").value,
  deviceClass=byId("deviceClass").value;
 if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(id))
  throw Error("El ID debe ser corto y usar solo letras, números, punto, guion o guion bajo.");
 if(!environment||environment.length>100)throw Error("Ingresá un entorno válido.");
 if(!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/.test(sourceGroup))
  throw Error("Ingresá un grupo de grabación seudónimo válido.");
 if(!splits.has(split)||!devices.has(deviceClass)||
    !["owned","consented"].includes(rights))throw Error("Metadatos de corpus no válidos.");
 const fileName=id+"."+state.ext;
 const checks=[...state.events,...state.suppressions];
 if(checks.some(x=>!Number.isFinite(x.startSeconds)||!Number.isFinite(x.endSeconds)||
    x.startSeconds<0||x.startSeconds>=x.endSeconds||
    x.endSeconds>state.duration+1e-4))throw Error("Hay intervalos fuera del audio.");
 const manifest={name:"Sesión autorizada para evaluación P03",sessions:[{
  id,path:fileName,environment,deviceClass,sourceGroup,evaluationSplit:split,
  rights,annotations:state.events.map(x=>({...x})),
  suppressions:state.suppressions.map(x=>({...x}))
 }]};
 return {fileName,manifest};
}
function download(blob,fileName){
 const url=URL.createObjectURL(blob);
 const link=document.createElement("a");
 link.href=url;link.download=fileName;
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function exportOne(which){
 try{
  const {fileName,manifest}=exportData();
  if(which==="audio")download(state.blob,fileName);
  else download(new Blob([JSON.stringify(manifest,null,2)+"\n"],{type:"application/json"}),
   "manifest-"+byId("sessionId").value.trim()+".json");
  status("Archivo descargado. Guardá audio y JSON juntos en la misma carpeta.","success");
 }catch(error){status(error.message,"error");}
}
function cancelCapture(){
 // Cancels even a pending getUserMedia prompt. Its eventual resolved stream
 // will be closed, without attaching a recorder or storing a single chunk.
 const recorder=state.recorder;
 state.epoch++;state.pendingMic=false;state.recording=false;
 state.recorder=null;state.chunks=[];
 try{if(recorder?.state==="recording")recorder.stop();}catch{}
 stopTracks();clearExisting();updateControls();
}
async function startRecording(){
 if(state.recording||state.pendingMic||state.closed)return;
 if(!byId("consent").checked){
  status("Confirmá el consentimiento antes de activar el micrófono.","error");return;
 }
 if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder!=="function"){
  status("Este navegador no permite grabar audio.","error");return;
 }
 // Erase the previous sample before requesting new audio. A cancellation
 // must invalidate both pending permission and any earlier import decode.
 clearExisting();
 const token=++state.epoch;
 state.pendingMic=true;updateControls();
 let stream=null;
 try{
  stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
  if(token!==state.epoch||state.closed||!byId("consent").checked||document.hidden){
   for(const track of stream.getTracks())try{track.stop();}catch{}
   return;
  }
  state.stream=stream;state.pendingMic=false;
  const preferred=["audio/webm;codecs=opus","audio/ogg;codecs=opus"];
  const supported=preferred.find(x=>MediaRecorder.isTypeSupported?.(x));
  const recorder=new MediaRecorder(stream,supported?{mimeType:supported}:undefined);
  state.recorder=recorder;state.chunks=[];state.recording=true;
  for(const track of stream.getTracks())track.addEventListener?.("ended",()=>{
   if(token!==state.epoch||!state.recording)return;
   cancelCapture();status("Se desconectó el micrófono. Se descartó la grabación.","error");
  });
  recorder.ondataavailable=event=>{
   if(token===state.epoch&&byId("consent").checked&&event.data?.size)
    state.chunks.push(event.data);
  };
  recorder.onerror=()=>{
   if(token!==state.epoch)return;
   cancelCapture();status("Falló la grabación. No se guardó audio.","error");
  };
  recorder.onstop=async()=>{
   if(token!==state.epoch)return;
   stopTracks();state.recording=false;state.recorder=null;
   updateControls();
   if(state.closed||!byId("consent").checked||document.hidden){
    cancelCapture();return;
   }
   try{
    const blob=new Blob(state.chunks,{type:recorder.mimeType||supported||"audio/webm"});
    state.chunks=[];
    await acceptAudio(blob,"grabacion."+extension("",blob.type),token);
   }catch(error){if(token===state.epoch)status(error.message,"error");}
  };
  recorder.start();updateControls();
  status("Grabación activa. Presioná «Detener grabación» para cortar el micrófono.","success");
 }catch(error){
  if(stream)for(const track of stream.getTracks())try{track.stop();}catch{}
  if(token===state.epoch){
   cancelCapture();
   status("No se inició la grabación: "+error.message,"error");
  }
 }
}
function stopRecording(){
 if(state.pendingMic){cancelCapture();status("Se canceló el permiso de grabación.","success");return;}
 if(!state.recording)return;
 try{if(state.recorder?.state==="recording")state.recorder.stop();}
 catch(error){cancelCapture();status("Se descartó la grabación: "+error.message,"error");}
 finally{stopTracks();}
}
byId("audioFile").addEventListener("change",async event=>{
 if(state.recording||state.pendingMic||state.closed)return;
 const file=event.target.files?.[0];
 if(!file)return;
 const token=++state.epoch;
 state.importing=true;updateControls();
 try{await acceptAudio(file,file.name,token);}
 catch(error){if(token===state.epoch){clearExisting();status(error.message,"error");}}
});
byId("consent").addEventListener("change",()=>{
 if(!byId("consent").checked){
  cancelCapture();status("Se retiró el consentimiento: audio y grabación descartados.","success");
 }else updateControls();
});
byId("startRecording").addEventListener("click",startRecording);
byId("stopRecording").addEventListener("click",stopRecording);
byId("discardAudio").addEventListener("click",()=>{
 clearExisting();status("Audio descartado de la memoria de esta página.","success");
});
byId("addEvent").addEventListener("click",()=>add("events"));
byId("addSuppression").addEventListener("click",()=>add("suppressions"));
byId("downloadAudio").addEventListener("click",()=>exportOne("audio"));
byId("downloadManifest").addEventListener("click",()=>exportOne("manifest"));
document.addEventListener("visibilitychange",()=>{
 if(document.hidden&&(state.recording||state.pendingMic)){
  cancelCapture();status("Grabación descartada al ocultar la pestaña.","success");
 }
});
window.addEventListener("pagehide",()=>{
 state.closed=true;cancelCapture();
});
window.addEventListener("pageshow",()=>{state.closed=false;updateControls();});
updateControls();
})();
