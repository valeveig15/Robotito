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
let pendingSync=false,fitObserver=null;
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
 fitObserver?.disconnect();fitObserver=null;
 clearTimeout(speechTimer);clearTimeout(blinkTimer);
 speechTimer=null;blinkTimer=null;current=null;pendingSync=false;
 getWorld()?.classList.remove("approved-art-world");
 const old=getRobot();
 old?.removeAttribute("aria-hidden");
 const oldHost=document.getElementById("approvedAvatarHost");
 oldHost?.shadowRoot?.replaceChildren();
 if(oldHost){oldHost.replaceChildren();oldHost.style.display="none";}
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
 if(robot.dataset.speciesAction&&ACTIONS[robot.dataset.speciesAction])return ACTIONS[robot.dataset.speciesAction];
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
 let prop=current.shadow.querySelector(".approved-object-prop");
 if(robot.classList.contains("object-trip-presenting")&&oldProp){
  if(!prop){prop=document.createElement("span");prop.className="approved-object-prop";prop.setAttribute("aria-hidden","true");current.shadow.appendChild(prop);}
  prop.textContent=oldProp.textContent;
 }else prop?.remove();
}

const SVG_NS="http://www.w3.org/2000/svg";
const APPROVED_BASE={width:700,height:635,footY:581,centerX:350,bodyHeight:465};
function fitApprovedAvatar(){
 if(!current?.fitGroup||!current.stage)return;
 const bounds=current.stage.getBoundingClientRect(),w=bounds.width,h=bounds.height;
 if(!(w>0&&h>0))return;
 // Keep the complete original world: shrink only the oversized avatar.
 // Wide screens previously caused xMidYMid slice to crop its feet and head.
 const slice=Math.max(w/APPROVED_BASE.width,h/APPROVED_BASE.height);
 const target=Math.min(390,h*.76);
 const factor=Math.min(1,Math.max(.2,target/(APPROVED_BASE.bodyHeight*slice)));
 const visibleBottom=(h-APPROVED_BASE.height*slice)/2+APPROVED_BASE.footY*slice;
 const offsetY=(h-Math.min(26,h*.05)-visibleBottom)/slice;
 current.fitGroup.setAttribute("transform",
  "translate(0 "+offsetY.toFixed(3)+") translate(350 581) scale("+
  factor.toFixed(4)+") translate(-350 -581)");
 current.host.dataset.avatarFit=factor.toFixed(3);
}
// Wrap rather than CSS-transform mouth elements: speaking animations still work.
function repairApprovedFace(avatar){
 const groups=[...avatar.querySelectorAll('[id^="mouth-"]')]
  .filter(el=>el.tagName.toLowerCase()==="g");
 for(const item of groups){
  const wrapper=document.createElementNS(SVG_NS,"g");
  wrapper.setAttribute("data-robotito-mouth-placement","");
  wrapper.setAttribute("transform","translate(0 12)");
  item.parentNode.insertBefore(wrapper,item);
  wrapper.appendChild(item);
 }
 const philtrum=avatar.querySelector('path[d="M354 316v10"]');
 if(philtrum)philtrum.setAttribute("d","M354 316v21");
 return groups.length;
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
 fitObserver?.disconnect();fitObserver=null;
 host.style.display="";
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
.approved-object-prop{position:absolute;left:58%;top:48%;font-size:clamp(24px,5vw,51px);pointer-events:none;filter:drop-shadow(0 5px 5px rgba(40,30,40,.22))}
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
  const fitGroup=document.createElementNS(SVG_NS,"g");
  fitGroup.setAttribute("data-robotito-full-body-fit","");
  avatar.parentNode.insertBefore(fitGroup,avatar);
  fitGroup.appendChild(avatar);
  const mouthCount=repairApprovedFace(avatar);
  if(mouthCount<6)throw new Error("Approved avatar mouth shapes missing: "+id);
  current={id,host,shadow,stage,avatar,fitGroup,mood,language};
  fitApprovedAvatar();
  if(typeof ResizeObserver!=="undefined"){
   fitObserver=new ResizeObserver(fitApprovedAvatar);
   fitObserver.observe(host);
  }
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
 if(mood==="sleepy"){
   clearTimeout(blinkTimer);blinkTimer=null;
   current.avatar.classList.remove("blink");
 }
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
 if(!current||document.hidden||getRobot()?.classList.contains("sleeping")||
    current.mood==="sleepy")return false;
 const avatar=current.avatar;
 clearTimeout(blinkTimer);
 avatar.classList.remove("blink");
 // Do not clear a new avatar's blink when an earlier timer completes.
 avatar.classList.add("blink");
 blinkTimer=setTimeout(()=>{avatar.classList.remove("blink");blinkTimer=null;},140);
 return true;
}
document.addEventListener("visibilitychange",()=>{if(document.hidden){speak(false);clearTimeout(blinkTimer);blinkTimer=null;current?.avatar.classList.remove("blink");}});
window.addEventListener("pagehide",reset);
window.ROBOTITO_APPROVED_AVATAR={
 ids:Object.keys(REFS),source:REFS,activate,setMood,setLanguage,speak,blink,reset,
 get current(){return current;},path
};
})();