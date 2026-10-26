"use strict";
const {spawn}=require("node:child_process");
const {chromium}=require("playwright");
const {pairwise}=require("./generative-matrix-kit.js");

const port=Number(process.env.ROBOTITO_TEST_PORT||8765);
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1"],{cwd:require("node:path").resolve(__dirname,".."),stdio:"ignore"});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

(async()=>{
  let browser;
  try{
    await pause(700);
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:1280,height:900}});
    await page.route("https://cdn.jsdelivr.net/**",route=>route.fulfill({status:200,contentType:"application/javascript",body:""}));
    const pageErrors=[];
    page.on("pageerror",error=>pageErrors.push(String(error)));
    await page.goto(`http://127.0.0.1:${port}/?tests=1`,{waitUntil:"domcontentloaded",timeout:60000});
    await page.waitForFunction(()=>document.documentElement.dataset.robotitoTests,{timeout:30000});
    const report=await page.evaluate(()=>window.ROBOTITO_LAST_TEST_REPORT);
    if(!report)throw new Error("The browser test report was not created");
    if(report.failed){
      console.error(JSON.stringify(report.results.filter(test=>!test.ok),null,2));
      throw new Error(`${report.failed} browser regression tests failed`);
    }
    if(pageErrors.length)throw new Error("Page errors: "+pageErrors.join(" | "));

    const routerIntegration=await page.evaluate(async()=>{
      const planner=window.ROBOTITO_SEMANTIC_PLANNER,router=window.ROBOTITO_ROUTER;
      if(!planner?.plan||!router?.classify||!router?.handle)throw new Error("Shared semantic routing unavailable");
      const comments=["El profesor dijo que mañana hay examen.","La profesora contó que estudió permutaciones."];
      for(const input of comments){
        const plan=planner.plan(input);
        if(plan.speechAct!=="statement"||plan.mayReadClass||plan.shouldExecute)
          throw new Error("Incidental class commentary is not an action: "+input);
        const result=await router.handle(input,{plan});
        if(result!==false)throw new Error("Router executed a comment: "+input);
      }
      const negated="No me muestres lo que dijo la profesora";
      const noPlan=planner.plan(negated);
      if(noPlan.shouldExecute||await router.handle(negated,{plan:noPlan}))
        throw new Error("Router executed a negated order");
      const object="¿Qué objeto es esto?";
      if(router.classify(object,planner.plan(object)).intent!=="object")
        throw new Error("Camera intent lost in central routing");
      return {comments:comments.length,negative:1,object:1};
    });
    console.log("Robotito structured router browser integration:",JSON.stringify(routerIntegration));
    const languageIntegration=await page.evaluate(async()=>{
      document.querySelector("#voiceEnabled").checked=false;
      document.querySelector("#voiceEnabled").dispatchEvent(new Event("change"));
      const entry=document.querySelector("#robotitoTextInput");
      if(!entry||!window.ROBOTITO_CHAT?.send)throw new Error("Missing typed dialogue");
      await window.ROBOTITO_CHAT.send("Pasemos a francés");
      if(document.documentElement.lang!=="fr"||document.querySelector("#languageMode").value!=="fr")
        throw new Error("French dialogue switching failed");
      await window.ROBOTITO_CHAT.send("Volvé al español");
      if(document.documentElement.lang!=="es")throw new Error("Spanish restoration failed");
      return true;
    });
    if(!languageIntegration)throw new Error("Language integration unavailable");
    const dialogueIntegration=await page.evaluate(async()=>{
      const chat=window.ROBOTITO_CHAT;
      if(!chat?.send||!chat.context)throw new Error("Unified dialogue unavailable");
      const oldClass=document.querySelector("#classAnswer")?.innerHTML||"";
      await chat.send("La profesora dijo que ayer repasamos permutaciones",{channel:"text"});
      if((document.querySelector("#classAnswer")?.innerHTML||"")!==oldClass)
        throw new Error("Class retrieval fired on ambient comment");
      if(chat.context().focus?.speechAct!=="statement")
        throw new Error("A statement was recorded as an instruction");
      await chat.send("No me muestres lo que dijo la profesora",{channel:"text"});
      if((document.querySelector("#classAnswer")?.innerHTML||"")!==oldClass)
        throw new Error("Class retrieval fired on a negated instruction");
      await chat.send("¿Qué es permutación? y después haceme una pregunta",{channel:"text"});
      const bubble=document.querySelector("#speechBubble")?.textContent||"";
      if(!/como explicarias|cómo explicarías/i.test(bubble))
        throw new Error("Sequential quiz action did not execute: "+bubble);
      return {comment:1,negated:1,compound:2};
    });
    console.log("Robotito unified dialogue browser integration:",JSON.stringify(dialogueIntegration));
    const recognitionIntegration=await page.evaluate(()=>{
      const qa=window.ROBOTITO_SPEECH_QA;
      if(!qa?.chooseAlternative||!qa?.alternativeScore)throw new Error("ASR selection missing");
      const utterances=[
        {transcript:"eh eh eh",confidence:.75},
        {transcript:"¿Qué es permutación?",confidence:.75}
      ];
      const best=qa.chooseAlternative(utterances);
      if(best!==utterances[1])throw new Error("Semantic question was not selected over repeated filler");
      const comment=qa.alternativeScore({transcript:"La profesora habló sobre permutaciones",confidence:.81});
      if(!Number.isFinite(comment))throw new Error("Narration cannot be scored");
      return {alternatives:utterances.length,selected:"semantic question",commentFinite:true};
    });
    console.log("Robotito semantic ASR integration:",JSON.stringify(recognitionIntegration));


    const integration=await page.evaluate(async()=>{
      const store=window.ROBOTITO_STORE;
      if(!store||!window.ROBOTITO_I18N||!window.ROBOTITO_AUDIO_PERCEPTION)throw new Error("Missing universal runtime modules");
      const languages=[...document.querySelectorAll("#languageMode option")].map(x=>x.value);
      if(["es","en","pt","fr","it","de"].some(x=>!languages.includes(x)))throw new Error("Missing language controls");
      const bytes=new Uint8Array([3,5,7,11,13,17,19,23]);
      await store.putBlob("browser-test-blob",new Blob([bytes]),{owner:"test",recordId:"browser-test-0"});
      for(let i=0;i<210;i++){
        await store.putRecord({id:"browser-test-"+i,type:"memories",owner:"test",topic:"science",
          timestamp:Date.now()+i,blobId:i===0?"browser-test-blob":null,data:{index:i}});
      }
      const rows=await store.queryRecords({type:"memories",owner:"test",limit:500});
      if(rows.length!==210)throw new Error("IndexedDB search mismatch: "+rows.length);
      const restored=new Uint8Array(await (await store.getBlob("browser-test-blob")).arrayBuffer());
      if(bytes.some((x,i)=>x!==restored[i]))throw new Error("Binary round-trip mismatch");
      const audit=await store.audit();
      if(audit.invalid.length||audit.missingBlobs.length)throw new Error("Storage audit failure");
      await Promise.all(Array.from({length:40},(_,i)=>store.set("browser-test-race",i)));
      if(await store.get("browser-test-race")!==39)throw new Error("Serialized writes lost latest state");
      await store.remove("browser-test-race");
      await store.putRecord({id:"relation-parent",type:"memories",owner:"test"});
      await store.putRecord({id:"relation-child",type:"notes",owner:"test",relatedIds:["relation-parent"]});
      await store.deleteRecord("relation-parent");
      if((await store.getRecord("relation-child")).relatedIds.length)throw new Error("Stale relation after deletion");
      await store.deleteRecord("relation-child");
      for(let i=0;i<210;i++)await store.deleteRecord("browser-test-"+i);
      if(await store.getBlob("browser-test-blob"))throw new Error("Cascade deletion failed");
      const recordId="legacy-audio-test";
      const oldDb=await new Promise((resolve,reject)=>{
        const q=indexedDB.open("robotito-class-audio-v1",1);
        q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);
      });
      const fakeAudio=new Blob([new Uint8Array([11,22,33,44,55])],{type:"audio/webm"});
      await new Promise((resolve,reject)=>{
        const tx=oldDb.transaction("recordings","readwrite");
        tx.objectStore("recordings").put({id:recordId,startedAt:Date.now()-1000,
          endedAt:Date.now(),subject:"Matemática",topic:"combinatoria",blob:fakeAudio});
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
      });
      oldDb.close();
      await window.ROBOTITO_CLASS_AUDIO.migrateAudio();
      const migrated=await store.getRecord("class-audio:"+recordId);
      if(!migrated||migrated.type!=="audios")throw new Error("Legacy audio migration failed");
      const bytesAfter=new Uint8Array(await (await store.getBlob(migrated.blobId)).arrayBuffer());
      if(bytesAfter.join(",")!=="11,22,33,44,55")throw new Error("Legacy audio was modified");
      await window.ROBOTITO_CLASS_AUDIO.removeRecording(recordId);
      if(await store.getRecord("class-audio:"+recordId))throw new Error("Audio delete failed");
      return {records:210,languages:languages.length};
    });
    console.log("Robotito browser IndexedDB integration:",JSON.stringify(integration));
    // Browser-backed, pairwise state contracts: combine device layout class,
    // language, class-mode silence, mute, voice and synthesis availability.
    const stateMatrix=pairwise({
      screen:["mobile-portrait","mobile-landscape","tablet","desktop"],
      language:["es","en","pt","fr","it","de"],
      classMode:[false,true],muted:[false,true],
      voiceEnabled:[false,true],synthesisAvailable:[false,true]
    },{seed:Number(process.env.ROBOTITO_TEST_SEED||17)});
    const stateResults=await page.evaluate(cases=>{
      const runtime=window.ROBOTITO_RUNTIME_POLICY;
      const i18n=window.ROBOTITO_I18N;
      if(!runtime?.canSpeak||!i18n)throw new Error("Runtime policy unavailable");
      let checked=0;
      for(const params of cases){
        const expected=!params.classMode&&!params.muted&&params.voiceEnabled&&params.synthesisAvailable;
        if(runtime.canSpeak(params)!==expected)
          throw new Error("Class/mute/speech state mismatch "+JSON.stringify(params));
        if(!i18n.locale(params.language).startsWith(params.language))
          throw new Error("Language state mismatch "+JSON.stringify(params));
        checked++;
      }
      return checked;
    },stateMatrix.cases);
    if(stateResults!==stateMatrix.cases.length||stateMatrix.coveredPairs!==stateMatrix.totalPairs)
      throw new Error("Pairwise browser state coverage incomplete");
    console.log("Robotito browser pairwise state matrix:",stateResults,
      "cases; pairs:",stateMatrix.coveredPairs+"/"+stateMatrix.totalPairs);
    const viewports=[[390,844],[360,740],[844,390],[768,1024]];
    for(const [width,height] of viewports){
      await page.setViewportSize({width,height});
      const layout=await page.evaluate(()=>{
        document.querySelector("#languageGate")?.classList.add("hidden");
        const scene=document.querySelector(".world-scene")?.getBoundingClientRect();
        const controls=document.querySelector(".world-controls")?.getBoundingClientRect();
        const buttons=[...document.querySelectorAll(".world-controls .quick-actions button")].map(el=>el.getBoundingClientRect());
        return {
          viewport:document.documentElement.clientWidth,
          scrollWidth:document.documentElement.scrollWidth,
          separated:!!scene&&!!controls&&controls.top>=scene.bottom-1,
          controlsVisible:!!controls&&controls.width>0&&controls.height>0,
          buttonsVisible:buttons.length>=7&&buttons.every(box=>box.width>20&&box.height>=38)
        };
      });
      if(layout.scrollWidth>layout.viewport+1||!layout.separated||!layout.controlsVisible||!layout.buttonsVisible){
        throw new Error(`Mobile layout failed at ${width}x${height}: ${JSON.stringify(layout)}`);
      }
    }
    console.log(`Robotito browser regression: ${report.total}/${report.total} passed; 4 responsive viewports passed`);
  }finally{
    if(browser)await browser.close();
    server.kill("SIGTERM");
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
