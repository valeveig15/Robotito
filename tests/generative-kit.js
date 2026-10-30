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
    if(values.some(v=>v!==null&&!['string','boolean','number'].includes(typeof v)
      ||typeof v==='number'&&(!Number.isFinite(v)||Object.is(v,-0))))
      throw Error("Factor values must be reproducible JSON scalars: "+name);
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
  const names=normalizeFactors(factors);
  if(!Array.isArray(rows))throw Error("Coverage rows must be an array");
  for(const row of rows){
    if(!row||typeof row!=="object"||Object.keys(row).length!==names.length
      ||names.some(k=>!Object.hasOwn(row,k)||!factors[k].some(v=>Object.is(row[k],v))))
      throw Error("Invalid executed coverage row: "+stableJson(row));
  }
  const targets=targetsFor(factors,options);
  const missing=targets.filter(target=>!rows.some(row=>matches(row,target)));
  const uniqueCases=new Set(rows.map(row=>JSON.stringify(names.map(k=>row[k])))).size;
  return {targets:targets.length,covered:targets.length-missing.length,
    missing,complete:missing.length===0,cases:rows.length,uniqueCases,duplicateCases:rows.length-uniqueCases};
}
function coveringArray(factors,{seed=17,criticalTriples=[],maxCases=2048,candidates=24}={}){
  const names=normalizeFactors(factors),random=randomSource(seed);
  if(!Number.isSafeInteger(maxCases)||maxCases<1||!Number.isSafeInteger(candidates)||candidates<1)
    throw Error("maxCases and candidates must be positive safe integers");
  const targets=targetsFor(factors,{criticalTriples});
  const uncovered=new Set(targets.map((_,i)=>i)),cases=[],seen=new Set();
  if(names.length===1){
    if(factors[names[0]].length>maxCases)throw Error("Covering array exceeded maxCases");
    return factors[names[0]].map(value=>({[names[0]]:value}));
  }
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
function replaySelection(env=process.env){
  const name=env.ROBOTITO_REPLAY_PROPERTY,raw=env.ROBOTITO_REPLAY_CASE;
  if(name!==undefined&&(typeof name!=="string"||!name.trim()))throw Error("Invalid replay property");
  if(raw!==undefined&&(!name||!/^\d+$/.test(raw)||!Number.isSafeInteger(Number(raw))))
    throw Error("Replay case requires a property and a nonnegative integer index");
  return {name,index:raw===undefined?null:Number(raw)};
}
function assertPropertySelection(reports,env=process.env){
  const selection=replaySelection(env);
  if(!Array.isArray(reports)||!reports.length)throw Error("No property reports were produced");
  if(selection.name){
    const matched=reports.filter(r=>r.name===selection.name);
    if(matched.length!==1||matched[0].checked<1)throw Error("Unknown or unexecuted replay property: "+selection.name);
    const expected=selection.index===null?matched[0].runs:1;
    if(matched[0].checked!==expected)throw Error("Replay did not execute the selected cases");
  }else if(reports.some(r=>r.checked!==r.runs))throw Error("Incomplete property execution");
  return true;
}
const shellQuote=value=>"'"+String(value).replaceAll("'","'\\''")+"'";
async function checkProperty({name,runs=200,seed=process.env.ROBOTITO_TEST_SEED||17,generate,check,shrink}={}){
  if(typeof name!=="string"||!name||!Number.isSafeInteger(runs)||runs<1
    ||typeof generate!=="function"||typeof check!=="function")throw Error("Invalid property definition");
  const random=randomSource(hashSeed(String(seed)+":"+name));
  const selection=replaySelection();
  const replayProperty=selection.name;
  const specific=replayProperty===name?selection.index:null;
  if(specific!==null&&(!Number.isSafeInteger(specific)||specific<0||specific>=runs))throw Error("Invalid replay index for "+name);
  let checked=0;
  if(replayProperty&&replayProperty!==name)return {name,seed,runs,checked,skipped:true,replay:false};
  const verify=async(value,meta)=>{if(await check(value,meta)===false)throw Error("Property returned false");};
  for(let index=0;index<runs;index++){
    let value,phase="generate";
    try{
      value=await generate(random,index);
      if(specific!==null&&specific!==index)continue;
      phase="check";await verify(value,{index,seed});checked++;
    }
    catch(error){
      let minimal=value,shrinkError=null;
      if(phase==="check"&&typeof shrink==="function"){
        // A shrinker can be lazy or infinite: inspect at most 64 candidates
        // without exhausting the iterator. Keep the smallest failing input.
        let examined=0,smallest=stableJson(value);
        try{
          const iterator=shrink(value)[Symbol.iterator]();
          try{
            while(examined++<64){
              const item=iterator.next();if(item.done)break;
              const candidate=item.value,encoded=stableJson(candidate);
              if(encoded.length>smallest.length||
                 (encoded.length===smallest.length&&encoded>=smallest))continue;
              try{await verify(candidate,{index,seed});}
              catch{minimal=candidate;smallest=encoded;}
            }
          }finally{iterator.return?.();}
        }catch(e){shrinkError=String(e?.message||e);}
      }
      const replay="ROBOTITO_TEST_SEED="+shellQuote(seed)+" ROBOTITO_REPLAY_PROPERTY="+shellQuote(name)
        +" ROBOTITO_REPLAY_CASE="+index+" ROBOTITO_PROP_SCALE="+shellQuote(process.env.ROBOTITO_PROP_SCALE||1);
      const result=new Error("PROPERTY FAILED "+name+" seed="+seed+" case="+index
        +"\nInput: "+stableJson(value)+"\nShrunk: "+stableJson(minimal)
        +"\nReproduce: "+replay+" npm run test:properties"
        +"\nCause: "+String(error?.stack||error)+(shrinkError?"\nShrinker: "+shrinkError:""));
      result.cause=error;
      result.counterexample={name,seed,index,phase,input:value,minimal,shrinkError,replay:replay+" npm run test:properties"};
      throw result;
    }
  }
  return {name,seed,runs,checked,replay:specific!==null};
}
module.exports={hashSeed,randomSource,targetsFor,coverageReport,coveringArray,checkProperty,replaySelection,assertPropertySelection};
