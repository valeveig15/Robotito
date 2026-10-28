"use strict";
// Eval metrics are per labelled clip, NOT a measured continuous-listening
// false-alarm rate. No automated approval of human-event reactions.
const {normalizeDeviceClass}=require("./audio-device-metadata.js");
const {normalizeSourceGroup,normalizeEvaluationSplit,sourceAudit}=require("./audio-source-groups.js");
const ALL=["clap","laugh","cry","cough","sneeze","music","voice","impact","noise","silence","unknown"];
const HUMAN=["clap","laugh","cry","cough","sneeze"];
const GATES={clap:{threshold:.96,margin:.20},laugh:{threshold:.89,margin:.14},
 cry:{threshold:.91,margin:.15},cough:{threshold:.94,margin:.18},sneeze:{threshold:.96,margin:.20}};
function classify(scores){
 const values=Object.fromEntries(ALL.map(k=>[k,0]));
 for(const kind of ALL){
  const n=Number(scores?.[kind]);
  if(Number.isFinite(n)&&n>=0&&n<=1)values[kind]=n;
 }
 const ranked=ALL.map(kind=>({kind,score:values[kind]})).sort((a,b)=>b.score-a.score);
 const best=ranked[0],next=ranked[1];
 if(HUMAN.includes(best.kind)){
  const gate=GATES[best.kind];
  return best.score>=gate.threshold&&best.score-next.score>=gate.margin?best.kind:"unknown";
 }
 return best.score>=.55?best.kind:"unknown";
}
// A clip may contain sound events at different instants. Taking the maximum
// score per class across the whole recording fabricates impossible simultaneous
// competitors. Keep predictions tied to their real analysis windows.
// For multi-window recordings require two ADJACENT positive windows of one
// target type, and abstain when distinct human-event types both qualify.
function classifyWindows(windows){
 if(!Array.isArray(windows)||windows.length<1||
    windows.some(row=>!row||typeof row!=="object"||Array.isArray(row)))
  throw Error("Real sound evaluation needs ordered per-window model scores");
 // A final evaluation window can overlap almost 100% of its predecessor.
 // When genuine window offsets are known, such a near-duplicate is NOT an
 // independent second observation of a cough, sneeze or other human event.
 const hasTiming=windows.some(row=>Object.hasOwn(row,"windowStartSeconds"));
 if(hasTiming&&windows.some((row,i)=>!Number.isFinite(row.windowStartSeconds)||
    row.windowStartSeconds<0||(i>0&&row.windowStartSeconds<=windows[i-1].windowStartSeconds)))
  throw Error("Window start times must be ordered, complete and nonnegative");
 const predictions=windows.map(row=>classify(row));
 const independent=(i,j)=>j>=0&&j<predictions.length&&predictions[i]===predictions[j]&&
  (!hasTiming||Math.abs(windows[j].windowStartSeconds-windows[i].windowStartSeconds)>=.4875-1e-6);
 const targetRuns=Object.fromEntries(HUMAN.map(k=>[k,0]));
 const qualifying=[];
 for(let i=0;i<predictions.length;i++){
  const kind=predictions[i];
  if(!HUMAN.includes(kind))continue;
  const adjacent=windows.length===1||independent(i,i-1)||independent(i,i+1);
  if(adjacent){targetRuns[kind]++;if(!qualifying.includes(kind))qualifying.push(kind);}
 }
 if(qualifying.length!==1){
  // Multiple human events in one file are mixed, not proof of a single
  // clip-level label. Unconfirmed single spikes also force abstention.
  const isolatedHuman=predictions.some(k=>HUMAN.includes(k));
  if(qualifying.length>1||isolatedHuman)
   return {predicted:"unknown",windowCount:windows.length,predictions,
    reason:qualifying.length>1?"conflicting-human-events":"isolated-human-spike"};
  // Otherwise retain real background/speech/music labels rather than
  // falsely turning every negative recording into "unknown".
  const counts=new Map();
  for(const kind of predictions)counts.set(kind,(counts.get(kind)||0)+1);
  const ranked=[...counts].sort((a,b)=>b[1]-a[1]);
  const stable=ranked[0][1]>=(windows.length===1?1:2)&&
   (ranked.length===1||ranked[0][1]>ranked[1][1]);
  return {predicted:stable?ranked[0][0]:"unknown",
   windowCount:windows.length,predictions,
   reason:stable?"stable-nonhuman-background":"ambiguous-background"};
 }
 const winner=qualifying[0];
 return {predicted:winner,windowCount:windows.length,predictions,
  reason:windows.length===1?"single-short-clip":"adjacent-window-evidence"};
}
function matrix(){return Object.fromEntries(ALL.map(k=>
 [k,Object.fromEntries(ALL.map(v=>[v,0]))]));}
