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
   state.started=true;
   setupAudio(stream);
   return !!state.audioContext&&typeof window.__appAcousticEvent==="function";
  });
  assert.equal(canSimulate,true,"Actual Robotito audio callback connected to live synthetic MediaStream");
  await page.locator("#reactionTrialStart").click();
  assert.equal(await page.evaluate(()=>reactionTrial.status().active),true);
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
  assert.equal(report.detectedEventsByKind.clap,2);
  assert.equal(report.detectedEventsByKind.sneeze,1);
  assert.equal(report.avatarActionsByType.clap,1,
   "Only one real animation is counted, not suppressed clap candidates");
  assert.equal(report.avatarActionsByType.bless,0,
   "Unapproved YAMNet cannot trigger a sneeze blessing in shipped Robotito");
  assert.equal(report.preventedByContext,1);
  assert.equal(report.notAppliedAfterDetection,1);
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
