"use strict";
// PHYSICAL DEVICE ONLY: no fake-device flags, no audio/video export or identities.
// Must run on an explicitly authorized runner with a real camera and microphone.
const assert=require("node:assert/strict");
const path=require("node:path"),{spawn}=require("node:child_process");
const {chromium}=require("playwright");
const port=Number(process.env.ROBOTITO_PHYSICAL_PORT||8896);
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{
 cwd:path.resolve(__dirname,".."),stdio:"ignore"
});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 let browser;
 const outcome={schemaVersion:1,physicalHardwareVerifiedAutomatically:false,
  camera:{status:"not-run"},microphone:{status:"not-run"},privacy:{status:"not-run"}};
 try{
  await sleep(600);
  browser=await chromium.launch({headless:false});
  const context=await browser.newContext({permissions:["camera","microphone"]});
  const page=await context.newPage();
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  await page.goto("http://127.0.0.1:"+port+"/p04-device-check.html",{waitUntil:"domcontentloaded"});
  await page.evaluate(()=>{if(!window.isSecureContext)throw Error("Secure context required");});
  const t0=Date.now();
  await page.click("#cameraStart");
  await page.waitForFunction(()=>document.querySelector("#cameraPreview")?.srcObject?.getVideoTracks?.()
   .some(t=>t.readyState==="live"),null,{timeout:12000});
  const camera=await page.evaluate(()=>{
   const video=document.getElementById("cameraPreview");
   const tracks=video.srcObject?.getVideoTracks?.()||[];
   return {live:tracks.some(t=>t.readyState==="live"),width:video.videoWidth,height:video.videoHeight};
  });
  assert.ok(camera.live&&camera.width>0&&camera.height>0,"Actual video frames required");
  outcome.camera={status:"pass",startupMs:Date.now()-t0,hasVideoFrames:true};
  const t1=Date.now();
  await page.click("#micStart");
  await page.waitForFunction(()=>/Micrófono activo/.test(
   document.querySelector("#micStatus")?.textContent||""),null,{timeout:12000});
  const meter=await page.locator("#meter").getAttribute("aria-valuenow");
  assert.ok(meter!==null,"Microphone meter must initialize");
  outcome.microphone={status:"pass",startupMs:Date.now()-t1,meterInitialized:true};
  await page.click("#micStop");
  await page.click("#cameraStop");
  assert.equal(await page.evaluate(()=>document.querySelector("#cameraPreview").srcObject),null,
   "Camera media stream reference is removed");
  assert.match(await page.locator("#micStatus").textContent(),/apagado/i);
  assert.equal(errors.length,0,"Unexpected errors: "+errors.join(" | "));
  outcome.privacy={status:"pass",controlsStopped:true};
  outcome.physicalHardwareVerifiedAutomatically=true;
 }finally{
  console.log(JSON.stringify(outcome));
  if(browser)await browser.close();
  server.kill("SIGTERM");
 }
})().catch(e=>{console.error("Physical field smoke failed:",e.message);process.exitCode=1;});
