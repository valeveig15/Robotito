"use strict";
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const {normalizeDeviceClass}=require("./audio-device-metadata.js");
const {normalizeSourceGroup,normalizeEvaluationSplit,sourceAudit}=require("./audio-source-groups.js");
const {assertNoMaskedEvents}=require("./audio-annotation-integrity.js");
const {normalizeAnnotationReview,verifyReviewedAudioDigest,
 verifyReviewedAnnotationDigest}=require("./audio-annotation-review.js");
const {canonicalReviewedAnnotations}=require("./audio-review-payload.js");
const labels=new Set(["clap","laugh","cry","cough","sneeze","music","voice","impact","noise","silence","unknown"]);
const human=new Set(["clap","laugh","cry","cough","sneeze"]);
const rights=new Set(["owned","consented","open-license"]);
const nonempty=x=>typeof x==="string"&&!!x.trim();
function range(x){
 if(!x||!Number.isFinite(x.startSeconds)||!Number.isFinite(x.endSeconds)||
    x.startSeconds<0||x.startSeconds>=x.endSeconds)
  throw Error("Invalid event or suppression time interval");
}
function contained(root,file){
 const diff=path.relative(root,file);
 return !!diff&&diff!==".."&&!diff.startsWith(".."+path.sep)&&!path.isAbsolute(diff);
}
// Verify byte-identical recordings locally before any model inference.
// Fixed-size chunks avoid loading 50-MiB clips into memory merely to hash.
// File digests never leave this process or appear in generated reports.
function fingerprint(file){
 const hash=crypto.createHash("sha256"),chunk=Buffer.allocUnsafe(64*1024);
 const fd=fs.openSync(file,"r");
 try{
  let count;
  while((count=fs.readSync(fd,chunk,0,chunk.length,null))>0)
   hash.update(chunk.subarray(0,count));
 }finally{fs.closeSync(fd);}
 return hash.digest("hex");
}
// Shared validation lets the local corpus assembler check the entire
// prospective dataset BEFORE writing anything. A single entrypoint applies
// the same rights, SHA-256, source-group and path rules to all workflows.
function validateManifestData(manifest,base){
 if(!manifest||typeof manifest!=="object"||Array.isArray(manifest))
  throw Error("Audio manifest must be an object");
 const clips=manifest.clips??[],sessions=manifest.sessions??[];
 if(!Array.isArray(clips)||!Array.isArray(sessions)||!clips.length&&!sessions.length)
  throw Error("Manifest needs labelled clips or annotated continuous sessions");
 const ids=new Set(),seenAudio=new Map(),all=[];
 for(const [rows,continuous]of [[clips,false],[sessions,true]]){
  for(const item of rows){
   if(!nonempty(item?.id)||ids.has(item.id))throw Error("Duplicate or missing audio ID");
   ids.add(item.id);
   if(!nonempty(item.path)||!nonempty(item.environment)||
      !rights.has(item.rights)||!continuous&&!labels.has(item.label))
    throw Error("Invalid audio path, label, rights or environment for "+item.id);
   if(item.rights==="open-license"&&(!nonempty(manifest.license)||!nonempty(manifest.source)))
    throw Error("Open-license audio requires license and source provenance");
   if(continuous){
    if(!Array.isArray(item.annotations)||!Array.isArray(item.suppressions??[]))
     throw Error("Continuous audio needs annotations and optional suppressions");
    for(const x of item.annotations){
     if(!human.has(x?.kind))throw Error("Invalid human event annotation");
     range(x);
    }
    for(const x of item.suppressions??[])range(x);
    // A labelled event must not be declared ground truth in redacted time.
    assertNoMaskedEvents(item.annotations,item.suppressions??[]);
   }
   // Validate the manually supplied coarse device category up front.
   // Never auto-collect a browser device ID or serial number.
   const deviceClass=normalizeDeviceClass(item.deviceClass);
   const sourceGroup=normalizeSourceGroup(item.sourceGroup);
   const evaluationSplit=normalizeEvaluationSplit(item.evaluationSplit,sourceGroup);
   const resolved=path.resolve(base,item.path);
   if(!contained(base,resolved))throw Error("Audio leaves manifest folder");
   const physical=fs.realpathSync(resolved);
   if(!contained(base,physical))throw Error("Audio symlink leaves manifest folder");
   const stat=fs.statSync(physical);
   if(!stat.isFile()||stat.size<=0||stat.size>50*1024*1024)
    throw Error("Invalid or oversized audio file");
   // IDs and filenames alone do not make observations independent.
   // Reject copies and symlink/hard-link aliases, even across clips and
   // continuous sessions, before YAMNet can inflate sample counts.
   const digest=fingerprint(physical),previous=seenAudio.get(digest);
   if(previous)throw Error("Duplicate audio recording: "+item.id+" repeats "+previous);
   seenAudio.set(digest,item.id);
   const annotationReview=continuous?normalizeAnnotationReview(item.annotationReview):undefined;
   // Fingerprint is already calculated to reject duplicated recordings.
   // Bind a completed annotation review to THESE actual bytes as well.
   // Drafts/legacy unreviewed manifests remain usable for offline preflight.
   const reviewedAudioDigestVerified=continuous?
    verifyReviewedAudioDigest(annotationReview,item.audioSha256,digest,item.id):false;
   const reviewedAnnotationDigestVerified=continuous?
    verifyReviewedAnnotationDigest(annotationReview,item.reviewAnnotationsSha256,
     crypto.createHash("sha256").update(canonicalReviewedAnnotations({
      ...item,suppressions:item.suppressions??[]
     })).digest("hex"),item.id):false;
   all.push({...item,deviceClass,sourceGroup,evaluationSplit,
    ...(continuous?{annotationReview,reviewedAudioDigestVerified,
      reviewedAnnotationDigestVerified}:{}),
    absolutePath:physical});
  }
 }
 // Reject leaks between development and validation/test before loading YAMNet.
 // This verifies declared groups only; it cannot discover undeclared related takes.
 const groupAudit=sourceAudit(all);
 return {base,manifest,clips:all.slice(0,clips.length),sessions:all.slice(clips.length),groupAudit};
}
function loadManifest(location){
 const actual=fs.realpathSync(location),base=path.dirname(actual);
 return validateManifestData(JSON.parse(fs.readFileSync(actual,"utf8")),base);
}
module.exports={loadManifest,validateManifestData};
