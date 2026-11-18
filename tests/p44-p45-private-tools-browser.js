"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p44-p45-private-tools",async test=>{
 const {page,baseURL}=test;
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 if(await page.locator("#languageGate").isVisible()){
  await page.locator('[data-start-language="es"]').click();
  await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 }
 await page.locator('[data-tab="memory"]').click();
 test.phase("no-unrequested-camera-or-screen-permission");
 assert.equal(await page.locator("#privateCaptureImage").isVisible(),false);
 assert.equal(await page.locator("#privateCaptureVideo").isVisible(),false);
 assert.equal(await page.locator("#privateCaptureDownload").isEnabled(),false);
 await page.evaluate(()=>{
  const denied=async()=>{throw new DOMException("denied","NotAllowedError");};
  Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia:denied,getDisplayMedia:denied}});
 });
 await page.locator("#privateCaptureCamera").click();
 await page.waitForFunction(()=>document.getElementById("privateCaptureStatus").textContent.includes("permiso"));
 assert.equal(await page.locator("#privateCaptureVideo").isVisible(),false);
 await page.locator("#privateCaptureScreen").click();
 await page.waitForFunction(()=>document.getElementById("privateCaptureStatus").textContent.includes("cancelada"));
 assert.equal(await page.locator("#privateCaptureDownload").isEnabled(),false);
 test.phase("opt-in-local-only-metrics");
 assert.equal(await page.locator("#privateMetricsConsent").isChecked(),false);
 await page.evaluate(()=>window.ROBOTITO_PRIVATE_METRICS.record("questions"));
 assert.match(await page.locator("#privateMetricsTotals").innerText(),/Preguntas enviadas: 0/);
 await page.locator("#privateMetricsConsent").check();
 await page.waitForFunction(()=>window.ROBOTITO_PRIVATE_METRICS.consent===true);
 await page.evaluate(()=>{
  window.ROBOTITO_PRIVATE_METRICS.record("questions");
  window.ROBOTITO_PRIVATE_METRICS.record("questions");
  window.ROBOTITO_PRIVATE_METRICS.record("classes");
 });
 await page.waitForFunction(()=>window.ROBOTITO_PRIVATE_METRICS.totals.questions===2);
 assert.match(await page.locator("#privateMetricsTotals").innerText(),/Preguntas enviadas: 2/);
 test.phase("turn-off-and-delete");
 await page.locator("#privateMetricsConsent").uncheck();
 await page.waitForFunction(()=>window.ROBOTITO_PRIVATE_METRICS.consent===false);
 await page.evaluate(()=>window.ROBOTITO_PRIVATE_METRICS.record("questions"));
 assert.equal(await page.evaluate(()=>window.ROBOTITO_PRIVATE_METRICS.totals.questions),2);
 page.once("dialog",dialog=>dialog.accept());
 await page.locator("#privateMetricsErase").click();
 await page.waitForFunction(()=>window.ROBOTITO_PRIVATE_METRICS.totals.questions===0);
 assert.deepEqual(test.report.pageErrors,[]);
});
