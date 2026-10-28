"use strict";
// OFFLINE sound-event evaluation. This is NOT Robotito's deployed reaction
// policy: no synthetic score or unreviewed report enables human reactions.
const {classify,HUMAN}=require("./audio-calibration.js");
const COOLDOWN={clap:1.9,laugh:8,cry:18,cough:9.5,sneeze:5.2};
const finite=n=>Number.isFinite(n)&&n>=0;
const seconds=spans=>spans.reduce((sum,[a,b])=>sum+b-a,0);
function union(spans){
 const out=[];
 for(const [a,b] of spans.filter(x=>x[1]>x[0]).sort((x,y)=>x[0]-y[0])){
  if(!out.length||a>out.at(-1)[1])out.push([a,b]);
  else out.at(-1)[1]=Math.max(b,out.at(-1)[1]);
 }
 return out;
}
function subtract(spans,remove){
 let remaining=union(spans);
 for(const [a,b] of union(remove))remaining=remaining.flatMap(([x,y])=>
  b<=x||a>=y?[[x,y]]:[[x,Math.min(a,y)],[Math.max(b,x),y]].filter(z=>z[1]>z[0]));
 return remaining;
}
function intersection(a,b){
 return union(a.flatMap(([x,y])=>b.map(([m,n])=>[Math.max(x,m),Math.min(y,n)])
  .filter(z=>z[1]>z[0])));
}
function range(obj,duration,name){
 if(!obj||!finite(obj.startSeconds)||!finite(obj.endSeconds)||
    obj.endSeconds<=obj.startSeconds||obj.endSeconds>duration)
  throw Error("Invalid "+name+" interval");
 return [obj.startSeconds,obj.endSeconds];
}
function covered(t,ranges){return ranges.some(([a,b])=>t>=a&&t<=b);}
function evaluateContinuous(sessions,{hopSeconds=.4875,matchToleranceSeconds=.75}={}){
 if(!Array.isArray(sessions)||!sessions.length)throw Error("At least one annotated session required");
 if(!finite(hopSeconds)||hopSeconds<=0||hopSeconds>5||
    !finite(matchToleranceSeconds)||matchToleranceSeconds>5)
  throw Error("Invalid acoustic timeline cadence");
 const ids=new Set(),results=[];
 for(const session of sessions){
  if(!session||typeof session.id!=="string"||!session.id.trim()||ids.has(session.id))
   throw Error("Each continuous session requires a unique ID");
  ids.add(session.id);
  if(!finite(session.durationSeconds)||session.durationSeconds<=0||
    !session.environment?.trim?.()||!["owned","consented","open-license"].includes(session.rights)||
    !Array.isArray(session.frames)||!Array.isArray(session.annotations)||
    !Array.isArray(session.suppressions||[]))
   throw Error("Session requires consent, environment, frames, duration and ground truth");
  let prev=-Infinity;
  for(const frame of session.frames){
   if(!frame||!finite(frame.atSeconds)||frame.atSeconds>session.durationSeconds||
      frame.atSeconds<=prev||!frame.scores||typeof frame.scores!=="object"||
      Array.isArray(frame.scores))
    throw Error("Observations must have strictly increasing timestamps and scores");
   prev=frame.atSeconds;
  }
  const truth=session.annotations.map(event=>{
   if(!HUMAN.includes(event?.kind))throw Error("Unsupported annotated sound event");
   return {kind:event.kind,interval:range(event,session.durationSeconds,"event")};
  });
  const suppressed=union((session.suppressions||[]).map(x=>range(x,session.durationSeconds,"suppression")));
  const observed=union(session.frames.map(x=>[
   Math.max(0,x.atSeconds-hopSeconds/2),
   Math.min(session.durationSeconds,x.atSeconds+hopSeconds/2)]));
  const active=subtract(observed,suppressed),observedSeconds=seconds(active);
  let prevKind=null,consecutive=0,lastTime=-Infinity;
  const lastAlert=Object.fromEntries(HUMAN.map(x=>[x,-Infinity])),alerts=[];
  for(const frame of session.frames){
   const t=frame.atSeconds,kind=classify(frame.scores);
   const eligible=covered(t,active)&&HUMAN.includes(kind);
   if(!eligible||kind!==prevKind||
      t-lastTime<hopSeconds*.5||t-lastTime>hopSeconds*1.9){
    prevKind=null;consecutive=0;
   }
   if(eligible){
    if(kind!==prevKind){prevKind=kind;consecutive=1;}
    else consecutive++;
    if(consecutive===2&&t-lastAlert[kind]>=COOLDOWN[kind]){
     alerts.push({kind,atSeconds:t});lastAlert[kind]=t;
    }
   }
   lastTime=t;
  }
  const metrics={};
  for(const kind of HUMAN){
   const labels=truth.filter(x=>x.kind===kind);
   const eligibleLabels=labels.filter(x=>seconds(intersection(active,[x.interval]))>0);
   const matched=new Set();
   let tp=0,fp=0;
   for(const alert of alerts.filter(x=>x.kind===kind)){
    const hit=eligibleLabels.findIndex((x,i)=>!matched.has(i)&&
     alert.atSeconds>=x.interval[0]-matchToleranceSeconds&&
     alert.atSeconds<=x.interval[1]+matchToleranceSeconds);
    if(hit<0)fp++;else{matched.add(hit);tp++;}
   }
   const negativeSeconds=seconds(subtract(active,union(labels.map(x=>x.interval))));
   metrics[kind]={tp,fp,fn:eligibleLabels.length-tp,annotatedEvents:labels.length,
    evaluableEvents:eligibleLabels.length,negativeSeconds,
    falseAlertsPerNegativeHour:negativeSeconds?fp*3600/negativeSeconds:null};
  }
  results.push({id:session.id,environment:session.environment,
   durationSeconds:session.durationSeconds,observedSeconds,
   missingOrSuppressedSeconds:Math.max(0,session.durationSeconds-observedSeconds),
   classifiedFrames:session.frames.length,alerts,metrics});
 }
 const aggregate=items=>{
  const summary={sessionCount:items.length,observedSeconds:0,metrics:{}};
  for(const kind of HUMAN)summary.metrics[kind]={
   tp:0,fp:0,fn:0,negativeSeconds:0,falseAlertsPerNegativeHour:null};
  for(const item of items){
   summary.observedSeconds+=item.observedSeconds;
   for(const kind of HUMAN){
    const dest=summary.metrics[kind],src=item.metrics[kind];
    for(const field of ["tp","fp","fn","negativeSeconds"])dest[field]+=src[field];
   }
  }
  for(const kind of HUMAN){
   const m=summary.metrics[kind];
   if(m.negativeSeconds)m.falseAlertsPerNegativeHour=m.fp*3600/m.negativeSeconds;
  }
  return summary;
 };
 const byEnvironment=Object.fromEntries([...new Set(results.map(x=>x.environment))]
  .map(name=>[name,aggregate(results.filter(x=>x.environment===name))]));
 return {schemaVersion:1,calibrated:false,automaticHumanReactionsApproved:false,
  metricScope:"Offline reference event detector on annotated observed intervals; NOT deployed Robotito alerts",
  assumptions:{hopSeconds,matchToleranceSeconds,adjacentFramesRequired:2,
   cooldownSeconds:COOLDOWN,unobservedTimeExcluded:true},
  overall:aggregate(results),byEnvironment,sessions:results,
  approvalBlocker:"Real annotated continuous recordings, consent, independent threshold validation and deployed-reaction testing required"};
}
module.exports={evaluateContinuous,union,subtract,intersection};
