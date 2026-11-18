// P44: photos/screen grabs only after an explicit user gesture and permission.
(function(root){
"use strict";
const $=id=>document.getElementById(id);
let stream=null,previewUrl=null,photo=null,epoch=0;
const message=value=>{if($("privateCaptureStatus"))$("privateCaptureStatus").textContent=value;};
function stopTracks(tracks){for(const track of tracks||[])try{track.stop();}catch{}}
function stop(){
 ++epoch;
 if(stream)stopTracks(stream.getTracks());
 stream=null;
 const video=$("privateCaptureVideo");if(video){video.pause();video.srcObject=null;video.hidden=true;}
}
function discard(){
 stop();photo=null;
 if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}
 const image=$("privateCaptureImage");if(image){image.removeAttribute("src");image.hidden=true;}
 if($("privateCaptureDownload"))$("privateCaptureDownload").disabled=true;
 message("Captura descartada. No se guardó ni subió ninguna imagen.");
}
function showBlob(blob){
 if(previewUrl)URL.revokeObjectURL(previewUrl);
 photo=blob;previewUrl=URL.createObjectURL(blob);
 const img=$("privateCaptureImage");
 img.src=previewUrl;img.hidden=false;
 $("privateCaptureDownload").disabled=false;
 message("📸 ¡Qué buena foto! Revisala y elegí si querés guardarla. Todo permanece en este dispositivo.");
}
async function snapshot(video,token){
 if(token!==epoch||document.hidden)return;
 if(video.readyState<2||video.videoWidth<1||video.videoHeight<1)throw Error("No hay una imagen disponible.");
 const canvas=document.createElement("canvas");
 const ratio=Math.min(1,1920/video.videoWidth);
 canvas.width=Math.max(1,Math.round(video.videoWidth*ratio));
 canvas.height=Math.max(1,Math.round(video.videoHeight*ratio));
 canvas.getContext("2d").drawImage(video,0,0,canvas.width,canvas.height);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
 if(token!==epoch||!blob)return;
 stop();showBlob(blob);
}
async function openCamera(){
 stop();const token=epoch;
 if(!navigator.mediaDevices?.getUserMedia){message("Este navegador no permite acceso a cámara.");return;}
 try{
  const request=navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:false});
  const media=await request;
  if(token!==epoch||document.hidden){stopTracks(media.getTracks());return;}
  stream=media;
  const video=$("privateCaptureVideo");video.srcObject=media;video.hidden=false;
  await video.play();message("Cámara lista. Solo se tomará la foto si presionás «Tomar foto».");
  for(const track of media.getTracks())track.addEventListener("ended",stop,{once:true});
 }catch(error){stop();message("No pude abrir la cámara. Revisá el permiso o probá de nuevo.");}
}
async function captureScreen(){
 stop();const token=epoch;
 if(!navigator.mediaDevices?.getDisplayMedia){message("Tu navegador no ofrece captura de pantalla compartida.");return;}
 try{
  // Browser-owned chooser: never bypasses permission or picks a window for the user.
  const media=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
  if(token!==epoch||document.hidden){stopTracks(media.getTracks());return;}
  stream=media;const video=$("privateCaptureVideo");video.srcObject=media;video.hidden=true;
  await video.play();
  if(token!==epoch){stop();return;}
  await snapshot(video,token);
 }catch(error){stop();message("La captura fue cancelada o no está disponible.");}
}
async function snapCamera(){
 if(!stream){message("Primero activá la cámara.");return;}
 const token=epoch;
 try{await snapshot($("privateCaptureVideo"),token);}catch(error){message("No pude obtener la imagen.");}
}
function download(){
 if(!photo||!previewUrl)return;
 const link=document.createElement("a");
 link.href=previewUrl;
 link.download="robotito-foto-"+new Date().toISOString().slice(0,10)+".png";
 link.click();
 message("Archivo preparado para descargar. No se subió a ningún servidor.");
}
function init(){
 $("privateCaptureCamera")?.addEventListener("click",()=>void openCamera());
 $("privateCaptureScreen")?.addEventListener("click",()=>void captureScreen());
 $("privateCaptureSnap")?.addEventListener("click",()=>void snapCamera());
 $("privateCaptureCancel")?.addEventListener("click",discard);
 $("privateCaptureDownload")?.addEventListener("click",download);
 document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();});
 root.addEventListener("pagehide",discard);
 root.addEventListener("robotito:memoryscopechange",discard);
}
root.ROBOTITO_PRIVATE_CAPTURE={init,stop,discard,get active(){return !!stream;}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window);
