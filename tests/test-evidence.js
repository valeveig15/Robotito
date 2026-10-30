"use strict";
// Reports contain synthetic test fixtures only. Never feed user/browser profiles here.
const fs=require("node:fs"),path=require("node:path");
const {execFileSync}=require("node:child_process");
function sourceRevision(){
  const cwd=path.resolve(__dirname,"..");
  try{
    return {commit:execFileSync("git",["rev-parse","HEAD"],{cwd,encoding:"utf8"}).trim(),
      dirty:!!execFileSync("git",["status","--porcelain"],{cwd,encoding:"utf8"}).trim()};
  }catch{return {commit:null,dirty:null};}
}
function writeEvidence(filename,report,{directory=process.env.ROBOTITO_TEST_ARTIFACT_DIR||path.resolve(__dirname,"../test-results")}={}){
  if(!/^[a-zA-Z0-9_-]+\.json$/.test(filename))throw Error("Evidence filename must be a plain JSON basename");
  fs.mkdirSync(directory,{recursive:true});
  const target=path.join(directory,filename),temporary=target+".tmp-"+process.pid;
  fs.writeFileSync(temporary,JSON.stringify({schemaVersion:1,recordedAt:new Date().toISOString(),
    runtime:{node:process.version,platform:process.platform},source:sourceRevision(),...report},null,2)+"\n");
  fs.renameSync(temporary,target);return target;
}
module.exports={writeEvidence};
