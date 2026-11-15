"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p23-temporal-vision",async test=>{
 const {page,baseURL}=test;
 test.phase("p23-browser-wiring");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>!!window.ROBOTITO_OBJECT_TRACKER?.createTracker&&
   !!window.ROBOTITO_ROUTER?.classify&&!!document.querySelector("#detectObjectBtn"),
   null,{timeout:20000});
 const checks=await page.evaluate(()=>{
  const tracker=window.ROBOTITO_OBJECT_TRACKER.createTracker({now:()=>5000});
  const first=tracker.observe([{class:"cup",score:.87}],5000);
  const second=tracker.observe([{class:"cup",score:.85}],5100);
  const third=tracker.observe([{class:"cup",score:.83}],5200);
  const fingers=window.ROBOTITO_OBJECT_TRACKER.createFingerCounter({now:()=>6000});
  fingers.observe(3,6000);fingers.observe(3,6100);
  return {first,second,third,raised:fingers.observe(3,6200),
    intent:window.ROBOTITO_ROUTER.classify("¿Qué objeto es esto?").intent};
 });
 assert.equal(checks.first,null);
 assert.equal(checks.second,null);
 assert.equal(checks.third.label,"cup");
 assert.equal(checks.raised,3);
 assert.equal(checks.intent,"object");
 await page.addStyleTag({content:"#languageGate{display:none !important;pointer-events:none !important;}"});
 await page.locator('[data-tab="class"]').click();
 await page.locator("#detectObjectBtn").click();
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={tracking:true,fingers:true,router:true,missingCameraHandled:true,hardware:false};
 console.log("P23 "+test.engineName+" real browser tracker and camera-off route passed");
}).catch(e=>{console.error(e);process.exitCode=1;});
