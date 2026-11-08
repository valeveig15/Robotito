"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p06-voices",async test=>{
 const {page,baseURL}=test;let checks=0;
 const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
 await page.addInitScript(()=>{
  const langs={es:"es-UY",en:"en-US",pt:"pt-BR",fr:"fr-FR",it:"it-IT",de:"de-DE"};
  const fixture=window.p06={voices:[],spoken:[],tracks:[],recorders:[],requests:0,permission:"allow",speechFault:null,pauses:[]};
  fixture.catalog=Object.entries(langs).flatMap(([lang,locale])=>[
   {voiceURI:lang+"-remote",name:lang+" Remote Neural",lang:locale,localService:false},
   {voiceURI:lang+"-local",name:lang+" Local",lang:locale,localService:true}]);
  const synth={getVoices:()=>fixture.voices,cancel(){},resume(){},speak(u){fixture.spoken.push(u);if(fixture.speechFault)u.onerror?.({error:fixture.speechFault});else u.onstart?.();}};
  Object.defineProperty(window,"speechSynthesis",{configurable:true,value:synth});
  Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:class{constructor(text){this.text=text;}}});
  function wav(){
   const n=16000,buffer=new ArrayBuffer(44+n*2),v=new DataView(buffer),text=(at,s)=>[...s].forEach((c,i)=>v.setUint8(at+i,c.charCodeAt(0)));
   text(0,"RIFF");v.setUint32(4,36+n*2,true);text(8,"WAVE");text(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,16000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,"data");v.setUint32(40,n*2,true);
   for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.sin(i*2*Math.PI*440/8000)*1000,true);
   return new Blob([buffer],{type:"audio/wav"});
  }
  fixture.stream=()=>{
   const t=new EventTarget();Object.assign(t,{kind:"audio",readyState:"live",enabled:true,muted:false,stops:0,
    stop(){this.readyState="ended";this.stops++;}});fixture.tracks.push(t);
   return {getTracks:()=>[t],getAudioTracks:()=>[t],getVideoTracks:()=>[]};
  };
  const getUserMedia=()=>{
   fixture.requests++;
   if(fixture.permission==="deny")return Promise.reject(new DOMException("denied","NotAllowedError"));
   if(fixture.permission==="defer")return new Promise(resolve=>fixture.grant=()=>resolve(fixture.stream()));
   return Promise.resolve(fixture.stream());
  };
  Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia}});
  class Recorder{
   constructor(){this.mimeType="audio/wav";this.state="inactive";fixture.recorders.push(this);}
   start(){this.state="recording";}
   stop(){this.state="inactive";queueMicrotask(()=>{this.ondataavailable?.({data:wav()});this.onstop?.();});}
  }
  Object.defineProperty(window,"MediaRecorder",{configurable:true,writable:true,value:Recorder});
 });
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>typeof setLanguageMode==="function"&&state.cancelVoiceSample);
 await page.click('[data-start-language="es"]');await page.click('[data-avatar-id="panda"]');
 test.phase("late-voices-and-no-visible-pitch");
 eq(await page.locator('#voiceSelect').isDisabled(),true,"No voices initially");
 eq(await page.locator('#voicePitch').count(),0,"Pitch stays internal");
 await page.click('#testVoiceBtn');eq(await page.evaluate(()=>state.voicePlaybackStatus),"unavailable");
 await page.evaluate(()=>{p06.voices=p06.catalog;speechSynthesis.onvoiceschanged();});
 eq(await page.locator('#voiceSelect option').count(),2,"Enumerated voices, not presets");
 eq(await page.locator('#voiceSelect').inputValue(),"es-local","Local voice preferred");
 test.phase("six-languages-ten-styles");
 const styles=await page.locator('#voiceStyle option').evaluateAll(nodes=>nodes.map(n=>n.value));eq(styles.length,10);
 for(const lang of ["es","en","pt","fr","it","de"]){
  await page.selectOption('#languageMode',lang);
  for(const style of styles){
   await page.selectOption('#voiceStyle',style);await page.click('#testVoiceBtn');
   const actual=await page.evaluate(()=>{
    const u=p06.spoken.at(-1);return {lang:u.lang.split('-')[0],values:[u.pitch,u.rate,u.volume],expected:Object.values(ROBOTITO_VOICE_SYSTEM.settings(state.voiceStyle)),status:state.voicePlaybackStatus};
   });
   eq(actual.lang,lang);eq(actual.values,actual.expected,lang+"/"+style);eq(actual.status,"playing");
   await page.click('#stopVoiceBtn');eq(await page.locator('#stopVoiceBtn').isDisabled(),true);
  }
  eq(await page.locator('#refreshVoicesBtn').textContent(),await page.evaluate(lang=>ROBOTITO_I18N.text("Actualizar voces",lang),lang));
 }
 test.phase("preferences-reset-and-explicit-preview");
 await page.selectOption('#languageMode','es');await page.selectOption('#voiceSelect','es-remote');
 await page.selectOption('#languageMode','en');await page.selectOption('#voiceSelect','en-remote');
 await page.selectOption('#languageMode','es');eq(await page.locator('#voiceSelect').inputValue(),"es-remote");
 await page.uncheck('#voiceEnabled');await page.click('#testVoiceBtn');eq(await page.evaluate(()=>state.speaking),true,"Manual preview with automatic replies off");
 await page.click('#stopVoiceBtn');
 await page.evaluate(()=>{state.nextResponseLanguage="de";});await page.click('#testVoiceBtn');
 eq(await page.evaluate(()=>p06.spoken.at(-1).lang),"es-UY","Preview follows UI, not one-reply override");await page.click('#stopVoiceBtn');
 await page.selectOption('#voiceStyle','strange');await page.click('#resetVoiceBtn');
 eq(await page.evaluate(()=>[state.voiceStyle,state.voiceRate,state.voicePitch]),["natural",.82,.65]);
 await page.reload();await page.waitForFunction(()=>state.cancelVoiceSample&&document.documentElement.lang==="es");
 await page.evaluate(()=>{p06.voices=p06.catalog;speechSynthesis.onvoiceschanged();});
 eq(await page.locator('#voiceSelect').inputValue(),"es-remote","Explicit voice survives reload");
 await page.evaluate(()=>{p06.voices=p06.catalog.filter(v=>v.voiceURI!=="es-remote");});await page.click('#refreshVoicesBtn');
 eq(await page.locator('#voiceSelect').inputValue(),"es-local","Removed voice falls back safely");
 await page.evaluate(()=>{p06.voices=p06.catalog;speechSynthesis.onvoiceschanged();});eq(await page.locator('#voiceSelect').inputValue(),"es-remote","Returning voice preference retained");
 await page.evaluate(()=>{p06.speechFault="not-allowed";});await page.click('#testVoiceBtn');
 eq(await page.evaluate(()=>state.voicePlaybackStatus),"blocked");eq(await page.locator('#stopVoiceBtn').isDisabled(),true);
 await page.evaluate(()=>{p06.speechFault=null;state.classMode=true;});await page.click('#testVoiceBtn');eq(await page.evaluate(()=>p06.spoken.length),1,"Class does not speak");
 await page.evaluate(()=>{state.classMode=false;state.silentUntil=Infinity;});await page.click('#testVoiceBtn');eq(await page.evaluate(()=>state.voicePlaybackStatus),"muted");
 await page.evaluate(()=>{state.silentUntil=0;});
 test.phase("sample-consent-denial-late-grant");
 await page.locator('.voice-sample-options summary').click();
 eq(await page.locator('#recordVoiceSample').isDisabled(),true);eq(await page.evaluate(()=>p06.requests),0);
 await page.check('#voiceSampleThirdParty');await page.check('#voiceSampleConsent');eq(await page.locator('#recordVoiceSample').isDisabled(),true,"Third-party name required");
 await page.fill('#voiceSampleName','Consenting tester');
 await page.evaluate(()=>{p06.permission="deny";});await page.click('#recordVoiceSample');
 await page.waitForFunction(()=>!state.voiceSampleCaptureActive);
 eq(await page.evaluate(()=>ROBOTITO_STORE.getRecord("voice-profile-local")),null,"Denied permission stores nothing");
 eq(await page.locator('#recordVoiceSample').isEnabled(),true,"Permission can be retried");
 await page.evaluate(()=>{p06.permission="defer";});await page.click('#recordVoiceSample');
 await page.waitForFunction(()=>typeof p06.grant==="function");await page.click('#cancelVoiceSample');
 await page.evaluate(()=>p06.grant());await page.waitForFunction(()=>p06.tracks[0]?.readyState==="ended");
 eq(await page.evaluate(()=>p06.recorders.length),0,"Late permission does not create a recorder");
 test.phase("record-save-local-playback-reload-delete");
 await page.evaluate(()=>{
  p06.permission="allow";window.RobotitoLocalASR={active:true,pause:x=>p06.pauses.push(x),setLanguage(){}};
 });
 await page.click('#recordVoiceSample');await page.waitForFunction(()=>!document.querySelector('#stopVoiceSample').disabled);
 eq(await page.evaluate(()=>p06.pauses.at(-1)),true,"Recording pauses local ASR");
 // Even a delayed native recognition result is gated while the microphone sample is private.
 const gated=await page.evaluate(()=>{
  state.started=true;state.recognitionWanted=true;
  let starts=0;window.SpeechRecognition=class{start(){starts++;}abort(){}};
  startListeningCycle();state.started=false;return starts;
 });eq(gated,0,"Native ASR cannot restart into a sample");
 await page.click('#testVoiceBtn');eq(await page.evaluate(()=>state.voicePlaybackStatus),"recording");
 await page.click('#stopVoiceSample');await page.waitForFunction(()=>!document.querySelector('#voiceSamplePlayback').hidden);
 eq(await page.evaluate(()=>state.voicePlaybackStatus),"idle","Recording blocker clears after save");
 const saved=await page.evaluate(async()=>{
  const p=await ROBOTITO_VOICE_SYSTEM.loadProfile();return {consent:p.record.data.consentRecorded,subject:p.record.data.subject,clone:p.record.data.cloned,type:p.blob.type,tracks:p06.tracks.every(t=>t.stops===1),paused:document.querySelector('#voiceSampleAudio').paused};
 });eq(saved,{consent:true,subject:"other",clone:false,type:"audio/wav",tracks:true,paused:true});
 test.phase("mobile-sample-controls");
 await page.setViewportSize({width:390,height:844});await page.selectOption('#languageMode','de');
 const card=page.locator('div.card.small').filter({has:page.locator('#voiceSelect')});
 const bounds=await card.boundingBox();eq(bounds.x>=0&&bounds.x+bounds.width<=390,true,"Voice card fits a narrow viewport");
 eq(await page.evaluate(()=>document.querySelector('#voiceRate').value),"0.82","Speed control shows the exact default");
 const imageName="p06-voice-controls-"+test.engineName+".png";
 await card.screenshot({style:".topbar,.tabs{visibility:hidden}",path:require('node:path').join(__dirname,'..','test-results',imageName)});
 test.report.artifacts.voiceControls=imageName;
 await page.selectOption('#languageMode','es');await page.setViewportSize({width:1280,height:900});
 await page.evaluate(async()=>{state.speechBlocked=true;await document.querySelector('#voiceSampleAudio').play();});
 await page.waitForFunction(()=>state.voiceSamplePlaybackActive===true);eq(await page.evaluate(()=>p06.pauses.at(-1)),true,"Playback pauses recognition");
 await page.evaluate(()=>document.querySelector('#voiceSampleAudio').pause());
 await page.waitForFunction(()=>state.voiceSamplePlaybackActive===false);eq(await page.evaluate(()=>state.speechBlocked),true,"Playback must preserve unrelated ASR permission failure");
 await page.evaluate(async()=>{state.speechBlocked=false;state.classMode=true;await document.querySelector('#voiceSampleAudio').play().catch(()=>{});});
 await page.waitForFunction(()=>document.querySelector('#voiceSampleAudio').paused);
 eq(await page.evaluate(()=>state.voiceSamplePlaybackActive),false,"Class mode prevents sample playback too");
 await page.evaluate(()=>{state.classMode=false;});
 await page.reload();await page.waitForFunction(()=>!document.querySelector('#voiceSamplePlayback').hidden);
 eq(await page.evaluate(()=>document.querySelector('#voiceSampleAudio').paused),true,"Reload never autoplays personal recording");
 eq(await page.locator('#voiceSampleConsent').isChecked(),false,"New recordings require fresh consent after reload");
 await page.locator('.voice-sample-options summary').click();await page.click('#deleteVoiceSample');
 await page.waitForFunction(async()=>!(await ROBOTITO_STORE.getRecord("voice-profile-local")));
 eq(await page.evaluate(()=>ROBOTITO_STORE.getBlob("voice-sample-local")),null,"Delete removes audio too");
 eq(await page.locator('#voiceSamplePlayback').isHidden(),true);
 test.phase("discard-revoke-storage-failure-and-no-recorder");
 await page.check('#voiceSampleConsent');await page.click('#recordVoiceSample');await page.waitForFunction(()=>!document.querySelector('#stopVoiceSample').disabled);
 await page.uncheck('#voiceSampleConsent');await page.waitForFunction(()=>!state.voiceSampleCaptureActive);
 eq(await page.evaluate(()=>ROBOTITO_STORE.getRecord("voice-profile-local")),null,"Revocation discards captured audio");
 await page.check('#voiceSampleConsent');await page.evaluate(()=>{window.p06OriginalSave=ROBOTITO_STORE.putRecordWithBlob;ROBOTITO_STORE.putRecordWithBlob=async()=>{throw Error("Quota exceeded");};});
 await page.click('#recordVoiceSample');await page.waitForFunction(()=>!document.querySelector('#stopVoiceSample').disabled);await page.click('#stopVoiceSample');
 await page.waitForFunction(()=>!state.voiceSampleCaptureActive);
 eq(await page.evaluate(()=>ROBOTITO_STORE.getRecord("voice-profile-local")),null,"Storage failure never creates fake profile");
 eq(await page.locator('#voiceSamplePlayback').isHidden(),true);
 await page.evaluate(()=>{ROBOTITO_STORE.putRecordWithBlob=p06OriginalSave;window.MediaRecorder=undefined;});
 const asked=await page.evaluate(()=>p06.requests);await page.click('#recordVoiceSample');eq(await page.evaluate(()=>p06.requests),asked,"Unsupported recorder does not request a microphone");
 eq(await page.locator('#voiceSampleStatus').textContent(),"Este navegador no permite grabar muestras de voz.");
 test.report.result={checks,languages:6,styles:10,syntheticMedia:true,actualIndexedDB:true,nativeAudioPlayback:true};
 console.log("P06 browser:",checks,"checks; six locales, ten styles, recording, native playback, reload, deletion and failures passed");
}).catch(error=>{console.error(error);process.exitCode=1;});
