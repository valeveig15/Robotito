"use strict";
// Manual real-audio evaluation only. Requires labelled, authorized local
// audio clips and network access to the opt-in MediaPipe/YAMNet assets.
// Run: npm run evaluate:audio -- /path/to/manifest.json
const fs=require("node:fs"),path=require("node:path"),{spawn}=require("node:child_process");
const {chromium}=require("playwright"),{evaluate}=require("../audio-calibration.js");
const {evaluateContinuous}=require("../audio-timeline-metrics.js");
const root=path.resolve(__dirname,".."),manifestPath=process.argv[2];
const port=Number(process.env.ROBOTITO_AUDIO_EVAL_PORT||8799);
if(!manifestPath)throw Error("Usage: npm run evaluate:audio -- /path/to/manifest.json");
const base=path.dirname(path.resolve(manifestPath));
const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
const clips=manifest.clips||[],sessions=manifest.sessions||[];
if(!Array.isArray(clips)||!Array.isArray(sessions)||!clips.length&&!sessions.length)
 throw Error("Manifest needs labelled clips or annotated continuous sessions");
const supported=new Set(["clap","laugh","cry","cough","sneeze","music","voice","impact","noise","silence","unknown"]);
for(const item of [...clips,...sessions]){
 if(!item.id||!sessions.includes(item)&&!supported.has(item.label)||
    !["owned","consented","open-license"].includes(item.rights)||
    typeof item.environment!=="string"||!item.environment.trim()||typeof item.path!=="string")
  throw Error("Clip needs id, valid label, environment, rights and local path");
 const file=path.resolve(base,item.path);
 if(!file.startsWith(base+path.sep))throw Error("Audio must stay inside manifest folder");
 item.absolutePath=file;
 const real=fs.realpathSync(file);
 if(!real.startsWith(base+path.sep))throw Error("Audio symlink leaves manifest folder: "+item.id);
 const size=fs.statSync(file).size;
 if(size<=0||size>50*1024*1024)throw Error("Invalid or oversized clip: "+item.id);
 if(sessions.includes(item)&&(!Array.isArray(item.annotations)||
   !Array.isArray(item.suppressions||[])))
  throw Error("Continuous session needs reviewed event intervals and optional suppressions");
}
async function main(){
 const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{cwd:root,stdio:"ignore"});
 let browser=null;
 try{
  await new Promise(resolve=>setTimeout(resolve,450));
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  await page.goto("http://127.0.0.1:"+port+"/tests/audio-eval.html",{waitUntil:"domcontentloaded"});
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
   const observation=await page.evaluate(async fileBase64=>{
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
    const spans=plan.plan(pcm.length);
    let paddedWindows=0;
    for(const span of spans){
     const slice=plan.frame(pcm,span);
     const categories=await window.__soundEvalClassify(slice);
     const mapped=window.ROBOTITO_SOUND_MODEL.mapCategories(categories);
     windowScores.push(mapped.scores);
     if(span.paddingStart||span.paddingEnd)paddedWindows++;
    }
    const frames=spans.map((span,i)=>({
      atSeconds:Math.min(audio.duration,(span.start+7800)/16000),
      scores:windowScores[i]
    }));
    return {windowScores,frames,windows:spans.length,paddedWindows,
      trailingSamplesCovered:spans.at(-1)?.end===pcm.length,
      durationSeconds:audio.duration};
   },file);
   if(sessions.includes(item))
    timelineSessions.push({id:item.id,environment:item.environment,
      rights:item.rights,durationSeconds:observation.durationSeconds,
      annotations:item.annotations,suppressions:item.suppressions||[],
      frames:observation.frames});
   else observations.push({id:item.id,label:item.label,environment:item.environment,
     rights:item.rights,...observation});
   console.log("Evaluated",item.id,observation.windows,"YAMNet windows");
  }
  const result=observations.length?evaluate(observations):{
    schemaVersion:2,clipCount:0,metricScope:"No isolated labelled clips",
    calibrated:false,automaticHumanReactionsApproved:false
  };
  if(timelineSessions.length)
   result.continuousEvaluation=evaluateContinuous(timelineSessions);
  result.datasetName=String(manifest.name||"unnamed");
  result.modelVersion="YAMNet float32/1 through MediaPipe Tasks Audio 1.1.1";
  result.createdAt=new Date().toISOString();
  const destination=path.join(base,"robotito-audio-evaluation.json");
  fs.writeFileSync(destination,JSON.stringify(result,null,2)+"\n");
  console.log("Saved non-calibrating evaluation report:",destination);
  console.log(JSON.stringify({clips:result.clipCount,metrics:result.metrics,
    continuousReference:result.continuousEvaluation?.overall||null,
    calibrated:false,automaticHumanReactionsApproved:false},null,2));
 }finally{
  if(browser)await browser.close();
  server.kill("SIGTERM");
 }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
