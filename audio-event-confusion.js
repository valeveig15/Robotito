"use strict";
// Diagnostic event-level confusion: match same-class alerts first (the
// unchanged TP/FP/FN policy), then attribute remaining alerts to eligible
// different-class events. This exposes cough->sneeze confusions without
// claiming that unobserved or suppressed labels are false negatives.
const {HUMAN}=require("./audio-calibration.js");
const ROWS=[...HUMAN,"background"],COLUMNS=[...HUMAN,"missed"];
function blankMatrix(){
 return Object.fromEntries(ROWS.map(row=>[
  row,Object.fromEntries(COLUMNS.map(col=>[col,0]))]));
}
function compatible(event,alert,tolerance){
 return alert.atSeconds>=event.interval[0]-tolerance&&
  alert.atSeconds<=event.interval[1]+tolerance;
}
function summarizeLatency(samples){
 const sorted=samples.slice().sort((a,b)=>a-b);
 const percentile=p=>sorted[Math.ceil(p*sorted.length)-1];
 return {count:sorted.length,min:sorted.length?sorted[0]:null,
  p50:sorted.length?percentile(.50):null,
  p95:sorted.length?percentile(.95):null,
  max:sorted.length?sorted.at(-1):null};
}
function eventConfusion(events,alerts,correctMatches,tolerance){
 const matrix=blankMatrix(),usedAlerts=new Set(),usedEvents=new Set();
 const latencies=Object.fromEntries(HUMAN.map(kind=>[kind,[]]));
 for(const {event,alert} of correctMatches){
  if(usedEvents.has(event)||usedAlerts.has(alert)||event.kind!==alert.kind||
     !compatible(event,alert,tolerance))
   throw Error("Invalid same-class event match");
  usedEvents.add(event);usedAlerts.add(alert);
  matrix[event.kind][alert.kind]++;
  // Reference-detector decision time relative to annotated onset. Negative
  // values can occur when permitted matching tolerance precedes the label.
  latencies[event.kind].push(alert.atSeconds-event.interval[0]);
 }
 const remainingEvents=events.filter(x=>!usedEvents.has(x));
 const remainingAlerts=alerts.filter(x=>!usedAlerts.has(x));
 const candidates=[];
 for(let ai=0;ai<remainingAlerts.length;ai++){
  const alert=remainingAlerts[ai];
  for(let ei=0;ei<remainingEvents.length;ei++){
   const event=remainingEvents[ei];
   if(alert.kind===event.kind||!compatible(event,alert,tolerance))continue;
   const distance=alert.atSeconds<event.interval[0]?
    event.interval[0]-alert.atSeconds:
    alert.atSeconds>event.interval[1]?alert.atSeconds-event.interval[1]:0;
   candidates.push({ai,ei,distance});
  }
 }
 candidates.sort((a,b)=>a.distance-b.distance||a.ai-b.ai||a.ei-b.ei);
 const crossAlerts=new Set(),crossEvents=new Set();
 for(const {ai,ei} of candidates){
  if(crossAlerts.has(ai)||crossEvents.has(ei))continue;
  crossAlerts.add(ai);crossEvents.add(ei);
  matrix[remainingEvents[ei].kind][remainingAlerts[ai].kind]++;
 }
 remainingAlerts.forEach((alert,i)=>{
  if(!crossAlerts.has(i))matrix.background[alert.kind]++;
 });
 remainingEvents.forEach((event,i)=>{
  if(!crossEvents.has(i))matrix[event.kind].missed++;
 });
 return {matrix,latencies};
}
module.exports={ROWS,COLUMNS,blankMatrix,eventConfusion,summarizeLatency};
