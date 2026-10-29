"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),
 os=require("node:os"),path=require("node:path");
const {build,parseCsv,CATEGORIES}=require("../scripts/prepare-esc50-manifest.js");
const {loadManifest}=require("../audio-evaluation-manifest.js");
let checks=0;
function eq(a,b,n){assert.deepEqual(a,b,n);checks++;}
eq(parseCsv('filename,fold,category,"quoted,cell"'),
 ["filename","fold","category","quoted,cell"],"Quoted CSV is parsed");
const root=fs.mkdtempSync(path.join(os.tmpdir(),"robotito-esc50-"));
try{
 fs.mkdirSync(path.join(root,"meta"));fs.mkdirSync(path.join(root,"audio"));
 const records=[
 ["1-101001-A-21.wav","1","sneezing"],
 ["2-101002-A-21.wav","2","sneezing"],
 ["1-101003-B-17.wav","1","door_knock"],
 ["1-101004-A-38.wav","1","coughing"],
 ["4-101006-A-21.wav","4","sneezing"],
 ["5-101007-A-21.wav","5","sneezing"],
 ["1-101005-A-0.wav","1","dog"]
 ];
 for(const [name]of records)fs.writeFileSync(path.join(root,"audio",name),
  Buffer.from("distinct synthetic fixture for "+name));
 const csv=["filename,fold,target,category,esc10,src_file,take",...records.map(([filename,fold,category])=>
  [filename,fold,0,category,"False","original","A"].join(","))].join("\n");
 fs.writeFileSync(path.join(root,"meta","esc50.csv"),csv);
 const first=build(root,{fold:"1"});
 eq(first.clips.length,3,"Fold excludes test samples and unsupported categories");
 eq(first.clips.map(x=>x.label).sort(),["cough","impact","sneeze"],
  "Positive and hard-negative events map correctly");
 eq(first.clips.every(x=>x.rights==="open-license"),true,
  "Benchmark labels require explicit license metadata");
 eq(first.clips.every(x=>x.evaluationSplit==="development"),true,
  "First fold is development only, never passed off as independent test");
 eq(first.clips[0].sourceGroup.startsWith("esc50-source-"),true,
  "Original Freesound IDs, not individual crops, are the independence units");
 eq(first.license,"CC-BY-NC-3.0","Noncommercial restriction preserved");
 eq(first.clips.every(x=>x.environment.startsWith("ESC-50/")),true,
  "Original background source categories are retained");
 const all=build(root,{fold:"all"});
 eq(all.clips.length,6,"All-fold option includes distinct development, validation and test WAVs");
 eq(all.clips.filter(x=>x.evaluationSplit==="validation").length,1,
  "Fold 4 is explicitly validation");
 eq(all.clips.filter(x=>x.evaluationSplit==="test").length,1,
  "Fold 5 stays untouched test data");
 eq(all.declaredSourceGroupCount,6,
  "Original Freesound source-group identities are audited before export");
 eq(all.verifiedRealWorldIndependence,false,
  "Source IDs declared by the dataset cannot certify physical-source independence");
 fs.writeFileSync(path.join(root,"from-esc50.json"),JSON.stringify(all));
 eq(loadManifest(path.join(root,"from-esc50.json")).groupAudit.recordingsBySplit.test,1,
  "Real shared corpus preflight preserves held-out test fold");
 eq(build(root,{fold:"all",limitPerCategory:1}).clips.length,3,
  "Per-category cap is exploratory only and need not retain test folds");
 assert.throws(()=>build(root,{fold:"7"}));checks++;
 assert.throws(()=>build(root,{fold:"1",limitPerCategory:0}));checks++;
 fs.writeFileSync(path.join(root,"meta","esc50.csv"),csv+"\n../../private.wav,1,0,sneezing,False,o,A");
 assert.throws(()=>build(root,{fold:"1"}),/Unsafe/);checks++;
 fs.writeFileSync(path.join(root,"meta","esc50.csv"),csv+"\n1-999999-A-21.wav,1,0,sneezing,False,o,A");
 assert.throws(()=>build(root,{fold:"1"}),/Missing/);checks++;
 fs.writeFileSync(path.join(root,"audio","5-101001-B-21.wav"),Buffer.alloc(10));
 fs.writeFileSync(path.join(root,"meta","esc50.csv"),csv+
  "\n5-101001-B-21.wav,5,0,sneezing,False,o,B");
 assert.throws(()=>build(root,{fold:"all"}),/appears across evaluation splits/);
 checks++;
 fs.writeFileSync(path.join(root,"meta","esc50.csv"),csv+
  "\n4-101006-A-21.wav,5,0,sneezing,False,o,A");
 assert.throws(()=>build(root,{fold:"all"}),/Unsafe or invalid ESC-50 filename\/fold/);
 checks++;
 eq(Object.keys(CATEGORIES).length,15,"Positive and negative classes listed");
}finally{fs.rmSync(root,{recursive:true,force:true});}
console.log("ESC-50 manifest preparation regression:",checks,"assertions passed");
