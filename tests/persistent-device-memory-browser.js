"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("persistent-device-memory",async test=>{
 const {page,baseURL}=test;
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 if(await page.locator("#languageGate").isVisible()){
  await page.locator('[data-start-language="es"]').click();
  await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 }
 test.phase("temporary-before-explicit-consent");
 const initial=await page.evaluate(()=>({
  owner:window.ROBOTITO_MEMORY.owner(),
  ephemeral:window.ROBOTITO_STORE.isEphemeral(window.ROBOTITO_MEMORY.owner()),
  optedIn:document.getElementById("deviceMemoryEnabled").checked
 }));
 assert.equal(initial.ephemeral,true);
 assert.equal(initial.optedIn,false);
 test.phase("opt-in-to-local-persistent-memory");
 page.once("dialog",dialog=>dialog.accept());
 await page.locator('[data-tab="memory"]').click();
 await page.locator("#deviceMemoryEnabled").check();
 await page.waitForFunction(()=>window.ROBOTITO_MEMORY.owner().startsWith("device:"));
 const saved=await page.evaluate(()=>window.ROBOTITO_MEMORY.owner());
 assert.equal(await page.locator("#deviceMemoryEnabled").isChecked(),true);
 assert.equal(await page.evaluate(()=>window.ROBOTITO_STORE.isEphemeral(window.ROBOTITO_MEMORY.owner())),false);
 test.phase("record-user-message-and-reopen");
 const words="Recuerda el dato de persistencia "+Date.now();
 await page.locator("#robotitoTextInput").fill(words);
 await page.locator("#robotitoTextSend").click();
 await page.waitForFunction(async words=>{
  const rows=await window.ROBOTITO_STORE.queryRecords({type:"conversations",owner:window.ROBOTITO_MEMORY.owner(),limit:Infinity});
  return rows.some(row=>row.data?.role==="user"&&row.data.text===words);
 },words);
 await page.reload({waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 await page.waitForFunction(owner=>window.ROBOTITO_MEMORY.owner()===owner,saved);
 await page.waitForFunction(words=>document.getElementById("typedChatHistory").textContent.includes(words),words);
 assert.equal(await page.locator("#deviceMemoryEnabled").isChecked(),true);
 assert.equal(await page.evaluate(()=>window.ROBOTITO_MEMORY.owner()),saved);
 const memoryRows=await page.evaluate(async()=>window.ROBOTITO_STORE.queryRecords({
  type:"memories",owner:window.ROBOTITO_MEMORY.owner(),limit:Infinity
 }));
 assert.ok(memoryRows.some(row=>row.data?.text===words),"Spoken/text memories persist in same browser");
 test.phase("disable-device-memory-keeps-history-private");
 await page.evaluate(()=>document.querySelector("#deviceMemoryEnabled").click());
 await page.waitForFunction(()=>window.ROBOTITO_STORE.isEphemeral(window.ROBOTITO_MEMORY.owner()));
 assert.notEqual(await page.evaluate(()=>window.ROBOTITO_MEMORY.owner()),saved);
 assert.equal(await page.locator("#deviceMemoryEnabled").isChecked(),false);
 await page.reload({waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 assert.equal(await page.evaluate(()=>window.ROBOTITO_STORE.isEphemeral(window.ROBOTITO_MEMORY.owner())),true);
 // In the same browser, opting back in resumes the previous store instead of deleting it.
 page.once("dialog",dialog=>dialog.accept());
 await page.locator('[data-tab="memory"]').click();
 await page.locator("#deviceMemoryEnabled").check();
 await page.waitForFunction(owner=>window.ROBOTITO_MEMORY.owner()===owner,saved);
 await page.waitForFunction(words=>document.getElementById("typedChatHistory").textContent.includes(words),words);
});
