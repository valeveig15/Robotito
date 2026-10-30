"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
const {coveringArray,coverageReport}=require("./generative-kit.js");
const seed=process.env.ROBOTITO_TEST_SEED||"17";
const viewports={
  "small-phone":{width:320,height:640},
  "phone":{width:360,height:740},
  "large-phone":{width:390,height:844},
  "landscape":{width:844,height:390},
  "tablet":{width:768,height:1024},
  "desktop":{width:1280,height:900}
};
const factors={
  viewport:Object.keys(viewports),
  language:["es","en","pt","fr","it","de"],
  avatar:["panda","chameleon","unicorn"],
  mood:["calm","happy","sad","scared"],
  audioState:["normal","class","muted"]
};
const criticalTriples=[
  ["viewport","language","avatar"],
  ["viewport","mood","audioState"],
  ["language","avatar","mood"]
];
runBrowserTest("browser-scenarios",async test=>{
  const {page,context,engineName}=test;
  const errors=test.report.pageErrors;
  test.report.command="npm run test:browser:scenarios";
  await page.goto(test.baseURL,{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>window.ROBOTITO_STORE?.putRecord
    &&document.querySelector("#robotito")?.dataset.avatar,{timeout:30000});
  await page.evaluate(()=>{
    const gate=document.querySelector("#languageGate");
    if(gate){gate.hidden=true;gate.classList.add("hidden");gate.style.display="none";}
    const voice=document.querySelector("#voiceEnabled");
    if(voice){voice.checked=false;voice.dispatchEvent(new Event("change"));}
  });
  const cases=coveringArray(factors,{seed,criticalTriples,maxCases:1000});
  const report=coverageReport(cases,factors,{criticalTriples});
  assert.equal(report.complete,true);
  assert.ok(report.targets>350,"Expected substantial real browser combinations");
  let checked=0;const executed=[];
  test.checkpoint(()=>{test.report.matrices.ui={planned:cases.length,executed:checked,
    coverage:coverageReport(executed,factors,{criticalTriples})};});
  for(const row of cases){
    test.phase("ui",checked,row);
    await page.setViewportSize(viewports[row.viewport]);
    const result=await page.evaluate(row=>{
      if(typeof window.applyAvatar!=="function"
         ||typeof window.setLanguageMode!=="function"
         ||typeof window.setMood!=="function")
        throw Error("Real Robotito UI handlers unavailable");
      window.setLanguageMode(row.language);
      window.applyAvatar(row.avatar);
      window.setMood(row.mood,"Browser scenario");
      const element=document.querySelector("#robotito");
      const label=document.querySelector('[data-i18n="typedChat"]');
      const source=window.ROBOTITO_AUDIO_PERCEPTION.create({clock:()=>0});
      const sample={rms:.1,flat:.96,harmonic:.01,low:42,mid:38,high:18,zcr:.31};
      const suppressed=row.audioState!=="normal";
      const result=source.process(sample,{now:100,suppress:suppressed});
      const canSpeak=window.ROBOTITO_RUNTIME_POLICY.canSpeak({
        classMode:row.audioState==="class",muted:row.audioState==="muted",
        voiceEnabled:true,synthesisAvailable:true
      });
      const scene=document.querySelector(".world-scene")?.getBoundingClientRect();
      const controls=document.querySelector(".world-controls")?.getBoundingClientRect();
      const buttons=[...document.querySelectorAll(".world-controls .quick-actions button")]
        .map(el=>el.getBoundingClientRect());
      return {
        avatar:element?.dataset.avatar,
        avatarClass:element?.classList.contains("avatar-"+row.avatar),
        moodClass:element?.classList.contains("mood-"+row.mood),
        lang:document.documentElement.lang,
        localized:label?.textContent===window.ROBOTITO_I18N.t("typedChat",row.language),
        width:document.documentElement.clientWidth,
        scrollWidth:document.documentElement.scrollWidth,
        layoutGeometry:Object.fromEntries(["#app",".topbar",".layout",".world",".panel",".tabs","#layoutResizer"]
         .map(selector=>{
           const el=document.querySelector(selector),r=el?.getBoundingClientRect();
           return [selector,r?{left:Math.round(r.left),right:Math.round(r.right),
             width:Math.round(r.width),scrollWidth:el.scrollWidth,
             cssGrid:getComputedStyle(el).gridTemplateColumns}:null];
         })),
        overflowSources:[...document.querySelectorAll("body *")].filter(el=>{
          const rect=el.getBoundingClientRect();
          return rect.width>0 && (rect.right>document.documentElement.clientWidth+1||rect.left< -1);
        }).slice(0,12).map(el=>({tag:el.tagName,cls:String(el.className||"").slice(0,70),
          left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right)})),
        panelOverflow:[...document.querySelectorAll(".panel *")].filter(el=>{
          const r=el.getBoundingClientRect();return r.width>0&&r.right>document.documentElement.clientWidth+1;
        }).slice(0,15).map(el=>({tag:el.tagName,id:el.id,cls:String(el.className||""),width:el.getBoundingClientRect().width})),
        // Desktop uses display:contents for the controls wrapper, so its own
        // bounding rectangle is intentionally empty. Separation is required
        // only for the structural mobile layout.
        separated:document.documentElement.clientWidth>900
          ?!!scene&&!!controls:!!scene&&!!controls&&controls.top>=scene.bottom-1,
        controlsVisible:!!controls&&(document.documentElement.clientWidth>900
          ||controls.width>0&&controls.height>0),
        actionIds:[...document.querySelectorAll(".world-controls .quick-actions button")].map(x=>x.dataset.action),
        buttonsVisible:buttons.length===6&&buttons.every(x=>x.width>20&&x.height>=(document.documentElement.clientWidth>900?20:38)),
        canSpeak,suppressedResult:result.kind==="unknown"&&result.events.length===0,
        volumeBounds:result.confidence>=0&&result.confidence<=1
      };
    },row);
    assert.equal(result.avatar,row.avatar,"Avatar change "+JSON.stringify(row));
    assert.equal(result.avatarClass,true,"Avatar CSS "+JSON.stringify(row));
    assert.equal(result.moodClass,true,"Emotion CSS "+JSON.stringify(row));
    assert.equal(result.lang,row.language,"Language switch "+JSON.stringify(row));
    assert.equal(result.localized,true,"Translated UI "+JSON.stringify(row));
    assert.equal(result.canSpeak,row.audioState==="normal","Audio mode policy "+JSON.stringify(row));
    if(row.audioState!=="normal")assert.equal(result.suppressedResult,true,
      "Suppressed recording/reaction "+JSON.stringify(row));
    assert.equal(result.volumeBounds,true,"Audio confidence bounded");
    // Desktop intentionally overlays its HUD on the full-scene background.
    // On narrow layouts the scene and controls must form separate stacked regions.
    if(viewports[row.viewport].width<=900)
      assert.equal(result.separated,true,"Mobile scene and controls separated "+JSON.stringify(row));
    assert.equal(result.controlsVisible,true,"Controls visible "+JSON.stringify(row));
    assert.equal(result.buttonsVisible,true,"Touch controls sized "+JSON.stringify(row));
    assert.deepEqual(result.actionIds,["pet","feed","highfive","play","surprise","poke"],
      "Only approved interactions remain across avatars and languages "+JSON.stringify(row));
    assert.ok(result.scrollWidth<=result.width+1,
      "No horizontal overflow "+JSON.stringify({row,result}));
    executed.push(row);checked++;
  }

  // Dragging the actual desktop splitter must never extend grid tracks past
  // the padded content area (a historical overflow regression).
  test.phase("splitter");
  await page.setViewportSize(viewports.desktop);
  const divider=page.locator("#layoutResizer");
  assert.equal(await divider.isVisible(),true,"Desktop resizing handle exists");
  const box=await divider.boundingBox();
  assert.ok(box&&box.width>=14,"Resizable splitter has a usable drag target");
  await page.mouse.move(box.x+box.width/2,box.y+Math.min(80,box.height/2));
  await page.mouse.down();
  await page.mouse.move(box.x+box.width/2+75,box.y+Math.min(80,box.height/2),{steps:5});
  await page.mouse.up();
  const resized=await page.evaluate(()=>({
    width:document.documentElement.clientWidth,
    contentWidth:document.documentElement.scrollWidth,
    ratio:localStorage.getItem("robotito.layoutSplit.v1")
  }));
  assert.ok(resized.contentWidth<=resized.width+1,
    "Dragging desktop splitter must not create horizontal overflow");
  assert.ok(Number(resized.ratio)>0&&Number(resized.ratio)<1,
    "Desktop ratio should survive navigation");

  test.phase("persistence-and-suspension");
  // Simulated tab suspension, recovery and a durable record across reload.
  await page.evaluate(()=>{
    const hidden=Object.getOwnPropertyDescriptor(document,"hidden");
    Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});
    document.dispatchEvent(new Event("visibilitychange"));
    if(hidden)Object.defineProperty(document,"hidden",hidden);
    else delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const final=cases.at(-1);
  const sentinelId="property-browser-reload-"+seed;
  await page.evaluate(async id=>{
    await window.ROBOTITO_STORE.putRecord({
      id,type:"preferences",owner:"property-test",source:"browser-simulation",
      data:{marker:"survive-reload",iteration:1}
    });
  },sentinelId);
  await page.reload({waitUntil:"domcontentloaded",timeout:60000});
  await page.waitForFunction(()=>window.ROBOTITO_STORE?.getRecord
    &&document.querySelector("#robotito")?.dataset.avatar,{timeout:30000});
  const durability=await page.evaluate(async id=>{
    const record=await window.ROBOTITO_STORE.getRecord(id);
    const info={marker:record?.data?.marker,avatar:document.querySelector("#robotito")?.dataset.avatar,
      language:document.documentElement.lang};
    await window.ROBOTITO_STORE.deleteRecord(id);
    return info;
  },sentinelId);
  assert.equal(durability.marker,"survive-reload","IndexedDB record survives browser reload");
  assert.equal(durability.avatar,final.avatar,"Avatar survives browser reload");
  assert.equal(durability.language,final.language,"Language survives browser reload");
  const interruptedMicrophone=await page.evaluate(async()=>{
    const start=await window.ROBOTITO_CLASS_AUDIO.start("Prueba sin micrófono","sin pista");
    return {start,active:window.ROBOTITO_CLASS_AUDIO.isRecording()};
  });
  assert.deepEqual(interruptedMicrophone,
    {start:{ok:false,reason:"no-audio-track"},active:false},
    "Unavailable microphone must not create a phantom class recording");
  // Actual Chromium permission rejection: no test may silently assume a mic.
  // The app must not create a recording on a denied microphone permission.
  test.phase("microphone-permission");
  const origin=test.baseURL;
  if(engineName==="chromium"){
  await page.context().grantPermissions([],{origin});
  const deniedMicrophone=await page.evaluate(async()=>{
    const state=await navigator.permissions.query({name:"microphone"})
      .then(result=>result.state).catch(()=>"unsupported");
    let request="unavailable";
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      stream.getTracks().forEach(track=>track.stop());
      request="granted";
    }catch(error){request=error.name||"denied";}
    const start=await window.ROBOTITO_CLASS_AUDIO.start("Prueba permiso denegado");
    return {state,request,start,active:window.ROBOTITO_CLASS_AUDIO.isRecording()};
  });
  assert.equal(deniedMicrophone.state,"denied","Chromium must deny microphone explicitly");
  // Headless runners frequently have no physical microphone, so Chromium
  // may raise NotFoundError *before* reaching the denied-permission path.
  // Both mean no stream was obtained; the permission state is checked above.
  assert.ok(["NotAllowedError","NotFoundError"].includes(deniedMicrophone.request),
    "Denied/unavailable microphone must not supply a media stream");
  console.log("Robotito microphone negative capability:",JSON.stringify(deniedMicrophone));
  assert.deepEqual(deniedMicrophone.start,{ok:false,reason:"no-audio-track"},
    "Denied microphone cannot start a phantom class recording");
  assert.equal(deniedMicrophone.active,false,"No hidden recording after denial");
  test.report.microphone={kind:"native-denial-or-absent-hardware",...deniedMicrophone};
  await page.context().clearPermissions();
  }else{
    // Firefox/WebKit have different headless permission-query support. Exercise
    // a deterministic rejection and label it as simulated, never as hardware.
    test.report.microphone=await page.evaluate(async()=>{
      const media=navigator.mediaDevices,original=media.getUserMedia;
      try{
        media.getUserMedia=async()=>{throw new DOMException("Test denial","NotAllowedError");};
        let request;try{await media.getUserMedia({audio:true});}catch(e){request=e.name;}
        const start=await window.ROBOTITO_CLASS_AUDIO.start("P02 denied microphone");
        return {kind:"simulated-denial",request,start,active:window.ROBOTITO_CLASS_AUDIO.isRecording()};
      }finally{media.getUserMedia=original;}
    });
    assert.equal(test.report.microphone.request,"NotAllowedError");
    assert.deepEqual(test.report.microphone.start,{ok:false,reason:"no-audio-track"});
    assert.equal(test.report.microphone.active,false);
  }

  // Executed fault combinations, not merely policy values: network loss,
  // visibility interruption, mode suppression, narrow layouts, IndexedDB
  // round-trip and cleanup must coexist without mixing private class data.
  const faultFactors={
    viewport:["small-phone","landscape","desktop"],
    network:["online","offline"],
    mode:["normal","class","muted"],
    visibility:["visible","hidden"]
  };
  const faultTriples=[
    ["viewport","network","visibility"],
    ["network","mode","visibility"]
  ];
  const faultCases=coveringArray(faultFactors,{seed,criticalTriples:faultTriples,maxCases:100});
  const faultCoverage=coverageReport(faultCases,faultFactors,{criticalTriples:faultTriples});
  assert.equal(faultCoverage.complete,true,"All fault pairs and risky triples covered");
  let faultChecked=0;const executedFaults=[];
  test.checkpoint(()=>{test.report.matrices.faults={planned:faultCases.length,executed:faultChecked,
    coverage:coverageReport(executedFaults,faultFactors,{criticalTriples:faultTriples})};});
  try{
    for(const row of faultCases){
      test.phase("fault",faultChecked,row);
      await page.setViewportSize(viewports[row.viewport]);
      await page.context().setOffline(row.network==="offline");
      const observation=await page.evaluate(async ({row,id})=>{
        const saved=Object.getOwnPropertyDescriptor(document,"hidden");
        if(row.visibility==="hidden"){
          Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});
          document.dispatchEvent(new Event("visibilitychange"));
        }
        try{
          const hidden=document.hidden;
          const suppress=hidden||row.mode!=="normal";
          const detector=window.ROBOTITO_AUDIO_PERCEPTION.create({clock:()=>100});
          const acoustic=detector.process({
            rms:.92,flat:.97,harmonic:.01,zcr:.35,low:46,mid:60,high:43
          },{now:100,suppress});
          const canSpeak=window.ROBOTITO_RUNTIME_POLICY.canSpeak({
            classMode:row.mode==="class",muted:row.mode==="muted",
            voiceEnabled:true,synthesisAvailable:true
          });
          const store=window.ROBOTITO_STORE;
          await store.putRecord({id,type:"preferences",owner:"p02-fault-tests",
            data:{kind:row.network,mode:row.mode,visible:!hidden}});
          const record=await store.getRecord(id);
          await store.deleteRecord(id);
          const removed=await store.getRecord(id);
          const scene=document.querySelector(".world-scene")?.getBoundingClientRect();
          const controls=document.querySelector(".world-controls")?.getBoundingClientRect();
          return {
            online:navigator.onLine,hidden,canSpeak,
            suppressed:acoustic.events.length===0&&acoustic.musicConfidence===0,
            roundTrip:record?.data?.kind===row.network&&record?.data?.mode===row.mode&&!removed,
            noOverflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,
            noMobileOverlap:document.documentElement.clientWidth>900||
              (!!scene&&!!controls&&controls.top>=scene.bottom-1)
          };
        }finally{
          if(saved)Object.defineProperty(document,"hidden",saved);
          else delete document.hidden;
          if(row.visibility==="hidden")document.dispatchEvent(new Event("visibilitychange"));
        }
      },{row,id:"p02-fault-"+seed+"-"+faultChecked});
      assert.equal(observation.online,row.network==="online",JSON.stringify(row)+" connectivity");
      assert.equal(observation.hidden,row.visibility==="hidden",JSON.stringify(row)+" visibility");
      assert.equal(observation.canSpeak,row.mode==="normal",JSON.stringify(row)+" voice gate");
      if(row.mode!=="normal"||row.visibility==="hidden")
        assert.equal(observation.suppressed,true,JSON.stringify(row)+" acoustic suppression");
      assert.equal(observation.roundTrip,true,JSON.stringify(row)+" offline storage");
      assert.equal(observation.noOverflow,true,JSON.stringify(row)+" no horizontal overflow");
      assert.equal(observation.noMobileOverlap,true,JSON.stringify(row)+" controls do not overlap");
      executedFaults.push(row);faultChecked++;
    }
  }finally{
    await page.context().setOffline(false);
    await page.context().clearPermissions();
    await page.setViewportSize(viewports.desktop);
  }
  console.log("Robotito adversarial browser matrix:",faultChecked,"real fault states /",
    faultCoverage.covered,"pair/triple targets; seed:",seed);
  // Capability matrix complements actual denial, network loss and mode faults.
  const speechFactors={
    language:["es","en","pt","fr","it","de"],
    viewport:["small-phone","phone","landscape","tablet","desktop"],
    mode:["normal","class","muted"],
    voiceEnabled:[false,true],synthesisAvailable:[false,true]
  };
  const speechTriples=[["mode","voiceEnabled","synthesisAvailable"]];
  const speechCases=coveringArray(speechFactors,{seed,criticalTriples:speechTriples,maxCases:250});
  const speechReport=coverageReport(speechCases,speechFactors,{criticalTriples:speechTriples});
  assert.equal(speechReport.complete,true,"Voice capability covering array is complete");
  let speechResult=0;const executedSpeech=[];
  test.checkpoint(()=>{test.report.matrices.speech={planned:speechCases.length,executed:speechResult,
    evidence:"real handlers; simulated speech engine",coverage:coverageReport(executedSpeech,speechFactors,{criticalTriples:speechTriples})};});
  for(const row of speechCases){
    test.phase("speech",speechResult,row);
    await page.setViewportSize(viewports[row.viewport]);
    const result=await page.evaluate(row=>{
      const descriptor=Object.getOwnPropertyDescriptor(window,"speechSynthesis");
      const utteranceDescriptor=Object.getOwnPropertyDescriptor(window,"SpeechSynthesisUtterance");
      const saved={classMode:state.classMode,voiceEnabled:state.voiceEnabled,silentUntil:state.silentUntil,
        speaking:state.speaking,languageMode:state.languageMode};
      let calls=0;
      try{
        setLanguageMode(row.language);state.classMode=row.mode==="class";
        state.silentUntil=row.mode==="muted"?Date.now()+60000:0;
        state.voiceEnabled=row.voiceEnabled;
        const synth=row.synthesisAvailable?{getVoices:()=>[{lang:ROBOTITO_I18N.locale(row.language),voiceURI:"p02-test"}],
          cancel(){},speak(utterance){calls++;utterance.onend?.();}}:undefined;
        Object.defineProperty(window,"speechSynthesis",{configurable:true,value:synth});
        Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:class{constructor(text){this.text=text;}}});
        const accepted=speakResponse("123",row.language);
        return {accepted,calls,language:document.documentElement.lang,
          noOverflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1};
      }finally{
        if(descriptor)Object.defineProperty(window,"speechSynthesis",descriptor);else delete window.speechSynthesis;
        if(utteranceDescriptor)Object.defineProperty(window,"SpeechSynthesisUtterance",utteranceDescriptor);else delete window.SpeechSynthesisUtterance;
        Object.assign(state,saved);
      }
    },row);
    const expected=row.mode==="normal"&&row.voiceEnabled&&row.synthesisAvailable;
    assert.equal(result.accepted,expected,"Actual speech handler "+JSON.stringify(row));
    assert.equal(result.calls,expected?1:0,"Speech requests "+JSON.stringify(row));
    assert.equal(result.language,row.language);assert.equal(result.noOverflow,true);
    executedSpeech.push(row);speechResult++;
  }
  assert.equal(speechResult,speechCases.length);
  console.log("Robotito voice availability matrix:",speechResult,
    "actual handler cases /",speechReport.covered,"pairs/triples; seed:",seed);
if(errors.length)throw Error("Browser exceptions: "+errors.join("\n"));
  console.log("Robotito browser scenario matrix:",checked,"real UI states /",
    report.covered,"pair/triple targets; reload and suspension passed; seed:",seed);
}).catch(error=>{console.error(error);process.exitCode=1;});
