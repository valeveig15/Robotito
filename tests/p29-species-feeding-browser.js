"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p29-species-feeding",async test=>{
 const {page,baseURL}=test;
 test.phase("start-panda-uses-bamboo");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true",null,{timeout:20000});
 await page.locator('[data-start-language="es"]').click();
 await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR?.current?.id==="panda");
 assert.equal(await page.locator("#robotito .food-prop").textContent(),"🎋");
 await page.locator('[data-action="feed"]').click();
 await page.waitForFunction(()=>document.querySelector("#approvedAvatarHost")?.shadowRoot?.querySelector(".approved-food-prop")?.textContent==="🎋");
 test.phase("species-questions-use-actual-avatar");
 await page.locator("#robotitoTextInput").fill("¿Dónde vivís?");
 await page.locator("#robotitoTextSend").click();
 await page.waitForFunction(()=>document.querySelector("#speechBubble")?.textContent.includes("Uruguay"),null,{timeout:15000});
 const habitat=await page.locator("#speechBubble").textContent();
 assert.ok(habitat.includes("China"),"Panda natural habitat distinct from program origin");
 await page.locator("#robotitoTextInput").fill("¿Qué comes?");
 await page.locator("#robotitoTextSend").click();
 await page.waitForFunction(()=>document.querySelector("#speechBubble")?.textContent.includes("bambú"));
 test.phase("chameleon-color-mood-and-insects");
 await page.locator("#changeAvatarBtn").click();
 await page.locator('#avatarChoices [data-avatar-id="chameleon"]').click();
 assert.equal(await page.locator("#world").evaluate(el=>el.classList.contains("approved-art-world")),false);
 assert.equal(await page.locator("#robotito .food-prop").textContent(),"🦗");
 const values=await page.evaluate(async()=>{
  const svg=document.querySelector("#robotito .avatar-character");
  if(!svg)throw Error("Missing actual SVG chameleon");
  const color=()=>getComputedStyle(svg).filter;
  setMood("calm");await new Promise(r=>setTimeout(r,760));const calm=color();
  setMood("angry");await new Promise(r=>setTimeout(r,760));const angry=color();
  setMood("sad");await new Promise(r=>setTimeout(r,760));const sad=color();
  setMood("happy");await new Promise(r=>setTimeout(r,760));const happy=color();
  return {calm,angry,sad,happy};
 });
 assert.equal(new Set(Object.values(values)).size,4,"Chameleon color changes across emotions");
 await page.locator("#robotitoTextInput").fill("¿Por qué cambias de color?");
 await page.locator("#robotitoTextSend").click();
 await page.waitForFunction(()=>document.querySelector("#speechBubble")?.textContent.includes("temperatura"));
 await page.locator('[data-action="feed"]').click();
 assert.equal(await page.locator("#robotito .food-prop").textContent(),"🦗");
 test.phase("refuse-unsafe-food-without-hunger-change");
 await page.locator("#changeAvatarBtn").click();
 await page.locator('#avatarChoices [data-avatar-id="dog"]').click();
 await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR?.current?.id==="dog");
 await page.evaluate(()=>{state.hunger=47;updateMeters();});
 await page.locator("#robotitoTextInput").fill("Te doy chocolate");
 await page.locator("#robotitoTextSend").click();
 try{
  await page.waitForFunction(()=>document.querySelector("#speechBubble")?.textContent.includes("No sé si ese alimento"),null,{timeout:9000});
 }catch(error){
  const diagnostic=await page.evaluate(()=>({
    bubble:document.querySelector("#speechBubble")?.textContent,
    avatar:state.avatar,hunger:state.hunger,
    offered:window.ROBOTITO_SPECIES_KNOWLEDGE?.feedingOffer?.("Te doy chocolate",{id:state.avatar,lang:state.languageMode}),
    messages:[...document.querySelectorAll(".typed-chat-line")].slice(-3).map(n=>n.textContent)
  }));
  throw new Error("Rejected-food chat route: "+JSON.stringify(diagnostic)+" / "+error.message);
 }
 assert.equal(await page.evaluate(()=>state.hunger),47);
 await page.locator("#robotitoTextInput").fill("Te doy carne");
 await page.locator("#robotitoTextSend").click();
 await page.waitForFunction(()=>state.hunger===0);
 assert.equal(await page.locator("#robotito .food-prop").textContent(),"🥣");
 assert.equal(await page.locator("#robotitoTextInput").isEnabled(),true);
 test.phase("fiction-and-other-species");
 await page.locator("#changeAvatarBtn").click();
 await page.locator('#avatarChoices [data-avatar-id="unicorn"]').click();
 await page.locator("#robotitoTextInput").fill("¿Dónde vivís?");
 await page.locator("#robotitoTextSend").click();
 await page.waitForFunction(()=>document.querySelector("#speechBubble")?.textContent.includes("inventado"));
 await page.locator("#changeAvatarBtn").click();
 await page.locator('#avatarChoices [data-avatar-id="robot"]').click();
 assert.equal(await page.locator("#robotito .food-prop").textContent(),"⚡");
 assert.ok(await page.locator('[data-action="highfive"]').count(),"High five remains");
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={species:50,locales:6,pandaFood:"🎋",polarFood:"🐟",dogFood:"🥣",
   chameleonColors:4,chameleonFood:"🦗",safeFoodRejection:true,originDistinction:true,
   physicalMobile:false};
 console.log("P29 "+test.engineName+" species knowledge, diet, color and safe feeding passed");
}).catch(error=>{console.error(error);process.exitCode=1;});
