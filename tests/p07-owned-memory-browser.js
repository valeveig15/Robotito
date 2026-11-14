"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p07-owned-memory",async test=>{
 const {page,context,baseURL}=test;
 test.phase("p07-owned-memory");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_STORE?.appendMemory)
  &&Boolean(window.ROBOTITO_STORE?.updateOwnedMemory),null,{timeout:20000});
 const fixture=await page.evaluate(async()=>{
  const s=window.ROBOTITO_STORE;
  const first=await s.appendMemory({owner:"local",person:"Visitante",
   text:"Mi color favorito es el azul",language:"es",source:"manual"});
  const id=first.record.id;
  const expectReject=async(cb,msg)=>{
   try{await cb();throw Error("EXPECTED REJECTION: "+msg);}
   catch(e){if(String(e.message).startsWith("EXPECTED REJECTION"))throw e;}
  };
  await expectReject(()=>s.updateOwnedMemory({id,owner:"otro",
   text:"dato ajeno",expectedVersion:1}),"owner mismatch");
  await expectReject(()=>s.updateOwnedMemory({id,owner:"local",
   text:"dato obsoleto",expectedVersion:2}),"stale version");
  await expectReject(()=>s.putRecord({id,type:"memories",owner:"otro",
   data:{text:"ataque"}}),"cross-owner overwrite");
  if((await s.getRecord(id)).data.text!=="Mi color favorito es el azul")
   throw Error("Rejection modified stored data");
  const tmp=await s.updateOwnedMemory({id,owner:"local",
   expectedVersion:1,text:"Mi color favorito es el verde"});
  if(tmp.record.version!==2||tmp.memories.find(m=>m.id===id)?.text!=="Mi color favorito es el verde")
   throw Error("Edited typed memory and legacy mirror disagree");
  const second=await s.appendMemory({owner:"local",person:"Visitante",
   text:"Mi materia es Física",source:"manual"});
  const other=await s.appendMemory({owner:"Otra persona",person:"Otra persona",
   text:"Este dato no debe aparecer en el panel local",source:"manual"});
  return {id,second:second.record.id,other:other.record.id};
 });
 await page.reload({waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_STORE?.appendMemory),null,{timeout:20000});
 await page.addStyleTag({content:"#languageGate{display:none !important;pointer-events:none !important;}"});
 await page.locator('[data-tab="memory"]').click();
 await page.locator("#memoryList").getByText("Mi color favorito es el verde").waitFor();
 assert.equal(await page.locator("#memoryList").getByText("Este dato no debe aparecer en el panel local").count(),0);
 const memoryRow=page.locator(".memory-row").filter({hasText:"Mi color favorito es el verde"});
 await page.evaluate(()=>window.prompt=()=>"Mi color favorito es el violeta");
 await memoryRow.locator(".p07-memory-actions button").first().click();
 await page.locator("#memoryList").getByText("Mi color favorito es el violeta").waitFor();
 const after=await page.evaluate(async id=>{
  const s=window.ROBOTITO_STORE,row=await s.getRecord(id),
   mirror=await s.get("robotito.memories.v2",[]);
  return {version:row.version,typed:row.data.text,
   mirrored:mirror.find(m=>m.id===id)?.text};
 },fixture.id);
 assert.deepEqual(after,{version:3,typed:"Mi color favorito es el violeta",
  mirrored:"Mi color favorito es el violeta"});
 test.phase("p07-concurrent-tabs");
 const secondPage=await context.newPage();
 await secondPage.goto(baseURL,{waitUntil:"domcontentloaded"});
 await secondPage.waitForFunction(()=>Boolean(window.ROBOTITO_STORE?.updateOwnedMemory));
 const changes=await Promise.allSettled([page,secondPage].map((p,i)=>p.evaluate(
  async({id,text})=>window.ROBOTITO_STORE.updateOwnedMemory({
    id,owner:"local",expectedVersion:1,text
  }),{id:fixture.second,text:"Resultado "+i}
 )));
 assert.equal(changes.filter(x=>x.status==="fulfilled").length,1,
  "Only one version-1 edit may commit across tabs");
 const final=await page.evaluate(async id=>window.ROBOTITO_STORE.getRecord(id),fixture.second);
 assert.equal(final.version,2);
 test.phase("p07-delete");
 await page.evaluate(()=>window.confirm=()=>true);
 await page.locator(".memory-row").filter({hasText:"Mi color favorito es el violeta"})
  .locator(".p07-memory-actions button").last().click();
 await page.waitForFunction(async id=>!(await window.ROBOTITO_STORE.getRecord(id)),fixture.id);
 const remaining=await page.evaluate(async ids=>{
  const s=window.ROBOTITO_STORE;
  return {mirror:await s.get("robotito.memories.v2",[]),
   other:await s.getRecord(ids.other),first:await s.getRecord(ids.id)};
 },fixture);
 assert.equal(remaining.first,null);
 assert.equal(remaining.mirror.some(m=>m.id===fixture.id),false);
 assert.equal(remaining.other.owner,"Otra persona","Other owners must survive deletion");
 assert.equal(await page.locator("#memoryList").getByText("Mi color favorito es el violeta").count(),0);
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={edited:true,ownerIsolation:true,versionConflict:true,
  crossTabConflict:true,atomicMirror:true,deleted:true};
 console.log("P07 owned memories: edit, cross-owner rejection, mirror, tab race and delete passed");
 await secondPage.close();
}).catch(e=>{console.error(e);process.exitCode=1;});
