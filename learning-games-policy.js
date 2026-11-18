// Robotito P79–P82 — educational activities from explicit user's source text.
(function(root){
"use strict";
const clean=(text,max=300)=>String(text??"").replace(/\s+/g," ").trim().slice(0,max);
const MAX_ITEMS=80;
const THEMES=Object.freeze(["normal","invierno","primavera","cumpleanos","fiesta"]);
function parseSource(text){
 const source=String(text??"").slice(0,24000);
 const lines=source.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const questions=[],seen=new Set();
 for(const line of lines){
  const parts=line.match(/^(.{3,220}?)\s*(?:=>|::|:|—)\s*(.{2,500})$/u);
  if(!parts)continue;
  const prompt=clean(parts[1],220),answer=clean(parts[2],500);
  const id=prompt.toLocaleLowerCase("es");
  if(!prompt||!answer||seen.has(id))continue;
  questions.push({id:"q"+questions.length,question:prompt,answer});
  seen.add(id);if(questions.length>=MAX_ITEMS)break;
 }
 return questions;
}
function choices(items,target,index=0){
 if(!items.includes(target))throw Error("Target does not belong to study material");
 const alternatives=items.filter(x=>x!==target&&x.answer.toLocaleLowerCase()!==target.answer.toLocaleLowerCase());
 const pool=[target,...alternatives.slice(0,3)];
 // Deterministic rotation to prevent correct-answer-always-first patterns.
 const turn=Math.max(0,Math.trunc(index))%pool.length;
 return pool.slice(turn).concat(pool.slice(0,turn)).map(x=>({label:x.answer,id:x.id}));
}
function nextDifficulty(history){
 const recent=(history||[]).slice(-5);
 if(recent.length<3)return "intro";
 const correct=recent.filter(x=>x.correct===true).length;
 if(correct>=4&&recent.length>=5)return "desafio";
 if(correct>=2)return "practica";
 return "intro";
}
function nextItem(items,history){
 if(!items?.length)return null;
 const counts=new Map(items.map(x=>[x.id,{seen:0,errors:0}]));
 for(const event of history||[]){
  const row=counts.get(event.id);if(!row)continue;
  row.seen++;if(event.correct===false)row.errors++;
 }
 return items.slice().sort((a,b)=>{
  const x=counts.get(a.id),y=counts.get(b.id);
  return (y.errors-x.errors)||(x.seen-y.seen)||a.id.localeCompare(b.id);
 })[0];
}
function grade(expected,given){
 const norm=x=>clean(x,500).toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[\p{P}\p{S}]/gu,"").replace(/\s+/g," ");
 return norm(expected)===norm(given);
}
function sanitizeMember(item){
 const name=clean(item?.name,60),minutes=Number(item?.minutes),completed=Number(item?.completed);
 if(!name)throw Error("Member name is required");
 if(!Number.isInteger(minutes)||minutes<0||minutes>100000)throw Error("Invalid minutes");
 if(!Number.isInteger(completed)||completed<0||completed>10000)throw Error("Invalid completed tasks");
 return {name,minutes,completed};
}
function groupStats(members){
 const rows=(members||[]).slice(0,30).map(sanitizeMember);
 const minutes=rows.reduce((n,x)=>n+x.minutes,0),completed=rows.reduce((n,x)=>n+x.completed,0);
 return {members:rows,minutes,completed,maxMinutes:Math.max(1,...rows.map(x=>x.minutes))};
}
function season(theme){return THEMES.includes(theme)?theme:"normal";}
const api={clean,parseSource,choices,nextDifficulty,nextItem,grade,sanitizeMember,groupStats,season,THEMES,MAX_ITEMS};
root.ROBOTITO_LEARNING_POLICY=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
