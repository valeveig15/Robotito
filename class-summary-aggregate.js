// Robotito P15: deterministic, source-linked cumulative class summaries.
// This module never sends academic materials to a remote service.
(function(root){
"use strict";
const fold=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
 .toLowerCase().replace(/\s+/g," ").trim();
const safe=s=>String(s||"").replace(/\s+/g," ").trim();
function build({lines=[],materials=[],sessions=[],subject="",topic="",level="medium"}={}){
 const key=fold(subject),topicKey=fold(topic);
 if(!key) return {ok:false,reason:"subject-required",sections:[]};
 const matches=(s,t)=>fold(s)===key&&(!topicKey||fold(t)===topicKey);
 const relevantLines=lines.filter(l=>matches(l.subject,l.topic));
 const relevantMaterials=materials.filter(m=>matches(m.subject,m.topic));
 const relevantSessions=sessions.filter(s=>matches(s.subject,s.topic));
 const limit=level==="short"?4:level==="long"?18:9;
 const entries=[];
 for(const l of relevantLines){
   const text=safe(l.correctedText||l.text);
   if(text.length<10)continue;
   entries.push({text,source:{type:"transcript",id:String(l.id||""),sessionId:String(l.sessionId||""),at:Number(l.at)||null,subject:l.subject,topic:l.topic}});
 }
 for(const m of relevantMaterials){
   const chunks=Array.isArray(m.chunks)?m.chunks:[];
   chunks.forEach((c,i)=>{
     const text=safe(c).slice(0,1200);
     if(text.length<10)return;
     entries.push({text,source:{type:"material",id:String(m.id||""),name:String(m.name||""),chunk:i+1,subject:m.subject,topic:m.topic}});
   });
 }
 const seen=new Set();
 const unique=entries.filter(item=>{
  const key=fold(item.text).slice(0,220);
  if(seen.has(key))return false;
  seen.add(key);return true;
 });
 const important=unique.filter(e=>!/[?¿]$/.test(e.text)).slice(0,limit);
 const doubts=unique.filter(e=>/[?¿]/.test(e.text)).slice(0,Math.min(limit,8));
 const exercises=[];
 for(const m of relevantMaterials){
  for(const ex of Array.isArray(m.exercises)?m.exercises:[]){
   exercises.push({text:safe(typeof ex==="string"?ex:ex.text||ex.statement||ex.enunciado).slice(0,350),
    source:{type:"exercise",id:String(m.id||""),name:String(m.name||""),subject:m.subject,topic:m.topic}});
   if(exercises.length>=limit)break;
  }
  if(exercises.length>=limit)break;
 }
 const counts=new Map();
 for(const entry of unique){
  const tokens=new Set(fold(entry.text).match(/[a-zñ]{5,}/g)||[]);
  for(const token of tokens)counts.set(token,(counts.get(token)||0)+1);
 }
 const stop=new Set(["porque","cuando","tambien","entonces","aunque","donde","sobre","tienen","desde","hasta","pueden","entre","esto","estas","estos","clase","profesor","profesora","cosas","veces","forma","mismo","misma","todos","todas","tener","hacer"]);
 const concepts=[...counts].filter(([word,count])=>count>=2&&!stop.has(word))
  .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,level==="long"?15:8)
  .map(([word,occurrences])=>({word,occurrences}));
 return {ok:unique.length>0||exercises.length>0,subject,topic:topic||null,level,
  sessionCount:new Set([...relevantLines.map(x=>x.sessionId),...relevantSessions.map(x=>x.sessionId)].filter(Boolean)).size,
  materialCount:relevantMaterials.length,lineCount:relevantLines.length,
  sourceCount:unique.length,important,doubts,exercises,concepts,
  // These are evidence excerpts, not fabricated prose or model interpretations.
  note:"Extractive summary; verify source context before trusting any claim."};
}
const api={build};
root.ROBOTITO_CLASS_AGGREGATE=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
