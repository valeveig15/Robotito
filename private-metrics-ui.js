// P45: opted-in local activity totals. Does not capture text/audio/images or phone identifiers.
(function(root){
"use strict";
const P=root.ROBOTITO_PRIVATE_STATS_POLICY,S=root.ROBOTITO_STORE;
const $=id=>document.getElementById(id);
let model=P.clean({consent:false,days:{}}),owner="",generation=0,queue=Promise.resolve();
const key=who=>"memory-scope:"+encodeURIComponent(who)+":robotito.privateMetrics.v1";
const current=()=>root.ROBOTITO_MEMORY?.owner?.()||null;
function status(text){const p=$("privateMetricsStatus");if(p)p.textContent=text;}
function render(){
 const consent=$("privateMetricsConsent");if(consent)consent.checked=!!model.consent;
 const totals=P.totals(model),host=$("privateMetricsTotals");
 if(host){
  host.replaceChildren();
  const words={questions:"Preguntas enviadas",classes:"Clases iniciadas",recommendations:"Recomendaciones solicitadas",studySessions:"Sesiones registradas",tasks:"Tareas agregadas"};
  for(const name of P.TYPES){const p=document.createElement("p");p.textContent=words[name]+": "+totals[name];host.append(p);}
 }
 const p=$("privateMetricsScope");
 if(p)p.textContent=model.consent?
  "Estadísticas locales activadas. No se guardan textos, voz, imágenes ni datos personales en estos contadores.":
  "Estadísticas desactivadas. Solo se cuentan acciones cuando das tu consentimiento.";
}
function load(){
 const who=current(),ticket=++generation;owner=who;model=P.clean({consent:false,days:{}});render();
 if(!who)return;
 void S.get(key(who),null).then(value=>{
  if(ticket!==generation||who!==current())return;
  model=P.clean(value);render();
 }).catch(()=>status("No pude cargar las estadísticas. Siguen desactivadas."));
}
function persist(next){
 const who=current(),ticket=generation;
 if(!who||who!==owner)return Promise.reject(Error("Changed profile"));
 const snapshot=P.clean(next);
 const job=queue.catch(()=>{}).then(async()=>{
  if(ticket!==generation||who!==current())throw Error("Changed profile");
  await S.set(key(who),snapshot);
  if(ticket!==generation||who!==current())throw Error("Changed profile");
  model=snapshot;render();
 });
 queue=job;return job;
}
function record(type){
 if(!model.consent||!owner||current()!==owner)return;
 const next=P.increment(model,type);
 // This only stores a category and date. No content of the interaction is copied.
 model=next;
 void persist(next).catch(()=>status("No se pudieron actualizar los contadores."));
}
function exportData(){
 if(!owner)return;
 const content={format:"robotito-private-metrics",version:1,createdAt:new Date().toISOString(),...P.clean(model)};
 const blob=new Blob([JSON.stringify(content,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="robotito-estadisticas-locales.json";a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1200);
 status("Exportación preparada. No se ha enviado a ningún servidor.");
}
function init(){
 $("privateMetricsConsent")?.addEventListener("change",event=>{
  const checked=event.target.checked;
  void persist({...model,consent:checked}).then(()=>status(checked?
   "Consentimiento activado solo para estos contadores locales.":"El registro quedó desactivado. Podés borrar los datos guardados cuando quieras."))
   .catch(()=>status("No se pudo guardar el consentimiento."));
 });
 $("privateMetricsErase")?.addEventListener("click",()=>{
  if(!root.confirm("¿Borrar todas las estadísticas locales de este perfil?"))return;
  void persist({consent:model.consent,days:{}}).then(()=>status("Se borraron los contadores de este perfil."))
   .catch(()=>status("No se pudieron borrar los contadores."));
 });
 $("privateMetricsExport")?.addEventListener("click",exportData);
 document.addEventListener("submit",event=>{
  const id=event.target?.id;
  if(id==="robotitoTextForm"&&event.target.querySelector("#robotitoTextInput")?.value.trim())record("questions");
  if(id==="nativeTaskForm")record("tasks");
 },true);
 document.addEventListener("click",event=>{
  const target=event.target.closest?.("button");
  if(!target)return;
  if(target.id==="startClassBtn")record("classes");
  if(target.id==="recommendBtn")record("recommendations");
  if(target.id==="studyRecordSession")record("studySessions");
 });
 root.addEventListener("robotito:memoryscopechange",load);
 root.addEventListener("robotito:memoryscopeready",load);
 load();
}
root.ROBOTITO_PRIVATE_METRICS={init,record,load,get consent(){return model.consent;},get totals(){return P.totals(model);}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window);
