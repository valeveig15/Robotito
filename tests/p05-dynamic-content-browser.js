"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p05-dynamic-content",async test=>{
 const {page,baseURL}=test;
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>typeof setLanguageMode==="function"&&window.ROBOTITO_LOCALIZED_CONTENT);
 await page.click('[data-start-language="es"]');
 await page.click('[data-avatar-id="panda"]');
 test.phase("six-locale-dynamic-panels");
 await page.evaluate(()=>{
  state.people=[{name:"Borrar",birthday:"2000-02-03",descriptors:[],voicePrints:[]}];
  state.memories=[{person:"Borrar",text:'Guardar archivo <img src=x onerror="throw 1">',at:Date.now(),source:"manual",language:"es"}];
  state.classLines=[{id:"p05-quote",subject:"Borrar",text:"Guardar archivo",speaker:"teacher",at:Date.now(),language:"es",sessionId:"p05-class"}];
  state.classSubject="Borrar";state.selectedClassSessionId="p05-class";
 });
 for(const lang of ["es","en","pt","fr","it","de"]){
  await page.evaluate(lang=>setLanguageMode(lang),lang);
  await page.waitForTimeout(30);
  const result=await page.evaluate(lang=>({
   traits:[...document.querySelectorAll(".avatar-special")].map(n=>n.textContent),
   expectedTraits:ROBOTITO_AVATARS.map(a=>ROBOTITO_SPECIES.profile(a.id,lang).trait),
   person:document.querySelector("#peopleList strong")?.textContent,
   memory:document.querySelector("#memoryList p")?.textContent,
   memoryLanguage:document.querySelector("#memoryList p")?.lang,
   noInjectedImage:!document.querySelector("#memoryList img"),
   transcript:document.querySelector('#classTranscript [translate="no"]')?.textContent,
   names:state.people.map(p=>p.name),
   dates:document.getElementById("dateInfo").textContent,
   expectedDate:new Date().toLocaleDateString(ROBOTITO_I18N.locale(lang),{weekday:"long",day:"numeric",month:"long",year:"numeric"}),
   controls:[...document.querySelectorAll("[data-ui-copy]")].every(el=>el.textContent===ROBOTITO_I18N.text(decodeURIComponent(el.dataset.uiCopy),lang))
  }),lang);
  assert.deepEqual(result.traits,result.expectedTraits,lang+": every avatar trait");
  assert.equal(result.traits.length,50);
  assert.equal(result.person,"Borrar",lang+": name must not translate like a button");
  assert.equal(result.memory,'Guardar archivo <img src=x onerror="throw 1">',lang+": original memory preserved");
  assert.equal(result.memoryLanguage,"es");assert.equal(result.noInjectedImage,true);
  assert.equal(result.transcript,"Guardar archivo",lang+": original class quote preserved");
  assert.deepEqual(result.names,["Borrar"]);assert.equal(result.dates,result.expectedDate);
  assert.equal(result.controls,true,lang+": all explicit copy markers localized");
 }
 test.phase("translation-provenance-and-races");
 await page.evaluate(()=>{
  setLanguageMode("en");delete window.Translator;delete window.LanguageModel;
  const node=document.createElement("div");node.id="p05-generated";document.body.append(node);
  ROBOTITO_LOCALIZED_CONTENT.render(node,"La clase de Ana trata sobre la luz.","es");
 });
 await page.waitForFunction(()=>document.querySelector('#p05-generated button')?.disabled===false);
 assert.equal(await page.locator('#p05-generated .localized-content-text').getAttribute('lang'),"es");
 assert.equal(await page.locator('#p05-generated .localized-content-status').textContent(),"Untranslated original");
 await page.evaluate(()=>{window.Translator={availability:async()=>"available",create:async()=>({translate:async()=>"Ana’s class is about light.",destroy(){}})};});
 await page.locator('#p05-generated button').click();
 await page.waitForFunction(()=>document.querySelector('#p05-generated .localized-content-text')?.lang==="en");
 assert.equal(await page.locator('#p05-generated .localized-content-text').textContent(),"Ana’s class is about light.");
 await page.evaluate(()=>{
  window.p05Pending=[];
  window.Translator={availability:async()=>"available",create:async()=>({translate:()=>new Promise(resolve=>p05Pending.push(resolve)),destroy(){}})};
  setLanguageMode("fr");
 });
 await page.waitForFunction(()=>p05Pending.length>0);
 await page.evaluate(()=>{setLanguageMode("de");p05Pending[0]("ANCIEN RÉSULTAT");});
 await page.waitForTimeout(30);
 assert.notEqual(await page.locator('#p05-generated .localized-content-text').textContent(),"ANCIEN RÉSULTAT");
 assert.equal(await page.locator('#p05-generated .localized-content-text').textContent(),"La clase de Ana trata sobre la luz.","Original survives successful translation and locale switch");
 test.phase("scopes-and-persistence");
 const scopes=await page.evaluate(()=>{
  delete window.Translator;setLanguageMode("es");
  handleLanguageCommand("Hablame en francés solo esta vez");
  sayDynamic("timeNow",{time:"12:00"});
  const consumed=state.nextResponseLanguage===null;
  handleLanguageCommand("Speak German this session");
  return {consumed,session:state.languageMode,saved:localStorage.getItem("robotito.languageMode.v1")};
 });
 assert.deepEqual(scopes,{consumed:true,session:"de",saved:"es"});
 await page.reload();await page.waitForFunction(()=>document.documentElement.lang==="es");
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={locales:6,avatars:50,originalDataPreserved:true,translationRacePassed:true,sessionReloadPassed:true};
 console.log("P05 dynamic content: 6 locales, 50 avatars, original data, translation races and scopes passed");
}).catch(error=>{console.error(error);process.exitCode=1;});
