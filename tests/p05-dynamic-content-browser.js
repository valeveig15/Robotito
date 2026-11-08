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
 test.phase("built-in-books-drawings-and-study-cards");
 await page.evaluate(()=>{
  setLanguageMode("fr");
  showBookRecommendations([{book:{...LOCAL_BOOK_CATALOG[0],title:"Borrar",language:"es"},matched:["fantasía"],owned:false}],analyzeBookPrompt("fantasía"),"fantasía",true);
  drawRequestedThing("dibujame un libro","fr");
  state.classLines[0].text="La profesora explicó cómo la luz atraviesa el agua.";
  makeFlashcards();
 });
 for(const lang of ["fr","de","en"]){
  await page.evaluate(lang=>setLanguageMode(lang),lang);
  await page.waitForFunction(lang=>document.querySelector('.book-description .localized-content-text')?.lang===lang,lang);
  const panel=await page.evaluate(lang=>({
   title:document.querySelector(".book-card strong").textContent,
   reason:document.querySelector(".book-match-reason").textContent,
   expectedReason:ROBOTITO_I18N.text("Puede encajar por {topics}.",lang,{topics:ROBOTITO_I18N.text("fantasía",lang)}),
   description:document.querySelector('.book-description .localized-content-text').textContent,
   expectedDescription:ROBOTITO_I18N.text(LOCAL_BOOK_CATALOG[0].description,lang),
   drawing:document.getElementById("drawingTitle").textContent,
   expectedDrawing:ROBOTITO_I18N.text("Robotito dibujó {name}",lang,{name:ROBOTITO_OBJECTS.displayName("book",lang)}),
   question:document.querySelector("#classAnswer strong").textContent,
   original:document.querySelector(".flashcard-answer .localized-content-text").textContent
  }),lang);
  assert.equal(panel.title,"Borrar","Book title stays verbatim");
  assert.equal(panel.reason,panel.expectedReason);
  assert.equal(panel.description,panel.expectedDescription,"Built-in catalogue translates without a model");
  assert.equal(panel.drawing,panel.expectedDrawing);
  assert.ok(panel.question.startsWith({fr:"Question",de:"Frage",en:"Question"}[lang]));
  assert.equal(panel.original,"La profesora explicó cómo la luz atraviesa el agua.");
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
 test.phase("audio-and-explicit-language-reply");
 const preserved=await page.evaluate(()=>{
  const root=document.getElementById("classRecordingsList");
  const audio=document.createElement("audio");audio.id="p05-playing-recording";root.append(audio);
  setLanguageMode("it");
  handleLanguageCommand("Hablame en francés solo esta vez");
  sayInLanguage("Bonjour !","fr");
  return {sameAudio:document.getElementById("p05-playing-recording")===audio,oneReplyConsumed:state.nextResponseLanguage===null};
 });
 assert.deepEqual(preserved,{sameAudio:true,oneReplyConsumed:true});
 test.phase("late-translation-after-language-switch");
 await page.evaluate(()=>{
  window.p05Pending=[];
  window.Translator={availability:async()=>"available",create:async()=>({translate:()=>new Promise(resolve=>p05Pending.push(resolve)),destroy(){}})};
  setLanguageMode("es");
  window.p05Translation=handleSayInLanguageCommand('Cómo se dice “La casa de Ana tiene una ventana” en inglés');
 });
 await page.waitForFunction(()=>p05Pending.length>0);
 await page.evaluate(()=>{setLanguageMode("de");for(const finish of p05Pending)finish("Ana’s house has a window.");});
 await page.evaluate(()=>p05Translation);
 assert.notEqual(await page.locator('#speechBubble').textContent(),"Ana’s house has a window.");
 test.phase("late-translation-after-speaker-switch");
 await page.evaluate(()=>{
  setLanguageMode("es");state.currentVoicePerson="Ada";window.p05Pending=[];
  window.p05Translation=handleSayInLanguageCommand('Cómo se dice “La casa de Ana tiene una ventana” en inglés');
 });
 await page.waitForFunction(()=>p05Pending.length>0);
 await page.evaluate(()=>{state.currentVoicePerson="Bruno";for(const finish of p05Pending)finish("Private answer for Ada.");});
 await page.evaluate(()=>p05Translation);
 assert.notEqual(await page.locator('#speechBubble').textContent(),"Private answer for Ada.");
 await page.evaluate(()=>{state.currentVoicePerson=null;});
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
