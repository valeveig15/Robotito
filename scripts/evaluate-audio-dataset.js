"use strict";
// Manual real-audio evaluation only. Requires labelled, authorized local
// audio clips and network access to the opt-in MediaPipe/YAMNet assets.
// Run: npm run evaluate:audio -- /path/to/manifest.json
const fs=require("node:fs"),path=require("node:path"),{spawn}=require("node:child_process");
const {chromium}=require("playwright"),{evaluate}=require("../audio-calibration.js");
const {evaluateContinuous}=require("../audio-timeline-metrics.js");
const {loadManifest}=require("../audio-evaluation-manifest.js");
const {inspectCorpus}=require("../audio-media-preflight.js");
const root=path.resolve(__dirname,".."),manifestPath=process.argv[2];
const port=Number(process.env.ROBOTITO_AUDIO_EVAL_PORT||8799);
if(!manifestPath)throw Error("Usage: npm run evaluate:audio -- /path/to/manifest.json");
const {base,manifest,clips,sessions,groupAudit}=loadManifest(manifestPath);
async function main(){
 const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{cwd:root,stdio:"ignore"});
 let browser=null;
 try{
  await new Promise(resolve=>setTimeout(resolve,450));
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  await page.goto("http://127.0.0.1:"+port+"/tests/audio-eval.html",{waitUntil:"domcontentloaded"});
  // Decode and validate every recording BEFORE initializing the Worker.
  // Later invalid sessions cannot leave an already evaluated partial corpus.
  const durationPreflight=await inspectCorpus(page,[...clips,...sessions]);
  await page.evaluate(async()=>{
   await new Promise((resolve,reject)=>{
    const worker=new Worker("../audio-model-worker.js");
    window.__soundEvalWorker=worker;
    window.__soundEvalPending=new Map();
    window.__soundEvalId=0;
    const timeout=setTimeout(()=>reject(Error("YAMNet loading timed out")),90000);
    worker.onmessage=event=>{
     const info=event.data||{};
     if(info.type==="ready"){clearTimeout(timeout);resolve();}
     if(info.type==="error"){clearTimeout(timeout);reject(Error(info.message||"MediaPipe model failed"));}
     if(info.type==="result"){
      const pending=window.__soundEvalPending.get(info.id);
      if(pending){window.__soundEvalPending.delete(info.id);pending.resolve(info.categories);}
     }
    };
    worker.onerror=error=>{clearTimeout(timeout);reject(Error(String(error.message||error)));};
    worker.postMessage({type:"init"});
   });
   window.__soundEvalClassify=audio=>new Promise((resolve,reject)=>{
    const id=++window.__soundEvalId;
    const timeout=setTimeout(()=>{window.__soundEvalPending.delete(id);reject(Error("Inference timeout"));},30000);
    window.__soundEvalPending.set(id,{
     resolve:categories=>{clearTimeout(timeout);resolve(categories);}
    });
    window.__soundEvalWorker.postMessage({type:"classify",id,sampleRate:16000,samples:audio},[audio.buffer]);
   });
  });
  const observations=[],timelineSessions=[];
  for(const item of [...clips,...sessions]){
   const file=fs.readFileSync(item.absolutePath).toString("base64");
   const observation=await page.evaluate(async ({fileBase64,suppressions})=>{
    const bytes=Uint8Array.from(atob(fileBase64),c=>c.charCodeAt(0));
    const audioContext=new AudioContext();
    let audio;
    try{audio=await audioContext.decodeAudioData(bytes.buffer);}
    finally{await audioContext.close();}
    const offline=new OfflineAudioContext(1,Math.ceil(audio.duration*16000),16000);
    const playback=offline.createBufferSource();
    playback.buffer=audio;playback.connect(offline.destination);playback.start();
    const rendered=await offline.startRendering(),pcm=rendered.getChannelData(0);
    const windowScores=[];
    const plan=window.ROBOTITO_AUDIO_EVALUATION_WINDOWS;
    const spans=plan.plan(pcm.length),skipped=[];
    let paddedWindows=0;
    for(const span of spans){
     const startSeconds=span.start/16000,endSeconds=span.end/16000;
     const suppressed=plan.overlapsSuppression(startSeconds,endSeconds,suppressions);
     skipped.push(suppressed);
     if(suppressed){
      // Never send samples containing class/sleep/own-voice audio to YAMNet,
      // even when the prediction's centre lies outside suppression.
      windowScores.push({unknown:1,windowStartSeconds:startSeconds});
      continue;
     }
     const slice=plan.frame(pcm,span);
     const categories=await window.__soundEvalClassify(slice);
     const mapped=window.ROBOTITO_SOUND_MODEL.mapCategories(categories);
     windowScores.push({...mapped.scores,windowStartSeconds:startSeconds});
     if(span.paddingStart||span.paddingEnd)paddedWindows++;
    }
    const frames=spans.map((span,i)=>({
      // A model cannot react until it has received the ENTIRE window.
      atSeconds:span.end/16000,
      windowStartSeconds:span.start/16000,
      windowEndSeconds:span.end/16000,
      suppressed:skipped[i],
      scores:windowScores[i]
    }));
    return {windowScores,frames,windows:spans.length,paddedWindows,
      skippedWindows:skipped.filter(Boolean).length,
      scoredWindows:skipped.filter(x=>!x).length,
      trailingSamplesCovered:spans.at(-1)?.end===pcm.length,
      durationSeconds:audio.duration};
   },{fileBase64:file,suppressions:sessions.includes(item)?item.suppressions||[]:[]});
   if(sessions.includes(item))
    timelineSessions.push({id:item.id,environment:item.environment,deviceClass:item.deviceClass,
      sourceGroup:item.sourceGroup,evaluationSplit:item.evaluationSplit,
      rights:item.rights,durationSeconds:observation.durationSeconds,
      annotations:item.annotations,suppressions:item.suppressions||[],
      frames:observation.frames});
   else observations.push({id:item.id,label:item.label,environment:item.environment,deviceClass:item.deviceClass,
     sourceGroup:item.sourceGroup,evaluationSplit:item.evaluationSplit,
     rights:item.rights,...observation});
   console.log("Evaluated",item.id,observation.scoredWindows,"YAMNet windows;",
     observation.skippedWindows,"suppressed windows never classified");
  }
  const result=observations.length?evaluate(observations):{
    schemaVersion:2,clipCount:0,metricScope:"No isolated labelled clips",
    calibrated:false,automaticHumanReactionsApproved:false
  };
  if(timelineSessions.length)
   result.continuousEvaluation=evaluateContinuous(timelineSessions);
  result.datasetName=String(manifest.name||"unnamed");
  // Preflight rejects exact duplicate PCM files before browser inference.
  // Only the aggregate check is reported; local SHA-256 digests stay private.
  result.datasetIntegrity={...groupAudit,durationPreflight,exactDuplicateFilesRejected:true,
    uniqueAudioFiles:clips.length+sessions.length,
    comparison:"Local SHA-256 over file bytes (not perceptual similarity)",
    limitation:"Edited or cropped copies and overlapping recording sessions require independent human audit"};
  result.datasetProvenance={license:manifest.license||null,
    source:manifest.source||null,citation:manifest.citation||null};
  result.modelVersion="YAMNet float32/1 through MediaPipe Tasks Audio 1.1.1";
  result.createdAt=new Date().toISOString();
  const destination=path.join(base,"robotito-audio-evaluation.json");
  fs.writeFileSync(destination,JSON.stringify(result,null,2)+"\n");
  console.log("Saved non-calibrating evaluation report:",destination);
  console.log(JSON.stringify({clips:result.clipCount,metrics:result.metrics,
    clipDeviceCounts:result.byDevice||null,
    continuousSessionCountsByDevice:result.continuousEvaluation?
      Object.fromEntries(Object.entries(result.continuousEvaluation.byDevice)
        .map(([device,summary])=>[device,summary.sessionCount])):null,
    continuousReference:result.continuousEvaluation?.overall||null,
    calibrated:false,automaticHumanReactionsApproved:false},null,2));
 }finally{
  if(browser)await browser.close();
  server.kill("SIGTERM");
 }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
