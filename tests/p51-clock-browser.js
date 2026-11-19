"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p51-clock",async test=>{
 const {page,baseURL}=test;await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 if(await page.locator("#languageGate").isVisible()){
  await page.locator('[data-start-language="es"]').click();
  await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 }
 await page.locator('[data-tab="temporal"]').click();
 test.phase("precise-visible-clock");
 assert.match(await page.locator("#clockVisual").innerText(),/^\d{2}:\d{2}:\d{2}$/);
 test.phase("next-local-clock-target");
 await page.locator("#clockTargetTime").fill("21:05");
 await page.locator("#clockSetTarget").click();
 await page.waitForFunction(()=>window.ROBOTITO_CLOCK_UI.target!==null);
 assert.match(await page.locator("#clockCountdownRemaining").innerText(),/min/);
 await page.locator("#clockClearTarget").click();
 assert.match(await page.locator("#clockCountdownRemaining").innerText(),/Sin cuenta regresiva/);
 test.phase("speech-should-be-explicit");
 assert.equal(await page.locator("#clockSpeak").count(),1);
 assert.deepEqual(test.report.pageErrors,[]);
});
