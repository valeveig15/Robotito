"use strict";
// Real Chromium page + actual app onEvent action callback; synthetic mic
// only. This does not verify sound recognition on physical devices.
const assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {spawn}=require("node:child_process");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"robotito-reaction-trial-"));
const port=Number(process.env.ROBOTITO_AVATAR_FIELD_PORT||8839);
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],
 {cwd:root,stdio:"ignore"});
(async()=>{
 let browser;
 try{
  await new Promise(resolve=>setTimeout(resolve,450));
  browser=await chromium.launch({headless:true,args:[
   "--use-fake-device-for-media-stream","--use-fake-ui-for-media-stream"
  ]});
  const page=await browser.newPage({acceptDownloads:true,permissions:["microphone"]});
  await page.route("https://cdn.jsdelivr.net/**",route=>route.fulfill({
   status:200,contentType:"application/javascript",body:""
  }));
  const errors=[];page.on("pageerror",error=>errors.push(String(error)));
  await page.goto("http://127.0.0.1:"+port+"/",{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>window.ROBOTITO_AUDIO_REACTION_TRIAL?.attachControls&&
   window.ROBOTITO_AUDIO_PERCEPTION?.create&&document.querySelector("#reactionTrialStart"),
   {timeout:30000});
  await page.evaluate(()=>{
   const gate=document.querySelector("#languageGate");
   if(gate){gate.hidden=true;gate.classList.add("hidden");gate.style.display="none";}
   document.querySelector(".reaction-trial-panel").open=true;
  });
  // App startup may re-open its language wizard asynchronously. This test
  // focuses on an already-onboarded user's explicit field-trial controls.
  await page.addStyleTag({content:"#languageGate{display:none!important;pointer-events:none!important;}"});
  assert.equal(await page.locator("#reactionTrialExport").isDisabled(),true,
   "No report exists on page load");
  assert.equal(await page.evaluate(()=>reactionTrial.status().active),false,
   "Actual app field counters are disabled without explicit opt-in");
  const textOnly=await page.evaluate(()=>{
   const original=window.sayInLanguage,spoken=[],handled=[];
   window.sayInLanguage=text=>spoken.push(text);
   try{
    for(const text of ["achu","achis","achoo","atchoo","atishoo",
     "el personaje dice achoo","que significa achis"])
     handled.push(handleSocialSpeech(text));
   }finally{window.sayInLanguage=original;}
   return {spoken,handled};
  });
  assert.deepEqual(textOnly.spoken,[],"Text or ASR onomatopoeias are not acoustic sneeze evidence");
  assert.equal(textOnly.handled.some(Boolean),false,"Sneeze words must remain available to the normal conversation planner");
  await page.locator("#reactionTrialStart").click();
  assert.match(await page.locator("#reactionTrialStatus").textContent(),/Iniciá Robotito/,
   "No microphone means no field-trial activation");
  const canSimulate=await page.evaluate(async()=>{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
   window.__trialMicStream=stream;
   const original=window.ROBOTITO_AUDIO_PERCEPTION.create;
   window.ROBOTITO_AUDIO_PERCEPTION.create=options=>{
    window.__appAcousticEvent=options.onEvent;
    return original(options);
   };
   const createSoundModel=window.ROBOTITO_SOUND_MODEL.create;
   window.__audioTimers=new Map();window.__audioWorkers=[];
   window.ROBOTITO_SOUND_MODEL.create=options=>{
    let sequence=0;
    window.__appSoundModel=createSoundModel({...options,
     workerFactory:()=>{
      const worker={postMessage(){},terminate(){this.closed=true;}};
      window.__audioWorkers.push(worker);return worker;
     },
     setTimer:(callback,ms)=>{
      const id=++sequence;window.__audioTimers.set(id,{callback,ms});return id;
     },clearTimer:id=>window.__audioTimers.delete(id)});
    return window.__appSoundModel;
   };
   state.started=true;
   setupAudio(stream);
   return !!state.audioContext&&typeof window.__appAcousticEvent==="function";
  });
  assert.equal(canSimulate,true,"Actual Robotito audio callback connected to live synthetic MediaStream");
  const recovery=await page.evaluate(()=>{
   const toggle=document.getElementById("audioModelEnabled"),model=window.ROBOTITO_SOUND_MODEL;
   const change=checked=>{toggle.checked=checked;toggle.dispatchEvent(new Event("change"));};
   const fire=ms=>{
    const entry=[...window.__audioTimers].find(([,v])=>v.ms===ms);
    if(!entry)throw Error("Missing app model watchdog: "+ms);
    window.__audioTimers.delete(entry[0]);entry[1].callback();
   };
   const status=()=>document.getElementById("audioModelStatus").textContent;
   change(true);fire(model.MAX_MODEL_LOAD_MS);
   const loadError=status(),loadClosed=window.__audioWorkers[0].closed;
   change(false);change(true);
   window.__audioWorkers[1].onmessage({data:{type:"ready"}});
   const ready=status();
   window.__appSoundModel.pushPCM(new Float32Array(24000),16000);
   fire(model.MAX_INFERENCE_MS);
   const inferenceError=status(),inferenceClosed=window.__audioWorkers[1].closed;
   change(false);
   return {loadError,ready,inferenceError,loadClosed,inferenceClosed,
    remainingTimers:window.__audioTimers.size,state:window.__appSoundModel.getStatus().state,
    expectedError:window.ROBOTITO_I18N.t("audioModelError",responseLanguage()),
    expectedReady:window.ROBOTITO_I18N.t("audioModelReady",responseLanguage())};
  });
  assert.equal(recovery.loadError,recovery.expectedError,"Startup timeout reaches actual localized UI");
  assert.equal(recovery.inferenceError,recovery.expectedError,"Inference timeout reaches actual localized UI");
  assert.equal(recovery.ready,recovery.expectedReady,"Consent toggle can retry the model after failure");
  assert.equal(recovery.loadClosed&&recovery.inferenceClosed,true);
  assert.equal(recovery.remainingTimers,0);assert.equal(recovery.state,"off");
  await page.locator("#reactionTrialStart").click();
  assert.equal(await page.evaluate(()=>reactionTrial.status().active),true);
  await page.evaluate(()=>{
   window.__appAcousticEvent({kind:"clap",confidence:.99,at:Date.now()-2000,
    metadata:{origin:"acoustic-heuristic",bursts:5}});
  });
  assert.equal(await page.locator("#robotito").evaluate(el=>el.classList.contains("clapping")),false,
   "A delayed event must not animate the actual avatar");
  await page.evaluate(()=>{
   window.__appAcousticEvent({kind:"clap",confidence:.99,at:Date.now(),
    metadata:{origin:"acoustic-heuristic",bursts:5}});
  });
  assert.equal(await page.locator("#robotito").evaluate(el=>el.classList.contains("clapping")),true,
   "The real app applies its clap animation before recording the action");
  await page.evaluate(()=>{
   state.classMode=true;
   window.__appAcousticEvent({kind:"clap",confidence:.99,at:Date.now(),
    metadata:{origin:"acoustic-heuristic",bursts:5}});
   state.classMode=false;
   window.__appAcousticEvent({kind:"sneeze",confidence:1,at:Date.now(),
    metadata:{model:"unapproved-synthetic",calibrated:true,evidenceFrames:30}});
  });
  // Explicitly observed dance transitions are allowed, but cannot be
  // mistaken for real acoustic accuracy or physical response latency.
  await page.evaluate(()=>{
   reactionTrial.observeDance(true);
   reactionTrial.observeDance(true);
   reactionTrial.observeDance(false);
  });
  await page.locator("#reactionTrialStop").click();
  const [download]=await Promise.all([
   page.waitForEvent("download"),page.locator("#reactionTrialExport").click()
  ]);
  assert.equal(download.suggestedFilename(),"robotito-avatar-reaction-trial.json");
  const file=path.join(temp,"trial.json");await download.saveAs(file);
  const report=JSON.parse(fs.readFileSync(file,"utf8"));
  assert.equal(report.detectedEventsByKind.clap,3);
  assert.equal(report.detectedEventsByKind.sneeze,1);
  assert.equal(report.avatarActionsByType.clap,1,
   "Only one real animation is counted, not suppressed clap candidates");
  assert.equal(report.avatarActionsByType.bless,0,
   "Unapproved YAMNet cannot trigger a sneeze blessing in shipped Robotito");
  assert.equal(report.preventedByContext,1);
  assert.equal(report.notAppliedAfterDetection,2);
  assert.equal(report.danceStarts,1);
  assert.equal(report.danceStops,1);
  assert.equal(report.noAudioRecordedByThisTool,true);
  assert.equal(report.actualHumanSoundAccuracyEstablished,false);
  assert.equal(JSON.stringify(report).includes("unapproved-synthetic"),false,
   "No model instance names or raw event metadata are exported");
  await page.locator("#reactionTrialClear").click();
  assert.equal(await page.locator("#reactionTrialExport").isDisabled(),true);
  assert.equal(await page.evaluate(()=>reactionTrial.report()),null);
  await page.locator("#reactionTrialStart").click();
  await page.evaluate(()=>{
   Object.defineProperty(document,"hidden",{configurable:true,value:true});
   document.dispatchEvent(new Event("visibilitychange"));
  });
  assert.equal(await page.evaluate(()=>reactionTrial.status().active),false,
   "Hidden tab immediately discards optional reaction trial");
  assert.equal(await page.locator("#reactionTrialExport").isDisabled(),true);
  await page.evaluate(()=>{
   delete document.hidden;
   state.started=false;
   window.__trialMicStream.getTracks().forEach(track=>track.stop());
   window.dispatchEvent(new Event("pagehide"));
  });
  assert.equal(await page.evaluate(()=>reactionTrial.report()),null);
  assert.equal(errors.length,0,"No browser JavaScript errors: "+errors.join(", "));
  console.log("Robotito real-app local avatar reaction trial Chromium regression passed");
 }finally{
  await browser?.close();
  server.kill("SIGTERM");
  fs.rmSync(temp,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
