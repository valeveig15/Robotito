"use strict";
// Deterministic generators for Robotito tests. No production dependency.
// A covering array certifies all individual/pair interactions plus selected
// higher-risk triples; it does not claim to cover the entire Cartesian space.
function hashSeed(value){
  if(Number.isFinite(value))return Number(value)>>>0;
  let hash=2166136261;
  for(const char of String(value??"17")){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}
  return hash>>>0;
}
function randomSource(seed=17){
  let state=hashSeed(seed)||0x9e3779b9;
  function next(){
    state^=state<<13;state^=state>>>17;state^=state<<5;
    return (state>>>0)/4294967296;
  }
  return Object.freeze({
    next,
    int:(lower,upper)=>{
      if(!Number.isSafeInteger(lower)||!Number.isSafeInteger(upper)||upper<lower)throw Error("Invalid RNG interval");
      return lower+Math.floor(next()*(upper-lower+1));
    },
    pick:values=>{
      if(!Array.isArray(values)||!values.length)throw Error("Empty RNG options");
      return values[Math.floor(next()*values.length)];
    },
    bool:(p=.5)=>next()<p,
    seed:hashSeed(seed)
  });
}
function normalizeFactors(factors){
  if(!factors||typeof factors!=="object"||Array.isArray(factors))throw Error("Factors must be a named object");
  const names=Object.keys(factors);
  if(!names.length)throw Error("At least one factor is required");
  for(const name of names){
    const values=factors[name];
    if(!Array.isArray(values)||!values.length||new Set(values.map(v=>JSON.stringify(v))).size!==values.length)
      throw Error("Each factor needs distinct, nonempty values: "+name);
  }
  return names;
}
function targetsFor(factors,{criticalTriples=[]}={}){
  const names=normalizeFactors(factors),targets=[];
  const add=(keys)=>{
    const values=keys.map(key=>factors[key]);
    const walk=(i,row)=>{
      if(i===keys.length){targets.push({keys:[...keys],values:[...row]});return;}
      for(let n=0;n<values[i].length;n++)walk(i+1,[...row,values[i][n]]);
    };
    walk(0,[]);
  };
  if(names.length===1)add([names[0]]);
  for(let a=0;a<names.length;a++)for(let b=a+1;b<names.length;b++)add([names[a],names[b]]);
  const seen=new Set();
  for(const triple of criticalTriples){
    if(!Array.isArray(triple)||triple.length!==3||new Set(triple).size!==3||triple.some(x=>!names.includes(x)))
      throw Error("Invalid critical triple: "+JSON.stringify(triple));
    const ordered=names.filter(x=>triple.includes(x)),id=ordered.join("\u0000");
    if(!seen.has(id)){seen.add(id);add(ordered);}
  }
  return targets;
}
function matches(row,target){
  return target.keys.every((key,i)=>Object.is(row[key],target.values[i]));
}
function coverageReport(rows,factors,options={}){
  const targets=targetsFor(factors,options);
  const missing=targets.filter(target=>!rows.some(row=>matches(row,target)));
  return {targets:targets.length,covered:targets.length-missing.length,
    missing,complete:missing.length===0,cases:rows.length};
}
function coveringArray(factors,{seed=17,criticalTriples=[],maxCases=2048,candidates=24}={}){
  const names=normalizeFactors(factors),random=randomSource(seed);
  const targets=targetsFor(factors,{criticalTriples});
  const uncovered=new Set(targets.map((_,i)=>i)),cases=[],seen=new Set();
  if(names.length===1)return factors[names[0]].map(value=>({[names[0]]:value}));
  while(uncovered.size){
    if(cases.length>=maxCases)throw Error("Covering array exceeded maxCases with "+uncovered.size+" targets uncovered");
    const anchor=targets[uncovered.values().next().value];
    let best=null,bestGain=-1;
    for(let trial=0;trial<Math.max(1,candidates);trial++){
      const candidate=Object.fromEntries(names.map(k=>[k,random.pick(factors[k])]));
      anchor.keys.forEach((key,i)=>candidate[key]=anchor.values[i]);
      let gain=0;
      for(const index of uncovered)if(matches(candidate,targets[index]))gain++;
      if(gain>bestGain){best=candidate;bestGain=gain;}
    }
    const fingerprint=JSON.stringify(names.map(k=>best[k]));
    if(seen.has(fingerprint))throw Error("Duplicate covering case without progress");
    seen.add(fingerprint);cases.push(best);
    for(const index of uncovered)if(matches(best,targets[index]))uncovered.delete(index);
  }
  const report=coverageReport(cases,factors,{criticalTriples});
  if(!report.complete)throw Error("Coverage incomplete: "+JSON.stringify(report.missing.slice(0,4)));
  return cases;
}
function stableJson(value){
  try{
    const encoded=JSON.stringify(value,(key,entry)=>typeof entry==="bigint"?String(entry):entry);
    return typeof encoded==="string"?encoded:String(value);
  }catch{return String(value);}
}
async function checkProperty({name,runs=200,seed=process.env.ROBOTITO_TEST_SEED||17,generate,check,shrink}={}){
  if(typeof name!=="string"||!name||!Number.isSafeInteger(runs)||runs<1
    ||typeof generate!=="function"||typeof check!=="function")throw Error("Invalid property definition");
  const random=randomSource(hashSeed(String(seed)+":"+name));
  const replayProperty=process.env.ROBOTITO_REPLAY_PROPERTY;
  const replayCase=process.env.ROBOTITO_REPLAY_CASE;
  const specific=replayProperty===name&&replayCase!==undefined?Number(replayCase):null;
  if(specific!==null&&(!Number.isSafeInteger(specific)||specific<0||specific>=runs))throw Error("Invalid replay index for "+name);
  let checked=0;
  for(let index=0;index<runs;index++){
    const value=generate(random,index);
    if(replayProperty&&replayProperty!==name)continue;
    if(specific!==null&&specific!==index)continue;
    try{await check(value,{index,seed});checked++;}
    catch(error){
      let minimal=value;
      if(typeof shrink==="function"){
        // A shrinker can be lazy or infinite: inspect at most 64 candidates
        // without exhausting the iterator. Keep the smallest failing input.
        let examined=0,smallest=stableJson(value);
        for(const candidate of shrink(value)){
          if(examined++>=64)break;
          const encoded=stableJson(candidate);
          if(encoded.length>smallest.length||
             (encoded.length===smallest.length&&encoded>=smallest))continue;
          try{await check(candidate,{index,seed});}
          catch{minimal=candidate;smallest=encoded;}
        }
      }
      const replay="ROBOTITO_TEST_SEED="+seed+" ROBOTITO_REPLAY_PROPERTY='"+name
        +"' ROBOTITO_REPLAY_CASE="+index;
      const result=new Error("PROPERTY FAILED "+name+" seed="+seed+" case="+index
        +"\nInput: "+stableJson(value)+"\nShrunk: "+stableJson(minimal)
        +"\nReproduce: "+replay+" npm run test:properties"
        +"\nCause: "+String(error?.stack||error));
      result.cause=error;throw result;
    }
  }
  return {name,seed,runs,checked,replay:specific!==null};
}
module.exports={hashSeed,randomSource,targetsFor,coverageReport,coveringArray,checkProperty};
