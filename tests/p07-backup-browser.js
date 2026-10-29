"use strict";
const assert=require("node:assert/strict");
const path=require("node:path"),{spawn}=require("node:child_process");
const {chromium}=require("playwright");
const port=Number(process.env.ROBOTITO_P07_PORT||8874);
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{
 cwd:path.resolve(__dirname,".."),stdio:"ignore"});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 let browser;
 try{
  await pause(600);
  browser=await chromium.launch({headless:true,acceptDownloads:true});
  const page=await browser.newPage({acceptDownloads:true,viewport:{width:1280,height:900}});
  const errors=[];page.on("pageerror",e=>errors.push(String(e)));
  await page.route("https://cdn.jsdelivr.net/**",r=>r.fulfill({
   status:200,contentType:"application/javascript",body:""
  }));
  await page.goto("http://127.0.0.1:"+port+"/",{waitUntil:"domcontentloaded",timeout:30000});
  await page.waitForFunction(()=>Boolean(window.ROBOTITO_STORE?.exportBackup)
   &&Boolean(window.ROBOTITO_STORE?.restoreBackup),null,{timeout:20000});
  const result=await page.evaluate(async()=>{
   const store=window.ROBOTITO_STORE;
   const at=Date.now()-60000;
   await store.putRecord({id:"p07-ada",type:"memories",owner:"Ada",timestamp:at,
    data:{text:"Only Ada may see this"}});
   await store.putRecord({id:"p07-visitor",type:"memories",owner:"visitor:pseudo-1",
    timestamp:at,data:{text:"Consent-backed anonymous profile"}});
   await store.putRecord({id:"p07-local",type:"memories",owner:"local",timestamp:at,
    data:{text:"Anonymous session stays anonymous"}});
   await store.putRecordWithBlob({id:"p07-audio",type:"audios",owner:"Ada",
    blobId:"p07-linked-blob",data:{consentRecorded:true}},new Blob([
     new Uint8Array([0,1,2,3,255,254,128])],{type:"audio/webm"}),{type:"audio"});
   await store.putBlob("p07-free-blob",new Blob([new Uint8Array([5,4,3,2,1])],
    {type:"application/pdf"}),{owner:"local",type:"pdf"});
   await store.set("p07-custom-state",{kind:"unlinked-local-state"});
   const snapshot=await store.exportBackup();
   const summary=store.validateBackup(snapshot);
   if(!summary.owners.includes("visitor:pseudo-1")||!summary.owners.includes("Ada"))
    throw Error("Owner separation lost in export");
   const archived=JSON.parse(JSON.stringify(snapshot));
   const clone=()=>JSON.parse(JSON.stringify(archived));
   const expectRejection=async(fn,message)=>{
    let rejected=false;try{await fn();}catch{rejected=true;}
    if(!rejected)throw Error(message);
   };
   const corrupt=clone();
   corrupt.records.find(x=>x.id==="p07-audio").owner="visitor:pseudo-1";
   await expectRejection(()=>store.restoreBackup(corrupt,{confirmation:"RESTAURAR"}),
    "Cross-owner blob import must be rejected");
   const duplicate=clone();duplicate.records.push({...duplicate.records[0]});
   await expectRejection(()=>store.restoreBackup(duplicate,{confirmation:"RESTAURAR"}),
    "Duplicate IDs must be rejected");
   await expectRejection(()=>store.restoreBackup(archived,{confirmation:"yes"}),
    "Restore must require exact explicit confirmation");
   const corruptData=clone();corruptData.blobs.find(x=>x.id==="p07-linked-blob").base64="bad!";
   await expectRejection(()=>store.restoreBackup(corruptData,{confirmation:"RESTAURAR"}),
    "Corrupted audio must be rejected");
   if((await store.getRecord("p07-local"))?.owner!=="local")
    throw Error("Rejected restore mutated live data");
   await store.putRecord({id:"p07-excess",type:"memories",owner:"Ada",
    data:{text:"Record after backup, intentionally removed on restore"}});
   await store.restoreBackup(archived,{confirmation:"RESTAURAR"});
   if(await store.getRecord("p07-excess"))throw Error("Restore did not replace snapshot");
   for(const [id,owner] of [["p07-local","local"],["p07-visitor","visitor:pseudo-1"],
      ["p07-ada","Ada"],["p07-audio","Ada"]]){
    if((await store.getRecord(id))?.owner!==owner)throw Error("Owner changed for "+id);
   }
   if((await store.get("p07-custom-state")).kind!=="unlinked-local-state")
    throw Error("Previous IndexedDB state not restored");
   const audio=new Uint8Array(await (await store.getBlob("p07-linked-blob")).arrayBuffer());
   if(JSON.stringify([...audio])!==JSON.stringify([0,1,2,3,255,254,128]))
    throw Error("Binary voice recording changed");
   const pdf=await store.getBlob("p07-free-blob");
   if(!pdf||pdf.size!==5)throw Error("Standalone PDF blob was omitted");
   const other=await store.queryRecords({type:"memories",owner:"visitor:pseudo-1"});
   if(other.some(x=>x.owner!=="visitor:pseudo-1"))throw Error("Owner query leaks profiles");
   return {records:summary.records,blobs:summary.blobs,
    owners:summary.owners.length,preservedAudioBytes:audio.length,restored:true};
  });
  assert.equal(result.restored,true);
  // The UI does not let an import begin without first preparing a backup.
  // This regression tests P07, not the separately tested onboarding gate.
  // Startup init can re-open the gate asynchronously; isolate this P07 test
  // with an overriding stylesheet instead of a racy one-time style mutation.
  await page.addStyleTag({content:"#languageGate{display:none !important;pointer-events:none !important;}"});
  await page.locator('[data-tab="memory"]').click();
  await page.locator("details.memory-backup summary").click();
  assert.equal(await page.locator("#chooseMemoryBackup").isDisabled(),true);
  let download;
  try{
    [download]=await Promise.all([page.waitForEvent("download",{timeout:8000}),page.locator("#downloadMemoryBackup").click()]);
  }catch(error){
    const status=await page.locator("#memoryBackupStatus").textContent();
    throw Error("Backup status: "+status+" / "+error.message);
  }
  assert.match(download.suggestedFilename(),/^robotito-indexeddb-\d{4}-\d{2}-\d{2}\.json$/);
  await page.waitForFunction(()=>!document.getElementById("chooseMemoryBackup").disabled);
  const saved=await download.path();
  assert.ok(saved,"The backup was provided as a downloadable file");
  // Browser UI must show a confirmation for full-dataset replacement.
  await page.evaluate(()=>{window.__p07ConfirmCount=0;
   window.confirm=()=>{window.__p07ConfirmCount++;return false;};
   window.prompt=()=>{throw Error("Prompt must not run when confirmation denied");};
  });
  await page.locator("#memoryBackupFile").setInputFiles(saved);
  await page.waitForFunction(()=>window.__p07ConfirmCount===1,null,{timeout:5000});
  assert.equal(await page.evaluate(()=>document.getElementById("memoryBackupFile").value),"");
  assert.deepEqual(errors,[],"No uncaught errors: "+errors.join(" | "));
  console.log("P07 real IndexedDB browser backup and safe restore:",JSON.stringify(result),
   "cross-owner rejection, bad bytes, duplicate IDs, explicit confirmation and download passed");
 }finally{
  if(browser)await browser.close();
  server.kill("SIGTERM");
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
