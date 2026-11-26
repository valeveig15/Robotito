"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p07-class-audio-privacy",async test=>{
 const {page,baseURL}=test;let checks=0;
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>ROBOTITO_MEMORY.active);
 test.phase("audio-owner-boundaries");
 checks+=await page.evaluate(async()=>{
  let checks=0;const check=(ok,msg)=>{if(!ok)throw Error(msg);checks++;};
  const rejected=async fn=>{try{await fn();return false;}catch{return true;}};
  state.currentVoicePerson="Ada";state.lastVoiceConfirmedAt=Date.now();await ROBOTITO_MEMORY.ready();
  const id="privacy-audio",s=ROBOTITO_STORE,a=ROBOTITO_CLASS_AUDIO;
  await s.putRecordWithBlob({id:"class-audio:"+id,type:"audios",owner:"Ada",source:"class-recorder",blobId:id,
   subject:"Private Ada subject",data:{id,owner:"Ada",subject:"Private Ada subject",topic:"Secret",startedAt:Date.now(),size:4,mimeType:"audio/webm"}},new Blob(["test"],{type:"audio/webm"}));
  await a.render();check(document.getElementById("classRecordingsList").textContent.includes("Private Ada"),"Ada sees her recording");
  const getBlob=s.getBlob;let release;
  s.getBlob=async(blobId,...args)=>{
   const blob=await getBlob(blobId,...args);
   if(blobId!==id)return blob;
   s.getBlob=getBlob;
   return new Promise(resolve=>{release=()=>resolve(blob);});
  };
  const pending=a.render();while(!release)await new Promise(resolve=>setTimeout(resolve,0));
  state.currentVoicePerson="Bea";state.lastVoiceConfirmedAt=Date.now();
  check(!document.getElementById("classRecordingsList").textContent.includes("Private Ada"),"Previous audio disappears synchronously while the new history loads");
  release();await pending;await ROBOTITO_MEMORY.ready();
  check(await rejected(()=>a.updateMetadata(id,{subject:"Stolen"})),"Another owner cannot edit audio metadata");
  check(await rejected(()=>a.removeRecording(id)),"Another owner cannot delete audio");
  check((await s.getRecord("class-audio:"+id)).data.subject==="Private Ada subject","Rejected updates preserve data");
  check((await a.listRecordings()).length===0,"Another owner cannot list the audio");
  state.currentVoicePerson="Ada";state.lastVoiceConfirmedAt=Date.now();await ROBOTITO_MEMORY.ready();
  const old=(await a.listRecordings())[0];await a.updateMetadata(id,{subject:"Physics",topic:"Waves"});
  check((await s.getRecord("class-audio:"+id)).subject==="Physics","Audio metadata and typed search fields stay coherent");
  check(await rejected(()=>a.removeRecording(id,{owner:"Ada",expectedVersion:old.version})),"Stale delete cannot erase a concurrent edit");
  await a.removeRecording(id);check(!(await s.getRecord("class-audio:"+id)),"Owner deletion removes metadata");
  check(!(await s.getBlob(id)),"Owner deletion removes bytes");return checks;
 });
 assert.equal(checks,10);test.report.checks=checks;
 console.log("P07 class audio privacy:",checks,"checks");
}).catch(e=>{console.error(e);process.exitCode=1;});
