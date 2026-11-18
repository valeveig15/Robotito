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
 if(await page.locator("#settingsPanel").isHidden())await page.locator("#settingsToggle").click();
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
 if(await page.locator("#settingsPanel").isHidden())await page.locator("#settingsToggle").click();
  await page.locator("#quickLanguageSelect").selectOption("pt");
 assert.equal(await page.locator("html").getAttribute("lang"),"pt");
 assert.equal(await page.locator("#languageMode").inputValue(),"pt");
 if(await page.locator("#settingsPanel").isHidden())await page.locator("#settingsToggle").click();
  await page.locator("#quickLanguageSelect").selectOption("es");
 await page.locator("#settingsClose").click();
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
 test.phase("spoken-commands-are-not-saved-in-horarios");
 const command=await page.evaluate(async()=>{
   await ROBOTITO_MEMORY.ready();
   const owner=ROBOTITO_MEMORY.owner();
   const engine=window.ROBOTITO_TEMPORAL_RULES.attach();
   const before=engine.list(owner).length;
   await window.ROBOTITO_CHAT.send("En 1 minuto decime tomar agua");
   return {before,after:engine.list(owner).length,
      temporary:engine.temporaryList(owner).map(row=>row.text),
      storage:JSON.parse(localStorage.getItem("robotito.temporal-rules.v1")||"[]").length};
 });
 assert.equal(command.before,command.after);
 assert.ok(command.temporary.includes("tomar agua"),"spoken reminder exists only in session");
 assert.equal(command.storage,command.after,"spoken reminder never writes to localStorage");
 test.phase("transient-order-survives-engine-refresh");
 await page.evaluate(async()=>{
   const rules=ROBOTITO_TEMPORAL_RULES;
   await rules.handle("En 1 segundo decime prueba temporal completada");
   await rules.refresh();
 });
 await page.waitForFunction(()=>document.getElementById("typedChatHistory").textContent.includes("prueba temporal completada"),null,{timeout:7000});
 assert.equal(await page.evaluate(()=>ROBOTITO_TEMPORAL_RULES.attach().temporaryList(ROBOTITO_MEMORY.owner()).some(row=>row.text==="prueba temporal completada")),false,"expired transient order removed without persistence");
 await page.locator("#robotitoTextSend").click();
 await page.waitForFunction(()=>document.querySelector(".typed-chat-user")?.textContent.includes("Hola desde el chat"),null,{timeout:8000});
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={avatarPicker:true,noAnimalCaption:true,languageSelect:true,
  bottomComposerSizes:3,clickableNight:true,typedMessage:true,
  stopControlRemoved:true,physicalHardware:false};
 console.log("Avatar/language/footer "+test.engineName+" real browser interaction passed");
}).catch(e=>{console.error(e);process.exitCode=1;});
