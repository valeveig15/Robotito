// Shared typed retrieval. Filters owner/type/date first, then textual relevance;
// never fabricates a remembered fact when storage is empty.
(function(root){
"use strict";
const choices=[
 {type:"conversations",terms:/\b(?:que dije|que dijiste|que hablamos|que conversamos|lo que dijimos|what did i say|what did we talk|said yesterday|conversacion|conversation|falamos|falei)\b/i},
 {type:"recommendations",terms:/\b(?:libro|libros|book|books|livro|livros|livre|buch)\b/i},
 {type:"tasks",terms:/\b(?:tarea|tareas|task|tasks|tarefa|deberes|devoirs|compiti|aufgaben)\b/i},
 {type:"classes",terms:/\b(?:clase|class|lecture|aula|cours|lezione|unterricht)\b/i},
 {type:"birthdays",terms:/\b(?:cumpleanos|cumpleaños|birthday|aniversario|anniversaire|compleanno|geburtstag)\b/i},
 {type:"people",terms:/\b(?:persona|person|pessoa|personne|personen)\b/i},
 {type:"memories",terms:/\b(?:recuerdo|recordas|recordás|acordas|remember|memory|memoria|souvenir|ricordo|erinnerung)\b/i}
];
function fold(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function intent(raw){
 const q=fold(raw);
 const retrieve=/\b(?:record(?:ame|as|a)|acord(?:as|ate)|me recomendaste|recomendaste|recomendou|remember|remind|show me|mostrame|muestrame|busca|buscar|recall|what did|que dije|que te dije|ultima vez|last time)\b/.test(q);
 if(!retrieve||/\b(?:que significa|significado|definime|definition of)\b/.test(q))return null;
 const type=choices.find(choice=>choice.terms.test(q))?.type||"memories";
 return {type,search:q};
}
async function search(raw,{owner="local",language="es",now=new Date(),limit=8}={}){
 const found=intent(raw),store=root.ROBOTITO_STORE,clock=root.ROBOTITO_TEMPORAL;
 if(!found||!store?.queryRecords)return {handled:false,rows:[]};
 const time=clock?.resolve?.(raw,{now,language});
 const options={type:found.type,owner,limit:Math.max(1,Math.min(20,limit))};
 if(time?.start!==null&&time?.start!==undefined){options.after=time.start;options.before=time.end;}
 options.limit=100;
 const rows=(await store.queryRecords(options)).filter(row=>{
  // The active question is often recorded by autoRemember before retrieval.
  // Exclude it so Robotito cannot "remember" the question as its own answer.
  const utterance=fold(row.data?.text||"").trim();
  return !utterance||utterance!==fold(raw).trim();
 });
 let selected=rows;
 const words=found.search.replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(x=>x.length>=6&&!/record|recomend|clase|libro|recuerd|tarea|semana|pasada|before|about|after/.test(x));
 if(words.length){
  const rated=rows.map(row=>{
   const text=fold(JSON.stringify(row.data||{})+" "+row.topic+" "+row.subject);
   return {row,score:words.reduce((sum,word)=>sum+(text.includes(word)?1:0),0)};
  }).sort((a,b)=>b.score-a.score||b.row.timestamp-a.row.timestamp);
  // A topic constraint requires matching evidence; broad recall has no such constraint.
  const topicConstrained=/\b(?:sobre|about|acerca de|regarding|relacionado con)\b/.test(found.search);
  if(rated[0]?.score)selected=rated.filter(x=>x.score>0).map(x=>x.row);
  else if(topicConstrained)selected=[];
 }
 selected=selected.slice(0,Math.max(1,Math.min(20,limit)));
 const first=selected[0];
 const data=first?.data||{};
 const summary=data.title||data.text||data.description||data.name||data.task||
   (typeof data==="string"?data:"");
 const notFound={
  es:"No encontré un recuerdo guardado que corresponda a esa consulta.",
  en:"I couldn't find a matching saved memory.",
  pt:"Não encontrei uma lembrança salva correspondente.",
  fr:"Je n'ai pas trouvé de souvenir enregistré correspondant.",
  it:"Non ho trovato un ricordo salvato corrispondente.",
  de:"Ich habe keine passende gespeicherte Erinnerung gefunden."
 };
 return {handled:true,rows:selected,time,type:found.type,
  text:first?(summary?String(summary).slice(0,650):"Encontré el registro, pero no tiene texto resumible."):(notFound[language]||notFound.es)};
}
root.ROBOTITO_MEMORY_RETRIEVAL={intent,search};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_MEMORY_RETRIEVAL;
})(typeof window!=="undefined"?window:globalThis);