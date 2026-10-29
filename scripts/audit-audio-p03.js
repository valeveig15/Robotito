"use strict";
// Offline inventory only. It never initializes YAMNet, opens a microphone,
// uploads content or blesses a human reaction. Source audio is hashed/checked
// by the existing manifest preflight, but NOT decoded by this quick audit.
const fs=require("node:fs");
const {loadManifest}=require("../audio-evaluation-manifest.js");
const {auditedCounts}=require("../audio-p03-readiness.js");
function audit(manifestPath,fieldPaths=[]){
 if(!manifestPath||!Array.isArray(fieldPaths)||fieldPaths.length>100)
  throw Error("Usage: npm run audit:audio:p03 -- /corpus/manifest.json [--field /ruta/diagnostico.json ...]");
 const manifest=loadManifest(manifestPath);
 const reports=fieldPaths.map(file=>{
  const stat=fs.statSync(file);
  if(!stat.isFile()||stat.size>64*1024||stat.size===0)
   throw Error("Invalid or oversized local field report");
  return JSON.parse(fs.readFileSync(file,"utf8"));
 });
 return auditedCounts(manifest,reports);
}
if(require.main===module){
 try{
  const args=process.argv.slice(2);
  const path=args.shift(),fieldPaths=[];
  while(args.length){
   if(args.shift()!=="--field"||!args.length)
    throw Error("Expected repeated --field /ruta/informe.json arguments");
   fieldPaths.push(args.shift());
  }
  console.log(JSON.stringify(audit(path,fieldPaths),null,2));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={audit};
