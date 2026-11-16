"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p10-p11-rules",async test=>{
 const {page,baseURL}=test;test.phase("p10-p11-ui");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_TEMPORAL_RULES?.attach)&&
  document.getElementById("temporalRuleAdd"),null,{timeout:20000});
 await page.waitForFunction(()=>ROBOTITO_MEMORY.active);
 await page.evaluate(async()=>{state.currentVoicePerson="Ada";state.lastVoiceConfirmedAt=Date.now();await ROBOTITO_MEMORY.ready();await ROBOTITO_TEMPORAL_RULES.refresh();});
 await page.addStyleTag({content:"#languageGate{display:none !important;pointer-events:none !important;}"});
 await page.locator('[data-tab="temporal"]').click();
 await page.locator("#temporalRuleInput").fill("En 1 minuto decime tomar agua");
 await page.locator("#temporalRuleAdd").click();
 await page.locator("#temporalRuleList").getByText("Recordar: tomar agua").waitFor();
 const saved=await page.evaluate(async()=>{
  const a=(await ROBOTITO_MEMORY_STATE.collection("Ada","robotito.temporal-rules.v1")).items;
  return a.map(x=>({kind:x.kind,owner:x.owner,text:x.text,dueAt:x.dueAt}));
 });
 assert.equal(saved.length,1);assert.equal(saved[0].kind,"once");
 assert.equal(saved[0].text,"tomar agua");
 test.phase("p10-p11-persistence");
 await page.reload({waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>ROBOTITO_MEMORY.active);
 await page.evaluate(async()=>{state.currentVoicePerson="Ada";state.lastVoiceConfirmedAt=Date.now();await ROBOTITO_MEMORY.ready();await ROBOTITO_TEMPORAL_RULES.refresh();});
 await page.addStyleTag({content:"#languageGate{display:none !important;pointer-events:none !important;}"});
 await page.locator('[data-tab="temporal"]').click();
 await page.locator("#temporalRuleList").getByText("Recordar: tomar agua").waitFor();
 await page.locator("#temporalRuleInput")
  .fill("Si digo hola robotito, decí buen día");
 await page.locator("#temporalRuleAdd").click();
 await page.locator("#temporalRuleList").getByText("Si digo").waitFor();
 const state=await page.evaluate(async()=>{
  const rows=(await ROBOTITO_MEMORY_STATE.collection("Ada","robotito.temporal-rules.v1")).items;
  const c=window.ROBOTITO_TEMPORAL_RULES.createEngine({
   storage:{getItem:()=>JSON.stringify(rows),setItem:()=>{}},now:()=>Date.now()});
  return {rules:c.list("Ada").map(x=>x.kind),
   ignored:c.speech("No coincido",{owner:"Ada"}).handled,
   triggers:c.speech("HOLA ROBOTITO",{owner:"Ada",emit:()=>{}}).triggered};
 });
 assert.deepEqual(state.rules.sort(),["once","phrase"]);
 assert.equal(state.ignored,false);
 assert.ok(typeof state.triggers==="string");
 test.phase("p10-p11-ui-cancel");
 await page.locator("#temporalRuleList .memory-row").first()
  .locator("button").click();
 await page.waitForFunction(()=>document.querySelectorAll("#temporalRuleList .memory-row").length===1);
 assert.equal(await page.locator("#temporalRuleList .memory-row").count(),1);
 test.phase("p10-p11-safe-headless");
 const checks=await page.evaluate(()=>{
  const adapter=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,
   setItem:(k,v)=>m.set(k,v)};};
  let t=Date.now(),emitted=[];
  const e=window.ROBOTITO_TEMPORAL_RULES.createEngine({
   storage:adapter(),now:()=>t});
  e.create({kind:"repeat",ms:1000,count:2,text:"pausa"},"local");
  t+=1000;const first=e.tick({owner:"local",visible:false,emit:x=>emitted.push(x)});
  const second=e.tick({owner:"local",visible:true,emit:x=>emitted.push(x)});
  t+=1000;e.tick({owner:"local",visible:true,emit:x=>emitted.push(x)});
  return {first,second,emitted,remaining:e.list("local").length};
 });
 assert.deepEqual(checks,{first:0,second:1,emitted:["pausa","pausa"],remaining:0});
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={ui:true,storage:true,cancel:true,finiteRepeat:true,
  visibleOnly:true,hardware:false,backgroundService:false};
 console.log("P10/P11 "+test.engineName+" UI, safe foreground rules and persistence passed");
}).catch(error=>{console.error(error);process.exitCode=1;});
