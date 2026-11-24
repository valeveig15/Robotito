// P28 — integrates the user's latest approved SVG worlds *inside* Robotito.
// The latest full user-authored HTML is parsed as inert SVG+all CSS, mounted into a scoped shadow root.
// Speech, permissions, memory, interaction and actions stay in the existing app.
(()=>{
"use strict";
const REFS=Object.freeze({
 "panda":"panda","brown-bear":"brown-bear","polar-bear":"polar-bear",
 "dog":"dog","monkey":"monkey",
 "cat":"cat","red-panda":"red-panda","iguana":"iguana"
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
const LATEST=Object.freeze({dog:"bobi",cat:"michi","red-panda":"roji",iguana:"igui"});
const cached=new Map();
const path=id=>LATEST[id]?"previews/"+LATEST[id]+"-review.html":"assets/approved-avatars/"+REFS[id]+".fragment.html";
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
// Parse only strict 15-state WebP face data. Never execute scripts from uploaded HTML.
function parseFaceAtlas(doc){
 const script=[...doc.querySelectorAll("script")].find(s=>s.textContent.includes("const atlas = {feliz:"));
 if(!script)return null;
 const atlas=Object.create(null);
 const matcher=/([a-z]+):[{]normal:"(data:image\/webp;base64,[A-Za-z0-9+/=]+)",speak:"(data:image\/webp;base64,[A-Za-z0-9+/=]+)",blink:"(data:image\/webp;base64,[A-Za-z0-9+/=]+)"[}]/g;
 for(const hit of script.textContent.matchAll(matcher))atlas[hit[1]]={normal:hit[2],speak:hit[3],blink:hit[4]};
 if(Object.keys(atlas).length!==15)throw new Error("Incomplete face texture atlas");
 return atlas;
}
function syncFace(){
 if(!current?.atlas)return;
 const {avatar,shadow,atlas}=current;
 const face=shadow.querySelector("#head #reference-face-idle image");
 if(!face)return;
 const mood=Object.prototype.hasOwnProperty.call(atlas,avatar.dataset.mood)?avatar.dataset.mood:"feliz";
 const variant=avatar.classList.contains("speaking")?"speak":avatar.classList.contains("blink")?"blink":"normal";
 const uri=atlas[mood][variant];
 if(uri&&face.getAttribute("href")!==uri)face.setAttribute("href",uri);
}
/* Michi V8: punta de cola de radio fijo 9.2; onda en S más pronunciada.
   Los primeros puntos permanecen fijados a la cadera: no se separa del cuerpo. */
function animateMichiTail(avatar,stage,token){
 const tails=['tail','side-tail'].map(id=>stage.querySelector('#'+id));
 if(!avatar||tails.some(t=>!t))return;
 const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const moods={
   feliz:[56,.73,0],emocionado:[63,.97,-7],enamorado:[49,.68,-3],
   tranquilo:[39,.59,0],triste:[10,.36,63],dormido:[2,.22,73],
   asustado:[17,1.14,43],enojado:[27,.95,10],curioso:[45,.70,0],
   confundido:[27,.60,5],aburrido:[12,.39,47],cansado:[9,.32,58],
   hambriento:[29,.72,4],sorprendido:[41,.98,0],avergonzado:[20,.51,23]
 };
 const N=22;
 function centerline(phase, amplitude, droop, side){
   // Cada tramo tiene LA MISMA longitud geométrica en todos los fotogramas.
   // Las curvas cambian de orientación, no de longitud: evita el efecto goma.
   const x0=side?414:446, y0=side?444:449;
   const pts=[[x0,y0]];
   const segment=9.6;            // 22 tramos: 211.2 unidades SVG constantes.
   const movement=Math.min(.62, amplitude/100); // vaivén moderado, menos que V8
   const lowered=droop/73;
   for(let i=1;i<=N;i++){
     const u=(i-.5)/N;
     // Al salir del cuerpo la orientación varía muy poco; la punta es más flexible.
     const base=1.05-1.22*u;
     const sCurve=.27*Math.sin(2*Math.PI*u-.3)*u;
     const lateral=movement*(.52*Math.sin(phase-.75)*u + .57*Math.sin(2*Math.PI*u-phase)*u*u);
     const relaxed=1.70*lowered*(.65+.35*u);
     const angle=base+sCurve+lateral+relaxed;
     const prev=pts[pts.length-1];
     pts.push([prev[0]+segment*Math.sin(angle),prev[1]-segment*Math.cos(angle)]);
   }
   return pts;
 }
 function band(pts,start,end,widthStart,widthEnd,rounded){
   const left=[],right=[];
   for(let i=start;i<=end;i++){
     const a=pts[Math.max(0,i-1)],b=pts[Math.min(N,i+1)];
     const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;
     const nx=-dy/len,ny=dx/len;
     const w=widthStart+(widthEnd-widthStart)*(i/N);
     left.push([pts[i][0]+nx*w,pts[i][1]+ny*w]);
     right.push([pts[i][0]-nx*w,pts[i][1]-ny*w]);
   }
   const fmt=p=>p[0].toFixed(2)+' '+p[1].toFixed(2);
   // Convertimos puntos poligonales en curvas cúbicas suaves (Catmull-Rom).
   function curveLine(arr){
     let d='';
     for(let i=0;i<arr.length-1;i++){
       const p0=arr[Math.max(0,i-1)],p1=arr[i],
             p2=arr[i+1],p3=arr[Math.min(arr.length-1,i+2)];
       const c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6];
       const c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];
       d+=' C'+fmt(c1)+' '+fmt(c2)+' '+fmt(p2);
     }
     return d;
   }
   let d='M'+fmt(left[0])+curveLine(left);
   if(rounded && end===N){
     const last=pts[N],prev=pts[N-1],tx=last[0]-prev[0],ty=last[1]-prev[1];
     const len=Math.hypot(tx,ty)||1;
     const w=widthStart+(widthEnd-widthStart)*(end/N);
     d+=' Q'+fmt([last[0]+tx/len*w*1.18,last[1]+ty/len*w*1.18])+' '+fmt(right[right.length-1]);
   }else d+=' L'+fmt(right[right.length-1]);
   d+=curveLine([...right].reverse());
   return d+' Z';
 }
 let start=null,last=0;
 function draw(timestamp){
   if(token!==requested||current?.avatar!==avatar)return;
   if(start===null)start=timestamp;
   const elapsed=reduce?.matches?0:(timestamp-start)/1000;
   const mood=avatar.getAttribute('data-mood')||'feliz';
   const [amp,freq,droop]=moods[mood]||moods.feliz;
   const action=avatar.getAttribute('class')||'';
   const multiplier=action.includes('action-bailar')?1.48:action.includes('action-caminar')?1.25:1;
   const phase=elapsed*freq*multiplier;
   const amount=amp*(action.includes('action-bailar')?1.08:1);
   tails.forEach((g,n)=>{
     const paths=g.querySelectorAll('path');
     if(paths.length<3)return;
     const pts=centerline(phase,amount,droop,!!n);
     paths[0].setAttribute('d',band(pts,0,N,13.5,9.2,true));
     paths[1].setAttribute('d',band(pts,1,N-3,4.4,2.3,false));
     paths[2].setAttribute('d',band(pts,N-4,N,9.2,9.2,true));
     const cap=g.querySelector('.michi-tail-round-cap');
     if(cap){cap.setAttribute('cx',pts[N][0].toFixed(2));cap.setAttribute('cy',pts[N][1].toFixed(2));}
   });
   requestAnimationFrame(draw);
 }
 requestAnimationFrame(draw);
}
async function fetchMarkup(id){
 if(cached.has(id))return cached.get(id);
 const promise=fetch(path(id),{credentials:"same-origin",cache:"force-cache"}).then(r=>{
   if(!r.ok)throw new Error("Approved avatar asset "+id+": "+r.status);
   return r.text();
 }).then(html=>{
   const doc=new DOMParser().parseFromString(html,"text/html");
   const styles=[...doc.querySelectorAll("style")],svg=doc.querySelector("svg#stage-svg");
   if(!styles.length||!svg||!svg.querySelector("#avatar")||!svg.querySelector("#environment"))
     throw new Error("Approved avatar incomplete "+id);
   // Last CSS layers position textured eyes/mouth and emotion overlays.
   // Original scripts/buttons are deliberately never executed.
   const safe=document.createElement("template");
   safe.innerHTML=styles.map(style=>"<style>"+style.textContent+"</style>").join("")
     +"<div class='stage'>"+svg.outerHTML+"</div>";
   if(safe.content.querySelector("script"))throw new Error("Executable asset rejected");
   return {content:safe.content,atlas:parseFaceAtlas(doc)};
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
 syncFace();
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
  const asset=await fetchMarkup(id);
  const content=asset.content.cloneNode(true);
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
  if(asset.atlas){
    // The user's texture already paints the exact approved eyes, cheeks, nose
    // and mouth for every emotion. Never layer the generic SVG face over it.
    const faceGuard=document.createElement("style");
    faceGuard.textContent=String.raw`
#avatar #head > #reference-face-idle{opacity:1!important;visibility:visible!important}
#avatar #head > :is(#eye-open,#eye-closed,#blush,#brows-angry,#brows-curious,#brows-sad,
 #mouth-happy,#mouth-neutral,#mouth-sad,#mouth-angry,#mouth-o,#mouth-speak,
 #tears,#tongue,#heart-eyes,#star-eyes,#sweat-mark,#sleep-marks,#approved-eyelids){
 opacity:0!important;visibility:hidden!important
}`;
    shadow.appendChild(faceGuard);
  }
  const stage=shadow.querySelector("#stage-svg"),avatar=shadow.querySelector("#avatar");
  // Do not crop feet, tails or lower body when the scene changes aspect ratio.
  stage?.setAttribute("preserveAspectRatio","xMidYMid meet");
  const openEyes=avatar?.querySelector("#eye-open");
  if(openEyes&&!avatar.querySelector("#approved-eyelids")&&!avatar.querySelector("#michi-tired-lids")){
    const ns="http://www.w3.org/2000/svg",lids=document.createElementNS(ns,"g");
    lids.setAttribute("id","approved-eyelids");
    const colors={panda:"#f8f8f7","brown-bear":"#8b5a3c","polar-bear":"#f4fbff",dog:"#c68a52",monkey:"#8c5a3c",cat:"#ffbd55","red-panda":"#bd642f",iguana:"#75ac56"};
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
  current={id,host,shadow,stage,avatar,mood,language,atlas:asset.atlas};
  robot?.setAttribute("aria-hidden","true");
  getWorld()?.classList.add("approved-art-world");
  observer=new MutationObserver(scheduleSync);
  if(robot)observer.observe(robot,{attributes:true,attributeFilter:["class","data-avatar","data-species-action","style"],childList:true});
  sync();
  if(id==="cat")animateMichiTail(avatar,stage,token);
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
 avatar.classList.toggle("speaking",!!active);syncFace();
 if(active)speechTimer=setTimeout(()=>{avatar.classList.remove("speaking");syncFace();},3500);
}
function blink(){
 if(!current||document.hidden||getRobot()?.classList.contains("sleeping")||
    current.mood==="sleepy")return false;
 const avatar=current.avatar;
 clearTimeout(blinkTimer);
 avatar.classList.remove("blink");
 // Do not clear a new avatar's blink when an earlier timer completes.
 avatar.classList.add("blink");syncFace();
 blinkTimer=setTimeout(()=>{avatar.classList.remove("blink");blinkTimer=null;syncFace();},140);
 return true;
}
document.addEventListener("visibilitychange",()=>{if(document.hidden){speak(false);clearTimeout(blinkTimer);blinkTimer=null;current?.avatar.classList.remove("blink");}});
window.addEventListener("pagehide",reset);
window.ROBOTITO_APPROVED_AVATAR={
 ids:Object.keys(REFS),source:REFS,activate,setMood,setLanguage,speak,blink,reset,
 get current(){return current;},path
};
})();