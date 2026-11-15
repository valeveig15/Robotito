// P10/P11: explicit local, foreground-only temporal instructions and safe rules.
// No eval, network, background-service claims, arbitrary command execution,
// microphone activation, camera control, account access or destructive actions.
(function(root){
"use strict";
const KEY="robotito.temporal-rules.v1",MAX=40,MAX_TEXT=240,MAX_RULE_TRIGGER=90;
const MIN_DELAY=1000,MAX_DELAY=24*3600000,GRACE=120000;
const fold=s=>String(s||"").toLocaleLowerCase().normalize("NFD")
 .replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();
const uid=()=>root.crypto?.randomUUID?.()||"t-"+Date.now()+"-"+Math.random().toString(36).slice(2);
function validOwner(s){return typeof s==="string"&&s.length>0&&s.length<=100;}
function safeText(s,max=MAX_TEXT){
 return typeof s==="string"&&s.trim().length>0&&s.trim().length<=max&&
  !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(s);
}
function duration(amount,unit){
 const n=Number(amount);
 if(!Number.isSafeInteger(n)||n<1)return null;
 const scale=/^(?:segundos?|seconds?|segundos?)$/.test(unit)?1000:
  /^(?:minutos?|minutes?|minuti?|minuten?)$/.test(unit)?60000:
  /^(?:horas?|hours?|heures?|stunden?)$/.test(unit)?3600000:null;
 const ms=n*scale;
 return scale&&ms>=MIN_DELAY&&ms<=MAX_DELAY?ms:null;
}
function safeRow(row){
 return !!row&&typeof row==="object"&&
  typeof row.id==="string"&&row.id.length<=100&&validOwner(row.owner)&&
  ["once","repeat","phrase","daily"].includes(row.kind)&&
  safeText(row.text)&&Number.isSafeInteger(row.createdAt)&&row.createdAt>0&&
  (row.kind==="phrase"?(safeText(row.trigger,MAX_RULE_TRIGGER)):
   row.kind==="daily"?(typeof row.time==="string"&&/^([01]\d|2[0-3]):[0-5]\d$/.test(row.time)):
   (Number.isSafeInteger(row.dueAt)&&row.dueAt>0))&&
  (row.kind!=="repeat"||(Number.isSafeInteger(row.intervalMs)&&
    row.intervalMs>=MIN_DELAY&&row.intervalMs<=MAX_DELAY&&
    Number.isSafeInteger(row.remaining)&&row.remaining>=1&&row.remaining<=12));
}
function parseInstruction(raw){
 const s=String(raw||"").trim().replace(/[.!?]+$/,"").trim();
 let m=s.match(/^(?:en|em|dentro de|in|daqui a|dans|tra)\s+(\d{1,4})\s*(segundos?|seconds?|minutos?|minutes?|minuti?|minuten?|horas?|hours?|heures?|stunden?)\s*[,;:]?\s*(?:recordame|recuerdame|avisame|decime|dime|dimmi|di|say|tell me|remind me|lembre-me|me lembre|dis-moi|ricordami|sag mir)\s+(.+)$/i);
 if(m){const ms=duration(m[1],fold(m[2]));return ms&&safeText(m[3])?{kind:"once",ms,text:m[3].trim()}:null;}
 m=s.match(/^(?:cada|every|a cada|toutes les|ogni|alle)\s+(\d{1,4})\s*(segundos?|seconds?|minutos?|minutes?|minuti?|minuten?|horas?|hours?|heures?|stunden?)\s*(?:por|durante|for|durant|per|fur)\s*(\d{1,2})\s*(?:veces|times|vezes|fois|volte|mal)\s*[,;:]?\s*(?:recordame|recuerdame|avisame|decime|dime|di|say|tell me|remind me|lembre-me|dis-moi|ricordami|sag mir)\s+(.+)$/i);
 if(m){const ms=duration(m[1],fold(m[2])),n=Number(m[3]);return ms&&n>=2&&n<=12&&safeText(m[4])?{kind:"repeat",ms,count:n,text:m[4].trim()}:null;}
 m=s.match(/^(?:si digo|cuando diga|if i say|when i say|se eu disser|quando eu disser|si je dis|quand je dis|se dico|quando dico|wenn ich sage)\s+["“«']?(.+?)["”»']?\s*[,;:]\s*(?:dec[ií]|decime|dime|d[ií]|say|tell me|diga|dis|di'|sage)\s+(.+)$/i);
 if(m&&safeText(m[1],MAX_RULE_TRIGGER)&&safeText(m[2]))return {kind:"phrase",trigger:m[1].trim(),text:m[2].trim()};
 m=s.match(/^(?:todos los d[ií]as|cada d[ií]a|every day|todo dia|tous les jours|ogni giorno|jeden tag)\s+(?:a las|at|as|a|um)\s+([01]?\d|2[0-3]):([0-5]\d)\s*[,;:]?\s*(?:dec[ií]|decime|dime|d[ií]|di'|say|tell me|diga|dis|sage)\s+(.+)$/i);
 if(m&&safeText(m[3]))return {kind:"daily",time:String(Number(m[1])).padStart(2,"0")+":"+m[2],text:m[3].trim()};
 return null;
}
function createEngine({storage,now=()=>Date.now(),onChange=()=>{}}={}){
 if(!storage?.getItem||!storage?.setItem)throw new Error("Local storage adapter required");
 const load=()=>{
  try{
   const value=JSON.parse(storage.getItem(KEY)||"[]");
   return Array.isArray(value)?value.filter(safeRow).slice(0,MAX):[];
  }catch{return [];}
 };
 let rows=load();
 const save=()=>{storage.setItem(KEY,JSON.stringify(rows));onChange(rows.map(r=>({...r})));};
 const list=(owner)=>rows.filter(r=>r.owner===owner).map(r=>({...r}));
 const create=(spec,owner)=>{
  if(!validOwner(owner)||!spec||!["once","repeat","phrase","daily"].includes(spec.kind)||
     !safeText(spec.text))throw new Error("Invalid instruction or profile");
  if(rows.length>=MAX)throw new Error("Maximum 40 instructions");
  const t=now();
  const row={id:uid(),owner,kind:spec.kind,text:spec.text,createdAt:t};
  if(spec.kind==="phrase"){
   if(!safeText(spec.trigger,MAX_RULE_TRIGGER)||fold(spec.trigger)===fold(spec.text))
    throw new Error("Unsafe or recursive conditional");
   row.trigger=spec.trigger;
  }else if(spec.kind==="daily"){
   if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(spec.time))throw new Error("Invalid daily time");
   row.time=spec.time;row.lastDate="";
  }else{
   if(!Number.isSafeInteger(spec.ms)||spec.ms<MIN_DELAY||spec.ms>MAX_DELAY)
    throw new Error("Delay must be from one second to 24 hours");
   row.dueAt=t+spec.ms;
   if(spec.kind==="repeat"){
    if(!Number.isSafeInteger(spec.count)||spec.count<2||spec.count>12)
     throw new Error("Repetitions must be between two and twelve");
    row.remaining=spec.count;row.intervalMs=spec.ms;
   }
  }
  if(!safeRow(row))throw new Error("Invalid scheduled instruction");
  rows=[...rows,row];save();return {...row};
 };
 const cancel=(id,owner)=>{
  const count=rows.length;
  rows=rows.filter(r=>!(r.id===id&&r.owner===owner));
  if(count!==rows.length){save();return true;}
  return false;
 };
 const clear=(owner)=>{if(!validOwner(owner))return 0;const n=rows.length;
  rows=rows.filter(r=>r.owner!==owner);if(n!==rows.length)save();return n-rows.length;};
 const tick=({owner,visible=true,emit=()=>{}}={})=>{
  if(!visible||!validOwner(owner))return 0;
  const t=now(),today=new Date(t).toLocaleDateString("en-CA"),hm=
   String(new Date(t).getHours()).padStart(2,"0")+":"+
   String(new Date(t).getMinutes()).padStart(2,"0");
  const due=[];let changed=false;
  rows=rows.filter(row=>{
   if(row.owner!==owner)return true;
   if(row.kind==="phrase")return true;
   if(row.kind==="daily"){
    if(row.time!==hm||row.lastDate===today)return true;
    row.lastDate=today;due.push(row.text);changed=true;return true;
   }
   if(t<row.dueAt)return true;
   if(t-row.dueAt<=GRACE)due.push(row.text);
   changed=true;
   if(row.kind==="once")return false;
   row.remaining--;
   if(row.remaining<=0||t-row.dueAt>GRACE)return false;
   row.dueAt=t+row.intervalMs;return true;
  });
  // Mark first: callback failure or unexpected rerender cannot replay.
  if(changed)save();
  for(const text of due.slice(0,3))emit(text);
  return Math.min(due.length,3);
 };
 const speech=(raw,{owner,emit=()=>{},visible=true}={})=>{
  if(!visible||!validOwner(owner))return {handled:false};
  const instruction=parseInstruction(raw);
  if(instruction){
   try{const row=create(instruction,owner);return {handled:true,created:row};}
   catch(error){return {handled:true,error:String(error.message)};}
  }
  const normalized=fold(raw);if(!normalized)return {handled:false};
  if(/^(?:cancela|cancelar|borra|borrar|elimina|delete|remove) (?:todas |all )?(?:las )?(?:ordenes|reglas|reminders|rules)$/.test(normalized))
   return {handled:true,needsConfirmation:true};
  const triggered=rows.find(row=>row.kind==="phrase"&&row.owner===owner&&
   fold(row.trigger)===normalized);
  if(!triggered)return {handled:false};
  emit(triggered.text);return {handled:true,triggered:triggered.id};
 };
 const reload=()=>{rows=load();onChange(rows.map(r=>({...r})));return rows.length;};
 return {create,list,cancel,clear,tick,speech,reload,parseInstruction};
}
let engine=null,context=null,timer=null;
function label(key,fallback){const lang=root.document?.documentElement?.lang||"es";
 return root.ROBOTITO_I18N?.t?.(key,lang)||fallback;
}
function attach({say=()=>{},owner=()=> "local"}={}){
 if(engine)return engine;
 context={say,owner};
 try{engine=createEngine({storage:root.localStorage,onChange:render});}
 catch(error){console.warn("P10/P11 local instructions unavailable",error);return null;}
 const $=id=>root.document?.getElementById(id);
 const submit=()=>{
  const box=$("temporalRuleInput"),raw=box?.value?.trim();if(!raw)return;
  const result=engine.speech(raw,{owner:context.owner(),emit:context.say});
  const status=$("temporalRuleStatus");
  if(status)status.textContent=result.created?label("p10RulesSavedOK","Instrucción guardada para este perfil."):
   result.error?label("p10RulesInvalid","No pude guardar esa orden."):
   label("p10RulesInvalid","Usá uno de los formatos de ejemplo.");
  if(result.created)box.value="";render();
 };
 $("temporalRuleAdd")?.addEventListener("click",submit);
 $("temporalRuleInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();submit();}});
 const status=$("temporalRuleStatus");
 if(status)status.textContent=label("p10RulesScope","Las órdenes se ejecutan solo mientras Robotito está abierto y visible.");
 render();
 timer=root.setInterval?.(()=>engine.tick({owner:context.owner(),visible:!root.document.hidden,
  emit:context.say}),1000);
 root.document?.addEventListener("visibilitychange",render);
 root.addEventListener?.("storage",event=>{
  if(event.key===KEY){engine.reload();render();}
 });
 return engine;
}
function render(){
 if(!engine||!root.document)return;
 const $=id=>root.document.getElementById(id),list=$("temporalRuleList");
 if(!list)return;
 list.replaceChildren();
 for(const row of engine.list(context.owner())){
  const item=root.document.createElement("div");item.className="memory-row";
  const description=root.document.createElement("span");
  description.textContent=row.kind==="phrase"?"Si digo “"+row.trigger+"”, decir: "+row.text:
   row.kind==="daily"?"Todos los días "+row.time+": "+row.text:
   row.kind==="repeat"?"Repetir "+row.remaining+" veces: "+row.text:
   "Recordar: "+row.text;
  const button=root.document.createElement("button");button.type="button";
  button.className="ghost danger";button.textContent=label("p10RulesCancel","Cancelar");
  button.addEventListener("click",()=>{engine.cancel(row.id,context.owner());render();});
  item.append(description,button);list.appendChild(item);
 }
}
function handle(raw,options={}){
 if(!engine)return {handled:false};
 const result=engine.speech(raw,{owner:context.owner(),visible:!root.document.hidden,
  emit:context.say});
 if(result.handled&&result.created)context.say(label("p10RulesStoredVoice","Orden guardada. La ejecutaré mientras esta página esté abierta y visible."));
 else if(result.needsConfirmation){
  if(root.confirm?.(label("p10RulesCancelAll","¿Cancelar todas las órdenes y reglas de este perfil?"))){
   engine.clear(context.owner());context.say(label("p10RulesCancelled","Órdenes y reglas de este perfil canceladas."));
  }
 }else if(result.error)context.say("No pude guardar esa orden: "+result.error);
 return result;
}
root.ROBOTITO_TEMPORAL_RULES={createEngine,parseInstruction,attach,handle};
if(typeof module!=="undefined"&&module.exports)
 module.exports={createEngine,parseInstruction};
})(typeof window!=="undefined"?window:globalThis);
