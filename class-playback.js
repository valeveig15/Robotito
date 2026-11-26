// Date resolution is shared with memories. Playback requires the central
// planner's explicit permission and the current owner's actual local file.
(function(root){
"use strict";
const fold=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const grammar=new Set(("robotito osito por favor please bitte pouvez pouvez-vous peux tu can could you puedes podes podrias pode puoi kannst du reproduci reproducir reproduce pon pone poneme play reproduza reproduzir joue ecouter fais riproduci ascolta spiele spiel abspielen ab " +
 "la el las los mi mis una un de del sobre about on sur su uber ayer anteayer hoy hace semana pasada semanas dias ultima vez anterior " +
 "the my a an of from on yesterday today before last week weeks days ago previous time s " +
 "o os as minha um uma da do ontem anteontem hoje ha passada ultima " +
 "le les mon ma mes un une du des hier avant aujourd hui il y a semaine derniere fois precedent " +
 "il lo gli i mia mie di ieri oggi altro fa settimana scorsa ultima volta precedente " +
 "die der das meine mein vom von gestern vorgestern heute vor einer einem woche letzte letztes mal vorherige " +
 "clase clases class classes lecture aula cours lezione unterricht grabacion grabaciones recording recordings gravacao enregistrement registrazione aufnahme audio " +
 "lunes martes miercoles jueves viernes sabado domingo monday tuesday wednesday thursday friday saturday sunday segunda terca quarta quinta sexta dimanche lundi mardi mercredi jeudi vendredi samedi lunedi martedi mercoledi giovedi venerdi sabato domenica montag dienstag mittwoch donnerstag freitag samstag sonntag").split(/\s+/));
function select(raw,rows,{now=new Date(),language="es",owner}={}){
 const time=root.ROBOTITO_TEMPORAL.resolve(raw,{now,language});
 if(time?.kind==="invalid")return {rows:[],reason:"invalid-date"};
 const words=(fold(raw).match(/[\p{L}]+/gu)||[]).filter(word=>word.length>1&&!grammar.has(word));
 let found=rows.filter(row=>row.owner===owner&&Number.isFinite(row.startedAt)&&row.startedAt<=now.getTime()&&
  (time?.start==null||row.startedAt>=time.start&&row.startedAt<time.end)&&
  words.every(word=>fold([row.subject,row.topic].join(" ")).split(/[^\p{L}]+/u).includes(word)));
 found.sort((a,b)=>b.startedAt-a.startedAt||String(a.id).localeCompare(String(b.id)));
 if(time?.precision==="context")found=found.slice(0,1);
 return {rows:found,time};
}
async function handle(raw,{plan,owner,language="es"}={}){
 if(plan?.intent!=="class-playback"||!plan.shouldExecute||!plan.mayReadClass||plan.needsClarification||plan.negative)return {handled:false};
 const text=source=>root.ROBOTITO_I18N.text(source,language),api=root.ROBOTITO_CLASS_AUDIO;
 const result=source=>({handled:true,text:text(source)});
 if(state.classMode||document.hidden)return result("Terminá la clase y mantené esta página visible para reproducir una grabación.");
 const all=await api.listRecordings();
 if(owner!==root.ROBOTITO_MEMORY.owner())return {handled:true};
 const found=select(raw,all,{owner,language});
 if(!found.rows.length)return result("No encontré una grabación guardada para esa fecha y materia.");
 if(found.rows.length>1)return result("Encontré varias grabaciones. Indicá la materia o el tema, o elegí una en Clase.");
 const record=found.rows[0];
 if(!(record.blob instanceof Blob)||!record.blob.size)return result("El registro existe, pero falta el archivo de audio.");
 await api.render();
 if(owner!==root.ROBOTITO_MEMORY.owner()||state.classMode||document.hidden)return {handled:true};
 document.querySelector('[data-tab="class"]')?.click();
 const row=[...document.querySelectorAll("[data-recording-id]")].find(node=>node.dataset.recordingId===record.id),player=row?.querySelector("audio");
 if(!player)return result("No pude reproducir el audio. Abrí Clase y usá el control de reproducción.");
 row.scrollIntoView({block:"nearest"});
 try{
  await player.play();
  if(owner!==root.ROBOTITO_MEMORY.owner()||state.classMode||document.hidden){player.pause();return {handled:true};}
  if(player.paused)throw Error("Playback did not start");
  return {handled:true,playing:true};
 }catch{return result("No pude reproducir el audio. Abrí Clase y usá el control de reproducción.");}
}
root.ROBOTITO_CLASS_PLAYBACK={select,handle};
if(typeof module!=="undefined"&&module.exports)module.exports={select};
})(typeof window!=="undefined"?window:globalThis);
