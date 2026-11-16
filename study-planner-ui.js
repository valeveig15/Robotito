// Robotito P18 — local task forms, scheduling and explicit Sheet import.
(function(root){
"use strict";
let planner=null,service=null;
function scoped(){return service ||= root.ROBOTITO_MEMORY_MODULES.create({...root.ROBOTITO_MEMORY_MODULES.native,factory:root.ROBOTITO_STUDY_PLANNER.createPlanner});}
const $=selector=>document.querySelector(selector);
function message(value){const el=$("#nativeTaskStatus");if(el)el.textContent=String(value);}
const node=(tag,text="",className="")=>{
 const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;
};
async function safe(call){try{
 const result=await scoped().run(engine=>{planner=engine;return call();});render();return result;
 }catch(e){planner=null;try{planner=await scoped().read();}catch{}render();message(e.message||"No pude guardar los cambios.");return null;}}
async function refresh(){try{planner=await scoped().read();render();}catch(e){planner=null;render();message(e.message);}}
function formValue(id){return $(id)?.value?.trim()||"";}
function announce(task,allDone){
 if(typeof root.setMood==="function")root.setMood("proud","Robotito celebra tu progreso de estudio.");
 const text=allDone?"¡Felicitaciones! ¡Completaste todos tus pendientes!":"¡Muy bien! Terminaste "+task.title+".";
 message(text);
 if(!(typeof state!=="undefined"&&state.classMode)&&typeof root.say==="function")root.say(text,5000);
}
function render(){
 if(!planner){message("El planificador local no está disponible en este navegador.");return;}
 const result=planner.todayPlan();
 const list=$("#nativeTaskList"),blocks=$("#nativeTaskBlocks"),summary=$("#nativeTaskDaySummary");
 if(summary)summary.textContent="Hoy "+result.date+" · "+result.tasks.length+" pendientes · "+result.completed+" terminadas · "+result.availableMinutes+" minutos disponibles";
 if(list){
  list.replaceChildren();
  if(!result.tasks.length&&!result.completed)list.append(node("p","Todavía no agregaste tareas.","muted"));
  if(result.allDone)list.append(node("p","🎉 ¡Felicitaciones! Completaste todos tus pendientes.","study-success"));
  const records=planner.snapshot().tasks;
  const ordered=[...result.tasks,...records.filter(t=>t.done).map(t=>({...t,stage:"Completada",allocated:0}))];
  for(const task of ordered){
   const row=node("article","","task-row native-task-row");
   const title=node("strong",task.title);
   if(task.done)title.style.textDecoration="line-through";
   row.append(title);
   row.append(node("div",[task.subject||"Sin materia",task.stage,
    task.due?"Fecha: "+task.due:"Sin vencimiento",
    task.done?"":(result.slots.length?"Tiempo asignado hoy: "+task.allocated+" min":task.minutes+" min estimados")
   ].filter(Boolean).join(" · "),"task-meta"));
   const controls=node("div","","native-task-controls");
   const toggle=node("button",task.done?"Reabrir":"✓ Completar","ghost");toggle.type="button";
   toggle.addEventListener("click",()=>safe(()=>{
    const changed=planner.updateTask(task.id,{done:!task.done});
    render();if(changed.done)announce(changed,planner.todayPlan().allDone);
    else message("Tarea reabierta.");
   }));
   controls.append(toggle);
   const priority=document.createElement("select");priority.setAttribute("aria-label","Prioridad de "+task.title);
   for(let i=1;i<=5;i++){
    const opt=node("option","Prioridad "+i);opt.value=String(i);opt.selected=i===Number(task.priority);priority.append(opt);
   }
   priority.addEventListener("change",()=>safe(()=>{planner.updateTask(task.id,{priority:priority.value});render();}));
   controls.append(priority);
   const due=document.createElement("input");due.type="date";due.value=task.due||"";
   due.setAttribute("aria-label","Fecha opcional de "+task.title);
   due.addEventListener("change",()=>safe(()=>{planner.updateTask(task.id,{due:due.value});render();}));
   controls.append(due);
   const duration=document.createElement("input");duration.type="number";
   duration.min="1";duration.max="1440";duration.value=String(task.minutes||30);
   duration.setAttribute("aria-label","Minutos estimados de "+task.title);
   duration.addEventListener("change",()=>safe(()=>{planner.updateTask(task.id,{minutes:duration.value});render();}));
   controls.append(duration);
   const remove=node("button","Borrar","ghost");remove.type="button";
   remove.addEventListener("click",()=>safe(()=>{planner.removeTask(task.id);render();message("Tarea borrada.");}));
   controls.append(remove);row.append(controls);list.append(row);
  }
 }
 if(blocks){
  blocks.replaceChildren();
  const weekdayNames=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  for(const b of planner.snapshot().blocks){
   const row=node("div","","task-row");
   row.append(node("span",weekdayNames[b.weekday]+" "+b.start+"–"+b.end));
   const del=node("button","Quitar bloque","ghost");del.type="button";
   del.addEventListener("click",()=>safe(()=>{planner.removeBlock(b.id);render();}));
   row.append(del);blocks.append(row);
  }
 }
}
function bind(){
 $("#nativeTaskForm")?.addEventListener("submit",e=>{
  e.preventDefault();safe(()=>{
   const t=planner.addTask({title:formValue("#nativeTaskName"),
    subject:formValue("#nativeTaskSubject"),priority:formValue("#nativeTaskPriority")||3,
    due:formValue("#nativeTaskDue"),minutes:formValue("#nativeTaskMinutes")||30});
   $("#nativeTaskName").value="";render();message("Anoté "+t.title+".");
  });
 });
 $("#nativeSubjectForm")?.addEventListener("submit",e=>{
  e.preventDefault();safe(()=>{planner.addSubject(formValue("#nativeSubjectName"),formValue("#nativeSubjectPriority")||3);
   render();message("Prioridad de materia guardada.");});
 });
 $("#nativeBlockForm")?.addEventListener("submit",e=>{
  e.preventDefault();safe(()=>{planner.addBlock({weekday:formValue("#nativeBlockWeekday"),
    start:formValue("#nativeBlockStart"),end:formValue("#nativeBlockEnd")});
   render();message("Horario disponible guardado.");});
 });
 $("#nativeSheetImport")?.addEventListener("click",()=>{
  if(typeof state==="undefined"||!Array.isArray(state.tasks)){message("No hay filas disponibles para importar.");return;}
  safe(()=>{const n=importRows(state.tasks);message(n+" tareas copiadas a tu planificador local.");render();});
 });
 void refresh();
}
function importRows(rows){
 if(!planner)throw new Error("Planificador no disponible.");
 const key=t=>[t.title,t.subject,t.due].map(v=>String(v||"").toLowerCase().trim()).join("|");
 const existing=new Set(planner.snapshot().tasks.map(key));
 let imported=0;
 for(const r of rows.slice(0,500)){
  if(!r?.task||/^(hecho|completo|completado|done|si|true|x|finalizado|entregado)$/i.test(String(r.status||"").trim()))continue;
  let due=String(r.due||"").trim();
  const d=due.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(d)due=[d[3],d[2].padStart(2,"0"),d[1].padStart(2,"0")].join("-");
  if(due&&!/^\d{4}-\d{2}-\d{2}$/.test(due))due="";
  const row={title:String(r.task),subject:String(r.subject||""),due,priority:3,minutes:30};
  if(existing.has(key(row)))continue;
  try{planner.addTask(row);existing.add(key(row));imported++;}
  catch(error){console.warn("Skipped invalid Sheet row",error);}
 }
 return imported;
}
async function speech(value){
 // Classify using an empty engine before reading any personal task history.
 const probe=root.ROBOTITO_STUDY_PLANNER.createPlanner({storage:{getItem:()=>null,setItem:()=>{}}}).speech(value);
 if(!probe.handled)return probe;
 return (await safe(()=>planner.speech(value)))||{handled:false};
}
root.ROBOTITO_STUDY_PLANNER_UI={render:refresh,importRows:rows=>safe(()=>importRows(rows)),speech,get engine(){return service?.engine||null;}};
root.addEventListener("robotito:memoryscopechange",()=>{planner=null;for(const id of ["#nativeTaskList","#nativeTaskBlocks","#nativeTaskDaySummary"])$(id)?.replaceChildren();});
root.addEventListener("robotito:memoryscopeready",()=>void refresh());
if(root.document)document.addEventListener("DOMContentLoaded",bind);
})(typeof window!=="undefined"?window:globalThis);
