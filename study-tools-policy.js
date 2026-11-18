// P60–P74: pure, side-effect-free study policies and accessible reading helpers.
(function(root){
"use strict";
const DAY=86400000,MAX_MINUTES=1440;
const clean=(value,max=200)=>String(value??"").replace(/\s+/g," ").trim().slice(0,max);
const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number(value)||0));
function durationMinutes(value){const n=Number(value);if(!Number.isInteger(n)||n<1||n>MAX_MINUTES)throw new RangeError("Study duration must be 1–1440 minutes");return n;}
function formatClock(ms){
 const seconds=Math.max(0,Math.floor(Number(ms)/1000)||0);
 const hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60);
 return [hours,minutes,seconds%60].map(x=>String(x).padStart(2,"0")).join(":");
}
function timerState({mode="stopwatch",startedAt=0,elapsedMs=0,limitMs=0,running=false},now){
 const delta=running?Math.max(0,now-startedAt):0,elapsed=Math.max(0,elapsedMs+delta);
 const remaining=mode==="countdown"?Math.max(0,limitMs-elapsed):null;
 return {elapsed,remaining,done:mode==="countdown"&&remaining===0,
  progress:mode==="countdown"&&limitMs>0?clamp(elapsed/limitMs*100,0,100):null};
}
function weekStart(time){
 const d=new Date(time);d.setHours(0,0,0,0);
 const weekday=(d.getDay()+6)%7;d.setDate(d.getDate()-weekday);
 return d.getTime();
}
function weeklyMinutes(sessions,now=Date.now()){
 const start=weekStart(now),days=Array.from({length:7},(_,i)=>({date:new Date(start+i*DAY).toLocaleDateString("sv-SE"),minutes:0,subjects:{}}));
 for(const row of sessions||[]){
  const timestamp=Number(row.at),duration=Number(row.minutes);
  if(!Number.isFinite(timestamp)||timestamp<start||timestamp>=start+7*DAY||!Number.isFinite(duration)||duration<=0)continue;
  const date=new Date(timestamp);date.setHours(0,0,0,0);
  const index=Math.round((date.getTime()-start)/DAY);if(index<0||index>=7)continue;
  const minutes=clamp(duration,0,MAX_MINUTES),subject=clean(row.subject,90)||"Sin materia";
  days[index].minutes+=minutes;days[index].subjects[subject]=(days[index].subjects[subject]||0)+minutes;
 }
 return days;
}
function estimateMinutes(sessions,subject,fallback=30){
 const selected=(sessions||[]).filter(x=>clean(x.subject,90)===clean(subject,90)&&Number.isFinite(x.minutes)&&x.minutes>0).slice(-12);
 if(selected.length<3)return {minutes:durationMinutes(fallback),samples:selected.length,source:"manual"};
 const sorted=selected.map(x=>x.minutes).sort((a,b)=>a-b);
 const median=(sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.floor(sorted.length/2)])/2;
 return {minutes:Math.round(clamp(median,1,MAX_MINUTES)),samples:selected.length,source:"observed"};
}
function makeFlashcard(front,back,subject=""){
 const question=clean(front,400),answer=clean(back,1200),topic=clean(subject,90);
 if(!question||!answer)throw Error("Front and back are required");
 return {front:question,back:answer,subject:topic,repetitions:0,intervalDays:0,dueAt:0};
}
function gradeCard(card,correct,now=Date.now()){
 const repetitions=correct?(Number(card.repetitions)||0)+1:0;
 const intervalDays=correct?Math.min(60,[1,3,7,14,30,60][Math.min(5,repetitions-1)]):1;
 return {...card,repetitions,intervalDays,dueAt:now+intervalDays*DAY};
}
function readingSegments(input){
 const text=String(input||"").slice(0,12000),parts=[];
 // Preserve whitespace and punctuation so display never changes the original.
 for(const part of text.match(/\p{L}+[\p{L}\p{M}'’-]*|[^\p{L}]+/gu)||[]){
  if(/^\p{L}/u.test(part)){
   const length=Math.min(Math.max(1,Math.ceil([...part].length*.42)),5);
   const chars=[...part];
   parts.push({head:chars.slice(0,length).join(""),tail:chars.slice(length).join(""),word:true});
  }else parts.push({head:part,tail:"",word:false});
 }
 return parts;
}
function mindMap(text,{maxBranches=8}={}){
 const lines=String(text||"").split(/\n+/).map(x=>clean(x,180)).filter(Boolean);
 const topic=clean(lines[0]||"Mis apuntes",110);
 const branches=lines.slice(1).filter(x=>x!==topic).slice(0,maxBranches).map((label,i)=>({id:i+1,label}));
 return {topic,branches,sourceLines:lines.length};
}
root.ROBOTITO_STUDY_POLICY=Object.freeze({clean,durationMinutes,formatClock,timerState,weeklyMinutes,weekStart,estimateMinutes,makeFlashcard,gradeCard,readingSegments,mindMap});
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_STUDY_POLICY;
})(typeof window!=="undefined"?window:globalThis);
