// Robotito P18 — private, browser-local study planner. Sheet imports remain separate.
(function(root){
"use strict";
const KEY="robotito.nativeStudyPlanner.v1";
const initial=()=>({version:1,subjects:[],blocks:[],tasks:[]});
const clean=v=>String(v??"").trim().replace(/\s+/g," ");
const norm=v=>clean(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const uid=()=>root.crypto?.randomUUID?.()||"id-"+Date.now()+"-"+Math.random().toString(36).slice(2);
const dayKey=(date=new Date())=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
function parseDate(s){
 if(s==null||s==="")return "";
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw new Error("Fecha inválida: usá AAAA-MM-DD.");
 const d=new Date(s+"T12:00:00Z");
 if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s)throw new Error("Fecha imposible.");
 return s;
}
const minutes=hhmm=>{
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(hhmm)))throw new Error("Horario inválido.");
 const [h,m]=hhmm.split(":").map(Number);return h*60+m;
};
function dayDiff(due,today){
 return Math.round((Date.parse(due+"T12:00:00Z")-Date.parse(today+"T12:00:00Z"))/86400000);
}
function stage(t,at=dayKey()){
 if(t.done)return "completada";
 if(!t.due)return "sin fecha";
 const delta=dayDiff(t.due,at);
 if(delta<0)return "ATRASADA — Superprioridad";
 if(delta===0)return "HOY — Superprioridad";
 if(delta===1)return "Mañana — Muy urgente";
 if(delta<=7)return "Próxima entrega";
 return "Con fecha";
}
function score(t,subjects,at){
 const p=Number(t.priority)||3;
 const sp=subjects.find(s=>norm(s.name)===norm(t.subject))?.priority||3;
 if(t.done)return -Infinity;
 const delta=t.due?dayDiff(t.due,at):null;
 const urgent=delta===null?0:delta<0?100000+Math.min(-delta,365)*10:
  delta===0?90000:delta===1?80000:delta<=7?70000-delta*1000:
  15000+Math.max(0,30-delta)*100;
 return urgent+p*100+sp*50+Math.min(300,Math.ceil(Number(t.minutes)||30));
}
function createPlanner({storage=root.localStorage,now=()=>new Date()}={}){
 let data=initial();
 try{
  const raw=JSON.parse(storage?.getItem(KEY)||"null");
  if(raw&&raw.version===1&&Array.isArray(raw.subjects)&&Array.isArray(raw.blocks)&&Array.isArray(raw.tasks)){
   data={version:1,subjects:raw.subjects.slice(0,100),blocks:raw.blocks.slice(0,500),tasks:raw.tasks.slice(0,1000)};
  }
 }catch(error){throw new Error("No pude leer el planificador local: "+error.message);}
 const persist=next=>{storage.setItem(KEY,JSON.stringify(next));data=next;return next;};
 function addSubject(name,priority=3){
  name=clean(name);priority=Number(priority);
  if(!name||name.length>90||!Number.isInteger(priority)||priority<1||priority>5)
   throw new Error("Materia o prioridad inválida (1–5).");
  const subjects=data.subjects.filter(s=>norm(s.name)!==norm(name));
  subjects.push({name,priority});
  persist({...data,subjects});return subjects.at(-1);
 }
 function addBlock({weekday,start,end}){
  weekday=Number(weekday);const s=minutes(start),e=minutes(end);
  if(!Number.isInteger(weekday)||weekday<0||weekday>6||e<=s)throw new Error("Bloque de estudio inválido.");
  if(data.blocks.some(b=>b.weekday===weekday&&s<minutes(b.end)&&e>minutes(b.start)))
   throw new Error("Ya tenés un bloque que se superpone con ese horario.");
  const b={id:uid(),weekday,start,end};
  persist({...data,blocks:[...data.blocks,b]});return b;
 }
 function addTask({title,subject="",priority=3,minutes:mins=30,due=""}={}){
  title=clean(title);subject=clean(subject);priority=Number(priority);mins=Number(mins);
  due=parseDate(due);
  if(!title||title.length>240||subject.length>90||
    !Number.isInteger(priority)||priority<1||priority>5||
    !Number.isInteger(mins)||mins<1||mins>1440)throw new Error("Datos de tarea inválidos.");
  const task={id:uid(),title,subject,priority,minutes:mins,due,done:false,createdAt:Date.now(),doneAt:null};
  const next={...data,tasks:[...data.tasks,task]};
  if(subject&&!next.subjects.some(s=>norm(s.name)===norm(subject)))
    next.subjects=[...next.subjects,{name:subject,priority:3}];
  persist(next);return task;
 }
 function updateTask(id,patch={}){
  const current=data.tasks.find(t=>t.id===id);
  if(!current)throw new Error("Tarea no encontrada.");
  const task={...current};
  if("title" in patch){task.title=clean(patch.title);if(!task.title||task.title.length>240)throw new Error("Nombre inválido.");}
  if("subject" in patch){task.subject=clean(patch.subject);if(task.subject.length>90)throw new Error("Materia inválida.");}
  if("priority" in patch){task.priority=Number(patch.priority);if(!Number.isInteger(task.priority)||task.priority<1||task.priority>5)throw new Error("Prioridad inválida.");}
  if("minutes" in patch){task.minutes=Number(patch.minutes);if(!Number.isInteger(task.minutes)||task.minutes<1||task.minutes>1440)throw new Error("Duración inválida.");}
  if("due" in patch)task.due=parseDate(patch.due);
  if("done" in patch){task.done=patch.done===true;task.doneAt=task.done?Date.now():null;}
  const next={...data,tasks:data.tasks.map(t=>t.id===id?task:t)};
  if(task.subject&&!next.subjects.some(s=>norm(s.name)===norm(task.subject)))
   next.subjects=[...next.subjects,{name:task.subject,priority:3}];
  persist(next);return task;
 }
 function removeTask(id){persist({...data,tasks:data.tasks.filter(t=>t.id!==id)});}
 function removeBlock(id){persist({...data,blocks:data.blocks.filter(b=>b.id!==id)});}
 function todayPlan(date=now()){
  const at=dayKey(date),weekday=date.getDay();
  const pending=data.tasks.filter(t=>!t.done).sort((a,b)=>
   score(b,data.subjects,at)-score(a,data.subjects,at)||a.createdAt-b.createdAt);
  const slots=data.blocks.filter(b=>b.weekday===weekday).sort((a,b)=>minutes(a.start)-minutes(b.start))
   .map(b=>({start:b.start,end:b.end,available:minutes(b.end)-minutes(b.start)}));
  const available=slots.reduce((n,b)=>n+b.available,0);
  let remaining=available;
  const tasks=pending.map(t=>{
   const allocated=slots.length?Math.min(t.minutes,remaining):t.minutes;
   if(slots.length)remaining-=allocated;
   return {...t,allocated,stage:stage(t,at),
    score:score(t,data.subjects,at),
    reason:t.due?stage(t,at):"Prioridad personal y de materia"};
  });
  return {date:at,weekday,slots,availableMinutes:available,tasks,
   completed:data.tasks.filter(t=>t.done).length,
   total:data.tasks.length,allDone:data.tasks.length>0&&pending.length===0};
 }
 // Only unambiguous, explicitly requested spoken actions are executed.
 function speech(raw){
  const value=clean(raw),n=norm(value);
  let m=n.match(/^(?:anota|anotame|agrega|agregame|registra)\s+(?:la\s+)?tarea\s+(.+?)\s+(?:para|de la materia)\s+(.+)$/);
  if(m){
   const original=value.match(/^(?:anot[aá]|anot[aá]me|agreg[aá]|agr[eé]game|registr[aá])\s+(?:la\s+)?tarea\s+(.+?)\s+(?:para|de la materia)\s+(.+)$/i);
   if(!original)return {handled:false};
   try{
    const t=addTask({title:original[1],subject:original[2]});
    return {handled:true,text:"Anoté "+t.title+" para "+t.subject+". Podés ajustar fecha y prioridad en Tareas."};
   }catch(e){return {handled:true,text:e.message};}
  }
  m=n.match(/^(?:termine|complete|marca(?:me)?\s+como\s+(?:hecha|completada)|marcar\s+como\s+hecha)\s+(?:la\s+)?tarea\s+(.+)$/);
  if(!m)return {handled:false};
  const found=data.tasks.filter(t=>!t.done&&norm(t.title)===m[1]);
  if(found.length!==1)return {handled:true,text:found.length?"Hay varias tareas con ese nombre. Elegí cuál completar en la lista.":"No encontré una tarea pendiente con ese nombre."};
  try{
   const t=updateTask(found[0].id,{done:true});
   return {handled:true,text:todayPlan().allDone?"¡Terminaste todos tus pendientes! ¡Felicitaciones!":"¡Bien! Marqué "+t.title+" como completada."};
  }catch(e){return {handled:true,text:e.message};}
 }
 return {addSubject,addBlock,addTask,updateTask,removeTask,removeBlock,todayPlan,speech,
  snapshot:()=>JSON.parse(JSON.stringify(data))};
}
const api={createPlanner,stage,dayKey,dayDiff};
root.ROBOTITO_STUDY_PLANNER=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
