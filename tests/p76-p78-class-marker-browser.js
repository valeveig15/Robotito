"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p76-p78-class-markers",async test=>{
 const {page,baseURL}=test;
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 if(await page.locator("#languageGate").isVisible()){
  await page.locator('[data-start-language="es"]').click();
  await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 }
 test.phase("quick-access-class-mode");
 assert.equal(await page.locator("#classModeQuickAccess").count(),1);
 await page.locator("#classModeQuickAccess").click();
 assert.equal(await page.locator("#tab-class").evaluate(node=>node.classList.contains("active")),true);
 test.phase("not-bookmarking-without-recording");
 await page.locator("#classMarkerAdd").click();
 assert.match(await page.locator("#classMarkerStatus").innerText(),/Empezá una clase/);
 assert.equal(await page.locator(".class-time-marker").count(),0);
 test.phase("active-class-indicator-and-stamped-marker");
 await page.evaluate(()=>{
  state.classMode=true;
  state.classStartedAt=Date.now()-125000;
  state.classSessionId="test-session-markers";
 });
 await page.waitForFunction(()=>document.getElementById("classModeIndicator").hidden===false);
 assert.match(await page.locator("#classModeIndicator").innerText(),/MODO CLASE ACTIVO/);
 await page.locator("#classMarkerColor").selectOption("blue");
 await page.locator("#classMarkerNote").fill("Ejercicio 4");
 await page.locator("#classMarkerAdd").click();
 await page.waitForFunction(()=>document.querySelectorAll(".class-time-marker").length===1);
 assert.match(await page.locator(".class-time-marker").innerText(),/Ejercicio 4/);
 assert.ok((await page.locator(".class-time-marker").getAttribute("class")).includes("mark-blue"));
 test.phase("marker-survives-ui-remount-and-missing-audio-honesty");
 await page.evaluate(()=>window.ROBOTITO_CLASS_MARKERS.load());
 await page.waitForFunction(()=>document.querySelectorAll(".class-time-marker").length===1);
 await page.locator(".class-time-marker button").first().click();
 assert.match(await page.locator("#classMarkerStatus").innerText(),/grabación no está disponible/);
 await page.evaluate(()=>{state.classMode=false;state.classSessionId=null;});
 await page.waitForFunction(()=>document.getElementById("classModeIndicator").hidden===true);
 assert.deepEqual(test.report.pageErrors,[]);
});
