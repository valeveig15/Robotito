"use strict";
// Shared, dependency-free reproducible generators for Node regressions.
// Fixtures are generated from independent factors, not a phrase-to-answer table.
function makeRandom(seed=17){
 let state=(Number(seed)>>>0)||0x9e3779b9;
 function next(){state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;}
 return {next,int:(size)=>Math.floor(next()*size),pick:(values)=>values[Math.floor(next()*values.length)],
  shuffle(values){const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}};
}
function factorialProduct(factors){
 const dimensions=Object.entries(factors);
 if(!dimensions.length||dimensions.some(([,values])=>!Array.isArray(values)||!values.length))throw Error("Nonempty factor arrays required");
 return dimensions.reduce((rows,[key,values])=>rows.flatMap(row=>values.map((value,index)=>({...row,[key]:value,__indices:{...row.__indices,[key]:index}}))),[{__indices:{}}]);
}
function pairKey(a,ai,b,bi){return a+"="+ai+"|"+b+"="+bi;}
function pairs(row,keys){
 const result=[];
 for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++)
  result.push(pairKey(keys[i],row.__indices[keys[i]],keys[j],row.__indices[keys[j]]));
 return result;
}
function pairwise(factors,{seed=17,maxCandidates=25000}={}){
 const keys=Object.keys(factors),size=Object.values(factors).reduce((p,v)=>p*v.length,1);
 if(size>maxCandidates)throw Error("Candidate matrix too large; partition the factors");
 const random=makeRandom(seed);
 const candidates=random.shuffle(factorialProduct(factors));
 const wanted=new Set();
 for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++)
  for(let ai=0;ai<factors[keys[i]].length;ai++)for(let bi=0;bi<factors[keys[j]].length;bi++)
   wanted.add(pairKey(keys[i],ai,keys[j],bi));
 const covered=new Set(),chosen=[];
 while(covered.size<wanted.size){
  let best=null,bestCount=0;
  for(const row of candidates){
   if(row.__selected)continue;
   const fresh=pairs(row,keys).filter(k=>!covered.has(k)).length;
   if(fresh>bestCount){best=row;bestCount=fresh;}
  }
  if(!best||bestCount===0)throw Error("Pairwise coverage stalled");
  best.__selected=true;chosen.push(best);for(const key of pairs(best,keys))covered.add(key);
 }
 return {cases:chosen.map(({__indices,__selected,...fields})=>fields),
  coveredPairs:covered.size,totalPairs:wanted.size,candidateCount:candidates.length};
}
function sample(seed,factors,count){
 const keys=Object.keys(factors),random=makeRandom(seed);
 return Array.from({length:count},()=>Object.fromEntries(keys.map(k=>[k,random.pick(factors[k])])));
}
function checkProperty(name,cases,property,{seed=17}={}){
 let checked=0;
 for(const row of cases){
  try{property(row,checked);checked++;}
  catch(error){
   const e=new Error("Property "+name+" failed at seed="+seed+" index="+checked+" case="+JSON.stringify(row)+": "+error.message);
   e.cause=error;throw e;
  }
 }
 return checked;
}
module.exports={makeRandom,factorialProduct,pairwise,sample,checkProperty};
