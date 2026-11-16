"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p07-memory",async test=>{
 const {page,context,baseURL}=test;let checks=0;
 const eq=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
 const open=async p=>{await p.goto(baseURL,{waitUntil:"domcontentloaded"});await p.waitForFunction(()=>window.ROBOTITO_MEMORY?.active);};
 const show=async()=>{await page.addStyleTag({content:"#languageGate{display:none!important}"});await page.locator('[data-tab="memory"]').click();};
 await open(page);await show();
 test.phase("ephemeral-memory-ui");
 const temporary=await page.evaluate(()=>ROBOTITO_MEMORY.owner());eq(temporary.startsWith("session:"),true,"Unknown session has unique owner");
 await page.locator("#memoryInput").fill("Solo de esta sesión temporal");await page.locator("#rememberBtn").click();
 await page.waitForFunction(()=>document.getElementById("memoryList").textContent.includes("Solo de esta sesión temporal"));
 eq(await page.evaluate(async()=>(await ROBOTITO_STORE.exportBackup()).records.some(r=>r.owner.startsWith("session:"))),false,"Temporary data excluded from durable backup");
 await page.reload();await page.waitForFunction(()=>ROBOTITO_MEMORY.active);await show();
 eq(await page.locator("#memoryList").textContent().then(s=>s.includes("Solo de esta sesión temporal")),false,"Reload discards temporary memory");
 eq(await page.evaluate(old=>ROBOTITO_MEMORY.owner()!==old,temporary),true,"Reload creates a different session");
 test.phase("visitor-consent-and-reload");
 await page.locator(".memory-scope details summary").click();
 await page.locator("#createVisitorMemory").click();
 eq(await page.evaluate(()=>ROBOTITO_MEMORY.owner().startsWith("session:")),true,"Missing consent does not create visitor");
 await page.locator("#visitorMemoryConsent").check();await page.locator("#createVisitorMemory").click();
 await page.waitForFunction(()=>document.getElementById("visitorMemoryKey").value.startsWith("visitor:"));
 const token=await page.locator("#visitorMemoryKey").inputValue(); // Never included in reports.
 await page.locator("#memoryInput").fill("Prefiero estudiar por la mañana");await page.locator("#rememberBtn").click();
 await page.waitForFunction(()=>document.getElementById("memoryList").textContent.includes("Prefiero estudiar"));
 const recordId=await page.locator("#memoryList .memory-row").first().getAttribute("data-record-id");
 page.once("dialog",d=>d.accept("Prefiero estudiar por la tarde"));await page.locator("#memoryList button").first().click();
 await page.waitForFunction(()=>document.getElementById("memoryList").textContent.includes("por la tarde"));
 eq(await page.evaluate(async id=>(await ROBOTITO_STORE.getRecord(id)).version,recordId),2,"Correction increments revision");
 await page.locator("#memorySaveType").selectOption("relationships");await page.locator("#memoryInput").fill("Durante esta visita pidió ayuda con calma");await page.locator("#rememberBtn").click();
 await page.waitForFunction(()=>document.getElementById("memoryInput").value==="");
 const visitor=await page.evaluate(()=>ROBOTITO_MEMORY.owner());
 await page.reload();await page.waitForFunction(()=>ROBOTITO_MEMORY.active);await show();
 eq((await page.locator("#memoryList").textContent()).includes("por la tarde"),false,"No automatic visitor identification on reload");
 await page.locator(".memory-scope details summary").click();await page.locator("#visitorMemoryKey").fill(token);await page.locator("#resumeVisitorMemory").click();
 await page.waitForFunction(id=>ROBOTITO_MEMORY.owner()===id,visitor);await page.evaluate(()=>ROBOTITO_MEMORY.ready());
 eq((await page.locator("#memoryList").textContent()).includes("por la tarde"),true,"Explicit key resumes persisted corrected memory");
 test.phase("isolation-and-atomic-link");
 const result=await page.evaluate(async({token,visitor,recordId})=>{
  const s=ROBOTITO_STORE,a=ROBOTITO_MEMORY_STATE;let assertions=0;
  const check=(v,m)=>{if(!v)throw Error(m);assertions++;};
  const reject=async(fn,m)=>{let failed=false;try{await fn();}catch{failed=true;}check(failed,m);};
  state.people=[{name:"Ada",descriptors:[]},{name:"Bob",descriptors:[]}];await s.set("robotito.people.v2",state.people);
  await s.putRecord({id:"bob-memory",owner:"Bob",type:"memories",data:{text:"Privado de Bob"}});
  await a.saveCollection(visitor,"robotito.tasks.v1",[{task:"Resolver ejercicio",memoryRecordId:"visitor-task"}],0);
  await s.putRecordWithBlob({id:"visitor-pdf",owner:visitor,type:"pdfs",blobId:"visitor-file",data:{title:"Apunte"}},new Blob(["PDF bytes"]),{type:"pdf"});
  const preview=await a.previewLink(token,"Ada");
  await reject(()=>a.linkVisitor({token,target:"Ada",confirmation:"Bob",revision:preview.revision}),"Wrong target confirmation rejected");
  await reject(()=>a.previewLink(token.replace(/.$/,"x"),"Ada"),"Wrong key rejected");
  await reject(()=>a.previewLink(token,"Missing"),"Unknown profile rejected");
  const stale=await s.getRecord(recordId);await s.editRecord(recordId,{owner:visitor,expectedVersion:stale.version,data:{text:"Texto revisado antes de vincular"}});
  await reject(()=>a.linkVisitor({token,target:"Ada",confirmation:"Ada",revision:preview.revision}),"Changed history requires a new review");
  const fresh=await a.previewLink(token,"Ada"),link=await a.linkVisitor({token,target:"Ada",confirmation:"Ada",revision:fresh.revision});
  check((await s.getRecord(recordId)).owner==="Ada","Record ownership transferred");
  check((await s.getRecord(recordId)).provenance.identityConfirmed===false,"Voluntary link never confirms identity");
  check((await s.getRecord("bob-memory")).owner==="Bob","Other person unchanged");
  check((await a.collection("Ada","robotito.tasks.v1")).items[0].task==="Resolver ejercicio","Tasks linked with history");
  check((await s.getRecord("visitor-pdf")).owner==="Ada"&&(await s.getBlob("visitor-file")).size===9,"File and owner transfer together");
  await reject(()=>a.resumeVisitor(token),"Linked history cannot be read as anonymous visitor");
  const row=await s.getRecord(recordId);
  await reject(()=>s.editRecord(recordId,{owner:"Bob",expectedVersion:row.version,data:{text:"stolen"}}),"Cross-owner correction denied");
  await s.editRecord(recordId,{owner:"Ada",expectedVersion:row.version,data:{text:"Corregido después de vincular"}});
  await a.undoLink({id:link.id,token,confirmation:"DESVINCULAR"});
  check((await s.getRecord(recordId)).owner===visitor,"Undo restores visitor ownership");
  check((await s.getRecord(recordId)).data.text==="Corregido después de vincular","Undo retains legitimate corrections");
  check((await a.collection("Ada","robotito.tasks.v1")).items.length===0,"Undo removes only transferred tasks");
  check((await a.collection(visitor,"robotito.tasks.v1")).items.length===1,"Undo returns visitor tasks");
  state.currentPerson="Bob";state.currentVoicePerson="Bob";state.lastVoiceConfirmedAt=Date.now();await ROBOTITO_MEMORY.ready();
  check(state.memories.every(m=>m.owner==="Bob"),"Known owner scopes legacy in-memory view");
  check(!document.getElementById("memoryList").textContent.includes("Corregido después"),"Other visitor hidden from active UI");
  state.currentVoicePerson=null;state.currentPerson=null;await ROBOTITO_MEMORY.ready();
  return assertions;
 },{token,visitor,recordId});checks+=result;
 test.phase("concurrent-record-and-collection-edit");
 const other=await context.newPage();await open(other);
 const row=await page.evaluate(async id=>ROBOTITO_STORE.getRecord(id),recordId);
 const outcomes=await Promise.all([page,other].map((p,i)=>p.evaluate(async({id,owner,version,i})=>{
  try{await ROBOTITO_STORE.editRecord(id,{owner,expectedVersion:version,data:{text:"Concurrent "+i}});return "saved";}catch{return "conflict";}
 },{id:recordId,owner:visitor,version:row.version,i})));
 eq(outcomes.filter(v=>v==="saved").length,1,"Exactly one concurrent edit wins");eq(outcomes.filter(v=>v==="conflict").length,1,"Stale edit explicitly fails");
 const version=await page.evaluate(async owner=>(await ROBOTITO_MEMORY_STATE.collection(owner,"robotito.tasks.v1")).version,visitor);
 const collections=await Promise.all([page,other].map((p,i)=>p.evaluate(async({owner,version,i})=>{
  try{await ROBOTITO_MEMORY_STATE.saveCollection(owner,"robotito.tasks.v1",[{task:"Updated "+i,memoryRecordId:"visitor-task"}],version);return "saved";}catch{return "conflict";}
 },{owner:visitor,version,i})));
 eq(collections.filter(v=>v==="saved").length,1,"Collection CAS prevents lost updates across tabs");
 await other.close();
 test.phase("owner-deletion");
 const deleted=await page.evaluate(async owner=>{
  await ROBOTITO_MEMORY_STATE.deleteOwner(owner,{confirmation:"BORRAR"});
  return {own:(await ROBOTITO_STORE.queryRecords({owner,limit:Infinity})).length,
   blob:await ROBOTITO_STORE.getBlob("visitor-file"),bob:!!(await ROBOTITO_STORE.getRecord("bob-memory"))};
 },visitor);
 eq(deleted,{own:0,blob:null,bob:true},"Deleting one history removes its files and preserves other owners");
 test.phase("legacy-database-upgrade");
 const isolated=await test.browser.newContext();
 await isolated.route("**/*",route=>new URL(route.request().url()).origin===baseURL?route.continue():route.fulfill({status:200,body:""}));
 const legacy=await isolated.newPage();await legacy.goto(baseURL+"/package.json");
 await legacy.evaluate(async()=>{
  await new Promise((resolve,reject)=>{const req=indexedDB.open("robotito-data-v2",3);
   req.onupgradeneeded=()=>{const db=req.result;db.createObjectStore("state",{keyPath:"key"});const r=db.createObjectStore("records",{keyPath:"id"});
    r.createIndex("byType","type");r.createIndex("byOwner","owner");r.createIndex("byDate","timestamp");r.createIndex("byTypeOwner",["type","owner"]);
    db.createObjectStore("blobs",{keyPath:"id"});db.createObjectStore("migrations",{keyPath:"id"});};
   req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction("state","readwrite");
    tx.objectStore("state").put({key:"robotito.people.v2",value:[{name:"Legacy Ada",descriptors:[]}]});
    tx.objectStore("state").put({key:"robotito.memories.v2",value:[{person:"Legacy Ada",text:"Assigned old note",at:123},{person:"persona no reconocida",text:"Unknown old visitor",at:124}]});
    tx.objectStore("state").put({key:"robotito.tasks.v1",value:[{task:"Unattributed old task",at:125}]});
    tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};});
 });
 await open(legacy);
 const migrated=await legacy.evaluate(async()=>{
  const s=ROBOTITO_STORE,a=ROBOTITO_MEMORY_STATE;await a.migrate();await a.migrate();
  const assigned=await s.queryRecords({type:"memories",owner:"Legacy Ada"}),unknown=await s.queryRecords({type:"memories",owner:"legacy:unassigned"});
  return {assigned:assigned.map(r=>r.data.text),unknown:unknown.map(r=>r.data.text),active:state.memories.length,
   task:(await a.collection("legacy:unassigned","robotito.tasks.v1")).items[0]?.task,audit:await s.audit()};
 });
 eq(migrated.assigned,["Assigned old note"],"Migration preserves explicit historical attribution");
 eq(migrated.unknown,["Unknown old visitor"],"Unknown legacy sessions quarantined without identity inference");
 eq(migrated.active,0,"New visitor never inherits legacy data");
 eq(migrated.task,"Unattributed old task","Legacy collection retained for recovery");
 eq(migrated.audit.invalid.length,0,"Repeated migration remains valid and idempotent");
 await isolated.close();
 test.report.checks=checks;console.log("P07 "+test.engineName+" durable memory, correction, consent, link/unlink and concurrency:",checks,"checks");
}).catch(e=>{console.error(e);process.exitCode=1;});
