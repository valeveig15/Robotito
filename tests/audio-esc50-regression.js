"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),
 os=require("node:os"),path=require("node:path");
const {build,parseCsv,CATEGORIES}=require("../scripts/prepare-esc50-manifest.js");
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
 ["1-101005-A-0.wav","1","dog"]
 ];
 for(const [name]of records)fs.writeFileSync(path.join(root,"audio",name),Buffer.alloc(10));
 const csv=["filename,fold,target,category,esc10,src_file,take",...records.map(([filename,fold,category])=>
  [filename,fold,0,category,"False","original","A"].join(","))].join("\n");
 fs.writeFileSync(path.join(root,"meta","esc50.csv"),csv);
 const first=build(root,{fold:"1"});
 eq(first.clips.length,3,"Fold excludes test samples and unsupported categories");
 eq(first.clips.map(x=>x.label).sort(),["cough","impact","sneeze"],
  "Positive and hard-negative events map correctly");
 eq(first.clips.every(x=>x.rights==="open-license"),true,
  "Benchmark labels require explicit license metadata");
 eq(first.license,"CC-BY-NC-3.0","Noncommercial restriction preserved");
 eq(first.clips.every(x=>x.environment.startsWith("ESC-50/")),true,
  "Original background source categories are retained");
 const all=build(root,{fold:"all"});
 eq(all.clips.length,4,"All-fold option includes fold two");
 eq(build(root,{fold:"all",limitPerCategory:1}).clips.length,3,
  "Per-category cap preserves diverse targets");
 assert.throws(()=>build(root,{fold:"7"}));checks++;
 assert.throws(()=>build(root,{fold:"1",limitPerCategory:0}));checks++;
 fs.writeFileSync(path.join(root,"meta","esc50.csv"),csv+"\n../../private.wav,1,0,sneezing,False,o,A");
 assert.throws(()=>build(root,{fold:"1"}),/Unsafe/);checks++;
 fs.writeFileSync(path.join(root,"meta","esc50.csv"),csv+"\n1-999999-A-21.wav,1,0,sneezing,False,o,A");
 assert.throws(()=>build(root,{fold:"1"}),/Missing/);checks++;
 eq(Object.keys(CATEGORIES).length,15,"Positive and negative classes listed");
}finally{fs.rmSync(root,{recursive:true,force:true});}
console.log("ESC-50 manifest preparation regression:",checks,"assertions passed");
