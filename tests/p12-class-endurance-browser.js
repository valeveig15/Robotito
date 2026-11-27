"use strict";
// Real elapsed time, native encoder and production IndexedDB path. The input
// is generated audio, never a microphone or a claim of physical-device testing.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const {execFileSync}=require("node:child_process");
const {runBrowserTest}=require("./browser-test-harness.js"),{writeEvidence}=require("./test-evidence.js");
const seconds=Number(process.env.ROBOTITO_SOAK_SECONDS||6);
assert.ok(Number.isSafeInteger(seconds)&&seconds>=3&&seconds<=10800,"Duration must be 3–10800 real seconds");
runBrowserTest("p12-class-endurance",async test=>{
 const {page,context,baseURL}=test;
 test.report.requestedSeconds=seconds;test.report.clock="real wall clock; no clock acceleration";
 test.report.input="Web Audio oscillator, synthetic consenting visitor";
 test.report.samples=[];
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>window.ROBOTITO_MEMORY?.active);
 const activate=async()=>{
  await page.evaluate(()=>document.getElementById("languageGate").style.display="none");
  await page.locator('[data-tab="memory"]').click();
  await page.locator(".memory-scope details > summary").click();
 };
 await activate();
 await page.locator("#visitorMemoryConsent").check();
 await page.locator("#createVisitorMemory").click();
 await page.waitForFunction(()=>ROBOTITO_MEMORY.owner().startsWith("visitor:"));
 const token=await page.locator("#visitorMemoryKey").inputValue();
 const owner=await page.evaluate(()=>ROBOTITO_MEMORY.owner());
 await page.locator('[data-tab="class"]').click();
 await page.evaluate(async()=>{
  await ROBOTITO_MEMORY.ready();
  window.soakContext=new AudioContext();await soakContext.resume();
  window.soakOscillator=soakContext.createOscillator();
  const destination=soakContext.createMediaStreamDestination();
  soakOscillator.frequency.value=440;soakOscillator.connect(destination);soakOscillator.start();
  state.stream=destination.stream;state.started=true;state.captureEpoch=1;state.captureRevision=1;state.captureSuspended=false;
 });
 await context.setOffline(true);
 assert.equal(await page.evaluate(()=>fetch(location.href,{cache:"no-store"}).then(()=>false,()=>true)),true);
 const started=await page.evaluate(()=>ROBOTITO_CLASS_AUDIO.start("Endurance","Generated signal","endurance-session"));
 assert.equal(started.ok,true,JSON.stringify(started));
 const clockStart=await page.evaluate(()=>soakContext.currentTime),wallStart=process.hrtime.bigint();
 const cdp=test.engineName==="chromium"?await context.newCDPSession(page):null;
 if(cdp)await cdp.send("Performance.enable");
 test.phase("continuous-native-offline-capture");
 while(Number(process.hrtime.bigint()-wallStart)/1e9<seconds){
  const remaining=seconds-Number(process.hrtime.bigint()-wallStart)/1e9;
  await page.waitForTimeout(Math.min(30000,Math.max(1,remaining*1000)));
  const sample=await page.evaluate(async()=>{
   const row=(await ROBOTITO_CLASS_AUDIO.listPending())[0],storage=await navigator.storage.estimate();
   return {recording:ROBOTITO_CLASS_AUDIO.isRecording(),audioClock:soakContext.currentTime,
    chunks:row?.chunkCount||0,committedBytes:row?.committedBytes||0,storageUsage:storage.usage,storageQuota:storage.quota};
  });
  sample.elapsedSeconds=Number(process.hrtime.bigint()-wallStart)/1e9;
  if(cdp){const m=await cdp.send("Performance.getMetrics");sample.jsHeapUsedBytes=m.metrics.find(x=>x.name==="JSHeapUsedSize")?.value;}
  test.report.samples.push(sample);assert.equal(sample.recording,true,"Recording stopped before the requested real duration");
  writeEvidence("p12-class-endurance-progress.json",test.report);
  console.log(JSON.stringify({phase:"recording",seconds:Math.round(sample.elapsedSeconds),chunks:sample.chunks,bytes:sample.committedBytes}));
 }
 test.report.elapsedSeconds=Number(process.hrtime.bigint()-wallStart)/1e9;
 test.report.audioClockSeconds=await page.evaluate(()=>soakContext.currentTime)-clockStart;
 assert.ok(test.report.elapsedSeconds>=seconds,"A shortened run is not a soak pass");
 assert.ok(test.report.audioClockSeconds>=seconds*.98,"Audio clock did not advance with real elapsed time");
 test.phase("finalize-native-audio");
 const finishStart=performance.now();
 const saved=await page.evaluate(async()=>{
  const row=await ROBOTITO_CLASS_AUDIO.stop();
  if(!row)return null;
  const sha256=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",await row.blob.arrayBuffer()))).map(x=>x.toString(16).padStart(2,"0")).join("");
  return {id:row.id,complete:row.complete,size:row.size,durationMs:row.durationMs,sha256,
   sharedTrackLive:state.stream.getTracks().every(t=>t.readyState==="live"),pending:(await ROBOTITO_CLASS_AUDIO.listPending()).length};
 });
 test.report.finalizeMs=performance.now()-finishStart;test.report.saved=saved;
 assert.ok(saved?.complete&&saved.size>100&&saved.sharedTrackLive&&saved.pending===0,JSON.stringify(saved));
 await page.evaluate(async()=>{soakOscillator.stop();state.stream.getTracks().forEach(t=>t.stop());state.started=false;await soakContext.close();});
 await context.setOffline(false);await page.reload();await page.waitForFunction(()=>window.ROBOTITO_MEMORY?.active);
 await activate();
 await page.locator("#visitorMemoryKey").fill(token);await page.locator("#resumeVisitorMemory").click();
 await page.waitForFunction(value=>ROBOTITO_MEMORY.owner()===value,owner);
 await page.evaluate(async()=>{await ROBOTITO_MEMORY.ready();await ROBOTITO_CLASS_AUDIO.render();});
 await page.locator('[data-tab="class"]').click();await context.setOffline(true);
 const replay=await page.evaluate(async id=>{
  const row=(await ROBOTITO_CLASS_AUDIO.listRecordings()).find(r=>r.id===id);
  const sha256=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",await row.blob.arrayBuffer()))).map(x=>x.toString(16).padStart(2,"0")).join("");
  const player=document.querySelector("#classRecordingsList audio");await player.play();
  return {sha256,played:!player.paused,requestBlocked:await fetch(location.href,{cache:"no-store"}).then(()=>false,()=>true)};
 },saved.id);
 assert.equal(replay.sha256,saved.sha256);assert.ok(replay.played&&replay.requestBlocked);test.report.replay=replay;
 await page.evaluate(()=>document.querySelector("#classRecordingsList audio").pause());
 const downloadPromise=page.waitForEvent("download");
 await page.locator('#classRecordingsList a[download]').evaluate(link=>link.click());
 const download=await downloadPromise;
 const target=path.resolve(process.env.ROBOTITO_TEST_ARTIFACT_DIR||"test-results","p12-endurance-generated.webm");
 await download.saveAs(target);
 assert.equal(crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex"),saved.sha256);
 // Decode the entire saved audio, not just its header or a plausible duration.
 const decoded=execFileSync("ffmpeg",["-nostdin","-v","error","-i",target,"-progress","pipe:1","-f","null","-"],{encoding:"utf8",timeout:180000,maxBuffer:1024*1024});
 const times=[...decoded.matchAll(/^out_time_us=(\d+)$/gm)].map(x=>Number(x[1])/1e6);
 test.report.decodedSeconds=times.at(-1);test.report.allAudioDecoded=true;
 assert.ok(test.report.decodedSeconds>=seconds*.98,"Saved audio does not contain the requested duration");
 assert.ok(test.report.decodedSeconds<=test.report.elapsedSeconds+5,"Unexpected audio duration");
 await context.setOffline(false);
 console.log(JSON.stringify({passed:true,elapsedSeconds:test.report.elapsedSeconds,decodedSeconds:test.report.decodedSeconds,bytes:saved.size,finalizeMs:test.report.finalizeMs}));
},{timeoutMs:seconds*1000+300000}).catch(error=>{console.error(error);process.exitCode=1;});
