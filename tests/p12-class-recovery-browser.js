"use strict";
const assert=require("node:assert/strict"),{runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p12-class-recovery",async test=>{
 const {page,baseURL}=test;let checks=0;
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});await page.waitForFunction(()=>ROBOTITO_MEMORY.active);
 test.phase("atomic-chunks-and-privacy");
 checks+=await page.evaluate(async()=>{
  let checks=0;const check=(ok,msg)=>{if(!ok)throw Error(msg);checks++;};
  const rejected=async action=>{try{await action();return false;}catch{return true;}};
  const j=ROBOTITO_CLASS_JOURNAL,s=ROBOTITO_STORE,anonymous=ROBOTITO_MEMORY.owner();
  const meta=(id,owner)=>({id,owner,writerToken:id+"-writer",subject:"Physics",topic:"Waves",startedAt:Date.now()-5000,sessionId:id+"-session",mimeType:"audio/webm"});
  await j.begin(meta("ram",anonymous));await j.append("ram",anonymous,"ram-writer",0,new Blob(["private"]));
  check((await j.list(anonymous)).length===1,"Anonymous partial audio stays available in current RAM session");
  check(!(await s.exportBackup()).records.some(row=>row.owner===anonymous),"Unconsented audio fragments never enter a backup");
  state.currentVoicePerson="Ada";state.lastVoiceConfirmedAt=Date.now();await ROBOTITO_MEMORY.ready();
  await j.begin(meta("recovery","Ada"));
  check(await rejected(()=>j.append("recovery","Bea","recovery-writer",0,new Blob(["wrong"]))),"Cannot append another owner's recording");
  await j.append("recovery","Ada","recovery-writer",0,new Blob(["first "]));
  check(await rejected(()=>j.append("recovery","Ada","recovery-writer",2,new Blob(["gap"]))),"A skipped chunk does not create a fake complete recording");
  await j.append("recovery","Ada","recovery-writer",1,new Blob(["second"]));
  check((await j.list("Ada"))[0].chunkCount===2,"Rejected sequence leaves metadata unchanged");
  check(await rejected(()=>j.claim("recovery","Ada")),"Live lease blocks recovery from another tab");
  await j.seal("recovery","Ada","recovery-writer",{complete:false,reason:"simulated crash"});
  const backup=await s.exportBackup();
  check(backup.records.filter(row=>row.source==="class-recorder-part").length===2,"Backups include consented committed chunks");
  const add=IDBObjectStore.prototype.add;
  IDBObjectStore.prototype.add=function(value,...args){if(this.name==="blobs"&&value.id==="class-audio:recovery")throw new DOMException("full","QuotaExceededError");return add.call(this,value,...args);};
  check(await rejected(()=>j.finish("recovery","Ada","recovery-writer")),"Quota failure is surfaced");
  IDBObjectStore.prototype.add=add;
  check(!(await s.getRecord("class-audio:recovery")),"Failed assembly cannot leave fake completed metadata");
  check((await j.list("Ada"))[0].chunkCount===2,"Failed assembly retains recoverable original chunks");
  check(!(await j.list("Bea")).length,"Other owner cannot list pending audio");
  return checks;
 });
 test.phase("reload-and-visible-recovery");
 await page.reload();await page.waitForFunction(()=>ROBOTITO_MEMORY.active);
 assert.equal(await page.evaluate(async()=>(await ROBOTITO_CLASS_JOURNAL.list(ROBOTITO_MEMORY.owner())).length),0);checks++;
 await page.evaluate(async()=>{state.currentVoicePerson="Ada";state.lastVoiceConfirmedAt=Date.now();await ROBOTITO_MEMORY.ready();await ROBOTITO_CLASS_AUDIO.render();document.getElementById("languageGate").style.display="none";});
 await page.locator('[data-tab="class"]').click();
 await page.locator("#classRecordingRecovery").getByRole("button",{name:"Recuperar audio parcial",exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[data-recording-id="recovery"]'));
 const recovered=await page.evaluate(async()=>{
  const rows=await ROBOTITO_CLASS_AUDIO.listRecordings(),r=rows.find(row=>row.id==="recovery");
  return {text:await r.blob.text(),complete:r.complete,pending:(await ROBOTITO_CLASS_JOURNAL.list("Ada")).length,
   fragments:(await ROBOTITO_STORE.queryRecords({owner:"Ada",type:"audios",limit:Infinity})).filter(row=>row.source==="class-recorder-part").length};
 });
 assert.deepEqual(recovered,{text:"first second",complete:false,pending:0,fragments:0});checks++;
 assert.ok((await page.locator('[data-recording-id="recovery"]').textContent()).includes("parcial"));checks++;
 test.phase("deletion-removes-recovery-material");
 checks+=await page.evaluate(async()=>{
  const j=ROBOTITO_CLASS_JOURNAL,s=ROBOTITO_STORE;
  await j.begin({id:"delete-me",owner:"Ada",writerToken:"writer",subject:"Private",startedAt:Date.now()});
  await j.append("delete-me","Ada","writer",0,new Blob(["private bytes"]));
  await ROBOTITO_MEMORY_STATE.deleteOwner("Ada",{confirmation:"BORRAR"});
  if((await j.list("Ada")).length)throw Error("Deleted history must not retain a recovery draft");
  if(await s.getBlob("class-audio-part:delete-me:00000000"))throw Error("Deleted history must not retain chunk bytes");
  try{await j.append("delete-me","Ada","writer",1,new Blob(["late"]));throw Error("Late write resurrected deleted audio");}catch(error){if(error.message.includes("resurrected"))throw error;}
  return 3;
 });
 test.phase("legacy-fragments-without-owner");
 checks+=await page.evaluate(async()=>{
  const db=await new Promise((resolve,reject)=>{const request=indexedDB.open("robotito-class-audio-v1",1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  const tx=db.transaction("chunks","readwrite");tx.objectStore("chunks").put({key:"old:00000000",sessionId:"old",seq:0,blob:new Blob(["old private fragment"])});
  await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
  await ROBOTITO_CLASS_AUDIO.migrateAudio();
  const row=await ROBOTITO_STORE.getRecord("class-audio-orphan:old");
  if(row?.owner!=="legacy:unassigned"||row.data.originalDateUnknown!==true||row.data.complete!==false)throw Error("Legacy fragments cannot invent an owner, date or completeness");
  if(await (await ROBOTITO_STORE.getBlob(row.blobId)).text()!=="old private fragment")throw Error("Legacy migration must preserve bytes");
  if((await ROBOTITO_CLASS_AUDIO.listRecordings()).some(item=>item.id===row.id))throw Error("Unassigned archive cannot leak into current class history");
  return 3;
 });
 test.report.checks=checks;console.log("P12 interrupted recording, quota, reload, privacy and atomic recovery:",checks,"checks");
}).catch(e=>{console.error(e);process.exitCode=1;});
