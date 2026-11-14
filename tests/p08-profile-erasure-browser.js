"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p08-profile-erasure",async test=>{
 const {page,baseURL}=test;
 test.phase("p08-profile-erasure");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_STORE?.deleteRegisteredProfile),
  null,{timeout:20000});
 const prepared=await page.evaluate(async()=>{
  const store=window.ROBOTITO_STORE;
  const vector=Array.from({length:128},(_,i)=>i/600);
  const alice={name:"Ada",role:"me",birthday:"2008-10-30",
   descriptors:[vector,vector,vector],voicePrints:[[1,0],[1,0],[1,0]],
   biometricConsent:{granted:true,recordedAt:Date.now(),scope:"face-and-voice"}};
  const bob={name:"Bruno",role:"classmate",birthday:"2007-05-14",
   descriptors:[vector,vector,vector],voicePrints:[[0,1],[0,1],[0,1]],
   biometricConsent:{granted:true,recordedAt:Date.now(),scope:"face-and-voice"}};
  await store.set("robotito.people.v2",[alice,bob]);
  await store.set("robotito.memories.v2",[
   {id:"ada-memory",owner:"Ada",text:"Only Ada",at:Date.now()},
   {id:"bob-memory",owner:"Bruno",text:"Only Bruno",at:Date.now()},
   {id:"unknown-memory",owner:"local",text:"Unverified",at:Date.now()}]);
  await store.set("robotito.classLines.v1",[
   {id:"p08-class-ada",speakerName:"Ada",speaker:"teacher",voicePrint:[1,0],
    feature:[1,0],text:"Learning notes should remain",at:Date.now()},
   {id:"p08-class-bruno",speakerName:"Bruno",speaker:"classmate",
    voicePrint:[0,1],text:"Bruno's class contribution",at:Date.now()}]);
  for(const [id,owner,type,data] of [
   ["p08-owner-ada","Ada","memories",{text:"private"}],
   ["p08-owner-bruno","Bruno","memories",{text:"private"}],
   ["p08-owner-unknown","local","memories",{text:"not attributed"}],
   ["p08-legacy-person","local","people",{name:"Ada"}],
   ["p08-legacy-birthday","local","birthdays",{person:"Ada",date:"2008-10-30"}],
   ["p08-related","Bruno","notes",{text:"note"}]]){
    await store.putRecord({id,owner,type,data,
     relatedIds:id==="p08-related"?["p08-owner-ada"]:[]});
  }
  await store.putRecordWithBlob({id:"p08-audio-ada",owner:"Ada",type:"audios",
   blobId:"p08-blob-ada",data:{consentRecorded:true}},
   new Blob([new Uint8Array([0,255,9])],{type:"audio/webm"}),{type:"audio"});
  await store.putRecordWithBlob({id:"p08-audio-bruno",owner:"Bruno",type:"audios",
   blobId:"p08-blob-bruno",data:{consentRecorded:true}},
   new Blob([new Uint8Array([1,2,3])],{type:"audio/webm"}),{type:"audio"});
  const copied=await store.exportBackup();
  await store.restoreBackup(copied,{confirmation:"RESTAURAR"});
  if(!await store.getRestoreUndoInfo())throw Error("Restore checkpoint not created");
  let denied=false;
  try{await store.deleteRegisteredProfile("Ada",{confirmation:"yes"});}
  catch{denied=true;}
  return {denied,backup:!!(await store.getRecord("p08-owner-ada"))};
 });
 assert.equal(prepared.denied,true,"Deletion demands the exact explicit confirmation");
 assert.equal(prepared.backup,true,"Denied deletion must not change state");
 await page.reload({waitUntil:"domcontentloaded"});
 await page.addStyleTag({content:"#languageGate{display:none !important;pointer-events:none !important;}"});
 await page.locator('[data-tab="people"]').click();
 await page.locator(".person-row").filter({hasText:"Ada"}).waitFor({timeout:15000});
 test.phase("p08-cancel-erasure");
 await page.evaluate(()=>{
  window.__p08PromptCount=0;
  window.confirm=()=>true;
  window.prompt=()=>{window.__p08PromptCount++;return "NO";};
 });
 await page.locator(".person-row").filter({hasText:"Ada"})
  .locator(".p08-profile-actions button").click();
 assert.equal(await page.evaluate(()=>window.__p08PromptCount),1);
 assert.equal(await page.evaluate(async()=>Boolean(await window.ROBOTITO_STORE.getRecord("p08-owner-ada"))),true);
 test.phase("p08-confirm-erasure");
 await page.evaluate(()=>{window.confirm=()=>true;window.prompt=()=>"BORRAR";});
 await Promise.all([
  page.waitForEvent("domcontentloaded",{timeout:20000}),
  page.locator(".person-row").filter({hasText:"Ada"})
   .locator(".p08-profile-actions button").click()
 ]);
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_STORE?.deleteRegisteredProfile));
 const after=await page.evaluate(async()=>{
  const s=window.ROBOTITO_STORE;
  const [people,memories,lines]=await Promise.all([
   s.get("robotito.people.v2",[]),s.get("robotito.memories.v2",[]),
   s.get("robotito.classLines.v1",[])]);
  const note=await s.getRecord("p08-related");
  const audit=await s.audit();
  return {
   people:people.map(p=>p.name),
   memoryOwners:memories.map(m=>m.owner),
   ada:await s.getRecord("p08-owner-ada"),
   legacyPerson:await s.getRecord("p08-legacy-person"),
   legacyBirthday:await s.getRecord("p08-legacy-birthday"),
   bob:await s.getRecord("p08-owner-bruno"),
   unknown:await s.getRecord("p08-owner-unknown"),
   adaAudio:await s.getBlob("p08-blob-ada"),
   brunoAudio:!!(await s.getBlob("p08-blob-bruno")),
   relations:note.relatedIds,
   adaLine:lines.find(l=>l.id==="p08-class-ada"),
   brunoLine:lines.find(l=>l.id==="p08-class-bruno"),
   undo:await s.getRestoreUndoInfo(),
   problems:audit.missingBlobs.concat(audit.orphanBlobs)
  };
 });
 assert.deepEqual(after.people,["Bruno"]);
 assert.deepEqual(after.memoryOwners,["Bruno","local"]);
 for(const key of ["ada","legacyPerson","legacyBirthday","adaAudio","undo"])
  assert.equal(after[key],null,key+" must be securely cleared locally");
 assert.equal(after.bob.owner,"Bruno");
 assert.equal(after.unknown.owner,"local","Anonymous memories may not be claimed by name");
 assert.equal(after.brunoAudio,true,"Other person's binary sample is preserved");
 assert.deepEqual(after.relations,[],"Relations to a deleted identity are scrubbed");
 assert.equal(after.adaLine.speakerName,null);
 assert.equal(after.adaLine.voicePrint,undefined);
 assert.equal(after.adaLine.feature,undefined);
 assert.equal(after.adaLine.text,"Learning notes should remain");
 assert.equal(after.brunoLine.speakerName,"Bruno");
 assert.deepEqual(after.problems,[]);
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={revocationConfirmed:true,otherOwnersSafe:true,anonymousSafe:true,
  biometricBlobErased:true,restoreUndoInvalidated:true,transcriptSamplesRedacted:true};
 console.log("P08 "+test.engineName+" profile revocation: owner, consent, audio, local records, undo passed");
}).catch(error=>{console.error(error);process.exitCode=1;});
