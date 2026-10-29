"use strict";
const assert=require("node:assert/strict");
const {spawn}=require("node:child_process"),path=require("node:path");
const {chromium}=require("playwright");
const port=Number(process.env.ROBOTITO_P04_DEVICE_PORT||8894);
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],
 {cwd:path.resolve(__dirname,".."),stdio:"ignore"});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 let browser;
 try{
  await sleep(600);
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({permissions:[]});
  const pageErrors=[];page.on("pageerror",e=>pageErrors.push(String(e)));
  await page.goto("http://127.0.0.1:"+port+"/p04-device-check.html",
   {waitUntil:"domcontentloaded",timeout:30000});
  assert.equal(await page.locator("#lang option").count(),6,
   "The diagnostic must offer six languages");
  for(const lang of ["es","en","pt","fr","it","de"]){
   await page.selectOption("#lang",lang);
   assert.equal(await page.locator("#lang").inputValue(),lang);
   assert.ok((await page.locator("#voiceList").textContent()).length>12,
    "Voice availability must be explained in "+lang);
  }
  await page.locator("#speechStop").click();
  assert.match(await page.locator("#speechStatus").textContent(),/detenida/i);
  await page.locator("#micStop").click();
  assert.match(await page.locator("#micStatus").textContent(),/apagado/i);
  // Simulate a denied permission, never opening the real device.
  await page.evaluate(()=>{
   Object.defineProperty(navigator,"mediaDevices",{
    configurable:true,value:{getUserMedia:async()=>{
     throw new DOMException("Permission denied","NotAllowedError");
    }}
   });
  });
  await page.locator("#micStart").click();
  await page.waitForFunction(()=>/No se pudo activar/.test(
   document.getElementById("micStatus").textContent),null,{timeout:3000});
  // Camera permission denial is explicit and never creates a preview.
  await page.locator("#cameraStart").click();
  await page.waitForFunction(()=>/No se pudo activar la cámara/.test(
   document.getElementById("cameraStatus").textContent),null,{timeout:3000});
  await page.evaluate(()=>{
   const preview=document.getElementById("cameraPreview");
   Object.defineProperty(preview,"srcObject",{configurable:true,writable:true,value:null});
   preview.play=async()=>{};
   window.__cameraTracks=[];
   navigator.mediaDevices.getUserMedia=async options=>{
    if(!options.video)throw new DOMException("No microphone","NotAllowedError");
    const track={readyState:"live",stops:0,handlers:{},
     stop(){this.readyState="ended";this.stops++;},
     addEventListener(event,handler){this.handlers[event]=handler;}};
    window.__cameraTracks.push(track);
    return {getTracks:()=>[track],getVideoTracks:()=>[track]};
   };
  });
  await page.locator("#cameraStart").click();
  await page.waitForFunction(()=>/Cámara activa/.test(
   document.getElementById("cameraStatus").textContent),null,{timeout:3000});
  await page.locator("#cameraStop").click();
  assert.ok(await page.evaluate(()=>window.__cameraTracks[0].stops>0),
   "Explicit stop must close a camera track");
  assert.equal(await page.evaluate(()=>document.getElementById("cameraPreview").srcObject),null,
   "Stopping camera clears preview");
  await page.locator("#cameraStart").click();
  await page.evaluate(()=>window.__cameraTracks.at(-1).handlers.ended());
  assert.match(await page.locator("#cameraStatus").textContent(),/desconectó/i,
   "Unexpected camera disconnect is reported");
  assert.ok(await page.evaluate(()=>window.__cameraTracks.at(-1).stops>0),
   "Unexpected disconnect releases the track");
  // Cancellation while permission is pending must stop the late-granted track.
  await page.evaluate(()=>{
   window.__lateTrack={readyState:"live",stops:0,stop(){this.stops++;}};
   navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{
    window.__grantLateCamera=()=>resolve({
     getTracks:()=>[window.__lateTrack],getVideoTracks:()=>[window.__lateTrack]
    });
   });
  });
  await page.locator("#cameraStart").click();
  await page.locator("#cameraStop").click();
  await page.evaluate(()=>window.__grantLateCamera());
  await page.waitForFunction(()=>window.__lateTrack.stops===1,null,{timeout:3000});
  assert.match(await page.locator("#cameraStatus").textContent(),/apagada/i,
   "Cancelled camera must stay off after late permission");

  // Browser ASR uses the selected locale and drops transcript on stop.
  await page.evaluate(()=>{
   window.__asrInstances=[];
   window.SpeechRecognition=class{
    constructor(){this.aborted=false;window.__asrInstances.push(this);}
    start(){this.onstart?.();}
    abort(){this.aborted=true;this.onend?.();}
   };
  });
  for(const [lang,locale] of Object.entries({
   es:"es-UY",en:"en-US",pt:"pt-BR",fr:"fr-FR",it:"it-IT",de:"de-DE"
  })){
   await page.selectOption("#lang",lang);
   await page.locator("#asrStart").click();
   assert.equal(await page.evaluate(()=>window.__asrInstances.at(-1).lang),locale,
    "Recognition locale must follow language "+lang);
   await page.locator("#asrStop").click();
  }
  await page.selectOption("#lang","es");
  await page.locator("#asrStart").click();
  await page.evaluate(()=>{
   window.__asrInstances.at(-1).onresult({
    results:[{0:{transcript:"frase de prueba"},isFinal:true}]
   });
  });
  assert.match(await page.locator("#asrTranscript").textContent(),/frase de prueba/);
  await page.locator("#asrStop").click();
  assert.equal(await page.locator("#asrTranscript").textContent(),"",
   "Stopping ASR must erase temporary recognition results");
  await page.locator("#asrStart").click();
  await page.evaluate(()=>{
   Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});
   document.dispatchEvent(new Event("visibilitychange"));
  });
  assert.ok(await page.evaluate(()=>window.__asrInstances.at(-1).aborted),
   "Hidden page aborts recognition");
  assert.equal(await page.locator("#asrTranscript").textContent(),"",
   "Hidden page clears transient transcript");
  assert.equal(pageErrors.length,0,"No JavaScript errors: "+pageErrors.join(" | "));
  console.log("Robotito P04 diagnostic Chromium: 6 locales; voice and mic controls; permission denial passed");
 }finally{
  if(browser)await browser.close();
  server.kill("SIGTERM");
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
