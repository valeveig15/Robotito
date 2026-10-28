"use strict";
// Browser integration with Chromium's synthetic microphone only. Not a test
// of actual phones, hardware permissions, acoustic recognition or latency.
const assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {spawn}=require("node:child_process");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"robotito-microphone-check-"));
const port=Number(process.env.ROBOTITO_DEVICE_CHECK_PORT||8838);
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{
 cwd:root,stdio:"ignore"
});
async function downloadJSON(page){
 const [download]=await Promise.all([
  page.waitForEvent("download"),page.click("#download")
 ]);
 const filename=download.suggestedFilename();
 const file=path.join(temp,filename);
 await download.saveAs(file);
 return JSON.parse(fs.readFileSync(file,"utf8"));
}
(async()=>{
 let browser;
 try{
  await new Promise(resolve=>setTimeout(resolve,450));
  browser=await chromium.launch({headless:true,args:[
   "--use-fake-device-for-media-stream","--use-fake-ui-for-media-stream"
  ]});
  const context=await browser.newContext({acceptDownloads:true,permissions:["microphone"]});
  const page=await context.newPage();
  const external=[];
  page.on("request",request=>{
   if(!request.url().startsWith("http://127.0.0.1:"+port+"/")&&
      !request.url().startsWith("blob:http://127.0.0.1:"+port+"/")&&
      !request.url().startsWith("data:"))external.push(request.url());
  });
  await page.goto("http://127.0.0.1:"+port+"/tools/audio-device-check.html",{waitUntil:"load"});
  await page.evaluate(()=>{
   const real=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
   window.__calls=0;
   window.__liveGetUserMedia=real;
   navigator.mediaDevices.getUserMedia=async(...args)=>{
    window.__calls++;
    const stream=await real(...args);
    window.__latestTrack=stream.getAudioTracks()[0];
    return stream;
   };
  });
  assert.equal(await page.evaluate(()=>window.__calls),0,"No microphone request on page load");
  assert.equal(await page.locator("#download").isDisabled(),true,"No automatic report");
  await page.click("#start");
  assert.match(await page.locator("#state").textContent(),/Confirmá el consentimiento/);
  assert.equal(await page.evaluate(()=>window.__calls),0,"No mic request without opt-in");
  await page.locator("#consent").check();
  await page.locator("#deviceClass").selectOption("usb");
  await page.locator("#environment").selectOption("quiet");
  await page.click("#start");
  await page.waitForFunction(()=>document.querySelector("#state").textContent.includes("Micrófono activo"));
  assert.equal(await page.evaluate(()=>window.__calls),1,"One explicit permission request");
  assert.equal(await page.locator("#start").isDisabled(),true,"No concurrent requests");
  await page.waitForFunction(()=>document.querySelector("#levelText").textContent.includes("Ventanas analizadas: "),null,{timeout:15000});
  await page.waitForTimeout(250);
  await page.click("#stop");
  assert.equal(await page.evaluate(()=>window.__latestTrack.readyState),"ended",
   "Stop must release a real browser MediaStreamTrack");
  assert.equal(await page.locator("#download").isDisabled(),false,"No-audio report available on stop");
  await page.locator("#heardLevel").check();
  const report=await downloadJSON(page);
  assert.equal(report.schemaVersion,1);
  assert.equal(report.kind,"robotito-p03-local-microphone-check");
  assert.equal(report.deviceClass,"usb");
  assert.equal(report.environment,"quiet");
  assert.equal(report.status,"user-stopped");
  assert.equal(report.microphoneTracksStopped,true);
  assert.equal(report.physicalHardwareVerifiedAutomatically,false);
  assert.equal(report.noAudioRecorded,true);
  assert.equal(report.noAudioExported,true);
  assert.ok(report.sampledFrames>0,"Audio analyser received frames from fake microphone");
  assert.ok(report.captureSeconds>=0,"Numeric duration can be inspected in the field");
  assert.equal(report.manualObservations.visibleLevelChange,true,
   "Only explicitly checked manual observations are included");
  assert.equal(report.manualObservations.disconnectReconnectChecked,false);
  const serialized=JSON.stringify(report);
  for(const secret of ["deviceId","groupId","userAgent","sampleBuffer","pcm","audioSha256","serialNumber","microphoneLabel"])
   assert.equal(serialized.includes('"'+secret+'"'),false,"No device identity/PCM leakage: "+secret);
  assert.deepEqual(external,[],"No external origins during live mic check or export");

  // Consent withdrawal must close all tracks and discard even the aggregate.
  await page.click("#start");
  await page.waitForFunction(()=>document.querySelector("#state").textContent.includes("Micrófono activo"));
  await page.locator("#consent").uncheck();
  assert.equal(await page.evaluate(()=>window.__latestTrack.readyState),"ended");
  assert.equal(await page.locator("#download").isDisabled(),true,
   "Revoked consent destroys prior metrics and downloads");
  assert.equal(await page.locator("#levelMeter").inputValue(),"0");

  // Delayed browser permission must remain cancelable: a later granted track
  // is shut immediately, never connected to AudioContext or analysed.
  await page.locator("#consent").check();
  await page.evaluate(()=>{
   const real=window.__liveGetUserMedia;
   navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{
    window.__grantPermission=async()=>{
     const stream=await real({audio:true,video:false});
     window.__lateTrack=stream.getAudioTracks()[0];
     resolve(stream);
    };
   });
  });
  await page.click("#start");
  await page.waitForFunction(()=>!document.querySelector("#stop").disabled);
  await page.click("#stop");
  await page.evaluate(()=>window.__grantPermission());
  await page.waitForFunction(()=>window.__lateTrack?.readyState==="ended");
  assert.equal(await page.locator("#start").isDisabled(),false);
  const canceled=await downloadJSON(page);
  assert.equal(canceled.status,"permission-request-canceled");
  assert.equal(canceled.sampledFrames,0);
  assert.equal(canceled.physicalHardwareVerifiedAutomatically,false);

  // Explicit rejection also reports only a coarse DOMException name.
  await page.evaluate(()=>{
   navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException("no permission","NotAllowedError");};
  });
  await page.click("#start");
  await page.waitForFunction(()=>document.querySelector("#state").textContent.includes("cancelada o rechazada"));
  const denied=await downloadJSON(page);
  assert.equal(denied.status,"permission-or-capture-error");
  assert.equal(denied.errorName,"NotAllowedError");
  assert.equal(denied.sampledFrames,0);
  assert.equal(JSON.stringify(denied).includes("no permission"),false,
   "Browser error descriptions may be identifying and must not be exported");

  // Hiding the tab closes capture and discards results; returning to the tab
  // never resumes the microphone automatically.
  await page.evaluate(()=>{
   navigator.mediaDevices.getUserMedia=window.__liveGetUserMedia;
  });
  await page.click("#start");
  await page.waitForFunction(()=>document.querySelector("#state").textContent.includes("Micrófono activo"));
  await page.evaluate(()=>{
   window.__hideTrack=document.querySelector("#state"); // no raw audio exposed
   Object.defineProperty(document,"hidden",{configurable:true,value:true});
   document.dispatchEvent(new Event("visibilitychange"));
  });
  assert.equal(await page.locator("#download").isDisabled(),true);
  assert.match(await page.locator("#state").textContent(),/Pestaña oculta/);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event("visibilitychange"));});
  assert.equal(await page.locator("#start").isDisabled(),false);
  await page.evaluate(()=>window.dispatchEvent(new Event("pagehide")));
  assert.equal(await page.locator("#start").isDisabled(),true);
  await page.evaluate(()=>window.dispatchEvent(new Event("pageshow")));
  assert.equal(await page.locator("#start").isDisabled(),false);
  assert.deepEqual(external,[],"No external uploads, analytics or model requests");
  console.log("Robotito local microphone field diagnostic Chromium regression passed",
   JSON.stringify({consent:true,levelFrames:report.sampledFrames,
    permissionCancel:true,denial:true,tabSuspension:true,exportOnlyJSON:true}));
 }finally{
  await browser?.close();
  server.kill("SIGTERM");
  fs.rmSync(temp,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
