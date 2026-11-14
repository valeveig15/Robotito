"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p07-restore-undo",async test=>{
 const {page,baseURL}=test;
 test.phase("p07-undo");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_STORE?.undoLastRestore
  &&window.ROBOTITO_STORE?.restoreBackup),null,{timeout:20000});
 const result=await page.evaluate(async()=>{
  const s=window.ROBOTITO_STORE;
  const expectReject=async task=>{
   try{await task();return false;}catch{return true;}
  };
  await s.putRecord({id:"p07-before",type:"memories",owner:"Ada",
   data:{text:"Remembered before restore"}});
  await s.putRecordWithBlob({id:"p07-undo-audio",type:"audios",owner:"Ada",
   blobId:"p07-undo-blob",data:{consentRecorded:true}},
   new Blob([new Uint8Array([0,1,123,255,200])],{type:"audio/webm"}),{type:"audio"});
  await s.set("p07-undo-custom",{phase:"before"});
  const base=await s.exportBackup();
  await s.putRecord({id:"p07-after",type:"memories",owner:"Bob",
   data:{text:"This must survive the undo"}});
  await s.set("p07-undo-custom",{phase:"after"});
  // A cyclic value is valid IndexedDB data but cannot be safely serialized
  // into the checkpoint estimate. The failed import must keep the old state.
  const cycle={};cycle.self=cycle;
  await s.set("p07-undo-cycle",cycle);
  const rejectedCheckpoint=await expectReject(()=>s.restoreBackup(base,{confirmation:"RESTAURAR"}));
  const unchanged=(await s.getRecord("p07-after"))?.owner==="Bob"&&
   (await s.get("p07-undo-custom")).phase==="after";
  await s.remove("p07-undo-cycle");
  await s.restoreBackup(base,{confirmation:"RESTAURAR"});
  const undoInfo=await s.getRestoreUndoInfo();
  const undoPreservesBob=undoInfo?.owners.includes("Bob");
  const originalRestored=(await s.getRecord("p07-after"))===null&&
   (await s.get("p07-undo-custom")).phase==="before";
  const exported=await s.exportBackup();
  const noUndoLeak=exported.state.every(row=>row.key!=="robotito.restore.undo.v1")&&
   !JSON.stringify(exported).includes("robotito.restore.undo.v1");
  const badConfirmation=await expectReject(()=>s.undoLastRestore({confirmation:"sí"}));
  await s.undoLastRestore({confirmation:"DESHACER"});
  const undoWorks=(await s.getRecord("p07-after"))?.owner==="Bob"&&
   (await s.get("p07-undo-custom")).phase==="after";
  const singleUse=(await s.getRestoreUndoInfo())===null&&
   await expectReject(()=>s.undoLastRestore({confirmation:"DESHACER"}));
  const binary=[...new Uint8Array(await (await s.getBlob("p07-undo-blob")).arrayBuffer())];
  // A privacy-sensitive deletion must discard any pre-restore data snapshot.
  await s.restoreBackup(base,{confirmation:"RESTAURAR"});
  await s.deleteRecord("p07-before");
  const invalidatedAfterDelete=(await s.getRestoreUndoInfo())===null;
  // Recreate checkpoint for the visible undo button.
  await s.restoreBackup(base,{confirmation:"RESTAURAR"});
  return {rejectedCheckpoint,unchanged,undoPreservesBob,originalRestored,
   noUndoLeak,badConfirmation,undoWorks,singleUse,
   binary,invalidatedAfterDelete,readyForUi:!!(await s.getRestoreUndoInfo())};
 });
 for(const [name,value] of Object.entries(result)){
  if(name==="binary")assert.deepEqual(value,[0,1,123,255,200],name);
  else assert.equal(value,true,name);
 }
 test.phase("p07-undo-ui");
 await page.reload({waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_STORE?.getRestoreUndoInfo),null,{timeout:20000});
 await page.addStyleTag({content:"#languageGate{display:none !important;pointer-events:none !important;}"});
 await page.locator('[data-tab="memory"]').click();
 await page.locator("details.memory-backup summary").click();
 await page.waitForFunction(()=>!document.getElementById("undoMemoryRestore").disabled);
 await page.evaluate(()=>{
  window.__p07UndoConfirmed=0;
  window.confirm=()=>{window.__p07UndoConfirmed++;return true;};
  window.prompt=()=>"DESHACER";
 });
 await page.locator("#undoMemoryRestore").click();
 await page.waitForFunction(async()=>{
  const s=window.ROBOTITO_STORE;
  return !!s?.getRestoreUndoInfo&&!(await s.getRestoreUndoInfo())&&
   (await s.getRecord("p07-after"))?.owner==="Bob";
 },null,{timeout:20000});
 // Recreate and discard from the actual panel; no data should be restored by it.
 await page.evaluate(async()=>{
  const s=window.ROBOTITO_STORE;
  await s.restoreBackup(await s.exportBackup(),{confirmation:"RESTAURAR"});
 });
 await page.reload({waitUntil:"domcontentloaded"});
 await page.addStyleTag({content:"#languageGate{display:none !important;pointer-events:none !important;}"});
 await page.locator('[data-tab="memory"]').click();
 await page.locator("details.memory-backup summary").click();
 await page.waitForFunction(()=>!document.getElementById("discardMemoryUndo").disabled);
 await page.evaluate(()=>window.confirm=()=>true);
 await page.locator("#discardMemoryUndo").click();
 await page.waitForFunction(async()=>!(await window.ROBOTITO_STORE.getRestoreUndoInfo()),null,{timeout:10000});
 assert.equal(await page.locator("#undoMemoryRestore").isDisabled(),true);
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={atomicRollback:true,cyclicFailureSafe:true,binaryPreserved:true,
  ownerPreserved:true,oneStepUndo:true,checkpointHidden:true,
  privateDeleteInvalidatesUndo:true,uiUndo:true,uiDiscard:true};
 console.log("P07 "+test.engineName+" reversible local restoration: checkpoint, rollback, undo and privacy passed");
}).catch(e=>{console.error(e);process.exitCode=1;});
