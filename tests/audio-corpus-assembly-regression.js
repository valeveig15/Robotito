"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path"),crypto=require("node:crypto");
const {assemble}=require("../scripts/assemble-audio-corpus.js");
const {loadManifest}=require("../audio-evaluation-manifest.js");
const {canonicalReviewedAnnotations}=require("../audio-review-payload.js");
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"robotito-corpus-assembly-"));
const digest=data=>crypto.createHash("sha256").update(data).digest("hex");
const write=(filename,content)=>fs.writeFileSync(filename,content);
function session(dir,id,group,split,bytes,review="complete"){
 fs.mkdirSync(dir,{recursive:true});
 const audio=path.join(dir,id+".wav");
 write(audio,bytes);
 const value={id,path:id+".wav",rights:"owned",environment:"quiet",
  sourceGroup:group,evaluationSplit:split,annotationReview:review,
  annotations:[],suppressions:[]};
 if(review==="complete"){
  value.audioSha256=digest(bytes);
  value.reviewAnnotationsSha256=digest(canonicalReviewedAnnotations(value));
 }
 const manifest=path.join(dir,"manifest-"+id+".json");
 write(manifest,JSON.stringify({sessions:[value]}));
 return {manifest,audio,session:value};
}
function denied(output,paths,match){
 assert.throws(()=>assemble(output,paths),match);
 assert.equal(fs.existsSync(output),false,
  "A failed assembly must leave no misleading output corpus");
}
try{
 const a=session(path.join(temp,"recording-a"),"one","source-a","development",
  Buffer.from("authorized synthetic wave A"));
 const b=session(path.join(temp,"recording-b"),"two","source-b","test",
  Buffer.from("authorized synthetic wave B"));
 const output=path.join(temp,"combined.json");
 const originalA=fs.readFileSync(a.audio),originalB=fs.readFileSync(b.audio);
 const result=assemble(output,[a.manifest,b.manifest]);
 assert.equal(result.sessions,2);
 assert.equal(result.reviewedSessions,2);
 assert.equal(result.draftSessions,0);
 assert.equal(result.recordingsCopied,0);
 assert.equal(result.sourceGroups,2);
 assert.equal(result.eligibleForYamnetEvaluation,true);
 assert.equal(result.independentlyVerified,false,
  "Declarations of group independence cannot be independently verified");
 const combined=loadManifest(output);
 assert.equal(combined.sessions.length,2);
 assert.equal(combined.sessions[0].path,"recording-a/one.wav");
 assert.equal(combined.sessions[1].path,"recording-b/two.wav");
 assert.equal(combined.sessions.every(x=>x.reviewedAudioDigestVerified&&
  x.reviewedAnnotationDigestVerified),true);
 assert.equal(combined.groupAudit.recordingsBySplit.development,1);
 assert.equal(combined.groupAudit.recordingsBySplit.test,1);
 assert.deepEqual(fs.readFileSync(a.audio),originalA,"Assembling cannot alter original recording");
 assert.deepEqual(fs.readFileSync(b.audio),originalB,"Assembling cannot alter original recording");
 assert.throws(()=>assemble(output,[a.manifest,b.manifest]),/already exists/,
  "Existing combined manifests must not be overwritten");

 const draft=session(path.join(temp,"recording-draft"),"draft","source-c","validation",
  Buffer.from("new synthetic draft recording"),"draft");
 const outputDraft=path.join(temp,"draft-combined.json");
 const draftResult=assemble(outputDraft,[a.manifest,draft.manifest]);
 assert.equal(draftResult.draftSessions,1,"Drafts may be assembled without false certification");
 assert.equal(draftResult.eligibleForYamnetEvaluation,false,
  "Any draft will still be rejected by the real evaluation command");
 assert.equal(loadManifest(outputDraft).sessions[1].annotationReview,"draft");

 denied(path.join(temp,"duplicate-id.json"),[a.manifest,a.manifest],
  /Repeated source manifest/);
 const dupId=session(path.join(temp,"duplicate-id"),"one","source-other","validation",
  Buffer.from("other authorized data"));
 denied(path.join(temp,"id-conflict.json"),[a.manifest,dupId.manifest],
  /Duplicate or missing audio ID/);
 const dupAudio=session(path.join(temp,"duplicate-audio"),"byte-copy","different-source","test",
  Buffer.from(originalA));
 denied(path.join(temp,"same-audio.json"),[a.manifest,dupAudio.manifest],
  /Duplicate audio recording/);
 const sameGroup=session(path.join(temp,"cross-split"),"cross","source-a","test",
  Buffer.from("different original but declared to be same source"));
 denied(path.join(temp,"group-leak.json"),[a.manifest,sameGroup.manifest],
  /appears across evaluation splits/);
 const changed=session(path.join(temp,"changed"),"changed","source-new","validation",
  Buffer.from("original protected recording"));
 write(changed.audio,Buffer.from("changed protected recording"));
 denied(path.join(temp,"changed-audio.json"),[a.manifest,changed.manifest],
  /Reviewed audio SHA-256 mismatch/);
 const tampered=session(path.join(temp,"tampered"),"tampered","source-new","test",
  Buffer.from("valid unchanged protected recording"));
 const obj=JSON.parse(fs.readFileSync(tampered.manifest,"utf8"));
 obj.sessions[0].suppressions=[{startSeconds:0,endSeconds:1}];
 write(tampered.manifest,JSON.stringify(obj));
 denied(path.join(temp,"edited-labels.json"),[a.manifest,tampered.manifest],
  /Reviewed annotation SHA-256 mismatch/);
 const external=os.mkdtempSync(path.join(os.tmpdir(),"robotito-external-corpus-"));
 try{
  const outside=session(path.join(external,"not-in-corpus"),"outside","outside","test",
   Buffer.from("authorized outside recording"));
  denied(path.join(temp,"outside.json"),[a.manifest,outside.manifest],
   /outside output corpus directory/);
 }finally{fs.rmSync(external,{recursive:true,force:true});}
 const openA=JSON.parse(fs.readFileSync(a.manifest,"utf8"));
 const openB=JSON.parse(fs.readFileSync(b.manifest,"utf8"));
 openA.sessions[0].rights="open-license";
 openB.sessions[0].rights="open-license";
 const openAPath=path.join(temp,"recording-a","open-A.json");
 const openBPath=path.join(temp,"recording-b","open-B.json");
 write(openAPath,JSON.stringify({...openA,license:"CC-BY-4.0",source:"author-A"}));
 write(openBPath,JSON.stringify({...openB,license:"CC-BY-NC-3.0",source:"author-B"}));
 denied(path.join(temp,"provenance-mix.json"),[openAPath,openBPath],
  /Conflicting open-license provenance/);
 const validLicense=JSON.parse(fs.readFileSync(openAPath,"utf8"));
 write(openBPath,JSON.stringify({...openB,license:validLicense.license,source:validLicense.source}));
 const licensed=assemble(path.join(temp,"licensed.json"),[openAPath,openBPath]);
 assert.equal(licensed.sessions,2);
 assert.equal(loadManifest(licensed.manifest).manifest.license,"CC-BY-4.0");
 console.log("Robotito local multi-session corpus assembly regression passed");
}finally{fs.rmSync(temp,{recursive:true,force:true});}