function wilsonUpper95(k,n){
 if(!Number.isInteger(k)||!Number.isInteger(n)||k<0||n<=0||k>n)return null;
 const z=1.959963984540054,z2=z*z,p=k/n,denom=1+z2/n;
 return Math.min(1,(p+z2/(2*n)+z*Math.sqrt(p*(1-p)/n+z2/(4*n*n)))/denom);
}
function summarize(rows){
 const counts=Object.fromEntries(ALL.map(k=>[k,0]));
 const confusion=matrix();
 const negativeExposureByTarget=Object.fromEntries(HUMAN.map(k=>[k,0]));
 let backgroundOnlyHours=0;
 for(const item of rows){
  counts[item.label]++;confusion[item.label][item.predicted]++;
  if(!HUMAN.includes(item.label))backgroundOnlyHours+=item.durationSeconds/3600;
  for(const kind of HUMAN)if(item.label!==kind)
   negativeExposureByTarget[kind]+=item.durationSeconds/3600;
 }
 const metrics=Object.fromEntries(HUMAN.map(kind=>{
  const tp=confusion[kind][kind],fp=ALL.filter(x=>x!==kind)
   .reduce((a,x)=>a+confusion[x][kind],0);
  const fn=ALL.filter(x=>x!==kind).reduce((a,x)=>a+confusion[kind][x],0);
  const negatives=rows.length-counts[kind],negativeHours=negativeExposureByTarget[kind];
  return [kind,{tp,fp,fn,positiveClips:counts[kind],negativeClips:negatives,
   precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null,
   falsePositiveClipRate:negatives?fp/negatives:null,
   falsePositiveClipRateUpper95:wilsonUpper95(fp,negatives),
   falsePositiveClipsPerNegativeHour:negativeHours?fp/negativeHours:null}];
 }));
 return {clipCount:rows.length,byLabel:counts,confusion,metrics,
  backgroundOnlyHours,negativeExposureByTarget};
}
// Several clips can derive from one recording. Treating each clip as an
// independent Bernoulli trial narrows the Wilson interval deceptively.
// This second diagnostic counts one false-positive opportunity per declared
// source group, retaining null rates when no independent groups exist.
function summarizeSourceGroups(rows){
 const groups=new Map();let ungroupedClips=0;
 for(const row of rows){
  if(!row.sourceGroup){ungroupedClips++;continue;}
  const members=groups.get(row.sourceGroup)||[];
  members.push(row);groups.set(row.sourceGroup,members);
 }
 const metrics=Object.fromEntries(HUMAN.map(kind=>{
  let negativeSourceGroups=0,falsePositiveSourceGroups=0,targetPresentGroupsExcluded=0;
  for(const members of groups.values()){
   // A group containing any genuine target event is not a pure negative
   // source for that kind, even if other excerpts contain background.
   if(members.some(row=>row.label===kind)){
    targetPresentGroupsExcluded++;continue;
   }
   negativeSourceGroups++;
   if(members.some(row=>row.predicted===kind))falsePositiveSourceGroups++;
  }
  return [kind,{negativeSourceGroups,falsePositiveSourceGroups,
   targetPresentGroupsExcluded,
   falsePositiveSourceGroupRate:negativeSourceGroups?
    falsePositiveSourceGroups/negativeSourceGroups:null,
   falsePositiveSourceGroupRateUpper95:
    wilsonUpper95(falsePositiveSourceGroups,negativeSourceGroups)}];
 }));
 return {declaredSourceGroups:groups.size,ungroupedClips,
  unit:"one declared original recording group; multiple derived clips count once",
  uncertainty:"Wilson 95% upper bound assumes independent declared source groups; curator labels unverified",
  independentlyVerified:false,metrics};
}
function evaluate(observations){
 if(!Array.isArray(observations)||!observations.length)
  throw Error("A nonempty labelled dataset is required");
 // Public evaluation entrypoints must not bypass manifest split isolation.
 const groupAudit=sourceAudit(observations);
 const seen=new Set(),all=[],byEnv=new Map(),byDevice=new Map(),bySplit=new Map();
 let evaluatedWindowClips=0,conflictingClips=0,singleShortClips=0;
 for(const obs of observations){
  if(!obs||typeof obs.id!=="string"||!obs.id.trim()||seen.has(obs.id))
   throw Error("Every clip needs a unique ID");
  seen.add(obs.id);
  if(!ALL.includes(obs.label)||typeof obs.environment!=="string"||
     !obs.environment.trim()||
     (!Object.hasOwn(obs,"scores")&&!Object.hasOwn(obs,"windowScores")))
   throw Error("Each clip needs a supported label, environment and model scores");
  if(!["owned","consented","open-license"].includes(obs.rights))
   throw Error("Audio rights/consent must be specified: "+obs.id);
  if(!Number.isFinite(obs.durationSeconds)||obs.durationSeconds<=0)
   throw Error("Invalid duration for clip: "+obs.id);
  const withWindows=Array.isArray(obs.windowScores);
  if(!withWindows&&(!obs.scores||typeof obs.scores!=="object"))
   throw Error("Missing model observations for clip: "+obs.id);
  const temporal=withWindows?classifyWindows(obs.windowScores):null;
  if(temporal){
   evaluatedWindowClips++;
   if(temporal.reason==="conflicting-human-events")conflictingClips++;
   if(temporal.reason==="single-short-clip")singleShortClips++;
  }
  const deviceClass=normalizeDeviceClass(obs.deviceClass);
  const group=normalizeSourceGroup(obs.sourceGroup);
  const evaluationSplit=normalizeEvaluationSplit(obs.evaluationSplit,group);
  const row={label:obs.label,sourceGroup:group,
   predicted:temporal?temporal.predicted:classify(obs.scores),
   durationSeconds:obs.durationSeconds};
  all.push(row);
  const envRows=byEnv.get(obs.environment)||[];
  envRows.push(row);byEnv.set(obs.environment,envRows);
  const deviceRows=byDevice.get(deviceClass)||[];
  deviceRows.push(row);byDevice.set(deviceClass,deviceRows);
  const splitRows=bySplit.get(evaluationSplit)||[];
  splitRows.push(row);bySplit.set(evaluationSplit,splitRows);
 }
 const summary=summarize(all);
 const environmentMetrics=Object.fromEntries([...byEnv].map(([name,rows])=>
  [name,summarize(rows)]));
 const deviceMetrics=Object.fromEntries([...byDevice].map(([name,rows])=>
  [name,summarize(rows)]));
 const splitMetrics=Object.fromEntries([...bySplit].map(([name,rows])=>
  [name,summarize(rows)]));
 const sourceGroupMetrics=summarizeSourceGroups(all);
 const sourceGroupMetricsBySplit=Object.fromEntries([...bySplit].map(([name,rows])=>
  [name,summarizeSourceGroups(rows)]));
 return {schemaVersion:2,source:"Provided labelled clips and model scores",
  metricScope:"clip-level, one prediction per labelled file; NOT continuous alarm episodes",
  clipCount:summary.clipCount,byLabel:summary.byLabel,
  byEnvironment:Object.fromEntries([...byEnv].map(([name,rows])=>[name,rows.length])),
  byDevice:Object.fromEntries([...byDevice].map(([name,rows])=>[name,rows.length])),
  confusion:summary.confusion,metrics:summary.metrics,
  negativeHours:summary.backgroundOnlyHours,
  negativeExposureByTarget:summary.negativeExposureByTarget,
  environmentMetrics,deviceMetrics,splitMetrics,
  sourceGroupMetrics,sourceGroupMetricsBySplit,
  sourceGroupAudit:groupAudit,
  temporalEvaluation:{clips:evaluatedWindowClips,conflictingClips,
   singleWindowHumanCandidates:singleShortClips,
   method:"ordered independent window decisions; two adjacent same-class windows for multi-window human events"},
  calibrated:false,automaticHumanReactionsApproved:false,
  approvalBlocker:"Representative real recordings, event timestamps, continuous negative-listening false-alarm episodes, independent calibration/validation and human-approved thresholds required"};
}
module.exports={ALL,HUMAN,GATES,classify,classifyWindows,evaluate,wilsonUpper95};
