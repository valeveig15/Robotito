"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p39-p40-reading-clubs",async test=>{
 const {page,baseURL}=test;
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 if(await page.locator("#languageGate").isVisible()){
  await page.locator('[data-start-language="es"]').click();
  await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 }
 await page.locator('[data-tab="books"]').click();
 test.phase("create-local-reading-circle");
 await page.locator("#clubName").fill("Amigas lectoras");
 await page.locator("#clubBook").fill("Un libro para compartir");
 await page.locator("#clubMeeting").fill("2026-12-01");
 await page.locator("#readingCircleForm button[type=submit]").click();
 await page.waitForFunction(()=>document.querySelectorAll(".reading-club").length===1);
 assert.match(await page.locator(".reading-club").innerText(),/Amigas lectoras/);
 test.phase("review-by-five-aspects");
 await page.locator("#readingRatingTitle").fill("Libro de prueba");
 await page.locator("#rating-trama").selectOption("5");
 await page.locator("#rating-personajes").selectOption("4");
 await page.locator("#readingRatingForm button[type=submit]").click();
 await page.waitForFunction(()=>document.querySelectorAll("#readingRatingsList p").length===1);
 assert.match(await page.locator("#readingRatingsList").innerText(),/3.6\/5/);
 test.phase("raffle-only-pending-books");
 await page.locator("#shelfTitle").fill("Pendiente en la estantería");
 await page.locator("#shelfAuthor").fill("Alguien");
 await page.locator("#shelfSelect").selectOption("to-read");
 await page.locator("#shelfAddBook button[type=submit]").click();
 await page.locator("#readingDrawBtn").click();
 assert.match(await page.locator("#readingDrawResult").innerText(),/Pendiente en la estantería/);
 await page.locator("#readingJokeBtn").click();
 assert.match(await page.locator("#readingDrawResult").innerText(),/polvo/);
 test.phase("same-profile-reentry");
 const owner=await page.evaluate(()=>window.ROBOTITO_MEMORY.owner());
 const persistent=await page.evaluate(()=>!window.ROBOTITO_STORE.isEphemeral(window.ROBOTITO_MEMORY.owner()));
 if(persistent){
  await page.reload({waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
  await page.waitForFunction(owner=>window.ROBOTITO_MEMORY.owner()===owner,owner);
  await page.locator('[data-tab="books"]').click();
  await page.waitForFunction(()=>document.querySelectorAll(".reading-club").length===1);
 }
});
