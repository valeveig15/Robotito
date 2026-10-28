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
// One-sided exact 95% Poisson upper bound for independent false episodes,
// conditional on time exposure. Even with zero observed false alarms, the
// upper bound stays positive (2.996 episodes per observed negative interval).
// The independence/stationary-rate assumptions must NOT be treated as
// validated for real microphones or a deployed avatar.
function poissonUpper95(events){
 if(!Number.isSafeInteger(events)||events<0)
  throw Error("False alarm count must be a nonnegative integer");
 if(events===0)return -Math.log(.05);
 let logFactorial=0;
 for(let i=2;i<=events;i++)logFactorial+=Math.log(i);
 const cdf=mean=>{
  let term=Math.exp(-mean+events*Math.log(mean)-logFactorial);
  let sum=term;
  for(let i=events;i>0;i--){
   term*=i/mean;
   sum+=term;
   if(term<sum*1e-16)break;
  }
  return sum;
 };
 let lo=events,hi=events+12*Math.sqrt(events+1)+16;
 while(cdf(hi)>.05)hi*=2;
 for(let i=0;i<55;i++){
  const mid=(lo+hi)/2;
  if(cdf(mid)>.05)lo=mid;else hi=mid;
 }
 return (lo+hi)/2;
}
function rateMetrics(fp,negativeSeconds){
 const negativeHours=negativeSeconds/3600;
 return {negativeHours,
  falseAlertsPerNegativeHour:negativeHours?fp/negativeHours:null,
  falseAlertsPerNegativeHourUpper95:negativeHours?
   poissonUpper95(fp)/negativeHours:null};
}
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
   const bounded=Object.hasOwn(frame,"windowStartSeconds")||
    Object.hasOwn(frame,"windowEndSeconds");
   if(bounded&&(!finite(frame.windowStartSeconds)||!finite(frame.windowEndSeconds)||
      frame.windowEndSeconds<=frame.windowStartSeconds||
      frame.windowEndSeconds>session.durationSeconds+1e-6||
      frame.atSeconds<frame.windowStartSeconds||
      frame.atSeconds>frame.windowEndSeconds+1e-6))
    throw Error("Invalid timestamped audio window bounds");
   if(Object.hasOwn(frame,"suppressed")&&typeof frame.suppressed!=="boolean")
    throw Error("Invalid suppressed-frame flag");
   prev=frame.atSeconds;
  }
  const truth=session.annotations.map(event=>{
   if(!HUMAN.includes(event?.kind))throw Error("Unsupported annotated sound event");
   return {kind:event.kind,interval:range(event,session.durationSeconds,"event")};
  });
  const suppressed=union((session.suppressions||[]).map(x=>range(x,session.durationSeconds,"suppression")));
  const rangeForFrame=frame=>Object.hasOwn(frame,"windowStartSeconds")
    ?[frame.windowStartSeconds,frame.windowEndSeconds]
    :[Math.max(0,frame.atSeconds-hopSeconds/2),
      Math.min(session.durationSeconds,frame.atSeconds+hopSeconds/2)];
  const blocked=frame=>frame.suppressed===true||
    suppressed.some(([start,end])=>{
     const [a,b]=rangeForFrame(frame);
     return a<end&&start<b;
    });
  // Only fully evaluated windows contribute negative listening exposure.
  // Windows partially containing suppressed speech cannot produce evidence.
  const scored=session.frames.filter(frame=>!blocked(frame));
  const observed=union(scored.map(rangeForFrame));
  const active=subtract(observed,suppressed),observedSeconds=seconds(active);
  let prevKind=null,consecutive=0,lastTime=-Infinity;
  const lastAlert=Object.fromEntries(HUMAN.map(x=>[x,-Infinity])),alerts=[];
  for(const frame of session.frames){
   const t=frame.atSeconds,kind=classify(frame.scores);
   const eligible=!blocked(frame)&&covered(t,active)&&HUMAN.includes(kind);
   if(!eligible||kind!==prevKind||
      t-lastTime<hopSeconds*.95||t-lastTime>hopSeconds*1.9){
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
   // Two temporally consecutive, genuinely analysed windows must intersect
   // a ground-truth event for this TWO-frame detector to have a chance.
   // With one window or a long missing gap, report "unevaluable" rather
   // than claiming a false negative on an impossible detection.
   const hasEvidenceCoverage=interval=>{
    const overlapping=scored.filter(frame=>{
     const [start,end]=rangeForFrame(frame);
     return start<interval[1]&&interval[0]<end&&covered(frame.atSeconds,active);
    });
    return overlapping.some((frame,i)=>{
     const next=overlapping[i+1];
     if(!next)return false;
     const delta=next.atSeconds-frame.atSeconds;
     return delta>=hopSeconds*.95&&delta<=hopSeconds*1.9;
    });
   };
   const eligibleLabels=labels.filter(x=>hasEvidenceCoverage(x.interval));
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
    evaluableEvents:eligibleLabels.length,
    unevaluableEvents:labels.length-eligibleLabels.length,negativeSeconds,
    ...rateMetrics(fp,negativeSeconds)};
  }
  results.push({id:session.id,environment:session.environment,
   durationSeconds:session.durationSeconds,observedSeconds,
   missingOrSuppressedSeconds:Math.max(0,session.durationSeconds-observedSeconds),
   classifiedFrames:scored.length,
   skippedFrames:session.frames.length-scored.length,alerts,metrics});
 }
 const aggregate=items=>{
  const summary={sessionCount:items.length,observedSeconds:0,metrics:{}};
  for(const kind of HUMAN)summary.metrics[kind]={
   tp:0,fp:0,fn:0,annotatedEvents:0,evaluableEvents:0,unevaluableEvents:0,
   negativeSeconds:0,negativeHours:0,
   falseAlertsPerNegativeHour:null,falseAlertsPerNegativeHourUpper95:null};
  for(const item of items){
   summary.observedSeconds+=item.observedSeconds;
   for(const kind of HUMAN){
    const dest=summary.metrics[kind],src=item.metrics[kind];
    for(const field of ["tp","fp","fn","annotatedEvents","evaluableEvents",
     "unevaluableEvents","negativeSeconds"])dest[field]+=src[field];
   }
  }
  for(const kind of HUMAN){
   const m=summary.metrics[kind];
   Object.assign(m,rateMetrics(m.fp,m.negativeSeconds));
  }
  return summary;
 };
 const byEnvironment=Object.fromEntries([...new Set(results.map(x=>x.environment))]
  .map(name=>[name,aggregate(results.filter(x=>x.environment===name))]));
 return {schemaVersion:1,calibrated:false,automaticHumanReactionsApproved:false,
  metricScope:"Offline reference event detector on annotated observed intervals; NOT deployed Robotito alerts",
  uncertainty:"One-sided 95% Poisson event-rate bound assumes independent stationary false episodes; zero observed alarms never proves zero risk",
  assumptions:{hopSeconds,matchToleranceSeconds,adjacentFramesRequired:2,
   recallDenominator:"annotated events with at least two consecutive analysed overlapping windows",
   cooldownSeconds:COOLDOWN,unobservedTimeExcluded:true},
  overall:aggregate(results),byEnvironment,sessions:results,
  approvalBlocker:"Real annotated continuous recordings, consent, independent threshold validation and deployed-reaction testing required"};
}
module.exports={evaluateContinuous,union,subtract,intersection,poissonUpper95,rateMetrics};
