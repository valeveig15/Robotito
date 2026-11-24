"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
const APPROVED=["panda","brown-bear","polar-bear","dog","monkey","cat","red-panda","iguana"];
const LANDSCAPES={panda:"environment","brown-bear":"pardo-grass-anchored",
 "polar-bear":"snow-particles",dog:"park-grounded-trunks",monkey:"jungle-branches",
 cat:"environment","red-panda":"environment",iguana:"environment"};
runBrowserTest("p28-approved-avatars",async test=>{
 const {page,baseURL}=test;
 // Observe before the interaction: short transitions can finish before a
 // subsequent Playwright round trip, especially with the full SVG in WebKit.
 const expectTransition=async(expected,trigger)=>{
  await page.evaluate(expected=>{
   const current=window.ROBOTITO_APPROVED_AVATAR.current,avatar=current.avatar;
   window.__p28Transition=new Promise(resolve=>{
    const finish=observed=>{
     clearTimeout(deadline);observer.disconnect();
     resolve({observed,id:current.id,mood:avatar.dataset.mood,classes:avatar.getAttribute("class"),expected});
    };
    const observer=new MutationObserver(()=>{
     if(expected.mood?avatar.dataset.mood===expected.mood:avatar.classList.contains(expected.action))finish(true);
    });
    const deadline=setTimeout(()=>finish(false),15000);
    observer.observe(avatar,{attributes:true,attributeFilter:["class","data-mood"]});
   });
  },expected);
  await trigger();
  const transition=await page.evaluate(()=>window.__p28Transition);
  assert.equal(transition.observed,true,"Missing approved-avatar transition: "+JSON.stringify(transition));
 };
 test.phase("load-seven-exact-svg-references");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 await page.locator('[data-start-language="es"]').click();
 await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR?.current?.id==="panda");
 test.phase("late-action-cleanup-preserves-latest-action");
 const actionRace=await page.evaluate(async()=>{
  const nativeTimeout=window.setTimeout,pending=[];
  // Deliver old completions after a different action and a repeated action start.
  // Real DOM mutations and the approved-avatar observer remain active.
  window.setTimeout=(callback,delay,...args)=>{pending.push(()=>callback(...args));return 0;};
  try{
   speciesAct("highfive",1300);
   speciesAct("pet",1500);
   speciesAct("pet",1500);
  }finally{window.setTimeout=nativeTimeout;}
  pending[0]();pending[1]();
  await new Promise(resolve=>nativeTimeout(resolve,0));
  const robot=document.querySelector("#robotito");
  const active={action:robot.dataset.speciesAction,reacting:robot.classList.contains("species-reacting"),
   visible:window.ROBOTITO_APPROVED_AVATAR.current.avatar.classList.contains("action-acariciar")};
  pending[2]();
  await new Promise(resolve=>nativeTimeout(resolve,0));
  return {timers:pending.length,active,finished:!robot.dataset.speciesAction&&!robot.classList.contains("species-reacting"),
   cleared:!window.ROBOTITO_APPROVED_AVATAR.current.avatar.classList.contains("action-acariciar")};
 });
 assert.deepEqual(actionRace,{timers:3,active:{action:"pet",reacting:true,visible:true},finished:true,cleared:true});
 test.phase("late-mood-recovery-preserves-newer-choice");
 const moodRace=await page.evaluate(async()=>{
  const nativeTimeout=window.setTimeout,pending=[];
  window.setTimeout=(callback,delay,...args)=>{pending.push(()=>callback(...args));return 0;};
  let savedMood,changedAvatar,currentRecovery=false;
  try{
   setMood("excited");
   scheduleMoodRecovery(()=>setMood("happy"),1300);
   setMood("embarrassed");
   pending.shift()();
   savedMood=state.mood;
   scheduleMoodRecovery(()=>{changedAvatar=true;},1300);
   const originalAvatar=state.avatar;
   try{state.avatar="dog";pending.shift()();}finally{state.avatar=originalAvatar;}
   scheduleMoodRecovery(()=>{currentRecovery=true;},1300);
   pending.shift()();
  }finally{window.setTimeout=nativeTimeout;}
  await new Promise(resolve=>nativeTimeout(resolve,0));
  return {savedMood,changedAvatar:!!changedAvatar,currentRecovery,
   visible:window.ROBOTITO_APPROVED_AVATAR.current.avatar.dataset.mood};
 });
 assert.deepEqual(moodRace,{savedMood:"embarrassed",changedAvatar:false,currentRecovery:true,visible:"avergonzado"});
 test.phase("load-seven-exact-svg-references");
 for(const id of APPROVED){
  await page.waitForFunction(id=>window.ROBOTITO_APPROVED_AVATAR?.current?.id===id,id,{timeout:20000});
  const meta=await page.evaluate(({id,landscape})=>{
    const r=window.ROBOTITO_APPROVED_AVATAR.current;
    const stage=r.shadow.getElementById("stage-svg");
    const style=r.shadow.querySelector("style");
    const all=stage.querySelectorAll("g[id],path,circle,ellipse,polygon").length;
    return {id:r.id,landscape:!!stage.querySelector("#"+landscape),
     polygons:all,hasStyle:style.textContent.length>30000,
     noScripts:r.shadow.querySelectorAll("script,button,input").length===0,
     role:document.querySelector("#approvedAvatarHost").getAttribute("role"),
     originalHidden:document.querySelector("#robotito").getAttribute("aria-hidden"),
     geometry:document.querySelector("#approvedAvatarHost").getBoundingClientRect().width,
     sourceView:stage.getAttribute("viewBox"),shadow:!!stage.querySelector("#shadow")};
  },{id,landscape:LANDSCAPES[id]});
  assert.equal(meta.id,id);
  assert.equal(meta.landscape,true,"Correct approved environment "+id);
  assert.equal(meta.shadow,true,"Grounded physical shadow "+id);
  // Stable markers from the user's own animal SVGs, not the generic species renderer.
  const identityChecks={
    dog:["#bobi-head-v21","#bobi-neck-bridge","#bobi-single-muzzle","#bobi-left-toes","#bobi-right-toes","#tail"],
    cat:["#michi-face-v17","#michi-single-pink-nose","#michi-whiskers"],
    "red-panda":["#roji-head-refined","#panda-eye-patches","#roji-cream-bib","#roji-front-tail"],
    iguana:["#head-anatomy-v2","#igui-attached-dewlap","#igui-tail-spines"]
  };
  if(identityChecks[id]){
    const identity=await page.evaluate(selectors=>{
      const svg=window.ROBOTITO_APPROVED_AVATAR.current.stage;
      return {found:selectors.map(selector=>svg.querySelectorAll(selector).length),
       heads:svg.querySelectorAll('#head').length};
    },identityChecks[id]);
    assert.ok(identity.found.every(n=>n===1),"Distinct user-approved animal features: "+id+" "+JSON.stringify(identity));
    assert.equal(identity.heads,1,"Never render a second underlying face: "+id);
  }
  assert.ok(meta.polygons>150,"Not a simplified recolored stock avatar: "+id);
  assert.equal(meta.hasStyle,true);
  assert.equal(meta.noScripts,true,"Original standalone JS/buttons must never be reexecuted");
  assert.equal(meta.originalHidden,"true");
  assert.equal(meta.role,"img");
  assert.ok(meta.geometry>250);
  assert.equal(meta.sourceView,"0 0 700 635");
  test.phase("approved-avatar-moods-and-actions",APPROVED.indexOf(id),{avatar:id});
  await expectTransition({mood:"avergonzado"},()=>page.evaluate(()=>setMood("embarrassed")));
  await expectTransition({mood:"feliz"},()=>page.evaluate(()=>setMood("happy")));
  await expectTransition({action:"action-chocar"},()=>page.locator('[data-action="highfive"]').click());
  await expectTransition({action:"action-acariciar"},()=>page.locator('[data-action="pet"]').click());
  await page.locator("#changeAvatarBtn").click();
  const index=APPROVED.indexOf(id),next=APPROVED[index+1];
  if(next)await page.locator('#avatarChoices [data-avatar-id="'+next+'"]').click();
  else await page.locator('#avatarChoices [data-avatar-id="chameleon"]').click();
 }
 test.phase("non-reference-avatar-keeps-previous-renderer");
 await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR.current===null);
 assert.equal(await page.locator("#robotito").getAttribute("aria-hidden"),null);
 assert.equal(await page.locator("#world").evaluate(el=>el.classList.contains("approved-art-world")),false);
 test.phase("layout-after-viewport-and-language-switch");
 await page.locator("#changeAvatarBtn").click();
 await page.locator('#avatarChoices [data-avatar-id="polar-bear"]').click();
 await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR.current?.id==="polar-bear");
 for(const [width,height] of [[360,740],[430,900],[1280,900]]){
  await page.setViewportSize({width,height});
  const box=await page.evaluate(()=>{
   const stage=document.querySelector(".world-scene").getBoundingClientRect();
   const host=document.querySelector("#approvedAvatarHost").getBoundingClientRect();
   const form=document.querySelector("#robotitoTextForm").getBoundingClientRect();
   const r=document.querySelector("#robotitoTextInput").getBoundingClientRect();
   return {stage:stage.bottom,hostWidth:host.width,formTop:form.top,hit:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.id};
  });
  assert.ok(box.hostWidth>220);
  assert.ok(box.formTop>=box.stage-2,"Approved art must remain behind chat");
  await page.locator("#robotitoTextInput").scrollIntoViewIfNeeded();
  await page.locator("#robotitoTextInput").click();
 }
 await page.locator("#quickLanguageSelect").selectOption("de");
 assert.equal(await page.locator("html").getAttribute("lang"),"de");
 assert.equal(await page.evaluate(()=>window.ROBOTITO_APPROVED_AVATAR.current?.id),"polar-bear");
 await page.evaluate(()=>window.ROBOTITO_APPROVED_AVATAR.speak(true));
 assert.equal(await page.evaluate(()=>window.ROBOTITO_APPROVED_AVATAR.current?.avatar.classList.contains("speaking")),true);
 await page.evaluate(()=>window.ROBOTITO_APPROVED_AVATAR.speak(false));
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={sourceAvatars:8,worlds:8,actions:["highfive","pet"],moods:["happy","embarrassed"],
   sizes:[360,430,1280],lateActionCleanup:true,lateMoodRecovery:true,noSeparatedPages:true,physicalReview:false};
 console.log("P28 "+test.engineName+" original user-authored avatar SVG worlds and app integration passed");
}).catch(e=>{console.error(e);process.exitCode=1;});
