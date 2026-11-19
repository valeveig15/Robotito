// P79–P82. Offline educational games and voluntary local team progress.
(function(root){
"use strict";
const P=root.ROBOTITO_LEARNING_POLICY,S=root.ROBOTITO_STORE,$=id=>document.getElementById(id);
let owner="",generation=0,model={decks:[],history:[],members:[],theme:"normal"},queue=Promise.resolve(),active=null,revealed=false,seenTarget="";
const fresh=()=>({decks:[],history:[],members:[],theme:"normal"});
const current=()=>root.ROBOTITO_MEMORY?.owner?.()||null;
const key=id=>"memory-scope:"+encodeURIComponent(id)+":robotito.learning.v1";
const status=msg=>{const target=$("learningStatus");if(target)target.textContent=msg};
function add(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el}
function load(){
 const who=current(),token=++generation;owner=who;model=fresh();active=null;render();
 if(!who)return;
 void S.get(key(who),null).then(value=>{
  if(token!==generation||who!==current())return;
  model={decks:Array.isArray(value?.decks)?value.decks.slice(-24):[],history:Array.isArray(value?.history)?value.history.slice(-1200):[],members:Array.isArray(value?.members)?value.members.slice(0,30):[],theme:P.season(value?.theme)};
  render();
 }).catch(()=>status("No pude cargar estos materiales. No se modificaron tus archivos."));
}
function save(next){
 const who=current(),token=generation;
 if(!who||owner!==who)return Promise.reject(Error("El perfil cambió"));
 const snapshot=structuredClone(next);
 const job=queue.catch(()=>{}).then(async()=>{
  if(token!==generation||who!==current())throw Error("El perfil cambió");
  await S.set(key(who),snapshot);
  if(token!==generation||who!==current())throw Error("El perfil cambió");
  model=snapshot;render();
 });
 queue=job;return job;
}
function deck(){
 return model.decks.find(x=>x.id===$("learningDeck")?.value)||model.decks[0]||null;
}
function chooseItem(){
 const selected=deck();
 if(!selected?.items?.length)return null;
 const history=model.history.filter(x=>x.deckId===selected.id);
 return P.nextItem(selected.items,history);
}
function renderGame(){
 const holder=$("learningGame");if(!holder)return;holder.replaceChildren();
 const selected=deck(),item=chooseItem();
 if(!selected||!item){holder.append(add("p","Guardá apuntes en formato «Concepto: explicación», una pareja por línea, para empezar.", "muted"));return;}
 const history=model.history.filter(x=>x.deckId===selected.id);
 holder.append(add("p","Nivel actual: "+P.nextDifficulty(history)+" · "+history.length+" respuestas registradas", "muted"));
 holder.append(add("h3",item.question));
 const correct=add("p","Respuesta del material: "+item.answer);correct.hidden=!revealed;correct.className="learning-answer";
 const style=$("learningMode")?.value||"game";
 if(style==="exam"){
  const input=add("input");input.placeholder="Escribí la respuesta exacta";input.setAttribute("aria-label","Tu respuesta");input.maxLength=500;
  const check=add("button","Corregir respuesta");
  check.type="button";check.onclick=()=>recordAnswer(item,P.grade(item.answer,input.value),input.value);
  holder.append(input,check,correct);
 }else{
  const options=P.choices(selected.items,item,history.length);
  const area=add("div",undefined,"learning-choices");
  for(const option of options){
   const button=add("button",option.label);button.type="button";
   button.onclick=()=>recordAnswer(item,option.id===item.id,option.label);
   area.append(button);
  }
  holder.append(area,correct);
 }
 const reveal=add("button","Ver respuesta del apunte");reveal.type="button";reveal.onclick=()=>{revealed=true;correct.hidden=false;};
 holder.append(reveal);
}
function recordAnswer(item,correct,given){
 const selected=deck();if(!selected||!item)return;
 const record={deckId:selected.id,id:item.id,correct:!!correct,at:Date.now()};
 const history=[...model.history,record].slice(-1200);
 revealed=false;
 void save({...model,history}).then(()=>status(correct?"Respuesta correcta según el apunte guardado.":"Respuesta a repasar. Solución original: "+item.answer))
   .catch(()=>status("No se pudo registrar el resultado."));
}
function renderDecks(){
 const select=$("learningDeck");if(!select)return;
 const chosen=select.value;select.replaceChildren();
 for(const entry of model.decks){const option=add("option",entry.subject+" · "+entry.topic+" ("+entry.items.length+")");option.value=entry.id;select.append(option)}
 if(model.decks.some(x=>x.id===chosen))select.value=chosen;
 const selected=deck(),remove=$("learningDeleteDeck");if(remove)remove.disabled=!selected;
 renderGame();
}
function renderTeam(){
 const place=$("learningTeamSummary");if(!place)return;
 place.replaceChildren();
 const stats=P.groupStats(model.members);
 const totals=add("p",stats.members.length+" integrantes · "+stats.minutes+" minutos registrados · "+stats.completed+" tareas finalizadas");
 place.append(totals);
 for(const entry of stats.members){
  const row=add("div",undefined,"learning-team-row");
  const label=add("span",entry.name+": "+entry.minutes+" min · "+entry.completed+" tareas");
  const bar=add("progress");bar.max=stats.maxMinutes;bar.value=entry.minutes;bar.setAttribute("aria-label","Minutos registrados de "+entry.name);
  const remove=add("button","Quitar");remove.type="button";remove.onclick=()=>{
   if(!root.confirm("¿Quitar este integrante de este registro local?"))return;
   void save({...model,members:model.members.filter(x=>x.name!==entry.name)}).catch(()=>status("No se pudo guardar."));
  };
  row.append(label,bar,remove);place.append(row);
 }
}
function renderTheme(){
 const theme=P.season(model.theme),world=$("world");if(world)world.dataset.festiveTheme=theme;
 if($("learningTheme"))$("learningTheme").value=theme;
}
function render(){renderDecks();renderTeam();renderTheme()}
function addMaterial(event){
 event.preventDefault();if(!current())return;
 const subject=P.clean($("learningSubject").value,90),topic=P.clean($("learningTopic").value,90),source=$("learningSource").value;
 const items=P.parseSource(source);
 if(!subject||!topic){status("Completá materia y tema.");return;}
 if(items.length<2){status("Se necesitan al menos dos pares «Concepto: explicación» distintos para jugar.");return;}
 if(model.decks.length>=24){status("Máximo 24 temas guardados por perfil.");return;}
 const entry={id:"deck:"+crypto.randomUUID(),subject,topic,items,source:source.slice(0,24000)};
 void save({...model,decks:[...model.decks,entry]}).then(()=>{revealed=false;$("learningSource").value="";$("learningDeck").value=entry.id;renderGame();status("Material guardado. Las preguntas proceden exclusivamente de tu texto.");})
  .catch(()=>status("No se pudo guardar el material."));
}
function addMember(event){
 event.preventDefault();if(!current())return;
 let member;try{member=P.sanitizeMember({name:$("learningMemberName").value,minutes:Number($("learningMemberMinutes").value),completed:Number($("learningMemberTasks").value)})}
 catch(e){status(e.message);return;}
 const members=model.members.filter(x=>x.name!==member.name);
 if(members.length>=30){status("Máximo 30 participantes locales.");return;}
 members.push(member);
 void save({...model,members}).then(()=>status("Registro local actualizado. No envía nada a otras personas."))
  .catch(()=>status("No se pudieron guardar los datos."));
}
function init(){
 if(!$("learningDesk"))return;
 $("learningMaterialForm")?.addEventListener("submit",addMaterial);
 $("learningTeamForm")?.addEventListener("submit",addMember);
 $("learningDeck")?.addEventListener("change",()=>{revealed=false;renderGame()});
 $("learningMode")?.addEventListener("change",()=>{revealed=false;renderGame()});
 $("learningDeleteDeck")?.addEventListener("click",()=>{
  const selected=deck();if(!selected||!root.confirm("¿Eliminar este material y su historial de preguntas?"))return;
  void save({...model,decks:model.decks.filter(x=>x.id!==selected.id),history:model.history.filter(x=>x.deckId!==selected.id)}).catch(()=>status("No se pudo borrar."));
 });
 $("learningTheme")?.addEventListener("change",e=>{
  const theme=P.season(e.target.value);
  void save({...model,theme}).catch(()=>status("No se pudo guardar la ambientación."));
 });
 root.addEventListener("robotito:memoryscopechange",load);
 root.addEventListener("robotito:memoryscopeready",load);
 load();
}
root.ROBOTITO_LEARNING_UI={init,load,get owner(){return owner},get history(){return model.history.slice()}};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window);
