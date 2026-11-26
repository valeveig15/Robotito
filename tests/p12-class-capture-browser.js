"use strict";
const assert=require("node:assert/strict"),{runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p12-class-capture",async test=>{
 const {page,baseURL,context}=test;let checks=0;
 // Playwright WebKit's offline flag rejects local Blob reads too (including
 // FileReader). Abort HTTP(S) instead, with explicit network/local controls.
 // Chromium/Firefox retain their native offline emulation.
 const httpPattern=/^https?:\/\//,blockHttp=route=>route.abort("internetdisconnected");
 const setOffline=enabled=>test.engineName!=="webkit"?context.setOffline(enabled):
  enabled?context.route(httpPattern,blockHttp):context.unroute(httpPattern,blockHttp);
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});await page.waitForFunction(()=>ROBOTITO_MEMORY.active);
 // Firefox/WebKit require an actual user activation before starting Web Audio.
 // Use the application's tab control rather than disabling autoplay policies.
 const activate=async()=>{
  await page.evaluate(()=>{document.getElementById("languageGate").style.display="none";});
  await page.locator('[data-tab="class"]').click();
 };
 await activate();
 const nativeRecorder=await page.evaluate(()=>typeof window.MediaRecorder==="function");
 test.report.capabilities={mediaRecorder:nativeRecorder};
 // The pinned Linux WebKit build exposes no MediaRecorder, even on localhost.
 // Exercise its real unsupported path; require native capture on other hosts,
 // including the separate WebKit/macOS CI job. Never substitute a fake here.
 assert.ok(nativeRecorder||(test.engineName==="webkit"&&process.platform==="linux"),"Native MediaRecorder unexpectedly unavailable");
 test.report.nativeCapture={status:nativeRecorder?"pending":"unavailable",checks:0};
 if(nativeRecorder)await page.evaluate(()=>{
  const start=MediaRecorder.prototype.start;window.auditNativeEvents=[];
  MediaRecorder.prototype.start=function(...args){
   window.auditNativeRecorder=this;
   this.addEventListener("dataavailable",event=>auditNativeEvents.push({event:"data",bytes:event.data.size,type:event.data.type}));
   this.addEventListener("error",event=>auditNativeEvents.push({event:"error",name:event.error?.name,message:event.error?.message}));
   return start.apply(this,args);
  };
 });
 test.phase("actual-media-recorder-offline");
 await page.evaluate(async nativeRecorder=>{
  state.currentVoicePerson="Ada";state.lastVoiceConfirmedAt=Date.now();await ROBOTITO_MEMORY.ready();
  window.auditAudioContext=new AudioContext();if(nativeRecorder)await auditAudioContext.resume();
  const oscillator=auditAudioContext.createOscillator(),destination=auditAudioContext.createMediaStreamDestination();
  window.auditOscillator=oscillator;
  oscillator.connect(destination);oscillator.start();state.stream=destination.stream;
  state.started=true;state.captureEpoch=1;state.captureRevision=1;state.captureSuspended=false;
 },nativeRecorder);
 test.phase("offline-recording-start");
 await setOffline(true);
 const network=await page.evaluate(async()=>({
  requestBlocked:await fetch(location.href,{cache:"no-store"}).then(()=>false,()=>true),
  localBlobReadable:await new Blob(["local bytes"]).text()==="local bytes"
 }));
 test.report.network={mode:test.engineName==="webkit"?"http-requests-aborted":"browser-offline-emulation",...network};
 assert.equal(network.requestBlocked,true,"HTTP must actually fail during recording");checks++;
 assert.equal(network.localBlobReadable,true,"Offline simulation must preserve local Blob reads");checks++;
 const started=await page.evaluate(()=>ROBOTITO_CLASS_AUDIO.start("Physics","Waves","actual-session"));
 if(nativeRecorder){
 assert.equal(started.ok,true,JSON.stringify(started));checks++;
 const clockAtStart=await page.evaluate(()=>auditAudioContext.currentTime);
 await page.waitForTimeout(1800);
 test.phase("finish-offline-recording");
 test.report.captureInput=await page.evaluate(()=>({clock:auditAudioContext.currentTime,contextState:auditAudioContext.state,sampleRate:auditAudioContext.sampleRate,
  recorderState:auditNativeRecorder.state,mimeType:auditNativeRecorder.mimeType,events:auditNativeEvents.slice(),
  tracks:state.stream.getTracks().map(track=>({kind:track.kind,readyState:track.readyState,muted:track.muted,enabled:track.enabled,settings:track.getSettings()}))}));
 test.report.captureInput.clockAtStart=clockAtStart;
 const recorded=await page.evaluate(async()=>{
  const row=await ROBOTITO_CLASS_AUDIO.stop();
  return {complete:row?.complete,bytes:row?.size,owner:row?.owner,session:row?.sessionId,
   live:state.stream.getTracks().every(track=>track.readyState==="live"),pending:(await ROBOTITO_CLASS_JOURNAL.list("Ada")).length};
 });
 test.report.captureOutput={...recorded,events:await page.evaluate(()=>auditNativeEvents)};
 assert.ok(recorded.bytes>100,JSON.stringify({input:test.report.captureInput,output:test.report.captureOutput}));checks++;
 assert.deepEqual({...recorded,bytes:0},{complete:true,bytes:0,owner:"Ada",session:"actual-session",live:true,pending:0});checks++;
 await setOffline(false);
 test.phase("reload-and-replay");
 await page.reload();await page.waitForFunction(()=>ROBOTITO_MEMORY.active);
 await activate();
 const replay=await page.evaluate(async()=>{
  state.currentVoicePerson="Ada";state.lastVoiceConfirmedAt=Date.now();await ROBOTITO_MEMORY.ready();await ROBOTITO_CLASS_AUDIO.render();
  const player=document.querySelector("#classRecordingsList audio");await player.play();const played=!player.paused;player.pause();return played;
 });assert.equal(replay,true);checks++;
 test.report.nativeCapture={status:"passed",checks:4};
 }else{
 test.phase("native-recorder-unavailable");
 assert.deepEqual(started,{ok:false,reason:"unsupported"});checks++;
 const unsupported=await page.evaluate(async()=>({
  busy:ROBOTITO_CLASS_AUDIO.isBusy(),recording:ROBOTITO_CLASS_AUDIO.isRecording(),
  pending:(await ROBOTITO_CLASS_JOURNAL.list("Ada")).length,
  saved:(await ROBOTITO_CLASS_AUDIO.listRecordings()).length,
  live:state.stream.getTracks().every(track=>track.readyState==="live")
 }));
 assert.deepEqual({busy:unsupported.busy,recording:unsupported.recording},{busy:false,recording:false});checks++;
 assert.deepEqual({pending:unsupported.pending,saved:unsupported.saved},{pending:0,saved:0});checks++;
 assert.equal(unsupported.live,true);checks++;
 test.report.unsupportedCapture={status:"passed",checks:4,reason:"MediaRecorder absent in this browser build"};
 await page.evaluate(async()=>{state.stream.getTracks().forEach(track=>track.stop());await auditAudioContext.close();});
 await setOffline(false);
 }
 test.phase("storage-failure-and-track-cleanup");
 checks+=await page.evaluate(async()=>{
  let checks=0;const check=(ok,msg)=>{if(!ok)throw Error(msg);checks++;};
  const real=window.MediaRecorder,append=ROBOTITO_CLASS_JOURNAL.append;
  const ctx=new AudioContext(),dest=ctx.createMediaStreamDestination();state.stream=dest.stream;state.started=true;state.captureEpoch=2;state.captureRevision=2;
  const clones=[],clone=state.stream.getAudioTracks()[0].clone.bind(state.stream.getAudioTracks()[0]);
  state.stream.getAudioTracks()[0].clone=()=>{const track=clone();clones.push(track);return track;};
  window.MediaRecorder=class {static isTypeSupported(){return true;}constructor(){window.auditRecorder=this;this.state="inactive";this.mimeType="audio/webm";}start(){this.state="recording";}stop(){this.state="inactive";queueMicrotask(()=>this.onstop());}};
  await ROBOTITO_CLASS_AUDIO.start("Storage failure","Topic","partial-session");
  auditRecorder.ondataavailable({data:new Blob(["committed prefix"])});
  while((await ROBOTITO_CLASS_JOURNAL.list("Ada")).find(row=>row.sessionId==="partial-session")?.chunkCount!==1)await new Promise(r=>setTimeout(r,0));
  ROBOTITO_CLASS_JOURNAL.append=async()=>{throw new DOMException("full","QuotaExceededError");};
  auditRecorder.ondataavailable({data:new Blob(["must not claim saved"])});
  while(ROBOTITO_CLASS_AUDIO.isBusy())await new Promise(r=>setTimeout(r,0));
  const partial=(await ROBOTITO_CLASS_AUDIO.listRecordings()).find(row=>row.sessionId==="partial-session");
  check(partial?.complete===false,"Quota failure produces an explicitly partial record");
  check(await partial.blob.text()==="committed prefix","Only committed bytes are reported saved");
  check(clones.every(track=>track.readyState==="ended"),"Failure closes all recorder clones");
  const before=(await ROBOTITO_STORE.queryRecords({owner:"Ada",type:"audios",limit:Infinity})).length;
  auditRecorder.ondataavailable({data:new Blob(["late foreign bytes"])});await new Promise(r=>setTimeout(r,0));
  check((await ROBOTITO_STORE.queryRecords({owner:"Ada",type:"audios",limit:Infinity})).length===before,"Late callbacks cannot resurrect finalized chunks");
  ROBOTITO_CLASS_JOURNAL.append=append;
  window.MediaRecorder=class {static isTypeSupported(){return true;}constructor(){throw Error("not supported");}};
  check((await ROBOTITO_CLASS_AUDIO.start("Failure")).ok===false,"Both recorder constructors can fail safely");
  check(clones.every(track=>track.readyState==="ended"),"Constructor failures also release microphone clones");
  check(state.stream.getTracks().every(track=>track.readyState==="live"),"Recorder failure does not stop Robotito's shared microphone");
  window.MediaRecorder=real;state.started=false;state.stream.getTracks().forEach(track=>track.stop());state.stream=null;await ctx.close();return checks;
 });
 test.report.checks=checks;test.report.simulatedFailureChecks=7;
 console.log("P12",nativeRecorder?"native recording/offline/replay":"unsupported native recorder", "and simulated storage/track failures:",checks,"checks; generated audio only");
}).catch(e=>{console.error(e);process.exitCode=1;});
