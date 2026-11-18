// Offline-first reading circle planner and personal rating journal.
(function(root){
"use strict";
const policy=root.ROBOTITO_READING_POLICY,store=root.ROBOTITO_STORE;
let services=null,activeOwner="",data={clubs:[],ratings:[],lastDraw:""},epoch=0,write=Promise.resolve();
const $=id=>document.getElementById(id);
const safe=s=>String(s??"").trim().slice(0,300);
const key=owner=>"memory-scope:"+encodeURIComponent(owner)+":robotito.readingCircles.v1";
const empty=()=>({clubs:[],ratings:[],lastDraw:""});
function message(text){const el=$("readingStatus");if(el)el.textContent=text;}
function readOwner(){return services?.owner?.()||"";}
async function load(){
 const owner=readOwner(),token=++epoch;
 activeOwner=owner;data=empty();render();
 if(!owner)return;
 try{
  const value=await store.get(key(owner),empty());
  if(token!==epoch||owner!==readOwner())return;
  data={clubs:Array.isArray(value?.clubs)?value.clubs.slice(0,policy.MAX_CLUBS):[],
   ratings:Array.isArray(value?.ratings)?value.ratings.slice(-policy.MAX_RATINGS):[],
   lastDraw:safe(value?.lastDraw)};
  render();
 }catch(error){message("No se pudo cargar el diario. No se modificó su contenido.");}
}
async function commit(next){
 const owner=readOwner(),token=epoch;
 if(!owner||owner!==activeOwner)throw Error("Profile changed");
 const copy=structuredClone(next);
 const task=write.catch(()=>{}).then(async()=>{
  if(owner!==readOwner()||token!==epoch)throw Error("Profile changed");
  await store.set(key(owner),copy);
  if(owner!==readOwner()||token!==epoch)throw Error("Profile changed");
  data=copy;render();
 });
 write=task;return task;
}
function node(tag,text,cls){
 const e=document.createElement(tag);if(text!==undefined)e.textContent=text;
 if(cls)e.className=cls;return e;
}
function render(){
 const list=$("readingCirclesList"),ratings=$("readingRatingsList");
 if(list){
  list.replaceChildren();
  if(!data.clubs.length)list.append(node("p","Todavía no creaste un club de lectura local.","muted"));
  for(const club of data.clubs){
   const section=node("article",undefined,"reading-club");
   const name=node("strong",club.name),book=node("p","📖 "+club.book);
   const when=node("p",club.meeting?"Próxima reunión: "+club.meeting:"Sin fecha de reunión");
   const notes=node("p",club.notes||"Sin notas"),remove=node("button","Eliminar club");
   remove.type="button";remove.addEventListener("click",()=>{if(root.confirm("¿Eliminar este club local?"))void commit({...data,clubs:data.clubs.filter(c=>c.id!==club.id)}).catch(()=>message("No se pudo guardar el cambio."));});
   section.append(name,book,when,notes,remove);list.append(section);
  }
 }
 if(ratings){
  ratings.replaceChildren();
  for(const entry of data.ratings.slice(-12).reverse()){
   const mean=(policy.aspects.reduce((sum,key)=>sum+entry.values[key],0)/5).toFixed(1);
   ratings.append(node("p",entry.book+" · "+mean+"/5 (trama, personajes, mundo, escritura y ritmo)"));
  }
 }
}
function extractClubs(){
 const name=safe($("clubName")?.value),book=safe($("clubBook")?.value);
 if(!name||!book)throw Error("Ingresá el nombre del club y el libro.");
 if(data.clubs.length>=policy.MAX_CLUBS)throw Error("Se alcanzó el límite de clubes locales.");
 const meeting=$("clubMeeting")?.value||"";
 return [...data.clubs,{id:"club:"+crypto.randomUUID(),name,book,
  meeting,notes:safe($("clubNotes")?.value),updatedAt:Date.now()}];
}
function exportClubs(){
 if(!readOwner())return;
 const payload={format:"robotito-reading-circle",version:1,createdAt:new Date().toISOString(),
  clubs:data.clubs};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="robotito-clubes-lectura.json";a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 message("Archivo de clubes preparado. Compartilo solamente con quienes elijas.");
}
async function importClubs(file){
 if(!file||file.size>512000)throw Error("Archivo demasiado grande.");
 const owner=readOwner(),snapshot=await file.text();
 if(owner!==readOwner())throw Error("Cambió el perfil.");
 const imported=policy.validateExport(JSON.parse(snapshot));
 if(!root.confirm("¿Importar "+imported.length+" clubes? Solo se guardarán en este perfil local."))return;
 const map=new Map(data.clubs.map(c=>[c.id,c]));
 for(const item of imported)map.set(item.id,item);
 const merged=[...map.values()];
 if(merged.length>policy.MAX_CLUBS)throw Error("Demasiados clubes.");
 await commit({...data,clubs:merged});
 message("Clubes importados correctamente.");
}
function init(options){
 services=options;
 $("readingCircleForm")?.addEventListener("submit",event=>{
  event.preventDefault();
  try{void commit({...data,clubs:extractClubs()}).then(()=>message("Club local guardado.")).catch(()=>message("No se pudo guardar."));}
  catch(e){message(e.message);}
 });
 $("readingRatingForm")?.addEventListener("submit",event=>{
  event.preventDefault();
  try{
   const book=safe($("readingRatingTitle").value);if(!book)throw Error("Indicá el libro.");
   const values=policy.validateRating(Object.fromEntries(policy.aspects.map(aspect=>[aspect,$("rating-"+aspect).value])));
   const ratings=[...data.ratings,{id:"rating:"+crypto.randomUUID(),book,values,at:Date.now()}].slice(-policy.MAX_RATINGS);
   void commit({...data,ratings}).then(()=>message("Valoración por aspectos guardada.")).catch(()=>message("No se pudo guardar."));
  }catch(e){message(e.message);}
 });
 $("readingDrawBtn")?.addEventListener("click",()=>{
  const book=policy.draw(services.getBooks(),{excludeLast:data.lastDraw});
  if(!book){message("No hay libros pendientes para sortear.");return;}
  const title=safe(book.Title||book.title);
  $("readingDrawResult").textContent="🎲 Próxima lectura: "+title;
  void commit({...data,lastDraw:title}).catch(()=>message("No se pudo guardar el sorteo."));
 });
 $("readingJokeBtn")?.addEventListener("click",()=>{
  $("readingDrawResult").textContent="📚 Ese libro abandonado está juntando polvo… ¡pero todavía te guarda el lugar!";
 });
 $("readingExportClubs")?.addEventListener("click",exportClubs);
 $("readingImportClubs")?.addEventListener("change",event=>{
  const file=event.target.files?.[0];if(!file)return;
  void importClubs(file).catch(error=>message(error.message));event.target.value="";
 });
 root.addEventListener("robotito:memoryscopechange",()=>{activeOwner="";data=empty();epoch++;render();});
 root.addEventListener("robotito:memoryscopeready",()=>void load());
 void load();
}
root.ROBOTITO_READING_UI={init,load,render};
})(window);
