"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p33-p35-battery-birthday-books",async test=>{
 const {page,baseURL}=test;
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 if(await page.locator("#languageGate").isVisible()){
  await page.locator('[data-start-language="es"]').click();
  await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 }
 test.phase("birthday-manual-and-gift");
 await page.locator("#birthdayManualBtn").click();
 assert.equal(await page.locator("#birthdayScene").isVisible(),true);
 assert.equal(await page.locator("#robotito").evaluate(el=>el.classList.contains("birthday-hidden")),true);
 await page.locator("#birthdayGift").click();
 assert.equal(await page.locator("#birthdayGift").isVisible(),false);
 assert.equal(await page.locator("#robotito").evaluate(el=>el.classList.contains("birthday-hidden")),false);
 assert.match(await page.locator("#birthdayText").innerText(),/mejor regalo/i);
 await page.locator("#birthdayClose").click();
 assert.equal(await page.locator("#birthdayScene").isVisible(),false);
 test.phase("birthday-once-per-person-per-slot");
 const records=await page.evaluate(()=>{
  const p=window.ROBOTITO_P33_P35,now=new Date(),person={id:"test-birthday-browser",name:"Ada",
   birthday:"2000-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0")};
  const key=p.birthdayKey(person,now);localStorage.removeItem(key);
  const once=window.ROBOTITO_BIRTHDAY.check(person,{started:true,classMode:false});
  const twice=window.ROBOTITO_BIRTHDAY.check(person,{started:true,classMode:false});
  const recorded=localStorage.getItem(key);window.ROBOTITO_BIRTHDAY.close();localStorage.removeItem(key);
  return {once,twice,recorded};
 });
 assert.deepEqual(records,{once:true,twice:false,recorded:"1"});
 test.phase("book-provenance-and-no-made-up-reviews");
 const cards=await page.evaluate(()=>{
  showBookRecommendations([{book:{title:"Ensayo verificado",authors:["Autor real"],
   averageRating:4,ratingsCount:7,publisher:"Editorial",publishedDate:"2020",infoLink:"https://books.google.com/books?id=123",
   thumbnail:"http://books.google.com/thumbnail",language:"es",description:"Descripción de prueba"},matched:[],owned:false}],
   {words:[],concepts:[],query:"ensayo"},"ensayo");
  const output=document.querySelector("#bookResults").innerText;
  const image=document.querySelector("#bookResults img");
  return {output,img:image?.getAttribute("src")};
 });
 assert.match(cards.output,/Google Books: 4\/5/);
 assert.match(cards.output,/7 valoraciones/);
 assert.match(cards.output,/Reseñas de lectores no disponibles/);
 assert.ok(cards.img?.startsWith("https://books.google.com/"));
 test.phase("low-power-presentation");
 const dim=await page.evaluate(()=>{
  state.lastSeenAt=Date.now()-180000;state.lastHeardAt=Date.now()-180000;
  state.classMode=false;state.nightSleep=false;inactivityTick();
  const asleep=document.body.classList.contains("robotito-low-power");
  state.lastSeenAt=Date.now();state.lastHeardAt=Date.now();inactivityTick();
  return {asleep,awake:!document.body.classList.contains("robotito-low-power")};
 });
 assert.deepEqual(dim,{asleep:true,awake:true});
});
