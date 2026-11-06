"use strict";
// Actual app lifecycle in each browser; permissions, tracks and recognizer are
// simulated. This measures no biometric accuracy and uses no physical device.
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p04-capture",async test=>{
 const {page,context,report}=test;
 report.media="simulated tracks and ASR";
 await context.addInitScript(()=>{
  localStorage.setItem("robotito.languageMode.v1","es");
  localStorage.setItem("robotito.voiceEnabled.v1","false");
  window.__recognizers=[];window.__tracks=[];window.__hands=[];
  window.SpeechRecognition=class{
   constructor(){window.__recognizers.push(this);}
   start(){this.onstart?.();}
   abort(){this.aborted=true;this.onend?.();}
  };
  window.faceapi={nets:{},FaceMatcher:class{}};
  for(const key of ["tinyFaceDetector","faceLandmark68Net","faceRecognitionNet"])
   window.faceapi.nets[key]={loadFromUri:async()=>{}};
  window.faceapi.TinyFaceDetectorOptions=class{};
  window.faceapi.detectAllFaces=()=>({withFaceLandmarks(){return this;},withFaceDescriptors:async()=>[]});
  window.Hands=class{
   constructor(){window.__hands.push(this);}
   setOptions(){} onResults(fn){this.result=fn;} send(){return Promise.resolve();}
   close(){this.closed=true;return Promise.resolve();}
  };
 });
 await page.goto(test.baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.querySelector("#startBtn")?.disabled===false);
 await page.evaluate(()=>{
  window.__hidden=false;
  Object.defineProperty(document,"hidden",{configurable:true,get:()=>window.__hidden});
  Object.defineProperty(camera,"srcObject",{configurable:true,writable:true,value:null});
  camera.play=async()=>{};camera.pause=()=>{};
  window.__classStops=0;window.ROBOTITO_CLASS_AUDIO.stop=async()=>{window.__classStops++;};
  window.setupAudio=()=>{state.audioCleanup=()=>{window.__audioClosed=true;};};
  window.__makeStream=()=>{
   const tracks=["audio","video"].map(kind=>{
    const t=new EventTarget();Object.assign(t,{kind,readyState:"live",enabled:true,muted:false,stops:0,
     stop(){this.readyState="ended";this.stops++;}});
    window.__tracks.push(t);return t;
   });
   return {getTracks:()=>tracks,getAudioTracks:()=>tracks.filter(t=>t.kind==="audio"),
    getVideoTracks:()=>tracks.filter(t=>t.kind==="video")};
  };
  Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia:async()=>window.__makeStream()}});
 });
 test.phase("hidden-page-invalidation");
 await page.locator("#startBtn").click();
 await page.waitForFunction(()=>state.recognition!=null);
 const hidden=await page.evaluate(()=>{
  state.currentPerson="Prior face";state.currentVoicePerson="Prior voice";
  state.recentVoicePrints=[{t:Date.now(),vector:[1]}];
  const old=state.recognition;window.__oldRecognition=old;window.__oldResult=old.onresult;
  window.__hidden=true;document.dispatchEvent(new Event("visibilitychange"));
  return {aborted:!!old.aborted,face:state.currentPerson,voice:state.currentVoicePerson,
   samples:state.recentVoicePrints.length};
 });
 assert.equal(hidden.aborted,true,"Hiding the actual app aborts native ASR");
 assert.deepEqual([hidden.face,hidden.voice,hidden.samples],[null,null,0]);
 await page.evaluate(()=>{window.__hidden=false;document.dispatchEvent(new Event("visibilitychange"));});
 await page.waitForFunction(()=>state.recognition&&state.recognition!==window.__oldRecognition);
 const stale=await page.evaluate(()=>{
  const before=state.memories.length;
  window.__oldResult({resultIndex:0,results:[Object.assign([{transcript:"stale command"}],{isFinal:true})]});
  flushRecognitionChunks();
  return {unchanged:state.memories.length===before,classStopped:window.__classStops>0};
 });
 assert.equal(stale.unchanged,true,"Old recognizer cannot write memory after resume");
 assert.equal(stale.classStopped,true,"Pausing senses also closes cloned class-audio capture");
 test.phase("track-mute-and-recovery");
 await page.evaluate(()=>{
  const t=state.stream.getVideoTracks()[0];t.muted=true;t.dispatchEvent(new Event("mute"));
 });
 assert.equal(await page.evaluate(()=>state.captureSuspended&&state.recognition===null),true);
 await page.evaluate(()=>{
  const t=state.stream.getVideoTracks()[0];t.muted=false;t.dispatchEvent(new Event("unmute"));
 });
 await page.waitForFunction(()=>!state.captureSuspended&&state.recognition!==null);
 test.phase("independent-final-transcripts");
 await page.evaluate(()=>{
  const result=text=>Object.assign([{transcript:text}],{isFinal:true});
  state.recognition.onresult({resultIndex:0,results:[result("I had"),result("had enough")]});
  flushRecognitionChunks();
 });
 assert.equal(await page.locator("#transcript").textContent(),"I had had enough");
 test.phase("device-ended-and-retry");
 await page.evaluate(()=>{
  const track=window.__tracks.find(t=>t.kind==="audio");
  track.readyState="ended";track.dispatchEvent(new Event("ended"));
 });
 await page.waitForFunction(()=>!state.started);
 assert.equal(await page.locator("#startBtn").isEnabled(),true);
 assert.equal(await page.evaluate(()=>window.__tracks.every(t=>t.stops>0)&&window.__audioClosed),true);
 await page.locator("#startBtn").click();
 await page.waitForFunction(()=>state.started&&state.recognition!=null);
 await page.waitForFunction(()=>window.__hands.length>=2);
 const hands=await page.evaluate(()=>{
  const old=window.__hands[0];
  old.result({multiHandLandmarks:[Array.from({length:21},()=>({x:.4,y:.4,z:0}))]});
  return {closed:old.closed,visible:state.visibleHands};
 });
 assert.deepEqual(hands,{closed:true,visible:0},"Old hand results cannot affect a restarted avatar");
 await page.locator("#stopSensesBtn").click();
 test.phase("late-permission-cancellation");
 await page.evaluate(()=>{navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{window.__grant=()=>resolve(window.__makeStream());});});
 await page.locator("#startBtn").click();
 await page.locator("#stopSensesBtn").click();
 await page.evaluate(()=>window.__grant());
 await page.waitForFunction(()=>window.__tracks.every(t=>t.stops>0));
 assert.equal(await page.evaluate(()=>state.started),false);
 test.phase("out-of-order-permission-sessions");
 await page.evaluate(()=>{
  window.__grants=[];
  navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{
   window.__grants.push(()=>resolve(window.__makeStream()));
  });
 });
 await page.locator("#startBtn").click();await page.locator("#stopSensesBtn").click();
 await page.locator("#startBtn").click();
 await page.evaluate(()=>window.__grants[1]());
 await page.waitForFunction(()=>state.stream&&state.recognition);
 await page.evaluate(()=>{window.__currentStream=state.stream;window.__grants[0]();});
 await page.waitForFunction(()=>window.__tracks.slice(-2).every(t=>t.stops>0));
 assert.equal(await page.evaluate(()=>state.stream===window.__currentStream&&
  state.stream.getTracks().every(t=>t.readyState==="live")),true,"Old permission cannot close the new stream");
 await page.locator("#stopSensesBtn").click();
 test.phase("hidden-during-camera-play");
 await page.evaluate(()=>{
  navigator.mediaDevices.getUserMedia=async()=>window.__makeStream();
  camera.play=()=>new Promise(resolve=>{window.__play=resolve;});
 });
 await page.locator("#startBtn").click();
 await page.waitForFunction(()=>typeof window.__play==="function");
 await page.evaluate(()=>{window.__hidden=true;document.dispatchEvent(new Event("visibilitychange"));window.__play();});
 await page.waitForFunction(()=>!state.started);
 assert.equal(await page.evaluate(()=>window.__tracks.every(t=>t.stops>0)),true,"Interrupted play closes all tracks");
 await page.evaluate(()=>{window.__hidden=false;document.dispatchEvent(new Event("visibilitychange"));camera.play=async()=>{};});
 test.phase("permission-rejection");
 await page.evaluate(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException("denied","NotAllowedError");};});
 await page.locator("#startBtn").click();
 await page.waitForFunction(()=>!state.started);
 assert.equal(await page.locator("#startBtn").isEnabled(),true);
 assert.equal(await page.evaluate(()=>state.currentPerson||state.currentVoicePerson),null);
 test.phase("pagehide");
 await page.evaluate(()=>{navigator.mediaDevices.getUserMedia=async()=>window.__makeStream();});
 await page.locator("#startBtn").click();
 await page.waitForFunction(()=>state.stream&&state.recognition);
 await page.evaluate(()=>window.dispatchEvent(new Event("pagehide")));
 assert.equal(await page.evaluate(()=>!state.started&&window.__tracks.every(t=>t.stops>0)),true);
 report.checked=["hidden","resume","old ASR","class capture stop","mute","unmute","independent final words",
  "ended","retry","old hands","stop","late permission","out-of-order permission","hidden play","denied","pagehide"];
 console.log("P04 real-app capture lifecycle:",test.engineName,"passed; synthetic media only");
}).catch(error=>{console.error(error);process.exitCode=1;});
