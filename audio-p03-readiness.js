"use strict";
// This audits the COVERAGE of a local authorized corpus and coarse voluntary
// microphone reports. It must never certify human annotation quality, physical
// hardware, source independence, thresholds or automatic avatar reactions.
const {HUMAN}=require("./audio-calibration.js");
const {SPLITS}=require("./audio-source-groups.js");
const {normalizeDeviceClass}=require("./audio-device-metadata.js");
const DEVICES=["unspecified","phone","tablet","built-in","headset","usb","recorder","other"];
const ENVIRONMENTS=["quiet","conversation","tv-music","street","other"];
const FIELD_KEYS=new Set(["schemaVersion","kind","deviceClass","environment","status",
 "permissionElapsedMs","captureSeconds","sampledFrames","framesWithRelativeLevel",
 "peakRelativeLevel","microphoneTracksStopped","errorName","noAudioRecorded",
 "noAudioExported","physicalHardwareVerifiedAutomatically","manualObservations"]);
const FIELD_STATUS=new Set(["user-stopped","microphone-track-ended",
 "permission-or-capture-error","permission-request-canceled"]);
const boolean=x=>typeof x==="boolean";
const unsigned=n=>Number.isFinite(n)&&n>=0;
function checkedFieldReport(report){
 if(!report||typeof report!=="object"||Array.isArray(report)||
    Object.keys(report).some(k=>!FIELD_KEYS.has(k)))
  throw Error("Invalid or identifying field check report keys");
 if(report.schemaVersion!==1||report.kind!=="robotito-p03-local-microphone-check"||
    !DEVICES.includes(report.deviceClass)||!ENVIRONMENTS.includes(report.environment)||
    !FIELD_STATUS.has(report.status)||
    (report.permissionElapsedMs!==null&&!unsigned(report.permissionElapsedMs))||
    !unsigned(report.captureSeconds)||!Number.isSafeInteger(report.sampledFrames)||
    report.sampledFrames<0||!Number.isSafeInteger(report.framesWithRelativeLevel)||
    report.framesWithRelativeLevel<0||report.framesWithRelativeLevel>report.sampledFrames||
    !unsigned(report.peakRelativeLevel)||report.peakRelativeLevel>1||
    !boolean(report.microphoneTracksStopped)||
    !boolean(report.noAudioRecorded)||report.noAudioRecorded!==true||
    !boolean(report.noAudioExported)||report.noAudioExported!==true||
    report.physicalHardwareVerifiedAutomatically!==false||
    ![null,"NotAllowedError","NotFoundError","NotReadableError","AbortError",
     "SecurityError","OverconstrainedError","Unavailable"].includes(report.errorName))
  throw Error("Invalid field check report values");
 const observations=report.manualObservations;
 if(!observations||typeof observations!=="object"||Array.isArray(observations)||
    Object.keys(observations).sort().join("|")!==
      ["disconnectReconnectChecked","muteBehaviorChecked","visibleLevelChange"].join("|")||
    Object.values(observations).some(x=>!boolean(x)))
  throw Error("Invalid field check manual observations");
 return {
  deviceClass:normalizeDeviceClass(report.deviceClass),
  environment:report.environment,
  status:report.status,
  safeStopObserved:report.microphoneTracksStopped,
  numericalInputObserved:report.sampledFrames>0&&report.framesWithRelativeLevel>0,
  manualInputObserved:observations.visibleLevelChange,
  manualMuteChecked:observations.muteBehaviorChecked,
  manualDisconnectChecked:observations.disconnectReconnectChecked
 };
}
function auditedCounts({clips,sessions,groupAudit},fieldReports=[]){
 if(!Array.isArray(clips)||!Array.isArray(sessions)||
    !groupAudit||!Array.isArray(fieldReports))
  throw Error("Expected preflight-validated audio manifest and optional field reports");
 const physical=fieldReports.map(checkedFieldReport);
 const all=[...clips,...sessions];
 const completeSessions=sessions.filter(x=>x.annotationReview==="complete");
 const drafts=sessions.length-completeSessions.length;
 const grouped=all.filter(x=>x.sourceGroup);
 const byDevice=Object.fromEntries(DEVICES.map(d=>[d,all.filter(x=>
  (x.deviceClass||"unspecified")===d).length]));
 const perKind={};
 for(const kind of HUMAN){
  const positives=completeSessions.flatMap(x=>x.annotations.filter(a=>a.kind===kind)
   .map(a=>({split:x.evaluationSplit||"unspecified",group:x.sourceGroup,device:x.deviceClass})));
  const positiveClips=clips.filter(x=>x.label===kind);
  const presentGroupKeys=new Set([...completeSessions.filter(x=>x.annotations.some(a=>a.kind===kind)),
   ...positiveClips].map(x=>x.sourceGroup).filter(Boolean));
  const negativeSessions=completeSessions.filter(x=>!x.annotations.some(a=>a.kind===kind));
  const pureNegativeGroups=new Set(negativeSessions.map(x=>x.sourceGroup)
   .filter(g=>g&&!presentGroupKeys.has(g)));
  const positiveSourceGroupsBySplit=Object.fromEntries(SPLITS.map(split=>[split,
   new Set([...completeSessions.filter(x=>(x.evaluationSplit||"unspecified")===split&&
      x.annotations.some(a=>a.kind===kind)),
    ...positiveClips.filter(x=>(x.evaluationSplit||"unspecified")===split)]
    .map(x=>x.sourceGroup).filter(Boolean)).size]));
  perKind[kind]={
   annotatedEvents:positives.length,
   draftAnnotatedEvents:sessions.filter(x=>x.annotationReview!=="complete")
    .reduce((n,x)=>n+x.annotations.filter(a=>a.kind===kind).length,0),
   positiveClips:positiveClips.length,
   reviewedNegativeSessions:negativeSessions.length,
   declaredDistinctPositiveSourceGroups:presentGroupKeys.size,
   declaredDistinctPureNegativeSourceGroups:pureNegativeGroups.size,
   positiveSourceGroupsBySplit,
   prospectiveCalibrationGaps:[
    ...(positiveSourceGroupsBySplit.development===0?["no-development-positive-source"]:[]),
    ...(positiveSourceGroupsBySplit.validation===0?["no-validation-positive-source"]:[]),
    ...(positiveSourceGroupsBySplit.test===0?["no-independent-test-positive-source"]:[]),
    ...(pureNegativeGroups.size===0?["no-declared-pure-negative-source"]:[])
   ]
  };
 }
 const summary={
  schemaVersion:1,kind:"robotito-p03-evidence-readiness",
  manifestIntegrityPreflightPassed:true,
  mediaDecodedByThisAudit:false,
  corpus:{clips:clips.length,sessions:sessions.length,reviewedSessions:completeSessions.length,
   draftSessions:drafts,declaredSourceGroups:groupAudit.sourceGroups,
   ungroupedRecordings:groupAudit.ungroupedRecordings,
   recordingsBySplit:groupAudit.recordingsBySplit,byDevice,
   allSessionsEligibleForEvaluation:drafts===0},
  perHumanEvent:perKind,
  fieldChecks:{count:physical.length,
   stoppedWithNoAudioExport:physical.filter(x=>x.safeStopObserved).length,
   trialsWithNumericInput:physical.filter(x=>x.numericalInputObserved).length,
   voluntarilyMarkedInput:physical.filter(x=>x.manualInputObserved).length,
   manuallyCheckedMute:physical.filter(x=>x.manualMuteChecked).length,
   manuallyCheckedDisconnect:physical.filter(x=>x.manualDisconnectChecked).length,
   byDevice:Object.fromEntries(DEVICES.map(d=>[d,physical.filter(x=>x.deviceClass===d).length])),
   reportsAreSelfDeclared:true,hardwareIndependentlyVerified:false},
  evidenceStatus:{
   realHumanRecordingQualityIndependentlyVerified:false,
   manualAnnotationQualityIndependentlyVerified:false,
   declaredSourceIndependenceIndependentlyVerified:false,
   actualAvatarReactionLatencyVerified:false,
   actualDeployedFalseAlarmsMeasured:false,
   safelyCalibratedThresholdsApproved:false,
   automaticHumanReactionsApproved:false,
   p03VerifiedComplete:false
  },
  nextExternalEvidence:[
   "Obtain authorized diverse real human audio and have independent reviewers audit event labels and negatives",
   "Audit independent recording-source provenance and reserve untouched test groups",
   "Measure confusion, negative listening hours and uncertainty on real holdout audio",
   "Run field checks with physical microphones and verify privacy, permission, mute and disconnect behavior",
   "Measure actual deployed avatar reaction latency and false reactions prospectively",
   "Review thresholds, residual risks and user consent before any explicit approval"
  ]
 };
 // No file IDs, names, source group identifiers, audio hashes, paths or PCM
 // enter this summary; even manually exported field reports remain local.
 return summary;
}
module.exports={checkedFieldReport,auditedCounts};
