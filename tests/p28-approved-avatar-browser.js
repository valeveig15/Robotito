"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
const APPROVED=["panda","brown-bear","polar-bear","dog","monkey"];
const LANDSCAPES={panda:"environment","brown-bear":"pardo-grass-anchored",
 "polar-bear":"snow-particles",dog:"park-grounded-trunks",monkey:"jungle-branches"};
runBrowserTest("p28-approved-avatars",async test=>{
 const {page,baseURL}=test;
 test.phase("load-five-exact-svg-references");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 await page.locator('[data-start-language="es"]').click();
 await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 for(const id of APPROVED){
  await page.waitForFunction(id=>window.ROBOTITO_APPROVED_AVATAR?.current?.id===id,id,{timeout:20000});
  const meta=await page.evaluate(({id,landscape})=>{
    const r=window.ROBOTITO_APPROVED_AVATAR.current;
    const stage=r.shadow.getElementById("stage-svg");
    const style=r.shadow.querySelector("style");
    const all=stage.querySelectorAll("g[id],path,circle,ellipse,polygon").length;
    return {id:r.id,landscape:!!stage.querySelector("#"+landscape),
     polygons:all,hasStyle:style.textContent.length>30000,
     noScripts:r.shadow.querySelectorAll("script,button,input").length===0,
     role:document.querySelector("#approvedAvatarHost").getAttribute("role"),
     originalHidden:document.querySelector("#robotito").getAttribute("aria-hidden"),
     geometry:document.querySelector("#approvedAvatarHost").getBoundingClientRect().width,
     sourceView:stage.getAttribute("viewBox"),shadow:!!stage.querySelector("#shadow")};
  },{id,landscape:LANDSCAPES[id]});
  assert.equal(meta.id,id);
  assert.equal(meta.landscape,true,"Correct approved environment "+id);
  assert.equal(meta.shadow,true,"Grounded physical shadow "+id);
  assert.ok(meta.polygons>150,"Not a simplified recolored stock avatar: "+id);
  assert.equal(meta.hasStyle,true);
  assert.equal(meta.noScripts,true,"Original standalone JS/buttons must never be reexecuted");
  assert.equal(meta.originalHidden,"true");
  assert.equal(meta.role,"img");
  assert.ok(meta.geometry>250);
  assert.equal(meta.sourceView,"0 0 700 635");
  await page.evaluate(()=>setMood("embarrassed"));
  await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR.current.avatar.dataset.mood==="avergonzado");
  await page.evaluate(()=>setMood("happy"));
  await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR.current.avatar.dataset.mood==="feliz");
  await page.locator('[data-action="highfive"]').click();
  await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR.current.avatar.classList.contains("action-chocar"));
  await page.locator('[data-action="pet"]').click();
  await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR.current.avatar.classList.contains("action-acariciar"));
  await page.locator("#changeAvatarBtn").click();
  const index=APPROVED.indexOf(id),next=APPROVED[index+1];
  if(next)await page.locator('#avatarChoices [data-avatar-id="'+next+'"]').click();
  else await page.locator('#avatarChoices [data-avatar-id="cat"]').click();
 }
 test.phase("non-reference-avatar-keeps-previous-renderer");
 await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR.current===null);
 assert.equal(await page.locator("#robotito").getAttribute("aria-hidden"),null);
 assert.equal(await page.locator("#world").evaluate(el=>el.classList.contains("approved-art-world")),false);
 test.phase("layout-after-viewport-and-language-switch");
 await page.locator("#changeAvatarBtn").click();
 await page.locator('#avatarChoices [data-avatar-id="polar-bear"]').click();
 await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR.current?.id==="polar-bear");
 for(const [width,height] of [[360,740],[430,900],[1280,900]]){
  await page.setViewportSize({width,height});
  const box=await page.evaluate(()=>{
   const stage=document.querySelector(".world-scene").getBoundingClientRect();
   const host=document.querySelector("#approvedAvatarHost").getBoundingClientRect();
   const form=document.querySelector("#robotitoTextForm").getBoundingClientRect();
   const r=document.querySelector("#robotitoTextInput").getBoundingClientRect();
   return {stage:stage.bottom,hostWidth:host.width,formTop:form.top,hit:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.id};
  });
  assert.ok(box.hostWidth>220);
  assert.ok(box.formTop>=box.stage-2,"Approved art must remain behind chat");
  await page.locator("#robotitoTextInput").scrollIntoViewIfNeeded();
  await page.locator("#robotitoTextInput").click();
 }
 await page.locator("#quickLanguageSelect").selectOption("de");
 assert.equal(await page.locator("html").getAttribute("lang"),"de");
 assert.equal(await page.evaluate(()=>window.ROBOTITO_APPROVED_AVATAR.current?.id),"polar-bear");
 await page.evaluate(()=>window.ROBOTITO_APPROVED_AVATAR.speak(true));
 assert.equal(await page.evaluate(()=>window.ROBOTITO_APPROVED_AVATAR.current?.avatar.classList.contains("speaking")),true);
 await page.evaluate(()=>window.ROBOTITO_APPROVED_AVATAR.speak(false));
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={sourceAvatars:5,worlds:5,actions:["highfive","pet"],moods:["happy","embarrassed"],
   sizes:[360,430,1280],noSeparatedPages:true,physicalReview:false};
 console.log("P28 "+test.engineName+" exact user-approved avatar SVG worlds and app integration passed");
}).catch(e=>{console.error(e);process.exitCode=1;});
