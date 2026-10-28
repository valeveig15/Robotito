"use strict";
// End-to-end local-audio evaluation: real WAV decoding, Chromium, genuine
// YAMNet inference, temporal event metrics and a saved report. No user audio.
const assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {execFileSync}=require("node:child_process");
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
 fs.writeFileSync(audio,wav());
 fs.writeFileSync(manifestPath,JSON.stringify({name:"CI synthetic audio only",
  sessions:[{id:"synthetic-01",path:"generated.wav",environment:"synthetic-tone",
   rights:"owned",sourceGroup:"synthetic-source-1",evaluationSplit:"test",annotations:[],
   suppressions:[{startSeconds:1.05,endSeconds:1.45}]}]}));
 const output=execFileSync(process.execPath,["scripts/evaluate-audio-dataset.js",manifestPath],{
  cwd:path.resolve(__dirname,".."),
  env:{...process.env,ROBOTITO_AUDIO_EVAL_PORT:"8826"},
  timeout:120000,encoding:"utf8"
 });
 const report=JSON.parse(fs.readFileSync(
  path.join(temp,"robotito-audio-evaluation.json"),"utf8"));
 assert.equal(report.clipCount,0,"Timeline-only manifests must work");
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
 assert.equal(JSON.stringify(report).includes("sha256:"),false,
  "No local recording fingerprints are exported in the report");
 assert.equal(report.continuousEvaluation.overall.sessionCount,1);
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
 console.log("Genuine end-to-end continuous YAMNet evaluation with suppressed-window isolation passed");
}finally{
 fs.rmSync(temp,{recursive:true,force:true});
}
