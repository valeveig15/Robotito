"use strict";
const assert=require("node:assert/strict"),{runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p12-class-capture",async test=>{
 const {page,baseURL,context}=test;let checks=0;
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});await page.waitForFunction(()=>ROBOTITO_MEMORY.active);
 // Firefox/WebKit require an actual user activation before starting Web Audio.
 // Use the application's tab control rather than disabling autoplay policies.
 const activate=async()=>{
  await page.evaluate(()=>{document.getElementById("languageGate").style.display="none";});
  await page.locator('[data-tab="class"]').click();
 };
 await activate();
 test.phase("actual-media-recorder-offline");
 await page.evaluate(async()=>{
  state.currentVoicePerson="Ada";state.lastVoiceConfirmedAt=Date.now();await ROBOTITO_MEMORY.ready();
  window.auditAudioContext=new AudioContext();await auditAudioContext.resume();
  const oscillator=auditAudioContext.createOscillator(),destination=auditAudioContext.createMediaStreamDestination();
  oscillator.connect(destination);oscillator.start();state.stream=destination.stream;
  state.started=true;state.captureEpoch=1;state.captureRevision=1;state.captureSuspended=false;
 });
 test.phase("offline-recording-start");
 await context.setOffline(true);
 assert.equal(await page.evaluate(async()=>(await ROBOTITO_CLASS_AUDIO.start("Physics","Waves","actual-session")).ok),true);checks++;
 await page.waitForTimeout(1800);
 test.phase("finish-offline-recording");
 const recorded=await page.evaluate(async()=>{
  const row=await ROBOTITO_CLASS_AUDIO.stop();
  return {complete:row?.complete,bytes:row?.size,owner:row?.owner,session:row?.sessionId,
   live:state.stream.getTracks().every(track=>track.readyState==="live"),pending:(await ROBOTITO_CLASS_JOURNAL.list("Ada")).length};
 });
 assert.ok(recorded.bytes>100);checks++;
 assert.deepEqual({...recorded,bytes:0},{complete:true,bytes:0,owner:"Ada",session:"actual-session",live:true,pending:0});checks++;
 await context.setOffline(false);
 test.phase("reload-and-replay");
 await page.reload();await page.waitForFunction(()=>ROBOTITO_MEMORY.active);
 await activate();
 const replay=await page.evaluate(async()=>{
  state.currentVoicePerson="Ada";state.lastVoiceConfirmedAt=Date.now();await ROBOTITO_MEMORY.ready();await ROBOTITO_CLASS_AUDIO.render();
  const player=document.querySelector("#classRecordingsList audio");await player.play();const played=!player.paused;player.pause();return played;
 });assert.equal(replay,true);checks++;
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
 test.report.checks=checks;console.log("P12 actual MediaRecorder, offline storage, replay and failure cleanup:",checks,"checks; generated audio only");
}).catch(e=>{console.error(e);process.exitCode=1;});
