"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {createHash}=require("node:crypto"),{execFileSync}=require("node:child_process");
const {canonicalReviewedAnnotations}=require("../audio-review-payload.js");
const {audit}=require("../scripts/audit-audio-p03.js");
const {checkedFieldReport}=require("../audio-p03-readiness.js");
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"robotito-p03-audit-"));
const sha=x=>createHash("sha256").update(x).digest("hex");
try{
 const sessions=[];
 for(const [id,group,split,kind,review] of [
  ["s01","source-dev","development","sneeze","complete"],
  ["s02","source-test","test","sneeze","complete"],
  ["s03","source-negative","validation",null,"complete"],
  ["s04","source-draft","development","cough","draft"]]){
  const bytes=Buffer.from("TEST-BYTES-"+id);
  fs.writeFileSync(path.join(temp,id+".wav"),bytes);
  const entry={id,path:id+".wav",environment:"quiet",rights:"owned",
   sourceGroup:group,evaluationSplit:split,deviceClass:"usb",
   annotationReview:review,annotations:kind?
    [{kind,startSeconds:.1,endSeconds:.5}]:[],suppressions:[]};
  if(review==="complete"){
   entry.audioSha256=sha(bytes);
   entry.reviewAnnotationsSha256=sha(canonicalReviewedAnnotations(entry));
  }
  sessions.push(entry);
 }
 const manifest=path.join(temp,"combined.json");
 fs.writeFileSync(manifest,JSON.stringify({sessions}));
 const sample={schemaVersion:1,kind:"robotito-p03-local-microphone-check",
  deviceClass:"usb",environment:"quiet",status:"user-stopped",
  permissionElapsedMs:42,captureSeconds:3.2,sampledFrames:120,
  framesWithRelativeLevel:60,peakRelativeLevel:.08,microphoneTracksStopped:true,
  errorName:null,noAudioRecorded:true,noAudioExported:true,
  physicalHardwareVerifiedAutomatically:false,manualObservations:{
   visibleLevelChange:true,muteBehaviorChecked:true,disconnectReconnectChecked:false
  }};
 const fieldFile=path.join(temp,"field-report.json");
 fs.writeFileSync(fieldFile,JSON.stringify(sample));
 const result=audit(manifest,[fieldFile]);
 assert.equal(result.corpus.sessions,4);
 assert.equal(result.corpus.reviewedSessions,3);
 assert.equal(result.corpus.draftSessions,1);
 assert.equal(result.corpus.allSessionsEligibleForEvaluation,false);
 assert.equal(result.corpus.declaredSourceGroups,4);
 assert.equal(result.corpus.recordingsBySplit.test,1);
 assert.equal(result.perHumanEvent.sneeze.annotatedEvents,2);
 assert.equal(result.perHumanEvent.sneeze.positiveSourceGroupsBySplit.development,1);
 assert.equal(result.perHumanEvent.sneeze.positiveSourceGroupsBySplit.test,1);
 assert.equal(result.perHumanEvent.sneeze.declaredDistinctPureNegativeSourceGroups,1,
  "Only independently declared fully reviewed pure-negative group counts as negative");
 assert.equal(result.perHumanEvent.cough.annotatedEvents,0,
  "Draft labels are not accepted as reviewed positive evidence");
 assert.equal(result.perHumanEvent.cough.draftAnnotatedEvents,1);
 assert.ok(result.perHumanEvent.cough.prospectiveCalibrationGaps.includes("no-independent-test-positive-source"));
 assert.equal(result.fieldChecks.count,1);
 assert.equal(result.fieldChecks.trialsWithNumericInput,1);
 assert.equal(result.fieldChecks.manuallyCheckedMute,1);
 assert.equal(result.fieldChecks.manuallyCheckedDisconnect,0);
 assert.equal(result.fieldChecks.hardwareIndependentlyVerified,false);
 assert.equal(result.evidenceStatus.realHumanRecordingQualityIndependentlyVerified,false);
 assert.equal(result.evidenceStatus.actualAvatarReactionLatencyVerified,false);
 assert.equal(result.evidenceStatus.automaticHumanReactionsApproved,false);
 assert.equal(result.evidenceStatus.p03VerifiedComplete,false);
 assert.equal(result.mediaDecodedByThisAudit,false);
 const output=execFileSync(process.execPath,[
  "scripts/audit-audio-p03.js",manifest,"--field",fieldFile],{
   cwd:path.resolve(__dirname,".."),encoding:"utf8"
  });
 const command=JSON.parse(output);
 assert.deepEqual(command,result,"Standalone CLI and direct APIs must agree");
 const printed=JSON.stringify(result);
 for(const secret of ["source-dev","s01.wav","TEST-BYTES-s01",sessions[0].audioSha256,
  sessions[0].reviewAnnotationsSha256,"deviceId","groupId"]){
  assert.equal(printed.includes(secret),false,"Audit must not expose local identifiers "+secret);
 }
 for(const invalid of [
  {...sample,noAudioRecorded:false},
  {...sample,deviceId:"private-id"},
  {...sample,physicalHardwareVerifiedAutomatically:true},
  {...sample,manualObservations:{visibleLevelChange:true}},
  {...sample,framesWithRelativeLevel:121},
  {...sample,peakRelativeLevel:4},
  {...sample,status:"pretend-verified"}
 ])assert.throws(()=>checkedFieldReport(invalid),/Invalid/);
 // The audit is local inventory, NOT a synthetic or human sensor certification.
 assert.equal(checkedFieldReport(sample).manualInputObserved,true);
 assert.throws(()=>audit(manifest,[path.join(temp,"missing.json")]));
 const altered=JSON.parse(fs.readFileSync(manifest,"utf8"));
 altered.sessions[0].annotations[0].kind="cough";
 fs.writeFileSync(manifest,JSON.stringify(altered));
 assert.throws(()=>audit(manifest,[fieldFile]),/Reviewed annotation SHA-256 mismatch/,
  "Evidence inventory must reject tampered human ground truth before counting it");
 console.log("Robotito P03 private evidence inventory regression passed");
}finally{fs.rmSync(temp,{recursive:true,force:true});}
