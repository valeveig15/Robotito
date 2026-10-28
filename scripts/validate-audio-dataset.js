"use strict";
// Offline local media validation: NO network, Worker, YAMNet, microphone or
// saved audio/PCM. Useful before authorizing an expensive model evaluation.
// Usage: npm run validate:audio -- /path/to/manifest.json
const {chromium}=require("playwright");
const {loadManifest}=require("../audio-evaluation-manifest.js");
const {inspectCorpus}=require("../audio-media-preflight.js");
async function main(file=process.argv[2]){
 if(!file)throw Error("Usage: npm run validate:audio -- /path/to/manifest.json");
 const {clips,sessions,groupAudit}=loadManifest(file);
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  await page.goto("about:blank");
  const result=await inspectCorpus(page,[...clips,...sessions]);
  console.log("Authorized audio corpus preflight passed (no sound model loaded):");
  console.log(JSON.stringify({...result,clips:clips.length,sessions:sessions.length,
   sourceGroups:groupAudit.sourceGroups,
   ungroupedRecordings:groupAudit.ungroupedRecordings,
   independentlyVerified:false},null,2));
  return result;
 }finally{await browser?.close();}
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={main};
