"use strict";
// P03: assemble independent, already-authorized session manifests into one
// local dataset without copying audio or weakening the existing validators.
// Usage: npm run assemble:audio -- /corpus/combined.json /corpus/a/manifest.json /corpus/b/manifest.json
const fs=require("node:fs"),path=require("node:path");
const {loadManifest,validateManifestData}=require("../audio-evaluation-manifest.js");
const FIELDS=["id","label","environment","deviceClass","sourceGroup",
 "evaluationSplit","rights","annotations","suppressions","annotationReview",
 "audioSha256","reviewAnnotationsSha256"];
function within(root,file){
 const diff=path.relative(root,file);
 return diff!==""&&diff!==".."&&!diff.startsWith(".."+path.sep)&&!path.isAbsolute(diff);
}
function provenance(claims){
 const licenses=claims.filter(x=>x.rights==="open-license");
 if(!licenses.length)return {};
 const first=licenses[0];
 for(const x of licenses.slice(1)){
  if(x.license!==first.license||x.source!==first.source)
   throw Error("Conflicting open-license provenance: separate the licensed corpora");
 }
 return {license:first.license,source:first.source,
  ...(licenses.every(x=>x.citation===first.citation)&&first.citation?
   {citation:first.citation}:{})};
}
function assemble(output,inputs){
 if(typeof output!=="string"||!output.endsWith(".json")||
    !Array.isArray(inputs)||inputs.length<2)
  throw Error("Usage: assemble:audio OUTPUT.json INPUT1.json INPUT2.json [more manifests]");
 const destination=path.resolve(output);
 const outputRoot=fs.realpathSync(path.dirname(destination));
 // An existing manifest should never be overwritten silently, even if it is
 // a previous report or one of the input manifests.
 if(fs.existsSync(destination))throw Error("Output corpus manifest already exists");
 const inputPaths=new Set(),allClips=[],allSessions=[],licenses=[];
 for(const input of inputs){
  const actual=fs.realpathSync(input);
  if(inputPaths.has(actual))throw Error("Repeated source manifest");
  inputPaths.add(actual);
  const {manifest,clips,sessions}=loadManifest(actual);
  for(const item of [...clips,...sessions]){
   if(!within(outputRoot,item.absolutePath))
    throw Error("Source recording is outside output corpus directory: choose a common parent folder");
   const ref=path.relative(outputRoot,item.absolutePath).split(path.sep).join("/");
   const clean=Object.fromEntries(FIELDS.filter(k=>item[k]!==undefined)
    .map(k=>[k,item[k]]));
   clean.path=ref;
   (sessions.includes(item)?allSessions:allClips).push(clean);
   if(item.rights==="open-license")
    licenses.push({rights:item.rights,license:manifest.license,source:manifest.source,
     citation:manifest.citation});
  }
 }
 const merged={name:"Robotito — corpus combinado local P03",
  ...provenance(licenses),clips:allClips,sessions:allSessions};
 // One cross-manifest preflight catches repeated IDs, byte-identical copies,
 // sources leaked between partitions, changed reviewed files, unsafe paths,
 // absent consent and open-license provenance BEFORE any write.
 const verified=validateManifestData(merged,outputRoot);
 let fd;
 try{
  fd=fs.openSync(destination,"wx",0o600);
  fs.writeFileSync(fd,JSON.stringify(merged,null,2)+"\n","utf8");
 }finally{if(fd!==undefined)fs.closeSync(fd);}
 return {
  manifest:destination,clips:verified.clips.length,sessions:verified.sessions.length,
  draftSessions:verified.sessions.filter(x=>x.annotationReview!=="complete").length,
  reviewedSessions:verified.sessions.filter(x=>x.annotationReview==="complete").length,
  sourceGroups:verified.groupAudit.sourceGroups,
  independentlyVerified:false,recordingsCopied:0,
  eligibleForYamnetEvaluation:verified.sessions.every(x=>x.annotationReview==="complete")
 };
}
if(require.main===module){
 try{
  const report=assemble(process.argv[2],process.argv.slice(3));
  console.log("Local audio corpus assembled; source audio files were not copied or uploaded.");
  console.log(JSON.stringify(report,null,2));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={assemble};
