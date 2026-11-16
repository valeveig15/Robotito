// P23 — repeatable visual consensus. Labels are hypotheses, never identities.
(function(root){
"use strict";
function createTracker({now=()=>Date.now(),ttlMs=1900,minFrames=3,minScore=.58}={}){
 let frames=[];
 function observe(predictions,at=now()){
  if(!Number.isFinite(at))return null;
  const candidates=(Array.isArray(predictions)?predictions:[])
   .filter(p=>typeof p.class==="string"&&Number.isFinite(Number(p.score))&&
     Number(p.score)>=.40&&Number(p.score)<=1);
  const ranked=candidates.sort((a,b)=>Number(b.score)-Number(a.score));
  const nonPerson=ranked.filter(p=>p.class!=="person");
  const best=(nonPerson[0]||ranked[0]||null);
  const competitor=nonPerson.length?nonPerson[1]:ranked[1];
  frames=frames.filter(x=>at>=x.at&&at-x.at<=ttlMs);
  frames.push({at,label:best?.class||null,score:Number(best?.score)||0,
    competitor:Number(competitor?.score)||0});
  frames=frames.slice(-7);
  return current(at);
 }
 function current(at=now()){
  const fresh=frames.filter(f=>at>=f.at&&at-f.at<=ttlMs);
  if(fresh.length<minFrames||at-fresh.at(-1).at>850)return null;
  const votes=new Map();
  for(const f of fresh){
   if(!f.label||f.score<minScore)continue;
   const row=votes.get(f.label)||{label:f.label,count:0,total:0,last:0};
   row.count++;row.total+=f.score;row.last=f.at;votes.set(f.label,row);
  }
  const ranked=[...votes.values()].sort((a,b)=>b.count-a.count||b.total-a.total);
  const best=ranked[0],other=ranked[1];
  if(!best||best.count<minFrames||best.count/fresh.length<.6||
    (other&&best.count-other.count<2))return null;
  const confidence=best.total/best.count;
  // A close second label in the same image prevents firm single-object attribution.
  const nearConflicts=fresh.filter(f=>f.label===best.label&&
    f.competitor>f.score-.08).length;
  if(confidence<minScore||nearConflicts>=2)return null;
  return {label:best.label,confidence,votes:best.count,frames:fresh.length,
    seenAt:best.last,stable:true};
 }
 return {observe,current,reset:()=>{frames=[];},history:()=>frames.map(x=>({...x}))};
}
function createFingerCounter({now=()=>Date.now(),maxGapMs=950,minFrames=3}={}){
 let values=[];
 function observe(count,at=now()){
  if(!Number.isInteger(count)||count<0||count>20||!Number.isFinite(at)){
   values=[];return null;
  }
  values=values.filter(x=>at>=x.at&&at-x.at<=maxGapMs);
  values.push({count,at});values=values.slice(-5);
  const last=values.slice(-minFrames);
  if(last.length===minFrames&&last.every(x=>x.count===last[0].count))
    return last[0].count;
  return null;
 }
 return {observe,reset:()=>{values=[];},history:()=>values.map(x=>({...x}))};
}
const api={createTracker,createFingerCounter};
root.ROBOTITO_OBJECT_TRACKER=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
