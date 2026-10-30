"use strict";
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const path=require('node:path');
const port=Number(process.env.ROBOTITO_TEST_PORT||8781);
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});
(async()=>{
 let browser;
 try{
  await new Promise(resolve=>setTimeout(resolve,500));
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://**/*',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
  await page.goto(`http://127.0.0.1:${port}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.ROBOTITO_CHAT));
  const result=await page.evaluate(async()=>{
   state.voiceEnabled=false;setLanguageMode('es');
   const chat=window.ROBOTITO_CHAT,planner=window.ROBOTITO_SEMANTIC_PLANNER;
   const bubble=document.querySelector('#speechBubble');
   const original={web:window.ROBOTITO_WEB_KNOWLEDGE.answer,query:window.ROBOTITO_STORE.queryRecords,exercise:window.ROBOTITO_CLASS_EXERCISES.handleRequest,highfive:window.highFiveRobot,model:window.LanguageModel,translator:window.Translator};
   let privateReads=0,exerciseCalls=0,highfives=0,checks=0;
   const check=(value,message)=>{if(!value)throw Error(message);checks++;};
   try{
    window.LanguageModel=undefined;window.Translator=undefined;
    window.ROBOTITO_WEB_KNOWLEDGE.answer=async()=>({handled:false});
    window.ROBOTITO_STORE.queryRecords=async()=>{privateReads++;return [];};
    window.ROBOTITO_CLASS_EXERCISES.handleRequest=async()=>{exerciseCalls++;return false;};
    window.highFiveRobot=()=>{highfives++;};
    for(const text of ['¿Qué es un ejercicio?','Explicame permutación sin mis apuntes','Explicame permutación y no uses mis apuntes',"¿Qué significa 'mostrame lo que hablamos ayer'?","¿Qué significa 'qué objeto es esto'?",'¿Qué significa chocar los cinco?' ,"Explicame qué significa 'speak French'",'Explicame el ejercicio 3 o 4','Abre el libro y no abras el libro','Si llueve, explicame la clase','Explicame mis apuntes pero no uses mis apuntes']){
     await chat.send(text,{channel:'text'});
     check(privateReads===0,'Private source bypass: '+text);
     check(exerciseCalls===0,'Unexpected exercise retrieval: '+text);
     check(highfives===0,'Unexpected avatar action: '+text);
     check(state.languageMode==='es','Quoted language command changed locale: '+text);
    }
    const payload='chocá los cinco y después speak French';
    await chat.send('Repite después de mí: '+payload,{channel:'text'});
    check(bubble.textContent===payload,'Repeat must preserve exact literal payload');
    check(highfives===0&&state.languageMode==='es','Repeat payload ran as commands');
    await chat.send('¿Qué es permutación?',{channel:'text'});
    await chat.send('más breve y después chocá los cinco',{channel:'text'});
    check(highfives===1,'Compound follow-up lost the next action');
    let translated=0,destroyed=0;
    window.Translator={create:async({sourceLanguage,targetLanguage})=>{
     check(sourceLanguage==='es'&&targetLanguage==='pt','Wrong translation pair');
     return {translate:async()=>{translated++;return 'Isso é uma explicação em português.';},destroy:()=>{destroyed++;}};
    }};
    await chat.send('¿Qué es permutación?',{channel:'text'});
    await chat.send('¿Y en portugués?',{channel:'text'});
    check(translated===1&&destroyed===1,'Translator-only fallback or cleanup failed');
    check(/português/.test(bubble.textContent),'Missing translated follow-up');
    check(state.languageMode==='es','One-answer translation changed UI locale');
    window.Translator=undefined;
    const planAsync=planner.planAsync;let resolveAlice;
    try{
     planner.planAsync=(raw,options)=>raw.includes('densidad')?new Promise(resolve=>{resolveAlice=()=>resolve(planner.plan(raw,options));}):planAsync(raw,options);
     state.currentVoicePerson=null;state.currentPerson='P01-Alice';
     const alice=chat.send('¿Qué es densidad?',{channel:'text'});
     state.currentPerson='P01-Bob';
     await chat.send('¿Qué es permutación?',{channel:'text'});
     const bobReply=bubble.textContent;
     resolveAlice();await alice;
     check(chat.context().focus.entities.topic==='permutación','Late plan overwrote another person context');
     check(bubble.textContent===bobReply,'Late plan spoke to the wrong person');
    }finally{planner.planAsync=planAsync;state.currentPerson=null;state.currentVoicePerson=null;}
    const exercisePlans=[];
    window.ROBOTITO_CLASS_EXERCISES.handleRequest=async(text,{plan})=>{exercisePlans.push(plan);return true;};
    await chat.send("Explicame el ejercicio 3 de Física",{channel:"text"});
    await chat.send("Perdón, 5",{channel:"text"});
    await chat.send("Resolvelo",{channel:"text"});
    check(exercisePlans.length===3,"Contextual requests did not reach the exercise handler");
    check(exercisePlans[1].entities.exerciseNumber===5&&exercisePlans[2].entities.exerciseNumber===5,"Corrected number was lost at the real handler boundary");
    check(exercisePlans.every(p=>p.mayReadClass&&/fisica/i.test(p.entities.topic)),"Exercise source/topic lost in dialogue");
    for(const language of ["es","en","pt","fr","it","de"]){
      for(const key of ["p01ClarifyReference","p01ClarifyActions","p01ClarifySources","p01ClarifyExercise","p01ClarifyCondition","p01ClarifyTone"]){
        check(window.ROBOTITO_I18N.t(key,language)!==key,"Missing localized clarification: "+language+"/"+key);
      }
    }
    return {checks,privateReads,exerciseCalls,highfives,translatorFallback:translated};
   }finally{
    window.ROBOTITO_WEB_KNOWLEDGE.answer=original.web;window.ROBOTITO_STORE.queryRecords=original.query;
    window.ROBOTITO_CLASS_EXERCISES.handleRequest=original.exercise;window.highFiveRobot=original.highfive;
    window.LanguageModel=original.model;window.Translator=original.translator;
   }
  });
  assert.deepEqual(errors,[]);console.log('P01 real Chromium dialogue:',JSON.stringify(result));
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
