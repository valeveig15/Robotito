// Structured memory retrieval shared by typed and spoken requests.
// No browsing or model-generated claims; responses cite only stored local data.
(function(root){
"use strict";
function normalize(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();}
function requestType(text){
 const q=normalize(text);
 if(/\b(?:dije|dijiste|hablamos|conversacion|conversaciones|said|conversation|we talked|falei|falamos|gesagt)\b/.test(q))return "conversations";
 return "memories";
}
function topicFrom(text){
 const match=String(text||"").match(/\b(?:sobre|acerca de|about|regarding|de la materia|sur|uber)\s+([^?.!,;]{2,100})/i);
 return match?normalize(match[1]).replace(/\b(?:ayer|hoy|la semana pasada|yesterday|last week|hace una semana)\b/g,"").trim():null;
}
function summarize(rows,{language="es",max=3}={}){
 const list=rows.slice(0,max).map(x=>({text:String(x.data?.text||x.data?.transcript||"").slice(0,500),at:x.timestamp}))
   .filter(x=>x.text);
 if(!list.length){
  return {es:"No encontré recuerdos de esa fecha.",en:"I couldn't find memories for that date.",
   pt:"Não encontrei lembranças dessa data.",fr:"Je n'ai pas trouvé de souvenirs pour cette date.",
   it:"Non ho trovato ricordi per quella data.",de:"Ich habe für dieses Datum keine Erinnerungen gefunden."}[language]||"No encontré recuerdos de esa fecha.";
 }
 const labels={es:"Encontré esto en mis recuerdos:",en:"Here's what I found in the saved records:",
  pt:"Encontrei isto nas lembranças:",fr:"Voici ce que j'ai trouvé dans les souvenirs :",
  it:"Ecco cosa ho trovato nei ricordi:",de:"Das habe ich in den Erinnerungen gefunden:"};
 return (labels[language]||labels.es)+" "+list.map((x,i)=>(i+1)+") "+x.text).join(" ");
}
async function retrieve(raw,{owner="local",language="es",now=new Date(),limit=4,store=root.ROBOTITO_STORE}={}){
 if(!store?.queryRecords)throw new Error("Storage unavailable");
 const interval=root.ROBOTITO_TEMPORAL?.resolve?.(raw,{now,language})||null;
 const type=requestType(raw);
 const desired=topicFrom(raw);
 const since=Number.isFinite(interval?.start)?interval.start:undefined;
 const until=Number.isFinite(interval?.end)?interval.end-1:undefined;
 const owners=owner==="local"?["local"]:[String(owner),"local"];
 const rows=[];
 for(const o of owners){
  const results=await store.queryRecords({type,owner:o,after:since,before:until,limit:500});
  rows.push(...results);
 }
 let found=rows.filter(x=>x?.data&&(x.data.text||x.data.transcript));
 if(desired){
  const words=desired.split(/\s+/).filter(w=>w.length>3);
  if(words.length)found=found.filter(x=>{
   const s=normalize(x.data?.text||x.data?.transcript);
   return words.some(word=>s.includes(word));
  });
 }
 found.sort((a,b)=>b.timestamp-a.timestamp);
 if(interval?.kind==="last-occurrence")found=found.slice(0,1);
 return {rows:found.slice(0,Math.max(1,Math.min(20,limit))),interval,type,
  answer:summarize(found,{language,max:Math.max(1,Math.min(20,limit))})};
}
root.ROBOTITO_MEMORY_QUERY={retrieve,requestType,topicFrom,summarize};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_MEMORY_QUERY;
})(typeof window!=="undefined"?window:globalThis);