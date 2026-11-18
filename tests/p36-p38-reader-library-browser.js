"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p36-p38-reader-library",async test=>{
 const {page,baseURL}=test;
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 if(await page.locator("#languageGate").isVisible()){
  await page.locator('[data-start-language="es"]').click();
  await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 }
 await page.locator('[data-tab="books"]').click();
 test.phase("three-decorated-shelves-and-manual-book");
 assert.equal(await page.locator(".personal-shelf").count(),3);
 await page.locator("#shelfTitle").fill("La casa del bosque");
 await page.locator("#shelfAuthor").fill("Autora X");
 await page.locator("#shelfSelect").selectOption("to-read");
 await page.locator("#shelfAddBook button[type=submit]").click();
 assert.equal(await page.locator(".shelf-book").count(),1);
 assert.match(await page.locator("#libraryStats").innerText(),/1 libro/);
 await page.locator("#shelfTitle").fill("La casa del bosque");
 await page.locator("#shelfAddBook button[type=submit]").click();
 assert.equal(await page.locator(".shelf-book").count(),1,"Duplicate manual book should not be added");
 await page.locator(".shelf-book-item select").selectOption("read");
 assert.equal(await page.locator(".shelf-read .shelf-book").count(),1);
 test.phase("isbn-validation-without-camera");
 await page.locator("#shelfISBN").fill("9780306406158");
 await page.locator("#shelfLookupISBN").click();
 assert.match(await page.locator("#shelfStatus").innerText(),/ISBN inválido/);
 test.phase("full-description-read-and-translate-only-on-request");
 const results=await page.evaluate(()=>{
  const book={title:"El viaje de prueba",authors:["Autor"],description:"Esta es una descripción original completa con aventuras en un bosque remoto.",
   language:"es",infoLink:"https://books.google.com",thumbnail:""};
  showBookRecommendations([{book,score:3,matched:[],owned:false}],{words:[],concepts:[],negative:[]},"aventura");
  return document.querySelectorAll(".book-description-controls").length;
 });
 assert.equal(results,1);
 await page.locator(".book-description-controls details summary").click();
 assert.match(await page.locator(".book-full-description").innerText(),/bosque remoto/);
 assert.equal(await page.locator(".book-description-controls button").count(),4);
 test.phase("reader-matrix");
 const simulated=await page.evaluate(()=>{
  const policies=window.ROBOTITO_BOOK_POLICY,users=policies.profiles(60);
  const candidates=LOCAL_BOOK_CATALOG.map(book=>({...book,language:"es"}));
  return users.map(user=>{
    const prompt=[user.interest,user.secondInterest,"sin",user.avoid,user.length].join(" ");
    const analysis=analyzeBookPrompt(prompt);
    const scores=candidates.map(book=>scoreBookCandidate(book,analysis).score);
    const ordered=[...scores].sort((x,y)=>y-x);
    return {id:user.id,language:user.language,top:ordered[0],valid:Number.isFinite(ordered[0]),
      exclusions:analysis.negative.length};
  });
 });
 assert.equal(simulated.length,60);
 assert.equal(new Set(simulated.map(p=>p.id)).size,60);
 assert.equal(new Set(simulated.map(p=>p.language)).size,6);
 assert.ok(simulated.every(x=>x.valid));
 assert.ok(simulated.some(x=>x.exclusions>0));
});
