"use strict";
const assert=require("node:assert/strict");
const kit=require("./generative-kit.js");
let assertions=0;
const equal=(a,b,msg)=>{assert.deepEqual(a,b,msg);assertions++;};
const truth=(a,msg)=>{assert.ok(a,msg);assertions++;};
(async()=>{
  const factors={
    language:["es","en","pt","fr","it","de"],
    channel:["typed","spoken","class"],
    intent:["definition","exercise","weather","task"],
    context:["empty","academic","weather","task"],
    permission:["allowed","denied"],
    device:["desktop","tablet","phone"],
    avatar:["panda","bear"]
  };
  const triples=[["language","channel","intent"],["intent","context","permission"],
    ["channel","device","permission"]];
  for(const seed of [17,42,99]){
    const rows=kit.coveringArray(factors,{seed,criticalTriples:triples,maxCases:400});
    const report=kit.coverageReport(rows,factors,{criticalTriples:triples});
    truth(report.complete,"covering triples + all pairs seed "+seed);
    equal(report.targets,363,"all 241 pairs and 122 risk triples enumerated");
    truth(rows.length<400,"compact covering array");
    equal(rows,kit.coveringArray(factors,{seed,criticalTriples:triples,maxCases:400}),
      "seed reproducibility "+seed);
    truth(new Set(rows.map(r=>JSON.stringify(r))).size===rows.length,"no duplicates");
    for(const row of rows)for(const [key,values] of Object.entries(factors))
      truth(values.includes(row[key]),"legal factor value "+key);
  }
  const missing=kit.coverageReport([{language:"es",channel:"typed"}],
    {language:["es","en"],channel:["typed","spoken"]});
  truth(!missing.complete&&missing.missing.length>0,"missing combinations recognized");
  equal(kit.coveringArray({one:[3,2,1]},{seed:3}),[{one:3},{one:2},{one:1}],"single factor");
  for(const invalid of [
    ()=>kit.coveringArray({a:[]}),
    ()=>kit.coveringArray({a:[1,1]}),
    ()=>kit.coveringArray({a:[0],b:[0],c:[0]},{criticalTriples:[["a","b","x"]]})
  ]){
    assert.throws(invalid);assertions++;
  }
  const rng1=kit.randomSource("session-17"),rng2=kit.randomSource("session-17");
  equal(Array.from({length:100},()=>rng1.int(0,10000)),
    Array.from({length:100},()=>rng2.int(0,10000)),"random stream repeatable");
  const stream=kit.randomSource(99);
  for(let i=0;i<100;i++)truth([1,2,3].includes(stream.pick([1,2,3])),"valid sample");

  const recordedA=[],recordedB=[];
  for(const recorded of [recordedA,recordedB]){
    const result=await kit.checkProperty({name:"self-test",runs:60,seed:42,
      generate:r=>({a:r.int(1,20),b:r.pick(["x","y"])}),
      check:(row,{index})=>{recorded.push({row,index});truth(row.a>=1&&row.a<=20,"bounds");}});
    equal(result.checked,60,"all property cases executed");
  }
  equal(recordedA,recordedB,"property generator repeatable");
  const savedProperty=process.env.ROBOTITO_REPLAY_PROPERTY,savedCase=process.env.ROBOTITO_REPLAY_CASE;
  try{
    process.env.ROBOTITO_REPLAY_PROPERTY="self-replay";
    process.env.ROBOTITO_REPLAY_CASE="5";
    let visited=0;
    const result=await kit.checkProperty({name:"self-replay",runs:20,seed:77,
      generate:r=>r.int(0,500),check:(x,{index})=>{equal(index,5,"selected case index");visited++;}});
    equal(result.checked,1,"replay checks one case");
    equal(visited,1,"one visitor");
    delete process.env.ROBOTITO_REPLAY_PROPERTY;
    delete process.env.ROBOTITO_REPLAY_CASE;
    let failed=false;
    try{
      await kit.checkProperty({name:"self-failure",runs:5,seed:1,
        generate:r=>r.int(5,10),check:()=>{throw Error("simulated counterexample");}});
    }catch(error){
      failed=true;
      truth(/PROPERTY FAILED self-failure/.test(error.message),"descriptive failure");
      truth(/ROBOTITO_REPLAY_CASE=0/.test(error.message),"replay instructions");
      truth(/simulated counterexample/.test(error.message),"root cause retained");
    }
    truth(failed,"failure is not swallowed");
  }finally{
    if(savedProperty===undefined)delete process.env.ROBOTITO_REPLAY_PROPERTY;
    else process.env.ROBOTITO_REPLAY_PROPERTY=savedProperty;
    if(savedCase===undefined)delete process.env.ROBOTITO_REPLAY_CASE;
    else process.env.ROBOTITO_REPLAY_CASE=savedCase;
  }
  console.log("Generative-kit regression:",assertions,"assertions passed");
})().catch(e=>{console.error(e);process.exitCode=1;});
