// P76/P77: conspicuous class status and private color-coded class bookmarks.
// P78 limited: audio bookmark seeks a real recording; no fabricated word alignment.
(function(root){
"use strict";
const policy=root.ROBOTITO_CLASS_MARK_POLICY,store=root.ROBOTITO_STORE;
const $=id=>document.getElementById(id);
let services=null,owner=null,revision=0,model={markers:[]},queue=Promise.resolve(),lastMode=false;
const storageKey=who=>"memory-scope:"+encodeURIComponent(who)+":robotito.classMarks.v1";
const current=()=>root.ROBOTITO_MEMORY?.owner?.()||null;
function status(text){const p=$("classMarkerStatus");if(p)p.textContent=text;}
function load(){
 const who=current(),token=++revision;
 owner=who;model={markers:[]};render();
 if(!who)return;
 void store.get(storageKey(who),{markers:[]}).then(data=>{
  if(token!==revision||who!==current())return;
  model={markers:Array.isArray(data?.markers)?data.markers.slice(-500):[]};render();
 }).catch(()=>status("No se pudieron cargar los marcadores. No se borraron datos."));
}
function persist(next){
 const who=current(),token=revision;
 if(!who||who!==owner)return Promise.reject(Error("Changed owner"));
 const data=structuredClone(next);
 const job=queue.catch(()=>{}).then(async()=>{
  if(token!==revision||who!==current())throw Error("Changed owner");
  await store.set(storageKey(who),data);
  if(token!==revision||who!==current())throw Error("Changed owner");
  model=data;render();
 });
 queue=job;return job;
}
function render(){
 const host=$("classMarkerList");if(!host)return;
 host.replaceChildren();
 if(!model.markers.length){const p=document.createElement("p");p.textContent="Sin marcadores todavía.";p.className="muted";host.append(p);return;}
 for(const item of model.markers.slice(-120).reverse()){
  const row=document.createElement("div");row.className="class-time-marker mark-"+item.color;
  row.dataset.markerId=item.id;row.dataset.classSession=item.sessionId;
  const title=document.createElement("span");title.textContent=policy.clock(item.offsetMs)+" · "+(item.note||"Marca de clase");
  const jump=document.createElement("button");jump.type="button";jump.textContent="Ir al audio";
  jump.addEventListener("click",()=>seek(item));
  const remove=document.createElement("button");remove.type="button";remove.textContent="Eliminar";
  remove.addEventListener("click",()=>{
   if(!root.confirm("¿Eliminar este marcador?"))return;
   void persist({markers:model.markers.filter(x=>x.id!==item.id)}).catch(()=>status("No se pudo eliminar el marcador."));
  });
  row.append(title,jump,remove);host.append(row);
 }
}
function findPlayer(sessionId){
 return [...document.querySelectorAll("#classRecordingsList .class-recording")].find(node=>node.dataset.classSession===sessionId)?.querySelector("audio")||null;
}
async function seek(item){
 const audio=findPlayer(item.sessionId);
 if(!audio){status("Esta grabación no está disponible aquí. El marcador permanece guardado.");return false;}
 try{
  if(audio.readyState===0)await new Promise((resolve,reject)=>{
   audio.addEventListener("loadedmetadata",resolve,{once:true});
   audio.addEventListener("error",reject,{once:true});
   audio.load();
  });
  const secs=item.offsetMs/1000;
  if(Number.isFinite(audio.duration))audio.currentTime=Math.min(secs,Math.max(0,audio.duration-.02));
  else audio.currentTime=secs;
  audio.scrollIntoView({block:"center",behavior:"auto"});
  try{await audio.play();}catch{}
  status("Reproducción situada aproximadamente en "+policy.clock(item.offsetMs)+".");
  return true;
 }catch{status("No se pudo posicionar esta grabación.");return false;}
}
function getPosition(){
 const live=services?.classInfo?.();
 if(live?.active&&live.sessionId&&Number.isFinite(live.startedAt)&&live.startedAt>0)
  return {sessionId:live.sessionId,offsetMs:Date.now()-live.startedAt};
 const player=[...document.querySelectorAll("#classRecordingsList .class-recording audio")].find(x=>!x.paused);
 const article=player?.closest(".class-recording");
 if(player&&article?.dataset.classSession)return {sessionId:article.dataset.classSession,offsetMs:player.currentTime*1000};
 return null;
}
function mark(){
 if(!owner||owner!==current())return;
 const data=getPosition();
 if(!data){status("Empezá una clase o reproducí una grabación para colocar un marcador.");return;}
 if(model.markers.length>=500){status("Límite de 500 marcadores. Eliminá algunos antes de crear más.");return;}
 let item;try{item=policy.marker({...data,color:$("classMarkerColor").value,note:$("classMarkerNote").value});}
 catch(error){status(error.message);return;}
 void persist({markers:[...model.markers,item]}).then(()=>{
  $("classMarkerNote").value="";status("Marcador guardado en el minuto "+policy.clock(item.offsetMs)+".");
 }).catch(()=>status("No se pudo guardar el marcador."));
}
function showMode(){
 const info=services?.classInfo?.(),active=!!info?.active,box=$("classModeIndicator"),badge=$("classBadge");
 if(box){
  box.hidden=!active;box.textContent=active?"🔴 MODO CLASE ACTIVO":"";
  box.setAttribute("aria-label",active?"La grabación y transcripción de clase están activas":"Modo Clase inactivo");
 }
 document.body.classList.toggle("class-mode-indicator-active",active);
 const toggle=$("startClassBtn");if(toggle)toggle.classList.toggle("class-start-active",active);
 if(lastMode!==active){lastMode=active;if(active)status("Clase activa: podés agregar marcadores de colores.");}
}
function syncAudioMarker(event){
 const audio=event.target;
 if(!(audio instanceof HTMLAudioElement))return;
 const sessionId=audio.closest(".class-recording")?.dataset.classSession;
 if(!sessionId)return;
 const pos=audio.currentTime*1000;
 let closest=null;
 for(const mark of model.markers)if(mark.sessionId===sessionId&&mark.offsetMs<=pos&&(!closest||mark.offsetMs>closest.offsetMs))closest=mark;
 document.querySelectorAll(".class-time-marker").forEach(row=>{
  row.classList.toggle("current",!!closest&&row.dataset.markerId===closest.id);
 });
}
function init(options){
 services=options;
 $("classMarkerAdd")?.addEventListener("click",mark);
 $("classModeQuickAccess")?.addEventListener("click",()=>document.querySelector('[data-tab="class"]')?.click());
 document.addEventListener("timeupdate",syncAudioMarker,true);
 root.addEventListener("robotito:memoryscopechange",load);
 root.addEventListener("robotito:memoryscopeready",load);
 setInterval(showMode,1000);showMode();load();
}
root.ROBOTITO_CLASS_MARKERS={init,mark,load,get markers(){return model.markers.slice();}};
})(window);
