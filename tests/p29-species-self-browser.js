"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p29-species-self",async test=>{
 const {page,baseURL}=test;
 test.phase("real-selected-avatar-questions");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 await page.locator('[data-start-language="es"]').click();
 await page.locator('#avatarChoices [data-avatar-id="chameleon"]').click();
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_SPECIES_FACTS&&window.ROBOTITO_SPECIES));
 assert.equal(await page.locator("#robotito").getAttribute("data-avatar"),"chameleon");
 const initial=await page.evaluate(()=>{
  const avatar=document.querySelector("#robotito");
  setMood("happy");
  const happy=getComputedStyle(avatar).getPropertyValue("--chameleon-hue").trim();
  setMood("sad");
  const sad=getComputedStyle(avatar).getPropertyValue("--chameleon-hue").trim();
  return {happy,sad,notSame:happy!==sad};
 });
 assert.equal(initial.notSame,true,"Chameleon color shifts with moods, not with arbitrary camera backgrounds");
 assert.equal(await page.evaluate(()=>handleSpeciesQuestion("¿Por qué cambias de color?")),true);
 assert.equal(await page.locator("#robotito").evaluate(el=>el.classList.contains("chameleon-color-demo")),true);
 const answer=await page.locator("#speechBubble").textContent();
 assert.match(answer,/camaleones|color/i);
 assert.equal(await page.evaluate(()=>handleSpeciesQuestion("Qué come un camaleón")),false,
  "Generic zoology questions must reach academic routing");
 await page.locator("#robotitoTextInput").fill("¿Qué comes?");
 await page.locator("#robotitoTextSend").click();
 await page.waitForFunction(()=>Array.from(document.querySelectorAll(".typed-chat-assistant")).some(n=>/insectos/i.test(n.textContent)),null,{timeout:12000});
 test.phase("avatar-change-swaps-knowledge-without-losing-conversation");
 if(await page.locator("#settingsPanel").isHidden())await page.locator("#settingsToggle").click();
  await page.locator("#changeAvatarBtn").click();
 await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR?.current?.id==="panda");
 assert.equal(await page.evaluate(()=>window.ROBOTITO_SPECIES_FACTS.describe("¿Qué comes?",{
   id:state.avatar,name:"Pandi",lang:"es"}).text.includes("bambú")),true);
 await page.locator("#robotitoTextInput").fill("¿Qué comes?");
 await page.locator("#robotitoTextSend").click();
 await page.waitForFunction(()=>Array.from(document.querySelectorAll(".typed-chat-assistant")).some(n=>/bambú/i.test(n.textContent)),null,{timeout:12000});
 assert.equal(await page.locator('[data-action="highfive"]').count(),1);
 test.phase("six-language-self-answers");
 for(const lang of ["es","en","pt","fr","it","de"]){
  if(await page.locator("#settingsPanel").isHidden())await page.locator("#settingsToggle").click();
  await page.locator("#quickLanguageSelect").selectOption(lang);
  const result=await page.evaluate(lang=>{
   const id=state.avatar,name=avatarName(avatarById(id),lang);
   return window.ROBOTITO_SPECIES_FACTS.describe("Qué comes?",{id,name,lang}).text;
  },lang);
  assert.ok(result.length>24,lang+" food response");
  assert.ok(!result.includes("{food}"),lang+" no missing placeholders");
 }
 test.phase("mobile-scene-does-not-cover-input");
 await page.setViewportSize({width:360,height:750});
 await page.locator("#robotitoTextInput").scrollIntoViewIfNeeded();
 const position=await page.evaluate(()=>{
  const a=document.querySelector(".quick-actions").getBoundingClientRect();
  const input=document.querySelector("#robotitoTextInput").getBoundingClientRect();
  const scene=document.querySelector(".world-scene").getBoundingClientRect();
  return {bottom:a.bottom,top:input.top,sceneBottom:scene.bottom,
    hit:document.elementFromPoint(input.left+input.width/2,input.top+input.height/2)?.id};
 });
 assert.ok(position.top>=position.bottom-2);
 assert.ok(position.top>=position.sceneBottom-2);
 assert.equal(position.hit,"robotitoTextInput");
 await page.locator("#robotitoTextInput").click();
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={locales:6,avatarSwap:true,chameleonMood:true,foodConversation:true,
  selfQueries:true,academicUnchanged:true,physicalHardware:false};
 console.log("P29 "+test.engineName+" self-knowledge, per-avatar diets, chameleon and chat integration passed");
}).catch(error=>{console.error(error);process.exitCode=1;});
