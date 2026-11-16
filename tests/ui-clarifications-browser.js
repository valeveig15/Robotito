"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("avatar-language-text-footer",async test=>{
 const {page,baseURL}=test;
 test.phase("startup-avatar-access");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true",null,{timeout:20000});
 // Use the real startup choices: a hidden overlay should not block the input.
 if(await page.locator("#languageGate").isVisible()){
  await page.locator('[data-start-language="es"]').click();
  await page.locator("#avatarChoices [data-avatar-id]").first().click();
 }
 assert.equal(await page.locator("#stopSensesBtn").count(),0,"no stop camera/microphone UI");
 assert.equal(await page.locator("#animalAvatarName").count(),0,"no animal caption on the scene");
 assert.equal(await page.locator("#avatar-choice-name").count(),0);
 test.phase("change-avatar-after-initial-selection");
 const old=await page.locator("#robotito").getAttribute("data-avatar");
 await page.locator("#changeAvatarBtn").click();
 assert.equal(await page.locator("#languageGate").isVisible(),true);
 const choices=page.locator("#avatarChoices [data-avatar-id]");
 assert.ok(await choices.count()>1);
 assert.equal(await page.locator(".avatar-choice-name").count(),0,"picker is visual-only");
 const fresh=await choices.evaluateAll((nodes,oldId)=>nodes.find(n=>n.dataset.avatarId!==oldId)?.dataset.avatarId,old);
 assert.ok(fresh);
 await page.locator('#avatarChoices [data-avatar-id="'+fresh+'"]').click();
 assert.equal(await page.locator("#robotito").getAttribute("data-avatar"),fresh);
 assert.equal(await page.locator("#languageGate").isVisible(),false);
 test.phase("quick-language");
 await page.locator("#quickLanguageSelect").selectOption("pt");
 assert.equal(await page.locator("html").getAttribute("lang"),"pt");
 assert.equal(await page.locator("#languageMode").inputValue(),"pt");
 await page.locator("#quickLanguageSelect").selectOption("es");
 test.phase("night-scene-and-clickable-bottom-composer");
 for(const [width,height] of [[320,750],[390,844],[1280,900]]){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>document.body.classList.add("mode-night"));
  const composer=page.locator("#robotitoTextInput");
  await composer.scrollIntoViewIfNeeded();
  const geometry=await page.evaluate(()=>{
    const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();
      return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};};
    const input=document.querySelector("#robotitoTextInput"),r=input.getBoundingClientRect();
    const at=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    return {scene:box(".world-scene"),actions:box(".quick-actions"),
      composer:box("#robotitoTextForm"),input:box("#robotitoTextInput"),
      hit:at?.id||at?.tagName,night:getComputedStyle(document.querySelector(".night-sky")).pointerEvents,
      horizontal:document.documentElement.scrollWidth-window.innerWidth};
  });
  assert.ok(geometry.composer.top>=geometry.actions.bottom-2,"composer is below all action buttons: "+width);
  assert.ok(geometry.composer.top>=geometry.scene.bottom-2,"scene cannot overlap composer: "+width);
  assert.equal(geometry.hit,"robotitoTextInput","input must win hit testing, not moon: "+width);
  assert.equal(geometry.night,"none");
  assert.ok(geometry.horizontal<4,"no horizontal overflow: "+width);
  await composer.click({timeout:10000});
  assert.equal(await composer.evaluate(node=>node===document.activeElement),true,
   "touch/click focuses text entry: "+width);
  await composer.fill("Hola desde el chat");
  assert.equal(await composer.inputValue(),"Hola desde el chat");
 }
 await page.locator("#robotitoTextSend").click();
 await page.waitForFunction(()=>document.querySelector(".typed-chat-user")?.textContent.includes("Hola desde el chat"),null,{timeout:8000});
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={avatarPicker:true,noAnimalCaption:true,languageSelect:true,
  bottomComposerSizes:3,clickableNight:true,typedMessage:true,
  stopControlRemoved:true,physicalHardware:false};
 console.log("Avatar/language/footer "+test.engineName+" real browser interaction passed");
}).catch(e=>{console.error(e);process.exitCode=1;});
