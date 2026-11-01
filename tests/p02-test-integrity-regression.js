"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {spawnSync}=require("node:child_process");
const kit=require("./generative-kit.js"),{writeEvidence}=require("./test-evidence.js");
let checks=0;
const equal=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
const throws=(fn,pattern)=>{assert.throws(fn,pattern);checks++;};
async function rejects(fn,pattern){await assert.rejects(fn,pattern);checks++;}
(async()=>{
  const factors={a:[1,2],b:[true,false]};
  for(const row of [{a:1},{a:1,b:true,other:1},{a:3,b:true},null])
    throws(()=>kit.coverageReport([row],factors),/Invalid executed/);
  for(const value of [undefined,NaN,Infinity,-Infinity,-0,{},[],()=>1])
    throws(()=>kit.coveringArray({a:[value]}),/scalars/);
  for(const options of [{maxCases:NaN},{maxCases:0},{candidates:0},{candidates:1.2}])
    throws(()=>kit.coveringArray(factors,options),/positive/);
  throws(()=>kit.coveringArray({a:[1,2]},{maxCases:1}),/exceeded/);
  const rows=kit.coveringArray(factors);
  const duplicate=kit.coverageReport([...rows,rows[0]],factors);
  equal([duplicate.complete,duplicate.uniqueCases,duplicate.duplicateCases],[true,4,1],"Duplicates do not inflate coverage");
  equal(kit.coverageReport([],factors).complete,false,"Unexecuted cases never count as covered");
  throws(()=>kit.assertPropertySelection([{name:"actual",runs:5,checked:0}],{ROBOTITO_REPLAY_PROPERTY:"typo"}),/Unknown/);
  throws(()=>kit.assertPropertySelection([]),/No property/);
  throws(()=>kit.assertPropertySelection([{name:"actual",runs:5,checked:4}],{}),/Incomplete/);
  throws(()=>kit.assertPropertySelection([{name:"actual",runs:5,checked:4}],{ROBOTITO_REPLAY_PROPERTY:"actual"}),/selected cases/);
  for(const env of [{ROBOTITO_REPLAY_CASE:"1"},{ROBOTITO_REPLAY_PROPERTY:""},
    {ROBOTITO_REPLAY_PROPERTY:"x",ROBOTITO_REPLAY_CASE:""},
    {ROBOTITO_REPLAY_PROPERTY:"x",ROBOTITO_REPLAY_CASE:"1.2"}])
    throws(()=>kit.replaySelection(env),/replay|Replay/);
  equal(kit.assertPropertySelection([{name:"actual",runs:5,checked:1}],
    {ROBOTITO_REPLAY_PROPERTY:"actual",ROBOTITO_REPLAY_CASE:"2"}),true,"One selected case is valid");
  await rejects(()=>kit.checkProperty({name:"false-result",runs:1,generate:()=>1,check:()=>false}),/Property returned false/);
  let failure;
  try{await kit.checkProperty({name:"generation",runs:1,seed:42,
    generate:()=>{throw Error("generator broke");},check:()=>{}});}catch(e){failure=e;}
  equal(failure.counterexample.phase,"generate","Generator failure carries replay metadata");
  equal(failure.counterexample.index,0,"Correct generator failure index");
  try{await kit.checkProperty({name:"bad-shrinker",runs:1,generate:()=>9,
    check:()=>{throw Error("original failure");},shrink:()=>{throw Error("broken shrinker");}});}catch(e){failure=e;}
  equal(failure.cause.message,"original failure","Shrinker cannot hide original defect");
  equal(failure.counterexample.shrinkError,"broken shrinker","Secondary error is retained");
  let generated=0;
  try{await kit.checkProperty({name:"finite-shrinking",runs:1,generate:()=>999,
    check:()=>false,shrink:function*(){while(true){generated++;yield 1;}}});}catch(e){failure=e;}
  equal(generated,64,"Infinite iterator is consumed at most 64 times");
  equal(failure.counterexample.minimal,1,"A false property is still false after reduction");
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),"robotito-p02-"));
  try{
    const file=writeEvidence("integrity.json",{suite:"self-test",status:"failed",counterexample:failure.counterexample},{directory});
    const parsed=JSON.parse(fs.readFileSync(file,"utf8"));
    equal(parsed.counterexample.minimal,1,"Machine-readable original failure saved");
    equal(parsed.status,"failed","Report does not claim success");
    throws(()=>writeEvidence("../unsafe.json",{},{directory}),/basename/);
    const env={...process.env,ROBOTITO_TEST_ARTIFACT_DIR:directory,
      ROBOTITO_REPLAY_PROPERTY:"misspelled-property",ROBOTITO_REPLAY_CASE:"0"};
    const result=spawnSync(process.execPath,[path.join(__dirname,"behavior-properties.js")],{env,encoding:"utf8",timeout:30000});
    equal(result.status,1,"The actual properties command rejects an unknown replay");
    assert.match(result.stderr,/Unknown or unexecuted replay property/);checks++;
    const report=JSON.parse(fs.readFileSync(path.join(directory,"properties-"+kit.hashSeed(env.ROBOTITO_TEST_SEED||"17")+"-scale-"+(env.ROBOTITO_PROP_SCALE||1)+".json"),"utf8"));
    equal(report.status,"failed","Real CLI failure artifact exists");
    equal(report.propertyRuns,0,"Zero executed properties is explicit");
    const replayReports=[];
    for(const explicit of [false,true]){
      const replayEnv={...env,ROBOTITO_REPLAY_PROPERTY:"normalization-metamorphic",ROBOTITO_REPLAY_CASE:"12",ROBOTITO_PROP_SCALE:"1"};
      delete replayEnv.ROBOTITO_TEST_SEED;if(explicit)replayEnv.ROBOTITO_TEST_SEED="17";
      const replay=spawnSync(process.execPath,[path.join(__dirname,"behavior-properties.js")],{env:replayEnv,encoding:"utf8",timeout:30000});
      equal(replay.status,0,"Valid default/explicit-seed replay succeeds");
      const saved=JSON.parse(fs.readFileSync(path.join(directory,"properties-"+kit.hashSeed("17")+"-scale-1.json"),"utf8"));
      equal(saved.propertyRuns,1,"Only the requested property case is checked");
      replayReports.push({seed:saved.seed,matrix:saved.matrix,properties:saved.properties});
    }
    equal(replayReports[0],replayReports[1],"Default seed and the copied CLI seed reproduce the same matrix");
  }finally{fs.rmSync(directory,{recursive:true,force:true});}
  console.log("P02 test integrity:",checks,"checks passed");
})().catch(e=>{console.error(e);process.exitCode=1;});
