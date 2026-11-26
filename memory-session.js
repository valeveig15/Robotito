// The active identity scopes all personal collections. Anonymous sessions live
// only in RAM; a visitor key is voluntary continuity, never biometric identity.
(function(root){
"use strict";
const api=root.ROBOTITO_MEMORY_STATE,store=root.ROBOTITO_STORE;
let state=null,renderApp=()=>{},resetIdentity=()=>{},session="session:"+crypto.randomUUID(),visitor=null,activeOwner=null;
let generation=0,readyPromise=Promise.resolve(),loading=false,viewLegacy=false;
let initializedResolve;const initialized=new Promise(resolve=>{initializedResolve=resolve;});
const versions=new Map(),queues=new Map();
const settings={"robotito.lastBook.v1":["lastBook",null],"robotito.voiceProfiles.v1":["voiceProfiles",{me:[],teacher:[],classmate:[]}],
 "robotito.tasksSheetUrl.v1":["tasksSheetUrl",""],"robotito.tasksSheetGid.v1":["tasksSheetGid","0"],
 "robotito.routinePrompts.v1":["routinePromptLog",{}],"robotito.greetings.v1":["greetingHistory",{}]};
const settingValues=new Map();
const byId=id=>document.getElementById(id);
const text=(source,data={})=>root.ROBOTITO_I18N?.text?.(source,state?.languageMode||"es",data)||source;
function label(el,source,data={}){if(el)root.ROBOTITO_I18N?.bindText?.(el,source,data);}
function status(source){label(byId("memoryActionStatus"),source);}
function computedOwner(){
 const age=Date.now()-Number(state?.lastVoiceConfirmedAt||0);
 const known=age>=0&&age<=8000&&state?.currentVoicePerson&&(!state.currentPerson||state.currentPerson===state.currentVoicePerson)?state.currentVoicePerson:null;
 return known&&known!=="local"&&!/^(?:session|visitor|legacy):/.test(known)?known:visitor?.id||session;
}
function owner(){const value=computedOwner();if(state&&activeOwner&&value!==activeOwner)changed(value);return computedOwner();}
function changed(value=computedOwner()){
 let current=value;if(current===activeOwner)return;
 if(activeOwner&&!store.isEphemeral(activeOwner)&&!activeOwner.startsWith("visitor:")&&current===session){session="session:"+crypto.randomUUID();current=session;}
 if(visitor&&current!==visitor.id&&!store.isEphemeral(current))visitor=null;
 if(state.classMode){state.classMode=false;void root.ROBOTITO_CLASS_AUDIO?.stop?.();state.classSessionId=null;}
 activeOwner=current;generation++;loading=true;
 root.ROBOTITO_TYPED_CHAT?.onOwnerChange?.(current);root.ROBOTITO_OBJECT_SCENE?.cancel?.();
 // Hide the previous profile synchronously, before any IndexedDB await.
 state.memories=[];for(const [field] of Object.values(api.collections))state[field]=[];
 for(const [field,fallback] of Object.values(settings))state[field]=structuredClone(fallback);
 for(const id of ["bookResults","classAnswer","studySummary","cumulativeSummaryOutput","speechBubble"])byId(id)?.replaceChildren();
 byId("memoryList")?.replaceChildren();viewLegacy=false;if(byId("memoryLegacy"))byId("memoryLegacy").checked=false;
 root.dispatchEvent(new CustomEvent("robotito:memoryscopechange",{detail:{owner:current}}));
 readyPromise=hydrate(current,generation).finally(()=>{if(current===activeOwner)loading=false;});
 readyPromise.catch(()=>status("No pude cargar la memoria. Recargá la página antes de guardar."));
 renderApp();
}
async function hydrate(current,epoch){
 const data=await Promise.all(Object.keys(api.collections).map(key=>api.collection(current,key)));
 const values=await Promise.all(Object.entries(settings).map(([key,[,fallback]])=>store.get(api.scopeKey(current,key),fallback)));
 const rows=await store.queryRecords({type:"memories",owner:current,limit:Infinity});
 if(current!==owner()||epoch!==generation)return;
 for(let i=0;i<data.length;i++){
  const key=Object.keys(api.collections)[i];versions.set(api.scopeKey(current,key),data[i].version);
  state[api.collections[key][0]]=data[i].items;
 }
 for(let i=0;i<values.length;i++){
  const key=Object.keys(settings)[i];settingValues.set(api.scopeKey(current,key),values[i]);state[settings[key][0]]=values[i];
 }
 if(byId("tasksSheetUrl"))byId("tasksSheetUrl").value=state.tasksSheetUrl;
 if(byId("tasksSheetGid"))byId("tasksSheetGid").value=state.tasksSheetGid;
 state.memories=rows.map(row=>({...row.data,id:row.id,owner:row.owner,person:row.owner,at:row.timestamp,language:row.language,source:row.source}));
 renderApp();await render();root.dispatchEvent(new CustomEvent("robotito:memoryscopeready",{detail:{owner:current}}));
}
async function init(options){
 state=options.state;renderApp=options.refresh||(()=>{});resetIdentity=options.resetIdentity||(()=>{});
 await api.migrate();
 for(const property of ["currentPerson","currentVoicePerson","lastVoiceConfirmedAt"]){
  let value=state[property];Object.defineProperty(state,property,{configurable:true,enumerable:true,
   get:()=>value,set:next=>{if(value===next)return;value=next;
    if(activeOwner===session&&computedOwner()===session&&property!=="lastVoiceConfirmedAt")session="session:"+crypto.randomUUID();
    changed();}});
 }
 changed();await readyPromise;attach();root.ROBOTITO_MEMORY.active=true;initializedResolve();
 root.addEventListener("robotito:languagechange",render);
 let timer;
 root.addEventListener("robotito:memorychange",()=>{clearTimeout(timer);timer=setTimeout(()=>{if(byId("tab-memory")?.classList.contains("active"))render().catch(()=>{});},80);});
 return true;
}
function persist(key,value){
 if(settings[key]){
  const scoped=api.scopeKey(owner(),key);settingValues.set(scoped,structuredClone(value));
  const job=store.set(scoped,value).catch(()=>status("No pude cargar la memoria. Recargá la página antes de guardar."));
  queues.set(scoped,job);job.finally(()=>{if(queues.get(scoped)===job)queues.delete(scoped);});return true;
 }
 if(!api.collections[key])return false;
 const current=owner(),scoped=api.scopeKey(current,key),snapshot=structuredClone(value),epoch=generation;
 // IDs are assigned before queuing so subsequent edits address the same rows.
 snapshot.forEach((row,i)=>{row.memoryRecordId ||= "scoped:"+crypto.randomUUID();if(value[i])value[i].memoryRecordId=row.memoryRecordId;});
 const previous=queues.get(scoped)||Promise.resolve();
 const job=previous.catch(()=>{}).then(async()=>{
  await readyPromise;
  if(current!==owner()||epoch!==generation)throw Error("Owner changed before save");
  const result=await api.saveCollection(current,key,snapshot,versions.get(scoped)||0);
  versions.set(scoped,result.version);
 }).catch(async error=>{
  console.warn("Scoped memory save",error);status("No se guardó el cambio: la memoria cambió en otra pestaña. Recargá y revisá los datos.");
  if(current===owner()){const saved=await api.collection(current,key);versions.set(scoped,saved.version);state[api.collections[key][0]]=saved.items;renderApp();}
 });
 queues.set(scoped,job);job.finally(()=>{if(queues.get(scoped)===job)queues.delete(scoped);});return true;
}
async function remember(value,{source="manual",type="memories"}={}){
 const content=String(value||"").trim();if(!content)return null;
 const current=owner();await readyPromise;if(current!==owner())throw Error("Owner changed before saving memory");
 if(!["memories","preferences","relationships"].includes(type))throw Error("Invalid memory category");
 const last=state.memories.at(-1);
 if(source==="speech"&&last?.text?.toLowerCase()===content.toLowerCase()&&Date.now()-last.at<15000)return null;
 const row=type==="memories"&&!store.isEphemeral(current)
  ?(await store.appendMemory({owner:current,person:current,text:content,source,language:state.languageMode||"es"})).record
  :await store.putRecord({type,owner:current,source,language:state.languageMode||"es",data:{text:content,person:current}});
 if(current===owner()){
  if(type==="memories")state.memories.push({...row.data,id:row.id,owner:current,at:row.timestamp,language:row.language,source});
  await render();status(store.isEphemeral(current)?"Recuerdo disponible solo en esta sesión temporal.":"Recuerdo guardado en este historial.");
 }
 return row;
}
async function render(){
 if(!state)return;
 const current=owner(),epoch=generation,requested=viewLegacy?"legacy:unassigned":current;
 label(byId("memoryOwner"),viewLegacy?"Archivo anterior sin atribuir (solo lectura)":store.isEphemeral(current)?"Sesión temporal: se descarta al recargar o cambiar de visitante.":current.startsWith("visitor:")?"Visitante con consentimiento: historial pseudónimo, identidad sin confirmar.":"Historial de {name}",{name:current});
 const type=byId("memoryType")?.value||"memories",rootList=byId("memoryList");if(!rootList)return;
 const rows=(await store.queryRecords({owner:requested,type,limit:Infinity})).filter(row=>!["class-recorder-draft","class-recorder-part"].includes(row.source));
 if(current!==owner()||epoch!==generation||requested!==(viewLegacy?"legacy:unassigned":owner()))return;
 rootList.replaceChildren();
 if(!rows.length){const empty=document.createElement("p");label(empty,"No hay registros en este historial y categoría.");rootList.append(empty);}
 for(const row of rows.slice(0,200)){
  const element=document.createElement("div");element.className="memory-row";element.dataset.recordId=row.id;
  const date=document.createElement("span");date.className="muted";date.textContent=new Date(row.timestamp).toLocaleString(root.ROBOTITO_I18N?.locale?.(state.languageMode)||"es-UY");
  const content=document.createElement("p");content.lang=row.language||"und";content.translate=false;
  content.textContent=row.data?.text||row.data?.title||row.data?.summary||row.data?.task||row.data?.name||JSON.stringify(row.data);
  element.append(date,content);
  if(!viewLegacy&&["memories","preferences","relationships","conversations"].includes(type)){
   const edit=document.createElement("button"),remove=document.createElement("button");edit.type=remove.type="button";edit.className="ghost";remove.className="ghost danger";
   label(edit,"Corregir recuerdo");label(remove,"Eliminar este recuerdo");
   edit.onclick=async()=>{
    const value=root.prompt(text("Corregí el texto del recuerdo:"),content.textContent);if(value===null||!value.trim())return;
    try{if(owner()!==current)throw Error("Owner changed");
     if(type==="memories"&&!store.isEphemeral(current))await store.updateOwnedMemory({id:row.id,owner:current,expectedVersion:row.version,text:value.trim()});
     else await store.editRecord(row.id,{owner:current,expectedVersion:row.version,data:{...row.data,text:value.trim()}});
     await hydrate(current,generation);status("Recuerdo corregido.");}
    catch{status("No se guardó el cambio: la memoria cambió en otra pestaña. Recargá y revisá los datos.");await render();}
   };
   remove.onclick=async()=>{
    if(!root.confirm(text("¿Eliminar este recuerdo del historial activo?")))return;
    try{if(owner()!==current)throw Error("Owner changed");
     if(type==="memories"&&!store.isEphemeral(current))await store.deleteOwnedMemory({id:row.id,owner:current,expectedVersion:row.version});
     else await store.editRecord(row.id,{owner:current,expectedVersion:row.version,remove:true});
     await hydrate(current,generation);status("Recuerdo eliminado.");}
    catch{status("No se guardó el cambio: la memoria cambió en otra pestaña. Recargá y revisá los datos.");}
   };
   const actions=document.createElement("div");actions.className="actions p07-memory-actions";actions.append(edit,remove);element.append(actions);
  }
  rootList.append(element);
 }
 if(rows.length>200){const count=document.createElement("p");label(count,"Mostrando 200 de {count} registros. La búsqueda y el respaldo incluyen todos.",{count:rows.length});rootList.append(count);}
}
async function newSession(){
 const old=session;session="session:"+crypto.randomUUID();visitor=null;resetIdentity();changed();
 await api.deleteOwner(old,{confirmation:"BORRAR"});await readyPromise;
}
async function deleteCurrent(){
 const current=owner();
 if(!root.confirm(text("Se borrarán los recuerdos, clases, libros, tareas y archivos del historial activo. Los demás historiales se conservan.")))return;
 if(root.prompt(text("Escribí BORRAR para eliminar este historial."))!=="BORRAR")return;
 await api.deleteOwner(current,{confirmation:"BORRAR"});
 root.ROBOTITO_TYPED_CHAT?.clearOwner?.(current);
 if(visitor?.id===current)visitor=null;
 if(owner()!==activeOwner){changed();await readyPromise;}else{generation++;await hydrate(owner(),generation);}
 status("Historial eliminado. Las copias descargadas deben borrarse por separado.");
}
async function clearMemories(){
 if(!root.confirm(text("¿Borrar los recuerdos de este historial? Los demás historiales se conservan.")))return;
 const current=owner();
 if(store.isEphemeral(current))await store.clearRecordsByType("memories",{owner:current});
 else await store.clearOwnedMemories(current);
 await hydrate(current,generation);
}
function attach(){
 byId("deleteMemoryHistory")?.addEventListener("click",()=>deleteCurrent().catch(()=>status("No pude cargar la memoria. Recargá la página antes de guardar.")));
 byId("copyVisitorMemoryKey")?.addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText(byId("visitorMemoryKey").value);status("Clave copiada. Guardala en privado.");}
  catch{byId("visitorMemoryKey").type="text";byId("visitorMemoryKey").select();status("Copiá la clave y guardala en privado.");}
 });
 byId("memoryType")?.addEventListener("change",render);
 byId("memoryLegacy")?.addEventListener("change",event=>{viewLegacy=event.target.checked;render();});
 byId("newMemorySession")?.addEventListener("click",()=>newSession().catch(()=>status("No pude cambiar de sesión.")));
 byId("createVisitorMemory")?.addEventListener("click",async()=>{
  try{
   if(state.currentPerson||state.currentVoicePerson)throw Error("Known profile active");
   visitor=await api.createVisitor({consent:byId("visitorMemoryConsent")?.checked===true});
   byId("visitorMemoryKey").value=visitor.token;changed();await readyPromise;
   status("Guardá esta clave en privado. Permite retomar el historial; no confirma quién sos. Los recuerdos temporales anteriores no se transfieren.");
  }catch{status("Confirmá el consentimiento y usá una sesión sin perfil identificado.");}
 });
 byId("resumeVisitorMemory")?.addEventListener("click",async()=>{
  try{
   if(state.currentPerson||state.currentVoicePerson)throw Error("Known profile active");
   visitor=await api.resumeVisitor(byId("visitorMemoryKey").value);changed();await readyPromise;
   status("Historial de visitante abierto por clave, sin confirmar identidad.");
  }catch{status("No se pudo abrir: clave inválida, consentimiento revocado o historial vinculado.");}
 });
 byId("linkVisitorMemory")?.addEventListener("click",async()=>{
  const token=byId("visitorMemoryKey").value,target=byId("visitorLinkTarget").value.trim();
  try{
   const review=await api.previewLink(token,target);
   const confirmation=root.prompt(text("Vincular {count} registros a {name}. Es una vinculación voluntaria, no una identidad confirmada. Escribí el nombre para confirmar.",{count:review.count,name:target}));
   if(confirmation===null)return;
   await api.linkVisitor({token,target,confirmation,revision:review.revision});visitor=null;changed();
   status("Historial vinculado. Conservá la clave para poder deshacer la vinculación.");
  }catch{status("No se vinculó el historial. Revisá la clave, el perfil y los cambios recientes.");}
 });
 byId("undoVisitorMemory")?.addEventListener("click",async()=>{
  try{
   const token=byId("visitorMemoryKey").value,id=String(token).split("/")[0],row=await store.getRecord(id);
   if(root.prompt(text("Escribí DESVINCULAR para devolver los registros al visitante."))!=="DESVINCULAR")return;
   await api.undoLink({id:row?.data?.linkId,token,confirmation:"DESVINCULAR"});await hydrate(owner(),generation);status("Vinculación deshecha. No se recuperan registros que hayas eliminado.");
  }catch{status("No se pudo deshacer la vinculación. Revisá la clave y el estado del historial.");}
 });
}
root.ROBOTITO_MEMORY={active:false,init,owner,ready:async()=>{await initialized;owner();await readyPromise;},persist,remember,render,newSession,deleteCurrent,clearMemories,
 hasSetting:key=>Object.hasOwn(settings,key),load:(key,fallback)=>settingValues.get(api.scopeKey(owner(),key))??fallback,
 flush:async()=>{if(state?.classMode||root.ROBOTITO_CLASS_AUDIO?.isBusy?.())throw Error("Finish the active recording before backing up");await initialized;await readyPromise;await Promise.all([...queues.values()]);await root.ROBOTITO_MEMORY_MODULES?.flush?.();await store.flush();},
 offerLink:name=>{if(byId("visitorLinkTarget"))byId("visitorLinkTarget").value=name;status("El perfil se registró. Podés revisar y vincular un historial de visitante desde Memoria.");}};
})(window);
