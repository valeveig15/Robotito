"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p30-p32-avatar-lifecycle",async test=>{
 const {page,baseURL}=test;
 test.phase("rest-before-awakening");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 await page.locator('[data-start-language="es"]').click();
 await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR?.current?.id==="panda");
 assert.equal(await page.evaluate(()=>window.ROBOTITO_AVATAR_LIFECYCLE.restState),"resting");
 assert.equal(await page.evaluate(()=>window.ROBOTITO_AVATAR_LIFECYCLE.singleBlink()),false);
 assert.equal(await page.evaluate(()=>window.ROBOTITO_APPROVED_AVATAR.current.avatar.dataset.mood),"dormido");
 await page.evaluate(()=>window.ROBOTITO_AVATAR_LIFECYCLE.inactivityTick());
 assert.equal(await page.evaluate(()=>state.sleeping),false,"No auto-sleep before wake");
 test.phase("awakening-and-eyes");
 await page.evaluate(()=>{
   const robot=document.querySelector("#robotito");
   state.everAwakened=true;state.started=true;
   robot.classList.remove("pre-awake","sleeping","drowsy");
   state.sleeping=false;setMood("calm");
 });
 await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR.current?.avatar.dataset.mood==="tranquilo");
 assert.equal(await page.evaluate(()=>window.ROBOTITO_AVATAR_LIFECYCLE.restState),"awake");
 test.phase("two-way-play");
 const before=await page.evaluate(()=>state.moodScore);
 await page.locator('[data-action="play"]').click();
 assert.equal(await page.locator("#playInvitation").isVisible(),true);
 assert.match(await page.locator("#playInstruction").textContent(),/imit|movimiento/i);
 assert.equal(await page.evaluate(()=>state.moodScore),before,
   "Playing is proposed, not credited until participation");
 await page.locator("#playConfirmBtn").click();
 assert.equal(await page.locator("#playInvitation").isVisible(),false);
 assert.equal(await page.evaluate(()=>state.moodScore),before+4);
 assert.equal(await page.evaluate(()=>window.ROBOTITO_AVATAR_LIFECYCLE.confirmPlay()),false);
 await page.locator('[data-action="play"]').click();
 await page.locator("#playCancelBtn").click();
 assert.equal(await page.locator("#playInvitation").isVisible(),false);
 assert.equal(await page.evaluate(()=>state.moodScore),before+4);
 assert.equal(await page.locator('[data-action="highfive"]').count(),1,
   "User explicitly preserved high-five");
 await page.locator('[data-action="highfive"]').click();
 test.phase("contradictory-emotion-cleanup");
 await page.evaluate(()=>{state.emotionHoldUntil=0;setMood("affectionate");animateAffection();});
 await page.waitForFunction(()=>document.querySelector("#robotito").classList.contains("heart-eyes"));
 await page.evaluate(()=>setMood("scared"));
 await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR.current?.avatar.dataset.mood==="asustado");
 assert.equal(await page.locator("#robotito").evaluate(node=>node.classList.contains("heart-eyes")),false);
 const fear=await page.evaluate(()=>{
  const sh=window.ROBOTITO_APPROVED_AVATAR.current.shadow;
  return {hearts:getComputedStyle(sh.querySelector("#heart-eyes")).opacity,
   stars:getComputedStyle(sh.querySelector("#star-eyes")).opacity};
 });
 assert.equal(fear.hearts,"0");assert.equal(fear.stars,"0");
 for(const mood of ["angry","sad","hungry","annoyed","affectionate","happy"]){
  await page.evaluate(mood=>setMood(mood),mood);
  assert.equal(await page.locator("#robotito").evaluate(node=>
    [...node.classList].filter(c=>c==="mood-scared").length),0,"Old fear clears for "+mood);
 }
 test.phase("gradual-doze-and-return");
 const steps=await page.evaluate(()=>{
  state.emotionHoldUntil=0;state.classMode=false;state.nightSleep=false;
  const now=Date.now();
  const ago=seconds=>{state.lastSeenAt=now-seconds*1000;state.lastHeardAt=now-seconds*1000;};
  ago(134);inactivityTick();
  const pre=window.ROBOTITO_AVATAR_LIFECYCLE.restState;
  ago(140);inactivityTick();ambientMood();
  const drowsy=window.ROBOTITO_AVATAR_LIFECYCLE.restState;
  const drowsyMood=state.mood;
  ago(151);inactivityTick();
  const sleeping=window.ROBOTITO_AVATAR_LIFECYCLE.restState;
  const blink=window.ROBOTITO_AVATAR_LIFECYCLE.singleBlink();
  ago(0);inactivityTick();
  return {pre,drowsy,drowsyMood,sleeping,blink,awake:window.ROBOTITO_AVATAR_LIFECYCLE.restState};
 });
 assert.deepEqual(steps,{pre:"awake",drowsy:"drowsy",drowsyMood:"sleepy",sleeping:"sleeping",blink:false,awake:"awake"});
 await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR.current?.avatar.dataset.mood==="tranquilo");
 test.phase("all-approved-art-states");
 for(const id of ["panda","brown-bear","polar-bear","dog","monkey"]){
  await page.locator("#changeAvatarBtn").click();
  await page.locator('#avatarChoices [data-avatar-id="'+id+'"]').click();
  await page.waitForFunction(id=>window.ROBOTITO_APPROVED_AVATAR.current?.id===id,id,{timeout:20000});
  await page.evaluate(()=>setMood("scared"));
  await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR.current?.avatar.dataset.mood==="asustado");
  await page.evaluate(()=>{state.sleeping=true;document.querySelector("#robotito").classList.add("sleeping");setMood("sleepy");});
  await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR.current?.avatar.dataset.mood==="dormido");
  await page.evaluate(()=>{state.sleeping=false;document.querySelector("#robotito").classList.remove("sleeping");setMood("calm");});
 }
 test.phase("quoted-and-class-dialogue-is-not-a-reaction");
 assert.equal(await page.evaluate(()=>window.ROBOTITO_EMOTION_DIALOGUE.classify("Mi profesora dijo: te quiero")),null);
 await page.evaluate(()=>{state.classMode=true;});
 assert.equal(await page.evaluate(()=>window.ROBOTITO_EMOTION_DIALOGUE.handle("te odio")),false);
 await page.evaluate(()=>{state.classMode=false;});
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={fiveApproved:true,playAcknowledgment:true,highfivePreserved:true,
  initialRest:true,doze15Seconds:true,sleepWake:true,exclusiveMoods:true,
  quotedSchoolSafe:true,physicalHardware:false};
 console.log("P30–P32 "+test.engineName+" gestures, waking, dozing, SVG moods and context passed");
}).catch(e=>{console.error(e);process.exitCode=1;});
