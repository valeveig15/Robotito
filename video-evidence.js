// P22 — private, consent-bound video study evidence. No video downloads.
(function(root){
"use strict";
const KEY="robotito.videoEvidence.v1";
const fold=x=>String(x||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();
const clean=x=>String(x||"").replace(/\s+/g," ").trim();
const formats=new Set(["provided-caption","heard","seen","inferred"]);
const uid=()=>root.crypto?.randomUUID?.()||"ev-"+Date.now()+"-"+Math.random().toString(36).slice(2);
const tokens=s=>new Set(fold(s).match(/[a-zñáéíóú0-9]{3,}/g)||[]);
function captionTime(value){
 const m=String(value||"").trim().replace(",",".").match(/^(?:(\d{1,2}):)?(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
 if(!m||Number(m[2])>59||Number(m[3])>59)return null;
 return (Number(m[1]||0)*3600+Number(m[2])*60+Number(m[3])+Number("0."+(m[4]||"0")));
}
function segmentCaptions(text,{maxChars=430,maxSegments=240}={}){
 maxChars=Number.isSafeInteger(maxChars)?Math.min(430,Math.max(1,maxChars)):430;
 maxSegments=Number.isSafeInteger(maxSegments)?Math.min(240,Math.max(0,maxSegments)):240;
 if(maxSegments===0)return [];
 const raw=String(text||"").replace(/\r/g,"").trim();
 if(!raw)return [];
 const chunks=raw.replace(/^WEBVTT[^\n]*\n/,"").split(/\n\s*\n/);
 const timed=[];
 for(const chunk of chunks){
  const lines=chunk.split("\n").map(s=>s.trim()).filter(Boolean);
  const idx=lines.findIndex(x=>x.includes("-->"));
  if(idx<0)continue;
  const timing=lines[idx].split("-->");
  const start=captionTime(timing[0]);
  const end=captionTime((timing[1]||"").trim().split(/\s+/)[0]);
  const text=clean(lines.slice(idx+1).filter(x=>!/^<[^>]+>$/.test(x)).join(" ")).replace(/<[^>]+>/g,"");
  if(start!==null&&end!==null&&end>start&&text.length>=3)
   timed.push({text:text.slice(0,maxChars),atSec:start,complete:false});
  if(timed.length>=maxSegments)break;
 }
 if(timed.length)return timed;
 // Malformed timed captions are NOT a plain transcript: never index raw
 // --> cue headers as educational speech or fabricate a timestamp.
 if(raw.includes("-->"))return [];
 // A pasted transcript without reliable timecodes must never acquire fake timestamps.
 return (raw.match(/[^.!?。]+[.!?。]?/g)||[raw]).reduce((acc,part)=>{
  let current=clean(part);
  while(current){
   const slice=current.slice(0,maxChars);
   if(slice.length>=4)acc.push({text:slice,atSec:null,complete:false});
   current=current.slice(maxChars);
   if(acc.length>=maxSegments)return acc;
  }
  return acc;
 },[]).slice(0,maxSegments);
}
function createStore({storage=root.localStorage,now=()=>Date.now()}={}){
 if(!storage||typeof storage.getItem!=="function"||typeof storage.setItem!=="function")
  throw new Error("Local persistence unavailable");
 let data=[];
 try{
  const stored=JSON.parse(storage.getItem(KEY)||"[]");
  if(!Array.isArray(stored))throw new Error("Invalid evidence state");
  data=stored;
 }catch(e){throw new Error("No puedo leer las evidencias de vídeo: "+e.message);}
 function addBatch({sourceId,sourceUrl="",title="",subject,topic="",sessionId="",
                    owner="local",consent=false,items=[]}={}){
  if(consent!==true)throw new Error("Se requiere permiso explícito para incorporar evidencia de video");
  if(!clean(sourceId)||!clean(subject)||!clean(owner))throw new Error("Falta la fuente, materia o propietario");
  if(!Array.isArray(items)||items.length>240)throw new Error("Demasiados fragmentos");
  const rows=[];
  for(const item of items){
   if(!formats.has(item.kind))throw new Error("Tipo de evidencia inválido");
   if(item.kind==="heard"&&item.capture!==true)
    throw new Error("Los subtítulos aportados no pueden marcarse como escuchados");
   if(item.kind==="seen"&&(!(Number(item.score)>=.70)||!(Number(item.samples)>=2)))
    continue; // A single uncertain visual prediction is not evidence.
   const text=clean(item.text).slice(0,430);
   if(text.length<3)continue;
   const atSec=item.atSec==null?null:Number(item.atSec);
   if(atSec!==null&&(!Number.isFinite(atSec)||atSec<0||atSec>864000))
    throw new Error("Marca temporal inválida");
   rows.push({id:uid(),sourceId:clean(sourceId).slice(0,100),
     sourceUrl:/^https:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]{11}$/.test(sourceUrl)?sourceUrl:"",
     title:clean(title).slice(0,160),subject:clean(subject).slice(0,100),
     topic:clean(topic).slice(0,100),owner:clean(owner).slice(0,100),
     sessionId:clean(sessionId).slice(0,120),
     kind:item.kind,text,atSec,confidence:Number.isFinite(Number(item.score))?
      Math.max(0,Math.min(1,Number(item.score))):null,
     complete:item.complete===true,recordedAt:now(),verified:false});
  }
  if(data.length+rows.length>1800)
   throw new Error("Límite de evidencia alcanzado; revisá o eliminá material anterior");
  const next=[...data,...rows];storage.setItem(KEY,JSON.stringify(next));data=next;
  return rows.length;
 }
 function search({subject,topic="",owner="local",query="",limit=8}={}){
  if(!clean(subject)||!clean(owner))return [];
  const q=tokens(query),list=data.filter(x=>fold(x.subject)===fold(subject)&&
   (!topic||fold(x.topic)===fold(topic))&&fold(x.owner)===fold(owner));
  return list.map(x=>{
    const words=tokens(x.text),score=[...q].reduce((n,t)=>n+(words.has(t)?2:0),0);
    return {...x,relevance:score};
   }).filter(x=>!q.size||x.relevance>0)
    .sort((a,b)=>b.relevance-a.relevance||b.recordedAt-a.recordedAt)
    .slice(0,Math.max(1,Math.min(20,Number(limit)||8)));
 }
 function removeSource(sourceId,owner="local"){
  const next=data.filter(x=>!(x.sourceId===sourceId&&x.owner===owner));
  storage.setItem(KEY,JSON.stringify(next));data=next;
  return next.length;
 }
 return {addBatch,search,removeSource,snapshot:()=>JSON.parse(JSON.stringify(data))};
}
const api={createStore,segmentCaptions,captionTime};
root.ROBOTITO_VIDEO_EVIDENCE=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
