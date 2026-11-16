"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p24-object-scene",async test=>{
  const {page,baseURL}=test;
  test.phase("p24-object-scene-browser");
  await page.goto(baseURL,{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>!!window.ROBOTITO_OBJECT_SCENE?.request&&
    !!window.ROBOTITO_ROUTER?.handle&&!!window.ROBOTITO_OBJECTS?.find,
    null,{timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true",
    null,{timeout:20000});
  await page.evaluate(()=>{const voice=document.querySelector("#voiceEnabled");
    if(voice){voice.checked=false;voice.dispatchEvent(new Event("change"));}});
  const first=await page.evaluate(()=>window.ROBOTITO_ROUTER.handle("Mostrame una manzana",{lang:"es"}));
  assert.equal(first,true,"normal route handles show-object requests");
  await page.waitForFunction(()=>document.querySelector("#objectSceneProp")?.textContent==="🍎",
    null,{timeout:9000});
  const state=await page.evaluate(()=>({
    prop:document.querySelector("#objectSceneProp")?.textContent,
    inAvatar:!!document.querySelector("#robotito > #objectSceneProp"),
    message:document.querySelector("#objectSceneStatus")?.textContent,
    cardHidden:document.querySelector("#objectShowcase")?.classList.contains("hidden")
  }));
  assert.equal(state.prop,"🍎");
  assert.equal(state.inAvatar,true,"prop belongs to moving avatar instead of a floating card");
  assert.ok(state.message.includes("manzana"));
  assert.equal(state.cardHidden,true);
  const negative=await page.evaluate(async()=>{
    window.ROBOTITO_OBJECT_SCENE.cancel();
    const start=window.ROBOTITO_OBJECT_SCENE.request("No me muestres una manzana");
    const missing=window.ROBOTITO_OBJECT_SCENE.request("Mostrame un objeto inventado inexistente");
    return {start,missing,prop:!!document.querySelector("#objectSceneProp")};
  });
  assert.equal(negative.start,false);
  assert.equal(negative.missing,true);
  assert.equal(negative.prop,false);
  assert.deepEqual(test.report.pageErrors,[]);
  test.report.result={scene:true,avatarProp:true,negation:true,unsupported:true,physicalDevice:false};
  console.log("P24 "+test.engineName+" object-trip browser checks passed");
}).catch(e=>{console.error(e);process.exitCode=1;});
