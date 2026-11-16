// Shared typed retrieval. Filters owner/type/date first, then textual relevance;
// never fabricates a remembered fact when storage is empty.
(function(root){
"use strict";
const choices=[
 {type:"conversations",terms:/\b(?:que dije|que dijiste|que hablamos|que conversamos|lo que dijimos|que hablamos la ultima vez|what did i say|what did we talk|what we discussed yesterday|what we talked about yesterday|said yesterday|conversacion|conversation|falamos|falei|ce qu.on a dit|avons.nous dit|avons.nous parle|abbiamo detto|abbiamo parlato|habe ich gesagt|haben wir(?: \w+){0,3} (?:gesagt|besprochen))\b/i},
 {type:"books",terms:/\b(?:mis libros|mi biblioteca|my books|my library|meus livros|minha biblioteca|mes livres|ma bibliotheque|i miei libri|mia biblioteca|meine bucher|meine bibliothek)\b/i},
 {type:"recommendations",terms:/\b(?:libro|libros|book|books|livro|livros|livre|buch)\b/i},
 {type:"tasks",terms:/\b(?:tarea|tareas|task|tasks|tarefa|deberes|devoirs|compiti|aufgaben)\b/i},
 {type:"classes",terms:/\b(?:clase|class|lecture|aula|cours|lezione|unterricht)\b/i},
 {type:"birthdays",terms:/\b(?:cumpleanos|cumpleaños|birthday|aniversario|anniversaire|compleanno|geburtstag)\b/i},
 {type:"people",terms:/\b(?:persona|person|pessoa|personne|personen)\b/i},
 {type:"preferences",terms:/\b(?:preferencia|preferencias|preference|preferences|preferenze|vorlieben)\b/i},
 {type:"memories",terms:/\b(?:recuerdo|recordas|recordás|acordas|remember|memory|memoria|souvenir|ricordo|erinnerung)\b/i}
];
function fold(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function intent(raw){
 const q=fold(raw);
 const directed=/^(?:[¿?\s]*)(?:recordame|recuerdame|acordate|remember|remind|recall|lembre|lembra|rappelle(?:z)?(?:.moi)?|souviens.toi|ricorda(?:mi)?|erinnere(?: mich)?|lo de (?:ayer|anteayer|la semana pasada)|o de (?:ontem|anteontem)|ce qu.on a dit|quello di ieri|das von gestern)\b/.test(q);
 const retrieve=/\b(?:record(?:ame|as|a)|recuerd(?:ame|as)|que hablamos|que conversamos|o que (?:falei|falamos)|lembre|lembra|rappelle|rappellez|souviens|ricorda|ricordami|ricordi|erinnere|erinnerst|avons.nous (?:dit|parle)|abbiamo (?:detto|parlato)|habe ich gesagt|haben wir(?: \w+){0,3} (?:gesagt|besprochen)|acord(?:as|ate)|me recomendaste|recomendaste|recomendou|remember|remind|show me|mostrame|muestrame|busca|buscar|recall|what did|que dije|que te dije|ultima vez|last time|lo de ayer|lo de anteayer|lo de la semana pasada|what we discussed yesterday|what we talked about yesterday|o de ontem|o de anteontem|ce qu.on a dit hier|quello di ieri|das von gestern)\b/.test(q);
 if(!retrieve||/\b(?:que significa|significado|definime|definition of|what is|que es|o que e|c.est quoi|was ist|che cos.e|signifie|significa|bedeutet)\b/.test(q))return null;
 const category=choices.find(choice=>choice.terms.test(q));
 if(!directed&&!category&&/\b(?:show me|mostrame|muestrame|busca|buscar)\b/.test(q)&&!root.ROBOTITO_TEMPORAL?.resolve?.(q))return null;
 const type=category?.type||"memories";
 return {type,search:q,directed};
}
async function search(raw,{owner="local",language="es",now=new Date(),limit=8,plan=null}={}){
 // Lexical matches cannot override the central planner's source/negation policy.
 if(plan&&(plan.shouldExecute===false||plan.needsClarification||
   ["general","none","conversation"].includes(plan.source)))return {handled:false,rows:[]};
 const found=intent(raw),store=root.ROBOTITO_STORE,clock=root.ROBOTITO_TEMPORAL;
 if(!found||!store?.queryRecords)return {handled:false,rows:[]};
 if(plan&&found.type==="classes"&&plan.mayReadClass!==true)return {handled:false,rows:[]};
 const time=clock?.resolve?.(raw,{now,language});
 const options={type:found.type,owner,limit:Math.max(1,Math.min(20,limit))};
 if(time?.start!==null&&time?.start!==undefined){options.after=time.start;options.before=time.end-1;}
 options.limit=Infinity;
 const rows=(await store.queryRecords(options)).filter(row=>{
  // Defense in depth: never trust a storage adapter to isolate people by itself.
  if(!row||row.owner!==owner||row.type!==found.type)return false;
  if(time?.kind==="invalid"||row.timestamp>now.getTime())return false;
  if(options.after!==undefined&&(row.timestamp<options.after||row.timestamp>options.before))return false;
  // The active question is often recorded by autoRemember before retrieval.
  // Exclude it so Robotito cannot "remember" the question as its own answer.
  const utterance=fold(row.data?.text||"").trim();
  // A previously recorded recall request is not evidence of an event.
  // Exclude it even when the same question is now asked in another language.
  return !utterance||(utterance!==fold(raw).trim()&&!intent(utterance));
 });
 let selected=rows.sort((a,b)=>b.timestamp-a.timestamp||String(a.id).localeCompare(String(b.id)));
 // A supplied topic is a constraint even when it is short ("ADN", "sol").
 const topic=found.search.match(/\b(?:sobre|acerca de|regarding|relacionado con|sur|su|uber)\s+(.+)/)?.[1]
  ||found.search.match(/\babout\s+(?!yesterday|last time|me\b)(.+)/)?.[1];
 const words=(topic||found.search).replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(x=>
  x.length>=(topic?2:6)&&!(/record|recomend|clase|libro|recuerd|tarea|semana|pasada|before|about|after/.test(x)));
 if(words.length){
  const rated=rows.map(row=>{
   const text=fold(JSON.stringify(row.data||{})+" "+row.topic+" "+row.subject);
   const tokens=new Set(text.split(/[^\p{L}\p{N}]+/u));
   return {row,score:words.reduce((sum,word)=>sum+(tokens.has(word)?1:0),0)};
  }).sort((a,b)=>b.score-a.score||b.row.timestamp-a.row.timestamp);
  // A topic constraint requires matching evidence; broad recall has no such constraint.
  const topicConstrained=Boolean(topic);
  if(rated[0]?.score)selected=rated.filter(x=>x.score>0).map(x=>x.row);
  else if(topicConstrained)selected=[];
 }
 selected=selected.slice(0,time?.precision==="context"?1:Math.max(1,Math.min(20,limit)));
 const first=selected[0];
 const data=first?.data||{};
 const summary=data.title||data.text||data.description||data.name||data.task||
   (typeof data==="string"?data:"");
 const noText={es:"Encontré el registro, pero no tiene texto resumible.",en:"I found the record, but it has no text to summarize.",pt:"Encontrei o registro, mas não tem texto para resumir.",fr:"J’ai trouvé l’entrée, mais elle n’a pas de texte à résumer.",it:"Ho trovato il record, ma non ha testo da riassumere.",de:"Der Eintrag enthält keinen Text zum Zusammenfassen."};
 const notFound={
  es:"No encontré un recuerdo guardado que corresponda a esa consulta.",
  en:"I couldn't find a matching saved memory.",
  pt:"Não encontrei uma lembrança salva correspondente.",
  fr:"Je n'ai pas trouvé de souvenir enregistré correspondant.",
  it:"Non ho trovato un ricordo salvato corrispondente.",
  de:"Ich habe keine passende gespeicherte Erinnerung gefunden."
 };
 return {handled:true,rows:selected,time,type:found.type,
  text:first?(summary?String(summary).slice(0,650):(noText[language]||noText.es)):(notFound[language]||notFound.es)};
}
root.ROBOTITO_MEMORY_RETRIEVAL={intent,search};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_MEMORY_RETRIEVAL;
})(typeof window!=="undefined"?window:globalThis);
