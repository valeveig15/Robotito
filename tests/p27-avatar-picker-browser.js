"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
const REQUIRED=["panda","brown-bear","polar-bear","dog","monkey","cat",
 "red-panda","iguana","armadillo","penguin","elephant","turtle"];
runBrowserTest("p27-avatar-picker",async test=>{
 const {page,baseURL}=test;
 test.phase("catalogue-initial-selection");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 // A fresh browser starts with the language selection, followed by avatar.
 await page.locator('[data-start-language="es"]').click();
 const ids=await page.locator("#avatarChoices [data-avatar-id]")
   .evaluateAll(nodes=>nodes.map(x=>x.dataset.avatarId));
 assert.equal(new Set(ids).size,50,"All 50 unique existing avatars are selectable");
 for(const id of REQUIRED)assert.ok(ids.includes(id),"Missing "+id);
 assert.equal(await page.locator(".avatar-choice-name,.avatar-special").count(),0);
 await page.locator('#avatarChoices [data-avatar-id="cat"]').click();
 assert.equal(await page.locator("#languageGate").isVisible(),false);
 assert.equal(await page.locator("#robotito").getAttribute("data-avatar"),"cat");
 assert.equal(await page.evaluate(()=>localStorage.getItem("robotito.avatar.v1")),"cat");
 test.phase("reload-persistence");
 await page.reload({waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 assert.equal(await page.locator("#languageGate").isVisible(),false);
 assert.equal(await page.locator("#robotito").getAttribute("data-avatar"),"cat");
 assert.equal(await page.locator("html").getAttribute("lang"),"es");
 test.phase("six-locales-switch-without-loss");
 for(const lang of ["es","en","pt","fr","it","de"]){
   await page.locator("#quickLanguageSelect").selectOption(lang);
   assert.equal(await page.locator("html").getAttribute("lang"),lang);
   await page.locator("#changeAvatarBtn").click();
   assert.equal(await page.locator("#avatarChoices [data-avatar-id]").count(),50);
   assert.equal(await page.locator(".avatar-choice-name,.avatar-special").count(),0);
   assert.ok((await page.locator("#avatarStepTitle").textContent()).length>5);
   await page.locator('#avatarChoices [data-avatar-id="cat"]').click();
   assert.equal(await page.locator("#robotito").getAttribute("data-avatar"),"cat");
 }
 test.phase("awake-change-keeps-sensors-state");
 const same=await page.evaluate(()=>{
   state.started=true;
   return state.started;
 });
 assert.equal(same,true);
 await page.locator("#changeAvatarBtn").click();
 await page.locator('#avatarChoices [data-avatar-id="dog"]').click();
 assert.equal(await page.evaluate(()=>state.started),true);
 assert.equal(await page.locator("#robotito").getAttribute("data-avatar"),"dog");
 await page.reload({waitUntil:"domcontentloaded"});
 assert.equal(await page.locator("html").getAttribute("lang"),"de");
 assert.equal(await page.locator("#robotito").getAttribute("data-avatar"),"dog");
 test.phase("legacy-language-without-avatar");
 await page.evaluate(()=>{localStorage.setItem("robotito.languageMode.v1","fr");localStorage.removeItem("robotito.avatar.v1");});
 await page.reload({waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 assert.equal(await page.locator("#languageGate").isVisible(),true);
 assert.equal(await page.locator("#avatarStep").isVisible(),true);
 assert.equal(await page.locator("#languageStep").isVisible(),false);
 await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 assert.equal(await page.locator("#languageGate").isVisible(),false);
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={catalogue:50,required:REQUIRED.length,locales:6,
   initial:true,persistent:true,legacyMigration:true,awakeSwitch:true};
 console.log("P27 "+test.engineName+" avatar selection and persistence passed");
}).catch(error=>{console.error(error);process.exitCode=1;});
