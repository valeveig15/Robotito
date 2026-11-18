"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p42-p43-weather-counter",async test=>{
 const {page,baseURL}=test;
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 if(await page.locator("#languageGate").isVisible()){
  await page.locator('[data-start-language="es"]').click();
  await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 }
 test.phase("weather-background-derived-from-current-data");
 const applied=await page.evaluate(()=>window.ROBOTITO_TRUTHFUL_UI.updateWeather({
  current:{weather_code:63,temperature_2m:12.3,is_day:1}
 }));
 assert.equal(applied,true);
 assert.equal(await page.locator("#world").evaluate(el=>el.classList.contains("weather-rain")),true);
 assert.match(await page.locator("#weatherSceneBadge").innerText(),/12 °C · Open-Meteo/);
 assert.equal(await page.locator("#weatherSceneBadge").evaluate(el=>getComputedStyle(el).pointerEvents),"none");
 test.phase("unknown-data-rejection-and-weather-cleanup");
 const rejected=await page.evaluate(()=>window.ROBOTITO_TRUTHFUL_UI.updateWeather({
  current:{weather_code:444,temperature_2m:15,is_day:1}
 }));
 assert.equal(rejected,false);
 assert.equal(await page.locator("#weatherSceneBadge").isVisible(),false);
 assert.equal(await page.locator("#world").evaluate(el=>[...el.classList].some(x=>x.startsWith("weather-"))),false);
 await page.locator(".question-help-panel summary").click();
 test.phase("truthful-non-global-session-count");
 assert.equal(await page.locator("#honestQuestionCount").innerText(),"0");
 await page.evaluate(()=>{window.ROBOTITO_TRUTHFUL_UI.recordQuestion();window.ROBOTITO_TRUTHFUL_UI.recordQuestion();});
 assert.equal(await page.locator("#honestQuestionCount").innerText(),"2");
 assert.match(await page.locator("#honestQuestionScope").innerText(),/esta pestaña/);
 await page.locator(".question-help-panel summary").click();
 test.phase("weather-does-not-cover-input-on-mobile");
 await page.setViewportSize({width:360,height:780});
 await page.evaluate(()=>window.ROBOTITO_TRUTHFUL_UI.updateWeather({current:{weather_code:71,temperature_2m:-2,is_day:0}}));
 const el=page.locator("#robotitoTextInput");await el.scrollIntoViewIfNeeded();
 await el.click();
 assert.equal(await el.evaluate(n=>n===document.activeElement),true);
 await page.evaluate(()=>window.ROBOTITO_TRUTHFUL_UI.clearWeather());
 assert.equal(await page.locator("#weatherSceneBadge").isVisible(),false);
});
