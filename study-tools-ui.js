// P60–P75: owner-scoped study desk. No network, camera or notification permissions.
(function(root){
"use strict";
const P=root.ROBOTITO_STUDY_POLICY,S=root.ROBOTITO_STORE;
const $=id=>document.getElementById(id);
const initial=()=>({sessions:[],cards:[],focus:false,goalMinutes:120,typography:"system",fontSize:100,theme:"default",bionic:false,lineGuide:false,subjectEstimate:{},lastProgressAt:Date.now()});
let model=initial(),owner="",generation=0,queue=Promise.resolve(),timer=null,tickId=null,shownCard=null,lastTicker=0;
const scope=who=>"memory-scope:"+encodeURIComponent(who)+":robotito.studyDesk.v1";
const currentOwner=()=>root.ROBOTITO_MEMORY?.owner?.()||null;
const isActive=()=>owner&&owner===currentOwner();
const toast=text=>{const el=$("studyDeskStatus");if(el)el.textContent=text;};
function save(next){
 const who=currentOwner(),token=generation;
 if(!who||who!==owner)return Promise.reject(Error("Profile changed"));
 const snapshot=structuredClone(next);
 const promise=queue.catch(()=>{}).then(async()=>{
  if(token!==generation||who!==currentOwner())throw Error("Profile changed");
  await S.set(scope(who),snapshot);
  if(token!==generation||who!==currentOwner())throw Error("Profile changed");
  model=snapshot;render();
 });
 queue=promise;return promise;
}
function load(){
 const who=currentOwner(),token=++generation;
 owner=who;model=initial();timer=null;shownCard=null;stopTicker();render();
 if(!who||!S?.get)return;
 void S.get(scope(who),null).then(value=>{
  if(token!==generation||who!==currentOwner())return;
  if(value&&typeof value==="object"){
   model={...initial(),...value,
    sessions:Array.isArray(value.sessions)?value.sessions.slice(-3000):[],
    cards:Array.isArray(value.cards)?value.cards.slice(-400):[]};
  }
  render();
 }).catch(()=>toast("No pude cargar las herramientas de estudio."));
}
function button(text,callback){const b=document.createElement("button");b.type="button";b.textContent=text;b.addEventListener("click",callback);return b;}
function timerDisplay(){
 const el=$("studyTimerDisplay");if(!el)return;
 if(!timer){el.textContent="00:00:00";$("studyTimerProgress").value=0;return;}
 const computed=P.timerState(timer,Date.now());
 el.textContent=P.formatClock(timer.mode==="countdown"?computed.remaining:computed.elapsed);
 $("studyTimerProgress").value=computed.progress??0;
 if(computed.done&&!timer.completed){
  timer.completed=true;timer.running=false;timer.elapsedMs=timer.limitMs;clearInterval(tickId);tickId=null;
  toast("Temporizador finalizado. La pestaña debe permanecer abierta para ver este aviso.");
 }
}
function stopTicker(){clearInterval(tickId);tickId=null;}
function startTimer(){
 if(!isActive())return;
 const mode=$("studyTimerMode").value;
 if(!timer||timer.mode!==mode||timer.completed){
  let limit=0;
  if(mode==="countdown"){
   try{limit=P.durationMinutes($("studyTimerMinutes").value)*60000;}catch(e){toast(e.message);return;}
  }
  timer={mode,startedAt:Date.now(),elapsedMs:0,limitMs:limit,running:true,completed:false};
 }else if(!timer.running){timer={...timer,startedAt:Date.now(),running:true};}
 stopTicker();tickId=setInterval(timerDisplay,250);timerDisplay();
}
function pauseTimer(){
 if(!timer||!timer.running)return;
 const computed=P.timerState(timer,Date.now());
 timer={...timer,elapsedMs:computed.elapsed,running:false};stopTicker();timerDisplay();
}
function resetTimer(){stopTicker();timer=null;timerDisplay();}
function recordSession(){
 if(!isActive())return;
 let minutes;try{minutes=P.durationMinutes($("studyMinutesDone").value);}catch(e){toast(e.message);return;}
 const subject=P.clean($("studySessionSubject").value,90)||"Sin materia";
 const next={...model,sessions:[...model.sessions,{id:crypto.randomUUID(),subject,minutes,at:Date.now()}].slice(-3000),lastProgressAt:Date.now()};
 void save(next).then(()=>toast("Sesión registrada en este perfil.")).catch(()=>toast("No se pudo guardar la sesión."));
}
function drawWeek(){
 const host=$("studyWeekChart");if(!host)return;
 host.replaceChildren();
 const days=P.weeklyMinutes(model.sessions),max=Math.max(1,...days.map(x=>x.minutes));
 for(let i=0;i<days.length;i++){
  const d=days[i],outer=document.createElement("div");outer.className="study-day";
  const bar=document.createElement("div");bar.className="study-day-bar";
  bar.style.height=Math.round(d.minutes/max*100)+"%";bar.setAttribute("aria-hidden","true");
  const desc=document.createElement("span");desc.textContent=["L","M","X","J","V","S","D"][i]+" · "+d.minutes+" min";
  outer.setAttribute("aria-label",desc.textContent);
  outer.append(bar,desc);host.append(outer);
 }
 const total=days.reduce((n,d)=>n+d.minutes,0),target=Number(model.goalMinutes)||120;
 $("studyWeekSummary").textContent=total+" minutos esta semana · meta "+target+" min";
 $("studyGoalProgress").value=Math.min(100,total/target*100);
 const subjects={};for(const day of days)for(const [subject,n] of Object.entries(day.subjects))subjects[subject]=(subjects[subject]||0)+n;
 const details=$("studySubjectTotals");details.replaceChildren();
 for(const [subject,n] of Object.entries(subjects).sort((a,b)=>b[1]-a[1])){const p=document.createElement("p");p.textContent=subject+": "+n+" min";details.append(p);}
}
function renderCards(){
 const host=$("studyFlashcardList");if(!host)return;host.replaceChildren();
 const now=Date.now(),due=model.cards.filter(c=>!c.dueAt||c.dueAt<=now);
 const chosen=due.find(c=>c.id===shownCard)||due[0];
 if(!chosen){shownCard=null;host.textContent="Sin tarjetas pendientes. Podés agregar nuevas o volver cuando corresponda.";return;}
 shownCard=chosen.id;
 const question=document.createElement("p");question.className="study-card-front";question.textContent=chosen.front;
 const answer=document.createElement("p");answer.className="study-card-back";answer.textContent=chosen.back;answer.hidden=true;
 const reveal=button("Mostrar respuesta",()=>{answer.hidden=false;reveal.disabled=true;});
 const actions=document.createElement("div");actions.className="study-card-actions";
 const assess=correct=>void save({...model,cards:model.cards.map(c=>c.id===chosen.id?P.gradeCard(c,correct,Date.now()):c),lastProgressAt:Date.now()})
  .then(()=>{shownCard=null;renderCards();toast(correct?"Tarjeta programada para repaso.":"Tarjeta programada para mañana.");}).catch(()=>toast("No se pudo guardar."));
 actions.append(button("Recordé",()=>assess(true)),button("Necesito repasar",()=>assess(false)),
  button("Eliminar tarjeta",()=>{if(root.confirm("¿Eliminar esta tarjeta?"))void save({...model,cards:model.cards.filter(c=>c.id!==chosen.id)}).then(()=>{shownCard=null;renderCards();});}));
 host.append(question,answer,reveal,actions);
 const n=document.createElement("small");n.textContent=due.length+" tarjetas para revisar ahora";host.append(n);
}
function renderReading(){
 const preview=$("studyReadingPreview");if(!preview)return;
 preview.replaceChildren();
 const text=$("studyReadingText")?.value||"";
 for(const chunk of P.readingSegments(text)){
  if(chunk.word&&model.bionic){const strong=document.createElement("strong");strong.textContent=chunk.head;preview.append(strong,document.createTextNode(chunk.tail));}
  else preview.append(document.createTextNode(chunk.head+chunk.tail));
 }
 preview.classList.toggle("reading-line-guide",!!model.lineGuide);
 preview.classList.toggle("reading-font-readable",model.typography==="readable");
 preview.style.fontSize=(Number(model.fontSize)||100)+"%";
 preview.dataset.theme=model.theme||"default";
}
function renderMap(){
 const host=$("studyMindMap");if(!host)return;
 const tree=P.mindMap($("studyReadingText")?.value||"");
 host.replaceChildren();
 if(!tree.sourceLines){host.textContent="Pegá apuntes, una idea por línea, para crear un esquema sin inventar información.";return;}
 const center=document.createElement("strong");center.className="mind-map-center";center.textContent=tree.topic;host.append(center);
 for(const branch of tree.branches){
  const child=document.createElement("div");child.className="mind-map-branch";child.textContent=branch.label;host.append(child);
 }
 const small=document.createElement("small");small.textContent="Esquema literal de tus apuntes: no representa relaciones comprobadas automáticamente.";host.append(small);
}
function render(){
 const focus=$("studyFocusMode");
 if(focus)focus.checked=!!model.focus;
 document.body.classList.toggle("robotito-focus-mode",!!model.focus);
 if($("studyGoalMinutes"))$("studyGoalMinutes").value=String(model.goalMinutes||120);
 for(const [id,value] of [["studyFontSize",model.fontSize],["studyTypography",model.typography],["studyReadingTheme",model.theme]]){
  const el=$(id);if(el)el.value=String(value);
 }
 if($("studyBionic"))$("studyBionic").checked=!!model.bionic;
 if($("studyLineGuide"))$("studyLineGuide").checked=!!model.lineGuide;
 timerDisplay();drawWeek();renderCards();renderReading();renderMap();
 const last=model.lastProgressAt||Date.now();
 const nudge=$("studyNoProgressStatus");
 if(nudge)nudge.textContent=Date.now()-last>=3*3600000?
  "Llevás más de tres horas sin registrar avances en este dispositivo. ¿Querés planificar una sesión corta?":"";
}
function setReadingPreference(property,value){
 if(!isActive())return;
 void save({...model,[property]:value}).catch(()=>toast("No se pudo guardar el ajuste de lectura."));
}
function initialize(){
 if(!$("studyDesk"))return;
 $("studyTimerStart")?.addEventListener("click",startTimer);
 $("studyTimerPause")?.addEventListener("click",pauseTimer);
 $("studyTimerReset")?.addEventListener("click",resetTimer);
 $("studyTimerMode")?.addEventListener("change",resetTimer);
 $("studyRecordSession")?.addEventListener("click",recordSession);
 $("studyEstimateBtn")?.addEventListener("click",()=>{
  const subject=P.clean($("studySessionSubject").value,90)||"Sin materia";
  let fallback;try{fallback=P.durationMinutes($("studyEstimateManual").value);}catch(e){toast(e.message);return;}
  const estimate=P.estimateMinutes(model.sessions,subject,fallback);
  $("studyEstimateResult").textContent=estimate.minutes+" minutos estimados ("+
   (estimate.source==="observed"?"mediana de "+estimate.samples+" sesiones reales":"ajuste manual; se necesitan 3 sesiones para estimar")+")";
 });
 $("studyGoalMinutes")?.addEventListener("change",event=>{
  try{const value=P.durationMinutes(event.target.value);void save({...model,goalMinutes:value});}
  catch(e){toast(e.message);}
 });
 $("studyFlashcardForm")?.addEventListener("submit",event=>{
  event.preventDefault();
  if(model.cards.length>=400){toast("Máximo 400 tarjetas en este dispositivo.");return;}
  try{
   const card={id:crypto.randomUUID(),...P.makeFlashcard($("flashcardFront").value,$("flashcardBack").value,$("flashcardSubject").value)};
   void save({...model,cards:[...model.cards,card],lastProgressAt:Date.now()})
    .then(()=>{$("flashcardFront").value="";$("flashcardBack").value="";toast("Tarjeta guardada.");})
    .catch(()=>toast("No se pudo guardar la tarjeta."));
  }catch(e){toast(e.message);}
 });
 $("studyFocusMode")?.addEventListener("change",event=>setReadingPreference("focus",event.target.checked));
 $("studyFontSize")?.addEventListener("change",event=>setReadingPreference("fontSize",Number(event.target.value)));
 $("studyTypography")?.addEventListener("change",event=>setReadingPreference("typography",event.target.value));
 $("studyReadingTheme")?.addEventListener("change",event=>setReadingPreference("theme",event.target.value));
 $("studyBionic")?.addEventListener("change",event=>setReadingPreference("bionic",event.target.checked));
 $("studyLineGuide")?.addEventListener("change",event=>setReadingPreference("lineGuide",event.target.checked));
 $("studyReadingText")?.addEventListener("input",()=>{renderReading();renderMap();});
 document.addEventListener("visibilitychange",()=>{
  if(document.hidden){pauseTimer();return;}
  render();
 });
 root.addEventListener("pagehide",()=>{pauseTimer();stopTicker();});
 root.addEventListener("robotito:memoryscopechange",load);
 root.addEventListener("robotito:memoryscopeready",load);
 load();
}
root.ROBOTITO_STUDY_TOOLS={get focusActive(){return !!model.focus;},get sessionOwner(){return owner;},load,recordSession,timerDisplay};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialize,{once:true});else initialize();
})(window);
