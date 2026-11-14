"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p09-private-visitors",async test=>{
 const {page,baseURL}=test;
 test.phase("p09-browser-consent");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_VISITORS&&window.ROBOTITO_STORE?.updateVisitorEnvelope));
 const before=await page.evaluate(async()=>({
  vault:await window.ROBOTITO_STORE.get("robotito.visitors.v1",null),
  locked:window.ROBOTITO_VISITORS.locked()
 }));
 assert.equal(before.vault,null);
 assert.equal(before.locked,true);
 const pass="P09 clave privada 12 caracteres";
 const first=await page.evaluate(async pass=>{
  const v=window.ROBOTITO_VISITORS,s=window.ROBOTITO_STORE;
  const face=(center,shift=0)=>Array.from({length:128},(_,i)=>i===0?center+shift:0);
  const samples=center=>Array.from({length:12},(_,i)=>face(center,(i%3-1)*.025));
  const nonConsent=await v.remember(samples(.3),{consent:false}).then(()=>false,()=>true);
  await v.open(pass);
  await v.remember(samples(.3),{consent:true,people:[]});
  const encrypted=await s.get("robotito.visitors.v1");
  const obs=c=>({descriptor:face(c),detection:{score:.94}});
  v.observe(obs(.3),{now:10000,singleFace:true});
  v.observe(obs(.3),{now:10400,singleFace:true});
  v.observe(obs(.3),{now:10800,singleFace:true});
  const active=v.info().active;
  await v.interaction("pet",{now:10900,singleFace:true});
  const wrong=await v.remember(samples(.31),{consent:true}).then(()=>false,()=>true);
  return {nonConsent,active,wrong,encrypted:JSON.stringify(encrypted).includes("templates"),
   version:encrypted.revision};
 },pass);
 assert.deepEqual(first,{nonConsent:true,active:true,wrong:true,encrypted:false,version:1});
 await page.reload({waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_VISITORS?.open));
 assert.equal(await page.evaluate(()=>window.ROBOTITO_VISITORS.locked()),true);
 const second=await page.evaluate(async pass=>{
  const v=window.ROBOTITO_VISITORS;
  const wrong=await v.open("incorrecta claramente 123").then(()=>false,()=>true);
  const result=await v.open(pass);
  const face=(center,shift=0)=>Array.from({length:128},(_,i)=>i===0?center+shift:0);
  const samples=center=>Array.from({length:12},(_,i)=>face(center,(i%3-1)*.025));
  await window.ROBOTITO_STORE.set("robotito.people.v2",[
   {name:"Ada",role:"other",birthday:"",descriptors:samples(.3),bond:{
    affection:50,trust:50,fear:8,irritation:8,updatedAt:Date.now()}}]);
  const reviewed=[];
  const linked=await v.offerLink("Ada",samples(.3),{
   review:summary=>{reviewed.push(summary);return true;}
  });
  return {wrong,count:result.count,reviewed:reviewed.length,linked:linked.linked,
   bond:linked.people[0].bond,countAfter:v.info().count,
   ciphertext:(await window.ROBOTITO_STORE.get("robotito.visitors.v1")).ciphertext};
 },pass);
 assert.equal(second.wrong,true);
 assert.equal(second.count,1);
 assert.equal(second.reviewed,1);
 assert.equal(second.linked,true);
 assert.equal(second.countAfter,0);
 assert.ok(second.bond.affection>50,"Kind interaction influences reviewed relationship");
 assert.ok(typeof second.ciphertext==="string");
 test.phase("p09-erasure-ui");
 await page.addStyleTag({content:"#languageGate{display:none !important;pointer-events:none !important;}"});
 await page.locator('[data-tab="people"]').click();
 await page.locator(".p09-visitor-privacy summary").click();
 await page.evaluate(()=>{window.confirm=()=>true;window.prompt=()=>"BORRAR VISITAS";});
 await page.locator("#visitorForgetBtn").click();
 await page.waitForFunction(async()=>!(await window.ROBOTITO_STORE.get("robotito.visitors.v1",null)));
 assert.equal(await page.evaluate(()=>window.ROBOTITO_VISITORS.locked()),true);
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={encrypted:true,noConsentPersistence:true,lockedByDefault:true,
  ownerMergeReviewed:true,erasure:true,physicalHardware:false};
 console.log("P09 encrypted anonymous visitors, consent, reload, reviewed link and erasure passed");
}).catch(error=>{console.error(error);process.exitCode=1;});
