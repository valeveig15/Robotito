"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("settings-gear-avatar-size",async test=>{
 const {page,baseURL}=test;
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 if(await page.locator("#languageGate").isVisible()){
  await page.locator('[data-start-language="es"]').click();
  await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 }
 test.phase("collapsed-gear-and-existing-preferences");
 assert.equal(await page.locator("#settingsPanel").isVisible(),false);
 assert.equal(await page.locator("#settingsToggle").getAttribute("aria-expanded"),"false");
 await page.locator("#settingsToggle").click();
 assert.equal(await page.locator("#settingsPanel").isVisible(),true);
 assert.equal(await page.locator("#settingsToggle").getAttribute("aria-expanded"),"true");
 assert.equal(await page.locator("#quickLanguageSelect").count(),1);
 assert.equal(await page.locator("#changeAvatarBtn").count(),1);
 await page.locator("#quickLanguageSelect").selectOption("en");
 assert.equal(await page.locator("html").getAttribute("lang"),"en");
 test.phase("size-persistence-and-original-avatar-geometry");
 await page.locator("#settingsAvatarSize").evaluate(el=>{el.value="60";el.dispatchEvent(new Event("input",{bubbles:true}));});
 assert.equal(await page.locator("#settingsAvatarSizeValue").innerText(),"60 %");
 assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector("#robotito")).scale),"0.6");
 await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR?.current?.id==="panda");
 const transform=await page.evaluate(()=>document.querySelector("#approvedAvatarHost").shadowRoot.getElementById("approvedAvatarScale")?.getAttribute("transform"));
 assert.ok(transform?.includes("scale(0.6)"),"SVG person, not SVG background, must be scaled");
 await page.reload({waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 await page.locator("#settingsToggle").click();
 assert.equal(await page.locator("#settingsAvatarSize").inputValue(),"60");
 test.phase("settings-links-to-existing-panels-and-avatar-change");
 await page.locator('[data-settings-target="voiceSelect"]').click();
 assert.equal(await page.locator("#settingsPanel").isVisible(),false);
 assert.equal(await page.locator("#voiceSelect").count(),1);
 await page.locator("#settingsToggle").click();
 await page.locator("#changeAvatarBtn").click();
 assert.equal(await page.locator("#languageGate").isVisible(),true);
 await page.locator('#avatarChoices [data-avatar-id="cat"]').click();
 assert.equal(await page.locator("#robotito").getAttribute("data-avatar"),"cat");
 test.phase("close-keyboard-and-responsive");
 for(const size of [{width:360,height:780},{width:1280,height:900}]){
  await page.setViewportSize(size);
  await page.locator("#settingsToggle").click();
  assert.equal(await page.locator("#settingsPanel").isVisible(),true);
  const bounds=await page.locator("#settingsPanel").boundingBox();
  assert.ok(bounds.x>=0&&bounds.x+bounds.width<=size.width+1);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#settingsPanel").isVisible(),false);
 }
});
