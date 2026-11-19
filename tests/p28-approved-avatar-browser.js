"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
const APPROVED=["panda","brown-bear","polar-bear","dog","monkey"];
const LANDSCAPES={panda:"environment","brown-bear":"pardo-grass-anchored",
 "polar-bear":"snow-particles",dog:"park-grounded-trunks",monkey:"jungle-branches"};
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
 test.phase("load-five-exact-svg-references");
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
 test.phase("load-five-exact-svg-references");
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
  assert.ok(meta.polygons>150,"Not a simplified recolored stock avatar: "+id);
  assert.equal(meta.hasStyle,true);
  assert.equal(meta.noScripts,true,"Original standalone JS/buttons must never be reexecuted");
  assert.equal(meta.originalHidden,"true");
  assert.equal(meta.role,"img");
  assert.ok(meta.geometry>250);
  assert.equal(meta.sourceView,"0 0 700 635");
  test.phase("whole-body-framing-and-mouth-below-nose",APPROVED.indexOf(id),{avatar:id});
  const geometry=await page.evaluate(()=>{
   const r=window.ROBOTITO_APPROVED_AVATAR.current;
   const scene=document.querySelector(".world-scene").getBoundingClientRect();
   const body=r.avatar.getBoundingClientRect();
   const nose=r.avatar.querySelector('path[d^="m332 295"],path[d^="M337 296"]');
   const mouth=r.avatar.querySelector("#mouth-neutral");
   return {scene:{top:scene.top,bottom:scene.bottom,height:scene.height},
    body:{top:body.top,bottom:body.bottom,height:body.height},
    factor:Number(r.host.dataset.avatarFit),
    wrappers:r.avatar.querySelectorAll("[data-robotito-mouth-placement]").length,
    noseBottom:nose?.getBoundingClientRect().bottom,
    mouthTop:mouth?.getBoundingClientRect().top,
    stem:!!r.avatar.querySelector('path[d="M354 316v21"]'),
    fit:!!r.fitGroup?.getAttribute("transform")};
  });
  assert.ok(geometry.fit,"Original avatar must have a dedicated framing group");
  assert.ok(geometry.factor>0&&geometry.factor<=1,"Never enlarge an already large character");
  assert.ok(geometry.wrappers>=6&&geometry.stem,"All mouth moods and philtrum must be aligned");
  assert.ok(geometry.mouthTop>geometry.noseBottom,
   "The mouth line must sit below the nose of "+id);
  assert.ok(geometry.body.top>=geometry.scene.top-4,
   "Head cropped in "+id+": "+JSON.stringify(geometry));
  assert.ok(geometry.body.bottom<=geometry.scene.bottom+4,
   "Feet cropped in "+id+": "+JSON.stringify(geometry));
  assert.ok(geometry.body.height<=geometry.scene.height*.92,
   "The avatar should not fill the entire scene height");
  test.phase("approved-avatar-moods-and-actions",APPROVED.indexOf(id),{avatar:id});
  await expectTransition({mood:"avergonzado"},()=>page.evaluate(()=>setMood("embarrassed")));
  await expectTransition({mood:"feliz"},()=>page.evaluate(()=>setMood("happy")));
  await expectTransition({action:"action-chocar"},()=>page.locator('[data-action="highfive"]').click());
  await expectTransition({action:"action-acariciar"},()=>page.locator('[data-action="pet"]').click());
  await page.locator("#changeAvatarBtn").click();
  const index=APPROVED.indexOf(id),next=APPROVED[index+1];
  if(next)await page.locator('#avatarChoices [data-avatar-id="'+next+'"]').click();
  else await page.locator('#avatarChoices [data-avatar-id="cat"]').click();
 }
 test.phase("non-reference-avatar-keeps-previous-renderer");
 await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR.current===null);
 const generic=await page.evaluate(()=>{
  const art=window.ROBOTITO_AVATAR_ART;
  return Object.keys(art.profiles).map(id=>{
   const svg=art.render({id},"avatar-main-svg");
   const mouth=svg.match(/class="avatar-mouth mouth-line" d="([^"]+)"/);
   return {id,hasMouth:!!mouth,belowNose:!!mouth&&/M(?:88 125|92 128)/.test(mouth[1])};
  });
 });
 assert.ok(generic.length>=40);
 assert.ok(generic.every(x=>x.hasMouth&&x.belowNose),
  "Generic animal and robot mouths must also be below their noses");
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
  const responsive=await page.evaluate(()=>{
    const r=window.ROBOTITO_APPROVED_AVATAR.current;
    return {scene:document.querySelector(".world-scene").getBoundingClientRect(),
      body:r.avatar.getBoundingClientRect(),
      factor:Number(r.host.dataset.avatarFit)};
  });
  assert.ok(responsive.body.top>=responsive.scene.top-4);
  assert.ok(responsive.body.bottom<=responsive.scene.bottom+4);
  assert.ok(responsive.factor>0&&responsive.factor<=1);
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
 test.report.result={sourceAvatars:5,worlds:5,actions:["highfive","pet"],moods:["happy","embarrassed"],
   sizes:[360,430,1280],lateActionCleanup:true,lateMoodRecovery:true,noSeparatedPages:true,physicalReview:false};
 console.log("P28 "+test.engineName+" exact user-approved avatar SVG worlds and app integration passed");
}).catch(e=>{console.error(e);process.exitCode=1;});
