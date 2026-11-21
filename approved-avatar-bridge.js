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
/* Shared emotion corrections for approved SVG designs. */
#avatar[data-mood="dormido"] #eye-open,#avatar[data-mood="dormido"] #eye-pupils,
#avatar[data-mood="dormido"] #heart-eyes,#avatar[data-mood="dormido"] #star-eyes{opacity:0!important;visibility:hidden!important;animation:none!important}
#avatar[data-mood="dormido"] #eye-closed{opacity:1!important;visibility:visible!important;animation:none!important}
#avatar[data-mood="dormido"] #approved-eyelids{display:none!important}
#avatar[data-mood="cansado"] #eye-open,#avatar[data-mood="aburrido"] #eye-open{transform:none!important}
#approved-eyelids{opacity:0;pointer-events:none;transform-box:fill-box;transform-origin:center}
#avatar[data-mood="cansado"] #approved-eyelids{opacity:1;transform:translateY(9px)}
#avatar[data-mood="aburrido"] #approved-eyelids{opacity:1;transform:translateY(3px)}
#avatar[data-mood="triste"] #tears{opacity:1!important;visibility:visible!important}
#avatar[data-mood="triste"] #tears path{
  transform-box:fill-box;transform-origin:center;
  animation:approvedTearFall 1.65s ease-in infinite!important;
  stroke:#347f9d;stroke-width:1.5;paint-order:stroke;
}
#avatar[data-mood="triste"] #tears path:nth-child(2){animation-delay:-.8s!important}
@keyframes approvedTearFall{
  0%{opacity:0;transform:translateY(-6px) scale(1.4)}
  18%,75%{opacity:1}
  100%{opacity:0;transform:translateY(38px) scale(1.7)}
}
#avatar #anger-mark{transform-box:fill-box;transform-origin:center;transform:translate(-12px,11px) scale(.66)!important}
#avatar[data-mood="enojado"] #anger-mark{animation:none!important;opacity:1!important}
#avatar #sweat-mark path{stroke:#246e8a;stroke-width:3.2;stroke-linejoin:round;paint-order:stroke}
#avatar #question-mark{transform-box:fill-box;transform-origin:center;transform:translate(-25px,17px)}
#avatar[data-mood="confundido"] #question-mark{animation:none!important;opacity:1!important}
#avatar[data-mood="curioso"] #brows-curious{
  opacity:1!important;visibility:visible!important;transform:translateY(-7px);
  filter:drop-shadow(0 1px 1px rgba(20,20,20,.1))
}
#avatar[data-mood="curioso"] #brows-curious path{stroke-width:6!important}
#avatar.speaking:not([data-mood="triste"]):not([data-mood="enojado"]) #mouth-speak{display:inline!important;opacity:1!important;visibility:visible!important}
#avatar.speaking #mouth-happy,#avatar.speaking #mouth-neutral,
#avatar.speaking #mouth-o,#avatar.speaking #mouth-sad,#avatar.speaking #mouth-angry{opacity:0!important}
#avatar[data-mood="enamorado"] #heart-eyes,#avatar[data-mood="emocionado"] #star-eyes{opacity:1!important}
#avatar[data-mood="enamorado"] #eye-pupils,#avatar[data-mood="emocionado"] #eye-pupils{opacity:0!important}
@media(prefers-reduced-motion:reduce){#avatar[data-mood="triste"] #tears path{animation:none!important}}

.approved-object-prop{position:absolute;left:58%;top:48%;font-size:clamp(24px,5vw,51px);pointer-events:none;filter:drop-shadow(0 5px 5px rgba(40,30,40,.22))}
@media(prefers-reduced-motion:reduce){
 #stage-svg #avatar,#stage-svg #front-view,#stage-svg #side-locomotion{animation:none!important;transition:none!important}
}
`;
  shadow.appendChild(overrides);
  const stage=shadow.querySelector("#stage-svg"),avatar=shadow.querySelector("#avatar");
  // Do not crop feet, tails or lower body when the scene changes aspect ratio.
  stage?.setAttribute("preserveAspectRatio","xMidYMid meet");
  const openEyes=avatar?.querySelector("#eye-open");
  if(openEyes&&!avatar.querySelector("#approved-eyelids")){
    const ns="http://www.w3.org/2000/svg",lids=document.createElementNS(ns,"g");
    lids.setAttribute("id","approved-eyelids");
    const colors={panda:"#f8f8f7","brown-bear":"#8b5a3c","polar-bear":"#f4fbff",dog:"#c68a52",monkey:"#8c5a3c"};
    lids.setAttribute("fill",colors[id]||"#e8d1b5");
    lids.setAttribute("stroke","#59443f");lids.setAttribute("stroke-opacity",".12");
    lids.setAttribute("stroke-width","1.8");
    for(const d of ["M268 241Q268 213 292 211Q315 212 319 241Q293 230 268 241Z",
                    "M389 239Q391 213 413 211Q437 213 439 239Q413 228 389 239Z"]){
      const lid=document.createElementNS(ns,"path");
      lid.setAttribute("d",d);lids.appendChild(lid);
    }
    openEyes.after(lids);
  }

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