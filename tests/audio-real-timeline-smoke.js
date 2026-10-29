"use strict";
// End-to-end local-audio evaluation: real WAV decoding, Chromium, genuine
// YAMNet inference, temporal event metrics and a saved report. No user audio.
const assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {execFileSync,spawnSync}=require("node:child_process");
const {createHash}=require("node:crypto");
const {canonicalReviewedAnnotations}=require("../audio-review-payload.js");
const seal=x=>({...x,reviewAnnotationsSha256:createHash("sha256")
 .update(canonicalReviewedAnnotations(x)).digest("hex")});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"robotito-timeline-real-"));
function wav(seconds=2.5,rate=16000){
 const samples=Math.floor(seconds*rate),bytes=Buffer.alloc(44+samples*2);
 bytes.write("RIFF",0);bytes.writeUInt32LE(bytes.length-8,4);
 bytes.write("WAVE",8);bytes.write("fmt ",12);bytes.writeUInt32LE(16,16);
 bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(rate,24);
 bytes.writeUInt32LE(rate*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);
 bytes.write("data",36);bytes.writeUInt32LE(samples*2,40);
 for(let i=0;i<samples;i++){
  const sample=Math.round(Math.sin(2*Math.PI*440*i/rate)*3600);
  bytes.writeInt16LE(sample,44+i*2);
 }
 return bytes;
}
try{
 const audio=path.join(temp,"generated.wav"),manifestPath=path.join(temp,"manifest.json");
 const originalAudio=wav(),audioSha256=createHash("sha256").update(originalAudio).digest("hex");
 fs.writeFileSync(audio,originalAudio);
 const reviewed=seal({id:"synthetic-01",path:"generated.wav",environment:"synthetic-tone",
  rights:"owned",sourceGroup:"synthetic-source-1",evaluationSplit:"test",
  annotationReview:"complete",audioSha256,annotations:[],
  suppressions:[{startSeconds:1.05,endSeconds:1.45}]});
 fs.writeFileSync(manifestPath,JSON.stringify({name:"CI synthetic audio only",sessions:[reviewed]}));
 const tamperedManifest=path.join(temp,"tampered-labels.json");
 fs.writeFileSync(tamperedManifest,JSON.stringify({sessions:[{
  ...reviewed,annotations:[{kind:"sneeze",startSeconds:.1,endSeconds:.3}]
 }]}));
 const deniedTampering=spawnSync(process.execPath,[
  "scripts/evaluate-audio-dataset.js",tamperedManifest],{
  cwd:path.resolve(__dirname,".."),timeout:10000,encoding:"utf8"
 });
 assert.notEqual(deniedTampering.status,0,
  "Changing labels without new review must fail before model initialization");
 assert.match(deniedTampering.stderr,/Reviewed annotation SHA-256 mismatch/);
 assert.equal(fs.existsSync(path.join(temp,"robotito-audio-evaluation.json")),false,
  "Tampered labels must not leave false statistical evidence");
 // Unreviewed data must fail before any Chromium worker or model download.
 const draftPath=path.join(temp,"draft-manifest.json");
 fs.writeFileSync(draftPath,JSON.stringify({sessions:[{
  id:"unreviewed",path:"generated.wav",rights:"owned",environment:"synthetic-tone",
  annotations:[],suppressions:[]
 }]}));
 const draftValidation=execFileSync(process.execPath,[
  "scripts/validate-audio-dataset.js",draftPath],{
  cwd:path.resolve(__dirname,".."),timeout:30000,encoding:"utf8"
 });
 assert.match(draftValidation,/decodedFilesVerified": 1/,
  "A draft can be decoded and validated without pretending it was reviewed");
 const deniedDraft=spawnSync(process.execPath,[
  "scripts/evaluate-audio-dataset.js",draftPath],{
  cwd:path.resolve(__dirname,".."),
  env:{...process.env,ROBOTITO_AUDIO_EVAL_PORT:"8826"},
  timeout:10000,encoding:"utf8"
 });
 assert.notEqual(deniedDraft.status,0,
  "An unreviewed corpus must fail before any YAMNet model initialization");
 assert.match(deniedDraft.stderr,/requires annotationReview=complete/);
 assert.equal(fs.existsSync(path.join(temp,"robotito-audio-evaluation.json")),false,
  "Unreviewed sessions must not generate a misleading saved report");
 // Swapping a recording with the same filename, duration and data format
 // must abort before any model is loaded or report is written.
 const replaced=Buffer.from(originalAudio);replaced[48]^=1;
 fs.writeFileSync(audio,replaced);
 const deniedChanged=spawnSync(process.execPath,[
  "scripts/evaluate-audio-dataset.js",manifestPath],{
  cwd:path.resolve(__dirname,".."),timeout:10000,encoding:"utf8"
 });
 assert.notEqual(deniedChanged.status,0,"Changed reviewed audio must be denied");
 assert.match(deniedChanged.stderr,/Reviewed audio SHA-256 mismatch/);
 assert.equal(fs.existsSync(path.join(temp,"robotito-audio-evaluation.json")),false,
  "Review/audio mismatch cannot leave a misleading report");
 fs.writeFileSync(audio,originalAudio);
 // The standalone preflight never downloads or initializes YAMNet.
 const preflight=execFileSync(process.execPath,["scripts/validate-audio-dataset.js",manifestPath],{
  cwd:path.resolve(__dirname,".."),timeout:30000,encoding:"utf8"
 });
 assert.ok(preflight.includes('"decodedFilesVerified": 1'),
  "Real browser preflight decodes the actual WAV without classifying it");
 const invalidPath=path.join(temp,"invalid-annotations.json");
 fs.writeFileSync(invalidPath,JSON.stringify({sessions:[{
  id:"out-of-bounds",path:"generated.wav",rights:"owned",environment:"synthetic-tone",
  annotationReview:"complete",audioSha256,
  annotations:[{kind:"sneeze",startSeconds:2.4,endSeconds:3.0}],suppressions:[]
 }].map(seal)}));
 const invalidValidation=spawnSync(process.execPath,[
  "scripts/validate-audio-dataset.js",invalidPath],{
   cwd:path.resolve(__dirname,".."),timeout:30000,encoding:"utf8"
  });
 assert.notEqual(invalidValidation.status,0,
  "An annotation extending beyond real WAV audio must be rejected");
 assert.match(invalidValidation.stderr,/Out-of-bounds annotation/);
 const badAudio=path.join(temp,"corrupt.wav");
 fs.writeFileSync(badAudio,Buffer.from("not genuine audio"));
 const badPath=path.join(temp,"corrupt-manifest.json");
 fs.writeFileSync(badPath,JSON.stringify({clips:[{
  id:"broken",path:"corrupt.wav",rights:"owned",environment:"synthetic",label:"noise"
 }]}));
 const invalidCodec=spawnSync(process.execPath,[
  "scripts/validate-audio-dataset.js",badPath],{
   cwd:path.resolve(__dirname,".."),timeout:30000,encoding:"utf8"
  });
 assert.notEqual(invalidCodec.status,0,"An undecodable file must be rejected");
 assert.match(invalidCodec.stderr,/Cannot decode authorized audio/);
 // The integrated evaluator must also abort BEFORE any model inference.
 const deniedEvaluation=spawnSync(process.execPath,[
  "scripts/evaluate-audio-dataset.js",invalidPath],{
   cwd:path.resolve(__dirname,".."),
   env:{...process.env,ROBOTITO_AUDIO_EVAL_PORT:"8826"},
   timeout:30000,encoding:"utf8"
  });
 assert.notEqual(deniedEvaluation.status,0,
  "An invalid later annotation cannot enter the YAMNet evaluation stage");
 assert.match(deniedEvaluation.stderr,/Out-of-bounds annotation/);
 assert.equal(fs.existsSync(path.join(temp,"robotito-audio-evaluation.json")),false,
  "A failed corpus preflight must never create a misleading report");
 const output=execFileSync(process.execPath,["scripts/evaluate-audio-dataset.js",manifestPath],{
  cwd:path.resolve(__dirname,".."),
  env:{...process.env,ROBOTITO_AUDIO_EVAL_PORT:"8826"},
  timeout:120000,encoding:"utf8"
 });
 const report=JSON.parse(fs.readFileSync(
  path.join(temp,"robotito-audio-evaluation.json"),"utf8"));
 assert.equal(report.clipCount,0,"Timeline-only manifests must work");
 assert.equal(report.datasetIntegrity.reviewedAnnotationSHA256Verified,true,
  "Real YAMNet report confirms labelled annotations were not modified");
 assert.equal(report.datasetIntegrity.reviewedAudioSHA256Verified,true,
  "Real evaluated sessions are bound to the exact reviewed audio bytes");
 assert.equal(report.datasetIntegrity.reviewedAudioRecheckedAtInference,true,
  "YAMNet input bytes are verified again after separate media preflight");
 assert.equal(report.datasetIntegrity.allEvaluatedSessionsHumanReviewed,true,
  "Evaluated negative hours require a declared completed human review");
 assert.equal(report.datasetIntegrity.humanReviewIndependentlyVerified,false,
  "A manually ticked review is never independently proven by test code");
 assert.equal(report.datasetIntegrity.durationPreflight.decodedFilesVerified,1,
  "Every real recording must be decoded and checked before any inference");
 assert.equal(report.datasetIntegrity.durationPreflight.modelInferencePerformed,false,
  "The preflight itself never executes YAMNet");
 assert.ok(Math.abs(report.datasetIntegrity.durationPreflight.totalDecodedSeconds-2.5)<.001,
  "Decoded duration is the source of truth rather than annotation guesses");
 assert.equal(report.datasetIntegrity.exactDuplicateFilesRejected,true,
  "Real YAMNet evaluation must be preceded by duplicate-file protection");
 assert.equal(report.datasetIntegrity.sourceGroups,1,
  "Genuine evaluation audit retains the declared recording-source group");
 assert.equal(report.datasetIntegrity.recordingsBySplit.test,1,
  "Source-group validation is carried through the genuine model CLI");
 assert.equal(report.datasetIntegrity.independentlyVerified,false,
  "No synthetic group labels can claim independent real-world verification");
 assert.equal(report.continuousEvaluation.sourceGroupAudit.sourceGroups,1,
  "Direct timeline metrics also audit their source-group declarations");
 assert.equal(report.continuousEvaluation.sourceGroupAudit.independentlyVerified,false,
  "A program cannot prove manual source-group labels are correct");
 assert.equal(report.continuousEvaluation.bySplit.test.sessionCount,1,
  "Real YAMNet timeline report stays stratified by holdout split");
 assert.equal(report.datasetIntegrity.uniqueAudioFiles,1,
  "Count physically distinct source recordings without exposing audio hashes");
 assert.equal(JSON.stringify(report).includes(reviewed.reviewAnnotationsSha256),false,
  "A privacy-preserving report must not reveal reviewed annotation digests");
 assert.equal(JSON.stringify(report).includes("sha256:"),false,
  "No local recording fingerprints are exported in the report");
 assert.equal(report.continuousEvaluation.overall.sessionCount,1);
 assert.equal(report.continuousEvaluation.overall.eventConfusion.background.sneeze,0,
  "Real YAMNet timeline includes false-alert attribution without invented human events");
 assert.equal(report.continuousEvaluation.overall.referenceDetectorLatencySeconds.sneeze.count,0,
  "No actual annotated sneezes means no fabricated detector delay");
 assert.match(report.continuousEvaluation.latencyScope,/NOT physical mic/,
  "Reference decision delay must never be reported as physical reaction latency");
 assert.equal(report.continuousEvaluation.sessions[0].environment,"synthetic-tone");
 const evaluated=report.continuousEvaluation.sessions[0];
 assert.ok(evaluated.classifiedFrames>=2,
  "Audio must be decoded, windowed and classified by real YAMNet");
 assert.ok(evaluated.skippedFrames>=1,
  "YAMNet must not receive even partly suppressed audio windows");
 assert.equal(evaluated.classifiedFrames+evaluated.skippedFrames>=4,true,
  "Suppression accounts for every planned time window");
 assert.ok(report.continuousEvaluation.overall.observedSeconds>1);
 assert.ok(report.continuousEvaluation.overall.observedSeconds<2.5,
  "Missing or suppressed time cannot inflate negative listening hours");
 assert.equal(report.continuousEvaluation.calibrated,false);
 assert.equal(report.continuousEvaluation.automaticHumanReactionsApproved,false);
 assert.equal(report.continuousEvaluation.overall.metrics.sneeze.tp,0,
  "No invented human ground truth");
 assert.equal(report.continuousEvaluation.byEnvironment["synthetic-tone"].sessionCount,1);
 assert.ok(output.includes("Saved non-calibrating evaluation report"),
  "The real CLI must finish successfully");
 // The real Chromium decoder can also inspect a combined dataset assembled
 // from separate studio-style manifests; not merely a JSON-only unit mock.
 const secondDir=path.join(temp,"take-two");
 fs.mkdirSync(secondDir);
 const secondBytes=Buffer.from(originalAudio);
 secondBytes[50]^=1; // distinct valid WAV PCM with same headers and duration
 fs.writeFileSync(path.join(secondDir,"other.wav"),secondBytes);
 const second=seal({id:"synthetic-02",path:"other.wav",
  environment:"synthetic-tone",rights:"owned",
  sourceGroup:"synthetic-source-2",evaluationSplit:"development",
  annotationReview:"complete",audioSha256:createHash("sha256")
   .update(secondBytes).digest("hex"),annotations:[],suppressions:[]});
 const secondManifest=path.join(secondDir,"manifest-2.json");
 fs.writeFileSync(secondManifest,JSON.stringify({sessions:[second]}));
 const combinedPath=path.join(temp,"combined-corpus.json");
 const assembledOutput=execFileSync(process.execPath,[
  "scripts/assemble-audio-corpus.js",combinedPath,manifestPath,secondManifest],{
   cwd:path.resolve(__dirname,".."),timeout:30000,encoding:"utf8"
  });
 assert.match(assembledOutput,/Local audio corpus assembled/);
 const combinedPreflight=execFileSync(process.execPath,[
  "scripts/validate-audio-dataset.js",combinedPath],{
   cwd:path.resolve(__dirname,".."),timeout:30000,encoding:"utf8"
  });
 assert.match(combinedPreflight,/"decodedFilesVerified": 2/,
  "Combined two-session corpus must decode both original WAV files in Chromium");
 assert.match(combinedPreflight,/"sourceGroups": 2/,
  "Independent declared source groups remain distinct in the combined manifest");
 console.log("Genuine end-to-end continuous YAMNet evaluation with suppressed-window isolation passed");
}finally{
 fs.rmSync(temp,{recursive:true,force:true});
}
