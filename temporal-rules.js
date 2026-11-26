// P10/P11: explicit local, foreground-only temporal instructions and safe rules.
// No eval, network, background-service claims, arbitrary command execution,
// microphone activation, camera control, account access or destructive actions.
(function(root){
"use strict";
const KEY="robotito.temporal-rules.v1",MAX=40,MAX_TEXT=240,MAX_RULE_TRIGGER=90;
const MIN_DELAY=1000,MAX_DELAY=24*3600000,GRACE=120000;
const EVENTS=new Set(["audio:clap","audio:music","vision:person","vision:empty"]);
const COOLDOWN=5000;
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
 const scale=/^(?:segundos?|seconds?|secondes?|second[io]|sekunden?)$/.test(unit)?1000:
  /^(?:minutos?|minutes?|minuti?|minuten?)$/.test(unit)?60000:
  /^(?:horas?|hours?|heures?|or[ae]|stunden?)$/.test(unit)?3600000:null;
 const ms=n*scale;
 return scale&&ms>=MIN_DELAY&&ms<=MAX_DELAY?ms:null;
}
function safeRow(row){
 return !!row&&typeof row==="object"&&
  typeof row.id==="string"&&row.id.length<=100&&validOwner(row.owner)&&
  ["once","repeat","phrase","daily","event"].includes(row.kind)&&
  (row.enabled===undefined||typeof row.enabled==="boolean")&&
  (row.priority===undefined||Number.isInteger(row.priority)&&row.priority>=0&&row.priority<=9)&&
  safeText(row.text)&&Number.isSafeInteger(row.createdAt)&&row.createdAt>0&&
  (row.kind==="event"?(Array.isArray(row.conditions)&&row.conditions.length>=1&&row.conditions.length<=3&&row.conditions.every(x=>EVENTS.has(x))&&["all","any"].includes(row.operator)&&Number.isInteger(row.holdMs)&&row.holdMs>=0&&row.holdMs<=60000):row.kind==="phrase"?(safeText(row.trigger,MAX_RULE_TRIGGER)):
   row.kind==="daily"?(typeof row.time==="string"&&/^([01]\d|2[0-3]):[0-5]\d$/.test(row.time)):
   (Number.isSafeInteger(row.dueAt)&&row.dueAt>0))&&
  (row.kind!=="repeat"||(Number.isSafeInteger(row.intervalMs)&&
    row.intervalMs>=MIN_DELAY&&row.intervalMs<=MAX_DELAY&&
    Number.isSafeInteger(row.remaining)&&row.remaining>=1&&row.remaining<=12));
}
function parseInstruction(raw){
 const s=String(raw||"").trim().replace(/[.!?]+$/,"").trim();
 let m=s.match(/^(?:en|em|dentro de|in|daqui a|dans|tra)\s+(\d{1,4})\s*(segundos?|seconds?|secondes?|second[io]|sekunden?|minutos?|minutes?|minuti?|minuten?|horas?|hours?|heures?|or[ae]|stunden?)\s*[,;:]?\s*(?:record[aá]me|recu[eé]rdame|av[ií]same|decime|dime|dimmi|di|say|tell me|remind me|lembre-me|me lembre|dis-moi|ricordami|sag mir)(?:\s+|,\s*)(.+)$/i);
 if(m){const ms=duration(m[1],fold(m[2]));return ms&&safeText(m[3].replace(/^[,;:]\s*/,""))?{kind:"once",ms,text:m[3].replace(/^[,;:]\s*/,"").trim()}:null;}
 m=s.match(/^(?:cada|every|a cada|toutes les|ogni|alle)\s+(\d{1,4})\s*(segundos?|seconds?|secondes?|second[io]|sekunden?|minutos?|minutes?|minuti?|minuten?|horas?|hours?|heures?|or[ae]|stunden?)\s*(?:por|durante|for|durant|per|f[uü]r)\s*(\d{1,2})\s*(?:veces|times|vezes|fois|volte|mal)\s*[,;:]?\s*(?:record[aá]me|recu[eé]rdame|av[ií]same|decime|dime|di|say|tell me|remind me|lembre-me|dis-moi|ricordami|sag mir)\s+(.+)$/i);
 if(m){const ms=duration(m[1],fold(m[2])),n=Number(m[3]);return ms&&n>=2&&n<=12&&safeText(m[4])?{kind:"repeat",ms,count:n,text:m[4].trim()}:null;}
 m=s.match(/^(?:si digo|cuando diga|if i say|when i say|se eu disser|quando eu disser|si je dis|quand je dis|se dico|quando dico|wenn ich sage)\s+["“«']?(.+?)["”»']?\s*[,;:]\s*(?:dec[ií]|decime|dime|d[ií]|say|tell me|diga|dis|di'?|sage)\s+(.+)$/i);
 if(m&&safeText(m[1],MAX_RULE_TRIGGER)&&safeText(m[2]))return {kind:"phrase",trigger:m[1].trim(),text:m[2].trim()};
 m=s.match(/^(?:todos los d[ií]as|cada d[ií]a|every day|todo dia|tous les jours|ogni giorno|jeden tag)\s+(?:a las|at|[aàá]s|[aà]|alle|um)\s+([01]?\d|2[0-3]):([0-5]\d)\s*[,;:]?\s*(?:dec[ií]|decime|dime|d[ií]|di'|say|tell me|diga|dis|sage)\s+(.+)$/i);
 if(m&&safeText(m[3]))return {kind:"daily",time:String(Number(m[1])).padStart(2,"0")+":"+m[2],text:m[3].trim()};
 // The natural spoken order can place the time after the requested message.
 m=s.match(/^(?:decime|dime|record[aá]me|recu[eé]rdame|av[ií]same|say|tell me|remind me|lembre-me|me lembre|dis-moi|ricordami|dimmi|sag mir)\s+(.+?)\s+(?:en|dentro de|in|daqui a|dans|tra)\s+(\d{1,4})\s*(segundos?|seconds?|secondes?|second[io]|sekunden?|minutos?|minutes?|minuti?|minuten?|horas?|hours?|heures?|or[ae]|stunden?)$/i);
 if(m){const ms=duration(m[2],fold(m[3]));return ms&&safeText(m[1])?{kind:"once",ms,text:m[1].trim()}:null;}
 m=s.match(/^(?:si|cuando|if|when|se|quando|quand|wenn)\s+(.+?)\s*[,;:]\s*(?:dec[ií]|decime|dime|d[ií]|say|tell me|diga|dis|di'?|sage)\s+(.+)$/i);
 if(m&&safeText(m[2])){
  let condition=fold(m[1]),holdMs=0;
  const hold=condition.match(/\s+(?:durante|for|pendant|per|fur)\s+(\d{1,2})\s+(?:segundos?|seconds?|secondes?|second[io]|sekunden?)$/);
  if(hold){holdMs=Number(hold[1])*1000;condition=condition.slice(0,hold.index);if(holdMs<1000||holdMs>60000)return null;}
  const operator=/\s+(?:o|or|ou|oder)\s+/.test(condition)?"any":"all";
  const parts=condition.split(/\s+(?:y|and|e|et|und|o|or|ou|oder)\s+/);
  const conditions=parts.map(part=>{
   if(/^(?:(?:ois|oyes|escuchas|hear|you hear|ouvir|ouves|entends|tu entends|senti|horst|du horst)\s+)(?:palmas|aplausos|claps|applause|applaudissements|applausi|klatschen)$/.test(part))return "audio:clap";
   if(/^(?:(?:ois|oyes|escuchas|hear|you hear|ouvir|ouves|entends|tu entends|senti|horst|du horst)\s+)(?:musica|music|musique|musik)$/.test(part))return "audio:music";
   if(/^(?:ves|veas|see|you see|ver|vessi|vois|tu vois|vedi|siehst|du siehst)\s+(?:una persona|a person|someone|uma pessoa|une personne|qualcuno|una persona|eine person|jemanden)$/.test(part))return "vision:person";
   if(/^(?:no ves a nadie|no veas a nadie|you see nobody|see nobody|nao ves ninguem|nao ver ninguem|tu ne vois personne|ne vois personne|non vedi nessuno|du siehst niemanden|siehst niemanden)$/.test(part))return "vision:empty";
   return null;
  });
  if(parts.length<=3&&conditions.every(Boolean)&&new Set(conditions).size===conditions.length&&!(conditions.includes("vision:person")&&conditions.includes("vision:empty")&&operator==="all"))
   return {kind:"event",conditions,operator,holdMs:conditions.includes("vision:empty")?Math.max(3000,holdMs):holdMs,text:m[2].trim()};
 }
 return null;
}
function parseManagement(raw){
 const s=fold(raw).replace(/[.!?]+$/,"");
 if(/^(?:mostrame|muestrame|lista|show|list|mostre|liste|elenca|zeige)\s+(?:(?:mis|las|my|meus|minhas|mes|les|le|mie|meine)\s+)?(?:reglas|recordatorios|rules|reminders|regras|regles|regole|regeln)$/.test(s))return {action:"list"};
 let m=s.match(/^(desactiva|desactivar|pausa|pause|disable|desative|desactive|disattiva|deaktiviere|activa|activar|reanuda|resume|enable|ative|active|attiva|aktiviere|cancela|cancelar|borra|elimina|delete|remove|supprime|elimina|losche)\s+(?:(?:la|the|a|le|die)\s+)?(?:regla|rule|regra|regle|regola|regel)\s+(\d{1,2})$/);
 if(m)return {action:/^(?:des|paus|dis|deakt)/.test(m[1])?"disable":/^(?:act|rean|res|enab|ativ|attiv|aktiv)/.test(m[1])?"enable":"delete",number:Number(m[2])};
 m=String(raw||"").trim().match(/^(?:cambi[aá]|cambia|edit|change|altere|modifie|modifica|[aä]ndere)\s+(?:(?:la|the|a|le|die)\s+)?(?:regla|rule|regra|r[eè]gle|regola|regel)\s+(\d{1,2})\s+(?:para decir|to say|para dizer|pour dire|per dire|um zu sagen)\s+(.+)$/i);
 if(m&&safeText(m[2]))return {action:"edit",number:Number(m[1]),text:m[2].trim()};
 m=s.match(/^(?:prioridad|priority|prioridade|priorite|priorita|prioritat)\s+(?:(?:de la|of|da|de|della|der)\s+)?(?:regla|rule|regra|regle|regola|regel)\s+(\d{1,2})\s+(?:a|to|para|auf)\s+([0-9])$/);
 return m?{action:"priority",number:Number(m[1]),priority:Number(m[2])}:null;
}
function createEngine({storage,now=()=>Date.now(),onChange=()=>{},initialTemporary=[],initialEvidence=null}={}){
 if(!storage?.getItem||!storage?.setItem)throw new Error("Local storage adapter required");
 const load=()=>{
  try{
   const value=JSON.parse(storage.getItem(KEY)||"[]");
   return Array.isArray(value)?value.filter(safeRow).slice(0,MAX):[];
  }catch{return [];}
 };
 let rows=load();
 let temporary=initialTemporary.filter(safeRow).map(row=>({...row})); // Commands spoken in conversation exist only in the open session.
 let evidence=initialEvidence?structuredClone(initialEvidence):{epoch:null,signals:{}};
 const save=()=>{storage.setItem(KEY,JSON.stringify(rows));onChange(rows.map(r=>({...r})));};
 const list=(owner)=>rows.filter(r=>r.owner===owner).map(r=>({...r}));
 const all=owner=>[...rows,...temporary].filter(r=>r.owner===owner).map(r=>({...r}));
 const priority=(a,b)=>(b.priority||0)-(a.priority||0)||a.createdAt-b.createdAt||a.id.localeCompare(b.id);
 const cyclic=candidate=>{
  if(candidate.kind!=="phrase")return false;
  const graph=new Map();
  for(const row of [...rows,...temporary].filter(row=>row.owner===candidate.owner&&row.kind==="phrase"&&row.id!==candidate.id).concat(candidate)){
   const key=fold(row.trigger);graph.set(key,[...(graph.get(key)||[]),fold(row.text)]);
  }
  const visits=(node,path=new Set())=>{if(path.has(node))return true;if(!graph.has(node))return false;const next=new Set(path).add(node);return graph.get(node).some(to=>visits(to,next));};
  return visits(fold(candidate.trigger));
 };
 const create=(spec,owner,{persist=true}={})=>{
  if(!validOwner(owner)||!spec||!["once","repeat","phrase","daily","event"].includes(spec.kind)||
     !safeText(spec.text))throw new Error("Invalid instruction or profile");
  if(rows.length+temporary.length>=MAX)throw new Error("Maximum 40 instructions");
  const t=now();
  const row={id:uid(),owner,kind:spec.kind,text:spec.text,createdAt:t};
  if(spec.enabled!==undefined)row.enabled=spec.enabled;
  if(spec.priority!==undefined)row.priority=spec.priority;
  if(spec.kind==="event"){
   row.conditions=spec.conditions;row.operator=spec.operator||"all";row.holdMs=spec.holdMs||0;
  }else if(spec.kind==="phrase"){
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
  if(cyclic(row))throw new Error("Unsafe or recursive conditional");
  if(persist){rows=[...rows,row];save();}
  else temporary=[...temporary,row];
  return {...row};
 };
 const update=(id,owner,patch)=>{
  const old=[...rows,...temporary].find(row=>row.id===id&&row.owner===owner);if(!old)return false;
  const permitted=Object.fromEntries(Object.entries(patch).filter(([key])=>["text","enabled","priority"].includes(key)));
  const next={...old,...permitted};if(!safeRow(next)||cyclic(next))throw Error("Invalid or recursive rule edit");
  if(rows.includes(old)){rows=rows.map(row=>row===old?next:row);save();}else temporary=temporary.map(row=>row===old?next:row);
  return {...next};
 };
 const cancel=(id,owner)=>{
  const count=rows.length;
  rows=rows.filter(r=>!(r.id===id&&r.owner===owner));
  const oldTemporary=temporary.length;
  temporary=temporary.filter(r=>!(r.id===id&&r.owner===owner));
  if(count!==rows.length)save();
  return count!==rows.length||temporary.length!==oldTemporary;
 };
 const clear=(owner)=>{if(!validOwner(owner))return 0;const n=rows.length,t=temporary.length;
  rows=rows.filter(r=>r.owner!==owner);
  temporary=temporary.filter(r=>r.owner!==owner);
  if(n!==rows.length)save();return n-rows.length+t-temporary.length;};
 const tick=({owner,visible=true,emit=()=>{}}={})=>{
  if(!visible||!validOwner(owner))return 0;
  const t=now(),date=new Date(t),today=date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0");
  const hm=String(date.getHours()).padStart(2,"0")+":"+String(date.getMinutes()).padStart(2,"0");
  const due=[];
  const process=list=>{
   let changed=false;const changedIds=new Set();
   const remaining=list.filter(row=>{
    if(row.owner!==owner||row.enabled===false)return true;
    if(row.kind==="phrase"||row.kind==="event")return true;
    if(row.kind==="daily"){
     if(row.time!==hm||row.lastDate===today||due.length>=3)return true;
     row.lastDate=today;due.push(row.text);changed=true;changedIds.add(row.id);return true;
    }
    if(t<row.dueAt)return true;
    if(t-row.dueAt<=GRACE&&due.length>=3)return true;
    if(t-row.dueAt<=GRACE)due.push(row.text);
    changed=true;changedIds.add(row.id);
    if(row.kind==="once")return false;
    row.remaining--;
    if(row.remaining<=0||t-row.dueAt>GRACE)return false;
    row.dueAt=t+row.intervalMs;return true;
   });
   return {remaining,changed,changedIds};
  };
  // Pick by priority across both persistent and session-only rules. Rows that
  // exceed the output budget remain due for the following tick.
  const ordered=[...rows,...temporary].sort(priority),storedIds=new Set(rows.map(row=>row.id));
  const processed=process(ordered),remainingIds=new Set(processed.remaining.map(row=>row.id));
  const stored={remaining:rows.filter(row=>remainingIds.has(row.id)),changed:[...processed.changedIds].some(id=>storedIds.has(id))};
  const session={remaining:temporary.filter(row=>remainingIds.has(row.id))};
  rows=stored.remaining;temporary=session.remaining;
  // Persist only explicitly saved reminders, never spoken commands.
  if(stored.changed)save();
  for(const text of due.slice(0,3))emit(text);
  return Math.min(due.length,3);
 };
 const speech=(raw,{owner,emit=()=>{},visible=true,persist=false}={})=>{
  if(!visible||!validOwner(owner))return {handled:false};
  const management=parseManagement(raw);
  if(management){
   const selected=all(owner);
   if(management.action==="list")return {handled:true,listed:selected};
   const target=selected[management.number-1];if(!target)return {handled:true,missing:true};
   try{
    if(management.action==="delete")return {handled:true,removed:cancel(target.id,owner)};
    const patch=management.action==="edit"?{text:management.text}:management.action==="priority"?{priority:management.priority}:{enabled:management.action==="enable"};
    return {handled:true,updated:update(target.id,owner,patch)};
   }catch(error){return {handled:true,error:error.message};}
  }
  const instruction=parseInstruction(raw);
  if(instruction){
   try{const row=create(instruction,owner,{persist});return {handled:true,created:row,temporary:!persist};}
   catch(error){return {handled:true,error:String(error.message)};}
  }
  const normalized=fold(raw);if(!normalized)return {handled:false};
  if(/^(?:cancela|cancelar|borra|borrar|elimina|delete|remove) (?:todas |all )?(?:las )?(?:ordenes|reglas|reminders|rules)$/.test(normalized))
   return {handled:true,needsConfirmation:true};
  const triggered=[...temporary,...rows].filter(row=>row.enabled!==false&&row.kind==="phrase"&&row.owner===owner&&
   fold(row.trigger)===normalized).sort(priority)[0];
  if(!triggered)return {handled:false};
  if(now()-(triggered.lastFiredAt??-Infinity)<COOLDOWN)return {handled:true,suppressed:true};
  triggered.lastFiredAt=now();if(rows.includes(triggered))save();
  emit(triggered.text);return {handled:true,triggered:triggered.id};
 };
 const observe=(event,{owner,visible=true,emit=()=>{}}={})=>{
  const t=now();
  if(!visible||!validOwner(owner)||!event||!EVENTS.has(event.kind)||event.verified!==true||event.permission!==true||
   !Number.isFinite(event.at)||event.at>t||t-event.at>1500||!Number.isSafeInteger(event.epoch)){
   evidence={epoch:null,signals:{}};return 0;
  }
  if(evidence.epoch!==event.epoch)evidence={epoch:event.epoch,signals:{}};
  if(event.kind.startsWith("vision:"))delete evidence.signals[event.kind==="vision:person"?"vision:empty":"vision:person"];
  const previous=evidence.signals[event.kind],continuous=previous&&event.at>previous.at&&event.at-previous.at<=1800;
  if(!previous||event.at!==previous.at)evidence.signals[event.kind]={at:event.at,since:continuous?previous.since:event.at,count:continuous?previous.count+1:1};
  let changed=false,fired=0;
  for(const row of [...rows,...temporary].filter(row=>row.owner===owner&&row.kind==="event"&&row.enabled!==false).sort(priority)){
   const matches=row.conditions.map(kind=>{const signal=evidence.signals[kind];return Boolean(signal&&t-signal.at<=1500&&t>=signal.at&&t-signal.since>=row.holdMs&&(!kind.startsWith("vision:")||signal.count>=2));});
   const satisfied=row.operator==="any"?matches.some(Boolean):matches.every(Boolean);
   if(!satisfied){if(row.latched){row.latched=false;changed||=rows.includes(row);}continue;}
   if(row.latched||t-(row.lastFiredAt??-Infinity)<COOLDOWN)continue;
   row.latched=true;changed||=rows.includes(row);
   if(fired>=1)continue;
   row.lastFiredAt=t;emit(row.text);fired++;
  }
  if(changed)save();return fired;
 };
 const reload=()=>{rows=load();onChange(rows.map(r=>({...r})));return rows.length;};
 return {create,list,all,update,cancel,clear,tick,speech,observe,reload,parseInstruction,evidence:()=>structuredClone(evidence),
  temporaryList:owner=>temporary.filter(row=>row.owner===owner).map(row=>({...row}))};
}
let engine=null,context=null,timer=null,service=null;
const sessionRules=new Map();
const sessionEvidence=new Map();
const lastEvidenceAt=new Map();
async function refresh(){if(!service)return;try{engine=await service.read();render();}catch{engine=null;render();}}
async function execute(action){
 const owner=context.owner(),emitted=[];let currentEngine;
 try{
  const result=await service.run(current=>{currentEngine=current;return action(current,owner,value=>emitted.push(value));});
  if(owner===context.owner()){
   engine=currentEngine;
   sessionRules.set(owner,engine.temporaryList(owner));sessionEvidence.set(owner,engine.evidence());
   if(emitted.length&&context.canRun())context.say(emitted.join(" · "));
  }
  render();return result;
 }catch(error){await refresh();return {handled:true,error:String(error.message||error)};}
}
function label(key,fallback){const lang=root.document?.documentElement?.lang||"es";
 return root.ROBOTITO_I18N?.t?.(key,lang)||fallback;
}
function attach({say=()=>{},owner=()=> "local",canRun=()=>true,canObserve=()=>false}={}){
 if(service)return service;
 context={say,owner,canRun,canObserve};
 try{service=root.ROBOTITO_MEMORY_MODULES.create({...root.ROBOTITO_MEMORY_MODULES.rules,factory:options=>createEngine({...options,initialTemporary:sessionRules.get(context.owner())||[],initialEvidence:sessionEvidence.get(context.owner())})});
  service.list=who=>engine?.list(who)||[];service.temporaryList=who=>(sessionRules.get(who)||[]).map(row=>({...row}));}
 catch(error){console.warn("P10/P11 local instructions unavailable",error);return null;}
 const $=id=>root.document?.getElementById(id);
 const submit=async()=>{
  const box=$("temporalRuleInput"),raw=box?.value?.trim();if(!raw)return;
  const result=await execute((current,owner,emit)=>current.speech(raw,{owner,emit,persist:true}));
  const status=$("temporalRuleStatus");
  if(status){
   const key=result.created?"p10RulesSavedOK":"p10RulesInvalid";
   status.setAttribute("data-i18n",key);status.textContent=label(key,"No pude guardar esa orden.");
  }
  if(result.created)box.value="";render();
 };
 $("temporalRuleAdd")?.addEventListener("click",submit);
 $("temporalRuleInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();submit();}});
 const status=$("temporalRuleStatus");
 if(status){status.setAttribute("data-i18n","p10RulesScope");status.textContent=label("p10RulesScope","Las órdenes se ejecutan solo mientras Robotito está abierto y visible.");}
 void refresh();
 timer=root.setInterval?.(()=>{if(!root.document.hidden&&context.canRun()&&(engine?.list(context.owner()).length||sessionRules.get(context.owner())?.length))
  void execute((current,owner,emit)=>current.tick({owner,visible:!root.document.hidden&&context.canRun(),emit}));},1000);
 root.addEventListener("robotito:memoryscopechange",()=>{sessionRules.clear();sessionEvidence.clear();engine=null;render();});
 root.addEventListener("robotito:memoryscopeready",()=>void refresh());
 root.document?.addEventListener("visibilitychange",()=>{sessionEvidence.clear();render();});
 root.document?.addEventListener("robotito:languagechange",render);
 root.addEventListener?.("storage",event=>{
  if(event.key===KEY)void refresh();
 });
 return service;
}
function render(){
 if(!root.document)return;
 const $=id=>root.document.getElementById(id),list=$("temporalRuleList");
 if(!list)return;
 list.replaceChildren();
 if(!engine)return;
 for(const row of engine.list(context.owner())){
  const item=root.document.createElement("div");item.className="memory-row";
  const description=root.document.createElement("span");description.className="rule-description";
  const template=row.kind==="event"?"Si se cumple «{condition}», decir: {text}":row.kind==="phrase"?"Si digo “{trigger}”, decir: {text}":
   row.kind==="daily"?"Todos los días {time}: {text}":
   row.kind==="repeat"?"Repetir {count} veces: {text}":"Recordar: {text}";
  const names={"audio:clap":"Palmas detectadas","audio:music":"Música detectada","vision:person":"Una persona visible","vision:empty":"Ninguna persona visible"};
  const condition=row.kind==="event"?row.conditions.map(key=>copy(names[key])).join(row.operator==="any"?" / ":" + ")+(row.holdMs?" · "+row.holdMs/1000+" s":""):"";
  root.ROBOTITO_I18N.bindText(description,template,{text:row.text,trigger:row.trigger,time:row.time,count:row.remaining,condition});
  const number=root.document.createElement("span");number.textContent="#"+(engine.all(context.owner()).findIndex(item=>item.id===row.id)+1)+" · ";
  const toggle=root.document.createElement("button");toggle.type="button";toggle.className="ghost";
  root.ROBOTITO_I18N.bindText(toggle,row.enabled===false?"Activar regla":"Pausar regla");
  toggle.addEventListener("click",()=>execute((current,owner)=>current.update(row.id,owner,{enabled:row.enabled===false})));
  const button=root.document.createElement("button");button.type="button";
  button.className="ghost danger";button.setAttribute("data-i18n","p10RulesCancel");button.textContent=label("p10RulesCancel","Cancelar");
  button.addEventListener("click",()=>execute((current,owner)=>current.cancel(row.id,owner)));
  item.append(number,description,toggle,button);list.appendChild(item);
 }
}
async function handle(raw,options={}){
 if(!service)return {handled:false};
 const requestOwner=context.owner();
 // No private read for unrelated speech when there are no active phrase rules.
 const probe=createEngine({storage:{getItem:()=>"[]",setItem:()=>{}}}).speech(raw,{owner:context.owner(),emit:()=>{}});
 if(!probe.handled&&![...(engine?.list(context.owner())||[]),...(sessionRules.get(context.owner())||[])].some(row=>row.kind==="phrase"))return {handled:false};
 const result=await execute((current,owner,emit)=>current.speech(raw,{owner,visible:!root.document.hidden,emit}));
 // A list contains private response text, so discard delayed management
 // results as well as emitted actions when the active history has changed.
 if(requestOwner!==context.owner())return {handled:true,stale:true};
 if(result.handled&&result.created)context.say(result.temporary?
  label("p10RulesTransientVoice","Entendido. Te aviso mientras Robotito esté abierto y visible; no lo guardé en Horarios."):
  label("p10RulesStoredVoice","Recordatorio guardado en Horarios mientras esta página esté abierta y visible."));
 else if(result.listed){
  const source=result.listed.length?result.listed.map((row,index)=>"#"+(index+1)+" · "+(row.enabled===false?copy("Pausada"):copy("Activa"))+" · "+row.text).join("; "):copy("No hay reglas en este historial.");context.say(source);
 }else if(result.updated||result.removed)context.say(copy("Regla actualizada."));
 else if(result.missing)context.say(copy("No encontré esa regla. Pedime la lista de reglas para ver sus números."));
 else if(result.needsConfirmation){
  if(root.confirm?.(label("p10RulesCancelAll","¿Cancelar todas las órdenes y reglas de este perfil?"))){
   const cleared=await execute((current,owner)=>current.clear(owner));if(!cleared?.error)context.say(label("p10RulesCancelled","Órdenes y reglas de este perfil canceladas."));
  }
 }else if(result.error)context.say(label("p10RulesInvalid","No pude guardar esa orden."));
 return result;
}
function copy(source){return root.ROBOTITO_I18N.text(source,root.document?.documentElement?.lang||"es");}
async function receive(event){
 if(!service||!context.canRun()||!context.canObserve(event)||root.document.hidden){resetEvidence();return 0;}
 if(!engine?.all(context.owner()).some(row=>row.kind==="event"&&row.enabled!==false))return 0;
 if(event.at-(lastEvidenceAt.get(event.kind)??-Infinity)<400)return 0;
 lastEvidenceAt.set(event.kind,event.at);
 return execute((current,owner,emit)=>current.observe(event,{owner,visible:context.canRun()&&context.canObserve(event)&&!root.document.hidden,emit}));
}
function resetEvidence(){sessionEvidence.clear();lastEvidenceAt.clear();}
root.ROBOTITO_TEMPORAL_RULES={createEngine,parseInstruction,parseManagement,attach,handle,refresh,receive,resetEvidence};
if(typeof module!=="undefined"&&module.exports)
 module.exports={createEngine,parseInstruction,parseManagement};
})(typeof window!=="undefined"?window:globalThis);
