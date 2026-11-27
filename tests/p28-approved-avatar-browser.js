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
     sourceView:stage.getAttribute("viewBox"),shadow:!!stage.querySelector("#shadow"),
     faceSource:stage.dataset.faceSource,
     faceNose:stage.querySelectorAll("#front-view #procedural-muzzle").length,
     faceEyes:stage.querySelectorAll("#front-view #eye-open #eye-pupils").length,
     faceHeart:stage.querySelectorAll("#front-view #eye-open #heart-eyes").length,
     faceStar:stage.querySelectorAll("#front-view #eye-open #star-eyes").length,
     noFaceImages:stage.querySelectorAll("#front-view #head image,#front-view #head foreignObject").length===0};
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
  assert.equal(meta.faceSource,"procedural-svg","Face must be generated as SVG "+id);
  assert.equal(meta.faceNose,1);
  assert.equal(meta.faceEyes,1);
  assert.equal(meta.faceHeart,1,"Heart emotion must survive redraw "+id);
  assert.equal(meta.faceStar,1,"Star emotion must survive redraw "+id);
  assert.equal(meta.noFaceImages,true,"Faces must not contain image crops "+id);
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
 assert.equal(await page.locator("#robotito").getAttribute("aria-hidden"),null);
 assert.equal(await page.locator("#world").evaluate(el=>el.classList.contains("approved-art-world")),false);
 test.phase("three-additional-faces-are-native-svg");
 for(const id of ["cat","red-panda","iguana"]){
  if(id!=="cat"){
   await page.locator("#changeAvatarBtn").click();
   await page.locator('#avatarChoices [data-avatar-id="'+id+'"]').click();
  }
  await page.waitForFunction(id=>document.querySelector("#robotito")?.dataset.avatar===id,id);
  const face=await page.evaluate(()=>{
   const root=document.querySelector("#robotito");
   const svg=root.querySelector(".avatar-character");
   return {ids:root.dataset.avatar, count:svg?.querySelectorAll('[data-avatar-face="programmed"]').length||0,
    raster:svg?.querySelectorAll("image,foreignObject,canvas").length||0,
    mouths:svg?.querySelectorAll(".avatar-mouth").length||0,
    eyes:svg?.querySelectorAll(".avatar-eye-group").length||0};
  });
  assert.equal(face.ids,id);
  assert.equal(face.count,1,"Missing vector face: "+id);
  assert.equal(face.raster,0,"Raster used in "+id);
  assert.equal(face.mouths,1);
  assert.equal(face.eyes,2);
 }
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
 test.report.result={sourceAvatars:5,worlds:5,actions:["highfive","pet"],moods:["happy","embarrassed"],
   sizes:[360,430,1280],lateActionCleanup:true,lateMoodRecovery:true,noSeparatedPages:true,physicalReview:false};
 console.log("P28 "+test.engineName+" exact user-approved avatar SVG worlds and app integration passed");
}).catch(e=>{console.error(e);process.exitCode=1;});
