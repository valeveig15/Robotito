// P28 — integrates the user's latest approved SVG worlds *inside* Robotito.
// The uploaded HTML is distilled to inert SVG+CSS, mounted into a scoped shadow root.
// Speech, permissions, memory, interaction and actions stay in the existing app.
(()=>{
"use strict";
const REFS=Object.freeze({
 "panda":"panda","brown-bear":"brown-bear","polar-bear":"polar-bear",
 "dog":"dog","monkey":"monkey"
});
const MOODS={
 calm:"tranquilo",happy:"feliz",sad:"triste",angry:"enojado",scared:"asustado",
 hungry:"hambriento",sleepy:"dormido",curious:"curioso",focused:"curioso",
 bored:"aburrido",affectionate:"enamorado",proud:"feliz",confused:"confundido",
 excited:"emocionado",embarrassed:"avergonzado",annoyed:"enojado"
};
const ACTIONS={
 highfive:"chocar",pet:"acariciar",feed:"acariciar",play:"saltar",
 introduce:"saludar",idle:"saludar",surprise:"saltar",poke:"saltar"
};
let requested=0,current=null,root=null,observer=null,speechTimer=null,blinkTimer=null;
let pendingSync=false;
const cached=new Map(),path=id=>"assets/approved-avatars/"+REFS[id]+".fragment.html";
function getRobot(){return document.getElementById("robotito");}
function getWorld(){return document.getElementById("world");}
function ensureHost(){
 let host=document.getElementById("approvedAvatarHost");
 if(!host){
  const scene=document.querySelector(".world-scene");
  if(!scene)return null;
  host=document.createElement("div");
  host.id="approvedAvatarHost";
  host.className="approved-avatar-host";
  host.setAttribute("role","img");
  host.setAttribute("aria-live","off");
  scene.appendChild(host);
  host.addEventListener("click",e=>{
   if(e.target.closest?.(".approved-object-prop"))return;
   if(!current)return;
   document.querySelector('[data-action="pet"]')?.click();
  });
 }
 return host;
}
function reset(){
 ++requested;
 observer?.disconnect();observer=null;
 clearTimeout(speechTimer);clearTimeout(blinkTimer);
 speechTimer=null;blinkTimer=null;current=null;pendingSync=false;
 getWorld()?.classList.remove("approved-art-world");
 const old=getRobot();
 old?.removeAttribute("aria-hidden");
 document.getElementById("approvedAvatarHost")?.replaceChildren();
}
async function fetchMarkup(id){
 if(cached.has(id))return cached.get(id);
 const promise=fetch(path(id),{credentials:"same-origin",cache:"force-cache"}).then(r=>{
   if(!r.ok)throw new Error("Approved avatar asset "+id+": "+r.status);
   return r.text();
 }).then(html=>{
   const doc=new DOMParser().parseFromString(html,"text/html");
   const style=doc.querySelector("style"),svg=doc.querySelector("svg#stage-svg");
   if(!style||!svg||!svg.querySelector("#avatar")||!svg.querySelector("#environment"))
     throw new Error("Approved avatar incomplete "+id);
   // Original scripts/buttons are neither imported nor executed.
   const safe=document.createElement("template");
   safe.innerHTML="<style>"+style.textContent+"</style><div class='stage'>"+svg.outerHTML+"</div>";
   if(safe.content.querySelector("script"))throw new Error("Executable asset rejected");
   return safe.content;
 });
 cached.set(id,promise);
 try{return await promise;}catch(error){cached.delete(id);throw error;}
}
function actionFromRobot(robot){
 if(robot.classList.contains("object-trip-walking")||robot.classList.contains("object-trip-searching"))
   return "caminar";
 if(robot.classList.contains("clapping"))return "aplaudir";
 if(robot.classList.contains("highfive"))return "chocar";
 if(robot.classList.contains("dancing"))return "bailar";
 if(robot.classList.contains("playing"))return "saltar";
 if(robot.classList.contains("pet-happy"))return "acariciar";
 if(robot.classList.contains("eating"))return "acariciar";
 return ACTIONS[robot.dataset.speciesAction]||"";
}
function readMood(robot,defaultMood){
 // The application pushes the canonical mood. This fallback covers older callbacks.
 const list=["embarrassed","confused","affectionate","excited","curious",
  "angry","sad","scared","hungry","sleepy","happy","calm"];
 for(const key of list)if(robot.classList.contains("mood-"+key))return key;
 return defaultMood||"calm";
}
function sync(){
 if(!current)return;
 const robot=getRobot(),{host,stage,avatar}=current;
 if(!robot||!host.isConnected)return;
 if(robot.dataset.avatar!==current.id)return;
 avatar.dataset.mood=MOODS[current.mood]||MOODS[readMood(robot)]||"tranquilo";
 const action=actionFromRobot(robot);
 for(const item of ["saludar","bailar","saltar","aplaudir","acariciar","caminar","chocar"])
  avatar.classList.toggle("action-"+item,item===action);
 const walk=robot.classList.contains("object-trip-walking")||robot.classList.contains("object-trip-searching");
 stage.dataset.view=walk?"perfil":"frente";
 stage.classList.toggle("shadow-walking",action==="caminar");
 stage.classList.toggle("shadow-jumping",action==="saltar");
 stage.classList.toggle("shadow-dancing",action==="bailar");
 host.classList.toggle("approved-is-walking",walk);
 const oldProp=robot.querySelector("#objectSceneProp");
 let prop=host.querySelector(".approved-object-prop");
 if(robot.classList.contains("object-trip-presenting")&&oldProp){
  if(!prop){prop=document.createElement("span");prop.className="approved-object-prop";prop.setAttribute("aria-hidden","true");host.appendChild(prop);}
  prop.textContent=oldProp.textContent;
 }else prop?.remove();
}
function scheduleSync(){
 if(pendingSync)return;
 pendingSync=true;
 queueMicrotask(()=>{pendingSync=false;sync();});
}
async function activate(id,{mood="calm",language="es"}={}){
 const token=++requested;
 if(!Object.prototype.hasOwnProperty.call(REFS,id)){
  reset();return false;
 }
 const host=ensureHost();if(!host)return false;
 observer?.disconnect();observer=null;
 // Keep the current avatar visible during async loading.
 try{
  const content=(await fetchMarkup(id)).cloneNode(true);
  if(token!==requested)return false;
  const shadow=host.shadowRoot||host.attachShadow({mode:"open"});
  shadow.replaceChildren(content);
  const overrides=document.createElement("style");
  overrides.textContent=String.raw`
:host{display:block;height:100%;width:100%;font-family:ui-rounded,"Trebuchet MS",system-ui,sans-serif}
.stage{height:100%;width:100%;aspect-ratio:auto!important;border-radius:0!important;overflow:hidden!important}
.stage #stage-svg{width:100%;height:100%;display:block;touch-action:manipulation}
.stage .cornerlabel,.stage button{display:none!important}
@media(prefers-reduced-motion:reduce){
 #stage-svg #avatar,#stage-svg #front-view,#stage-svg #side-locomotion{animation:none!important;transition:none!important}
}
`;
  shadow.appendChild(overrides);
  const stage=shadow.querySelector("#stage-svg"),avatar=shadow.querySelector("#avatar");
  if(!stage||!avatar)throw new Error("Invalid approved avatar "+id);
  stage.setAttribute("aria-hidden","true");
  const robot=getRobot();
  host.setAttribute("aria-label",robot?.getAttribute("aria-label")||"Robotito");
  current={id,host,shadow,stage,avatar,mood,language};
  robot?.setAttribute("aria-hidden","true");
  getWorld()?.classList.add("approved-art-world");
  observer=new MutationObserver(scheduleSync);
  if(robot)observer.observe(robot,{attributes:true,attributeFilter:["class","data-avatar","data-species-action","style"],childList:true});
  sync();
  return true;
 }catch(error){
  console.warn("Approved avatar unavailable; using safe existing rendering",error);
  if(token===requested)reset();
  return false;
 }
}
function setMood(mood){
 if(!current)return;
 if(MOODS[mood])current.mood=mood;
 scheduleSync();
}
function setLanguage(lang){
 if(current)current.language=lang;
 const robot=getRobot();
 const host=document.getElementById("approvedAvatarHost");
 if(robot&&host&&current)host.setAttribute("aria-label",robot.getAttribute("aria-label")||"Robotito");
}
function speak(active=true){
 if(!current)return;
 clearTimeout(speechTimer);
 const {avatar}=current;
 avatar.classList.toggle("speaking",!!active);
 if(active)speechTimer=setTimeout(()=>avatar.classList.remove("speaking"),3500);
}
function blink(){
 if(!current||document.hidden)return;
 current.avatar.classList.add("blink");
 clearTimeout(blinkTimer);
 blinkTimer=setTimeout(()=>current?.avatar.classList.remove("blink"),140);
}
document.addEventListener("visibilitychange",()=>{if(document.hidden){speak(false);clearTimeout(blinkTimer);current?.avatar.classList.remove("blink");}});
window.addEventListener("pagehide",reset);
window.ROBOTITO_APPROVED_AVATAR={
 ids:Object.keys(REFS),source:REFS,activate,setMood,setLanguage,speak,blink,reset,
 get current(){return current;},path
};
})();