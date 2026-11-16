// Shared calendar interpretation: use ONE resolver in tasks, classes, memories and books.
(function(root){
"use strict";
const dayMs=86400000;
function fold(x){return String(x||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();}
function midnight(value){const d=new Date(value);d.setHours(0,0,0,0);return d;}
function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function span(start,end,kind,precision="day"){return {kind,precision,start:start.getTime(),end:end.getTime(),startDate:iso(start),endDate:iso(end)};}
function next(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
const DAYS={
 es:["domingo","lunes","martes","miercoles","jueves","viernes","sabado"],
 en:["sunday","monday","tuesday","wednesday","thursday","friday","saturday"],
 pt:["domingo","segunda","terca","quarta","quinta","sexta","sabado"],
 fr:["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"],
 it:["domenica","lunedi","martedi","mercoledi","giovedi","venerdi","sabato"],
 de:["sonntag","montag","dienstag","mittwoch","donnerstag","freitag","samstag"]
};
function resolve(raw,{now=new Date(),language="es",future=false}={}){
 const q=fold(raw),today=midnight(now);let offset=null,kind=null;
 // Parse calendar dates locally, never as UTC, and reject impossible dates.
 const dated=q.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)||q.match(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/);
 if(dated){
  const y=Number(dated[dated[1].length===4?1:3]),m=Number(dated[2]),d=Number(dated[dated[1].length===4?3:1]);
  const date=new Date(y,m-1,d);
  if(date.getFullYear()!==y||date.getMonth()!==m-1||date.getDate()!==d)return {kind:"invalid",start:null,end:null};
  return span(date,next(date,1),"date");
 }
 if(/\b(anteayer|day before yesterday|anteontem|avant hier|l'altro ieri|vorgestern)\b/.test(q)){offset=-2;kind="anteayer";}
 else if(/\b(ayer|yesterday|ontem|hier|ieri|gestern)\b/.test(q)){offset=-1;kind="ayer";}
 else if(/\b(hoy|today|hoje|aujourd'hui|oggi|heute)\b/.test(q)){offset=0;kind="hoy";}
 else if(/\b(manana|tomorrow|amanha|demain|domani|morgen)\b/.test(q)){offset=1;kind="mañana";}
 if(offset!==null){const d=next(today,offset);return span(d,next(d,1),kind);}
 if(/\b(semana pasada|last week|semana passada|semaine derniere|settimana scorsa|letzte woche)\b/.test(q)){
  const monday=next(today,-((today.getDay()+6)%7)-7);return span(monday,next(monday,7),"last-week","week");
 }
 const amount="(\\d+|un|una|one|um|uma|une|ein|eine|einer|einem)",unit="(?:dias?|days?|jours?|giorn[oi]|tag(?:e|en)?|semanas?|weeks?|semaines?|settiman[ae]|wochen?)";
 const m=q.match(new RegExp("\\b(?:hace|ha|il y a|vor)\\s*"+amount+"\\s*"+unit+"\\b"))
  ||q.match(new RegExp("\\b"+amount+"\\s*"+unit+"\\s*(?:ago|fa)\\b"));
 if(m){
  const weeks=/seman|week|semain|settiman|woch/.test(m[0]),d=next(today,-Math.min(3650,(/^\d+$/.test(m[1])?Number(m[1]):1)*(weeks?7:1)));
  return span(d,next(d,1),"relative");
 }
 const weekdays=DAYS[language]||DAYS.es;
 for(let day=0;day<7;day++){
  const name=weekdays[day];
  if(new RegExp("\\b"+name+"\\b").test(q)){
   let delta=(day-today.getDay()+7)%7;
   if(!future)delta=delta===0?0:delta-7;
   const d=next(today,delta);return span(d,next(d,1),"weekday");
  }
 }
 if(/\b(ultima vez|last time|ultima vez|derniere fois|ultima volta|letztes mal|clase anterior|previous class|aula anterior|cours precedent)\b/.test(q))
  return {kind:/clase|class|aula|cours/.test(q)?"previous-class":"last-occurrence",precision:"context",start:null,end:null};
 return null;
}
root.ROBOTITO_TEMPORAL={resolve,fold,iso,midnight};
if(typeof module!=="undefined"&&module.exports)module.exports=root.ROBOTITO_TEMPORAL;
})(typeof window!=="undefined"?window:globalThis);
