"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p07-encrypted-backup",async test=>{
 const {page,baseURL}=test;
 test.phase("p07-encrypted-backup");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_STORE?.exportBackup
  &&window.ROBOTITO_BACKUP_CRYPTO?.encrypt),null,{timeout:20000});
 const marker="Confidencial: prueba de cifrado P07";
 await page.evaluate(async marker=>{
  await window.ROBOTITO_STORE.putRecord({id:"p07-encrypted-memory",
   type:"memories",owner:"Persona autorizada",data:{text:marker}});
  await window.ROBOTITO_STORE.putRecordWithBlob({id:"p07-encrypted-audio",
   type:"audios",owner:"Persona autorizada",blobId:"p07-encrypted-blob",
   data:{consentRecorded:true}},new Blob([new Uint8Array([0,255,22,88,19,6])],
    {type:"audio/webm"}),{type:"audio"});
 },marker);
 const password="Una contraseña fuerte P07 ✅!";
 const checks=await page.evaluate(async(password)=>{
  const store=window.ROBOTITO_STORE,tool=window.ROBOTITO_BACKUP_CRYPTO,
   raw=await store.exportBackup();
  const encrypted=await tool.encrypt(raw,password);
  const decrypted=await tool.decrypt(encrypted,password);
  const expectReject=async task=>{
   try{await task();return false;}catch{return true;}
  };
  const tampered={...encrypted,ciphertext:encrypted.ciphertext.slice(0,-4)+"AAAA"};
  const wrongSalt={...encrypted,salt:encrypted.salt.replace(/^./,encrypted.salt[0]==="A"?"B":"A")};
  return {
   privateTextAbsent:!JSON.stringify(encrypted).includes("Confidencial: prueba de cifrado"),
   header:tool.isEncrypted(encrypted),roundtrip:JSON.stringify(raw)===JSON.stringify(decrypted),
   wrongPassword:await expectReject(()=>tool.decrypt(encrypted,"contraseña incorrecta muy larga")),
   changedBytes:await expectReject(()=>tool.decrypt(tampered,password)),
   changedSalt:await expectReject(()=>tool.decrypt(wrongSalt,password)),
   weakPassword:await expectReject(()=>tool.encrypt(raw,"corta")),
   invalidKdf:await expectReject(()=>tool.decrypt({...encrypted,iterations:10},password)),
   invalidData:await expectReject(()=>tool.decrypt({...encrypted,ciphertext:"@@@@@"},password))
  };
 },password);
 for(const [key,passed] of Object.entries(checks))assert.equal(passed,true,key);
 await page.addStyleTag({content:"#languageGate{display:none !important;pointer-events:none !important;}"});
 await page.locator('[data-tab="memory"]').click();
 await page.locator("details.memory-backup summary").click();
 await page.locator("#encryptMemoryBackup").check();
 assert.equal(await page.locator("#memoryBackupEncryptionFields").isVisible(),true);
 await page.locator("#memoryBackupPassword").fill("contraseña1");
 await page.locator("#memoryBackupPasswordConfirm").fill("contraseña2");
 await page.locator("#downloadMemoryBackup").click();
 assert.equal(await page.locator("#chooseMemoryBackup").isDisabled(),true,
  "Mismatched passwords must not produce a backup");
 await page.locator("#memoryBackupPassword").fill(password);
 await page.locator("#memoryBackupPasswordConfirm").fill(password);
 const [download]=await Promise.all([
  page.waitForEvent("download",{timeout:12000}),
  page.locator("#downloadMemoryBackup").click()
 ]);
 assert.match(download.suggestedFilename(),/^robotito-encrypted-\d{4}-\d{2}-\d{2}\.json$/);
 const saved=await download.path();
 const content=fs.readFileSync(saved,"utf8");
 assert.equal(content.includes(marker),false,"Downloaded encrypted file leaks plaintext");
 const envelope=JSON.parse(content);
 assert.equal(envelope.format,"robotito-encrypted-backup");
 assert.equal(envelope.cipher,"AES-256-GCM");
 assert.equal(await page.locator("#memoryBackupPassword").inputValue(),"");
 assert.equal(await page.locator("#memoryBackupPasswordConfirm").inputValue(),"");
 await page.waitForFunction(()=>!document.getElementById("chooseMemoryBackup").disabled);
 test.phase("p07-wrong-password-ui");
 await page.locator("#memoryBackupRestorePassword").fill("contraseña falsa falsa");
 await page.locator("#memoryBackupFile").setInputFiles(saved);
 await page.waitForFunction(()=>document.getElementById("memoryBackupRestorePassword").value==="");
 const failedStatus=await page.locator("#memoryBackupStatus").textContent();
 assert.ok(failedStatus&&failedStatus.trim());
 assert.equal(await page.evaluate(async()=>(await window.ROBOTITO_STORE.getRecord("p07-encrypted-memory"))?.owner),
  "Persona autorizada");
 test.phase("p07-restore-confirmation");
 await page.evaluate(()=>{window.__p07EncryptedConfirmCount=0;window.confirm=()=>{
  window.__p07EncryptedConfirmCount++;return false;};});
 await page.locator("#memoryBackupRestorePassword").fill(password);
 await page.locator("#memoryBackupFile").setInputFiles(saved);
 await page.waitForFunction(()=>window.__p07EncryptedConfirmCount===1,null,{timeout:20000});
 assert.equal(await page.locator("#memoryBackupRestorePassword").inputValue(),"");
 test.phase("p07-reversible-file-restore");
 await page.evaluate(async()=>{
  await window.ROBOTITO_STORE.putRecord({id:"p07-after-encrypted-export",
    type:"memories",owner:"Persona autorizada",data:{text:"Data introduced after backup"}});
  window.confirm=()=>true;window.prompt=()=>"RESTAURAR";
 });
 await page.locator("#memoryBackupRestorePassword").fill(password);
 await page.locator("#memoryBackupFile").setInputFiles(saved);
 await page.waitForFunction(async()=>{
  const store=window.ROBOTITO_STORE;
  return !!store?.getRecord&&!(await store.getRecord("p07-after-encrypted-export"))&&
   !!(await store.getRecord("p07-encrypted-memory"));
 },null,{timeout:20000});
 const data=await page.evaluate(async()=>{
  const store=window.ROBOTITO_STORE,blob=await store.getBlob("p07-encrypted-blob");
  return {record:await store.getRecord("p07-encrypted-memory"),
   binary:[...new Uint8Array(await blob.arrayBuffer())]};
 });
 assert.equal(data.record.data.text,marker);
 assert.deepEqual(data.binary,[0,255,22,88,19,6]);
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={cryptoChecks:Object.keys(checks).length,encryptUI:true,
  wrongPasswordSafe:true,confirmation:true,roundtrip:true,ownerPreserved:true,
  preservedBinaryBytes:data.binary.length};
 console.log("P07 "+test.engineName+" encrypted backup: AES-GCM, KDF, tamper, secrets, UI and restore passed");
}).catch(e=>{console.error(e);process.exitCode=1;});
