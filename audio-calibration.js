"use strict";
// A reproducible evaluation report, NOT an authorization to enable reactions.
// Real datasets and human review remain mandatory for sound-class calibration.
const ALL=["clap","laugh","cry","cough","sneeze","music","voice","impact","noise","silence","unknown"];
const HUMAN=["clap","laugh","cry","cough","sneeze"];
const GATES={clap:{threshold:.96,margin:.20},laugh:{threshold:.89,margin:.14},
 cry:{threshold:.91,margin:.15},cough:{threshold:.94,margin:.18},sneeze:{threshold:.96,margin:.20}};
function classify(scores){
 const values=Object.fromEntries(ALL.map(k=>[k,0]));
 for(const kind of ALL){
  const n=Number(scores?.[kind]);if(Number.isFinite(n)&&n>=0&&n<=1)values[kind]=n;
 }
 const ranked=ALL.map(kind=>({kind,score:values[kind]})).sort((a,b)=>b.score-a.score);
 const best=ranked[0],next=ranked[1];
 if(HUMAN.includes(best.kind)){
  const gate=GATES[best.kind];
  return best.score>=gate.threshold&&best.score-next.score>=gate.margin?best.kind:"unknown";
 }
 return best.score>=.55?best.kind:"unknown";
}
function evaluate(observations){
 if(!Array.isArray(observations)||!observations.length)throw Error("A nonempty labelled dataset is required");
 const seen=new Set(),matrix=Object.fromEntries(ALL.map(k=>[k,Object.fromEntries(ALL.map(v=>[v,0]))]));
 let negativeHours=0;
 const negativeExposureByTarget=Object.fromEntries(HUMAN.map(kind=>[kind,0]));
 const byEnv={},byLabel=Object.fromEntries(ALL.map(kind=>[kind,0]));
 for(const obs of observations){
  if(!obs||typeof obs.id!=="string"||!obs.id.trim()||seen.has(obs.id))throw Error("Every clip needs a unique ID");
  seen.add(obs.id);
  if(!ALL.includes(obs.label)||typeof obs.environment!=="string"||!obs.environment.trim())
   throw Error("Each clip needs a supported label and environment: "+obs.id);
  if(!["owned","consented","open-license"].includes(obs.rights))
   throw Error("Audio rights/consent must be specified: "+obs.id);
  if(!Number.isFinite(obs.durationSeconds)||obs.durationSeconds<=0)
   throw Error("Invalid audio duration: "+obs.id);
  if(!obs.scores||typeof obs.scores!=="object")throw Error("Missing raw model scores: "+obs.id);
  const predicted=classify(obs.scores);
  matrix[obs.label][predicted]++;
  byLabel[obs.label]++;
  byEnv[obs.environment]=(byEnv[obs.environment]||0)+1;
  if(!HUMAN.includes(obs.label))negativeHours+=obs.durationSeconds/3600;
  for(const kind of HUMAN)if(obs.label!==kind)
   negativeExposureByTarget[kind]+=obs.durationSeconds/3600;
 }
 const metrics=Object.fromEntries(HUMAN.map(kind=>{
  const tp=matrix[kind][kind],fp=ALL.filter(k=>k!==kind).reduce((n,k)=>n+matrix[k][kind],0);
  const fn=ALL.filter(k=>k!==kind).reduce((n,k)=>n+matrix[kind][k],0);
  return [kind,{tp,fp,fn,precision:tp+fp?tp/(tp+fp):null,
    recall:tp+fn?tp/(tp+fn):null,
    falsePositivesPerNegativeHour:negativeExposureByTarget[kind]
      ?fp/negativeExposureByTarget[kind]:null}];
 }));
 return {schemaVersion:1,source:"labelled audio and real model observations",
  clipCount:observations.length,byLabel,byEnvironment:byEnv,
  confusion:matrix,metrics,negativeHours,negativeExposureByTarget,
  // No amount of unit-test success can grant real-data calibration approval.
  calibrated:false,automaticHumanReactionsApproved:false,
  approvalBlocker:"Human-reviewed representative recordings, adequate samples for every label, per-environment false-positive analysis and signed off thresholds required"};
}
module.exports={ALL,HUMAN,GATES,classify,evaluate};
