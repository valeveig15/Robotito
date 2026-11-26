"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p05-ui-localization",async test=>{
  const {page,baseURL}=test,errors=test.report.pageErrors;
  test.phase("p05-ui-localization");
  await page.goto(baseURL,{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>window.ROBOTITO_I18N&&typeof window.setLanguageMode==="function",null,{timeout:20000});
  const initial=await page.evaluate(()=>[...document.querySelectorAll("#languageGateTitle .startup-language-line")]
   .map(node=>({lang:node.lang,display:getComputedStyle(node).display,text:node.textContent})));
  assert.deepEqual(initial.map(x=>x.lang),["es","en","pt","fr","it","de"]);
  assert.ok(initial.every(x=>x.display==="block"&&x.text.length>10),
   "Multilingual startup phrases must use separate rows");
  for(const lang of ["es","en","pt","fr","it","de"]){
   await page.evaluate(lang=>window.setLanguageMode(lang),lang);
   const localized=await page.evaluate(lang=>{
    const i18n=window.ROBOTITO_I18N;
    const expected=key=>i18n.t(key,lang);
    const field=(id,key)=>document.getElementById(id)?.placeholder===expected(key);
    return {
     htmlLang:document.documentElement.lang,
     input:field("robotitoTextInput","uiInputPrompt"),
     subject:field("classSubject","uiClassSubjectExample"),
     birthday:field("personBirthday","uiBirthdayPlaceholder"),
     book:field("bookPrompt","uiBookPromptExample"),
     questions:[...document.querySelectorAll(".question-example-list li")].map((el,i)=>
      el.textContent===expected("uiAskQ"+(i+1))),
     contact:document.querySelector(".whatsapp-help-button")?.getAttribute("aria-label")===
      expected("uiHelpContactAria"),
     eyebrow:document.getElementById("avatarBrandEyebrow")?.textContent===expected("uiBrandEyebrow"),
     world:document.getElementById("world")?.getAttribute("aria-label")===
      expected(document.getElementById("world")?.dataset.timeMode==="night"
       ?"uiWorldNightAria":"uiWorldDayAria"),
     dayNight:document.getElementById("dayNightLabel")?.textContent===
      expected(document.getElementById("world")?.dataset.timeMode==="night"
       ?"uiNightLabel":"uiDayLabel"),
     controls:Object.entries({
      reactionTrialStart:"uiTrialStart",nextTeacherBtn:"uiClassTeacherNext",
      nextClassmateBtn:"uiClassmateNext",prepareYoutubeBtn:"uiYouTubePrepare",
      startYoutubeCaptureBtn:"uiYouTubeListen",saveYoutubeTranscriptBtn:"uiYouTubeSaveTranscript",
      solveMathBtn:"uiSolveMath"
     }).map(([id,key])=>document.getElementById(id)?.textContent===expected(key)),
     voiceStyles:Object.entries({natural:"Natural",deep:"Deep",high:"High",
      cute:"Cute",energetic:"Energetic",funny:"Funny",robotic:"Robotic",
      strange:"Strange",calm:"Calm",narrator:"Narrator"})
      .map(([value,suffix])=>[...document.querySelectorAll("#voiceStyle option")]
       .some(o=>o.value===value&&o.textContent===expected("uiVoiceStyle"+suffix)))
    };
   },lang);
   assert.equal(localized.htmlLang,lang,"Language attr "+lang);
   for(const key of ["input","subject","birthday","book","contact","eyebrow","world","dayNight"])
    assert.equal(localized[key],true,lang+" "+key);
   assert.equal(localized.questions.length,15,lang+" full help list");
   assert.ok(localized.questions.every(Boolean),lang+" every help example translated");
   assert.ok(localized.controls.every(Boolean),lang+" class/video/trial controls translated");
   assert.ok(localized.voiceStyles.every(Boolean),lang+" voice style labels translated");
  }
  test.phase("saved-reminder-copy-and-literal-content");
  await page.waitForFunction(()=>window.ROBOTITO_MEMORY?.active&&window.ROBOTITO_TEMPORAL_RULES?.attach());
  await page.evaluate(async()=>{
   await ROBOTITO_MEMORY.ready();
   const service=ROBOTITO_TEMPORAL_RULES.attach();
   await service.run(engine=>{
    const owner=ROBOTITO_MEMORY.owner();
    engine.create({kind:"once",ms:3600000,text:"Léa <libro>"},owner);
    engine.create({kind:"repeat",ms:3600000,count:3,text:"Léa <libro>"},owner);
    engine.create({kind:"phrase",trigger:"Mi frase",text:"Léa <libro>"},owner);
    engine.create({kind:"daily",time:"14:30",text:"Léa <libro>"},owner);
   });
   await ROBOTITO_TEMPORAL_RULES.refresh();
  });
  const reminderPrefixes={es:["Recordar:","Repetir 3 veces:","Si digo","Todos los días"],
   en:["Remind:","Repeat 3 times:","If I say","Every day"],
   pt:["Lembrar:","Repetir 3 vezes:","Se eu disser","Todos os dias"],
   fr:["Rappel :","Répéter 3 fois :","Si je dis","Tous les jours"],
   it:["Promemoria:","Ripeti 3 volte:","Se dico","Ogni giorno"],
   de:["Erinnerung:","3-mal wiederholen:","Wenn ich","Jeden Tag"]};
  for(const [lang,prefixes] of Object.entries(reminderPrefixes)){
   await page.evaluate(lang=>setLanguageMode(lang),lang);
   const descriptions=await page.locator("#temporalRuleList .rule-description").allTextContents();
   assert.equal(descriptions.length,4);
   descriptions.forEach((text,index)=>{
    assert.ok(text.startsWith(prefixes[index]),lang+" localized reminder: "+text);
    assert.ok(text.endsWith("Léa <libro>"),"Literal user content must stay unchanged");
   });
   assert.equal(await page.locator("#temporalRuleList libro").count(),0,"User text must never become markup");
  }
  assert.deepEqual(errors,[],"No uncaught page errors during locale changes");
  test.report.result={locales:6,questions:15,forms:4};
  console.log("P05 "+test.engineName+" UI localization: 6 locales, 15 questions, 4 form checks and accessible labels passed");
},{viewport:{width:390,height:844}}).catch(error=>{console.error(error);process.exitCode=1;});
