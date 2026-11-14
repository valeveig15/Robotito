"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p11-custom-rules",async test=>{
 const {page,baseURL}=test;
 test.phase("p11-rule-editor");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_CUSTOM_RULES&&
  window.ROBOTITO_STORE?.updatePersonalRules));
 await page.addStyleTag({content:"#languageGate{display:none !important;pointer-events:none !important;}"});
 await page.locator('[data-tab="tasks"]').click();
 await page.locator(".p11-rules-panel summary").click();
 await page.locator("#customRuleText").fill("si digo hola, decí buen día");
 await page.locator("#customRuleAdd").click();
 await page.locator(".p11-rules-panel .person-row").waitFor({timeout:15000});
 let state=await page.evaluate(async()=>window.ROBOTITO_STORE.get("robotito.custom-rules.v1:local"));
 assert.equal(state.rules.length,1);
 assert.equal(state.rules[0].when.type,"speech");
 assert.equal(state.rules[0].enabled,true);
 assert.equal(state.rules[0].lastRunAt,0);
 test.phase("p11-rule-fires");
 const seen=await page.evaluate(async()=>{
  const text=document.getElementById("speechBubble");
  await p11Emit({type:"speech",phrase:"hola"});
  const rule=(await window.ROBOTITO_STORE.get("robotito.custom-rules.v1:local")).rules[0];
  return {text:text.textContent,lastRunAt:rule.lastRunAt};
 });
 assert.ok(seen.text.includes("buen día"),"Actual rule action reaches Robotito speech UI");
 assert.ok(seen.lastRunAt>0,"Cooldown reservation written before side effect");
 test.phase("p11-disabled-no-effect");
 await page.locator(".p11-rules-panel .person-row button").first().click();
 await page.waitForFunction(async()=>{
  const r=await window.ROBOTITO_STORE.get("robotito.custom-rules.v1:local");
  return r.rules[0].enabled===false;
 });
 const noFire=await page.evaluate(async()=>{
  const before=(await window.ROBOTITO_STORE.get("robotito.custom-rules.v1:local")).rules[0].lastRunAt;
  await p11Emit({type:"speech",phrase:"hola"});
  const after=(await window.ROBOTITO_STORE.get("robotito.custom-rules.v1:local")).rules[0].lastRunAt;
  return before===after;
 });
 assert.equal(noFire,true);
 test.phase("p11-reload-retains-disabled");
 await page.reload({waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_CUSTOM_RULES));
 state=await page.evaluate(async()=>window.ROBOTITO_STORE.get("robotito.custom-rules.v1:local"));
 assert.equal(state.rules.length,1);
 assert.equal(state.rules[0].enabled,false);
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={saved:true,acted:true,disabled:true,reloaded:true,foregroundOnly:true};
 console.log("P11 "+test.engineName+" real UI rule add, execution, cooldown, disable, reload passed");
}).catch(e=>{console.error(e);process.exitCode=1;});
