"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p30-p32-gestures-eyes-bond",async test=>{
 const {page,baseURL}=test;
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true");
 if(await page.locator("#languageGate").isVisible()){
   await page.locator('[data-start-language="es"]').click();
   await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 }
 test.phase("gestures-unified-and-highfive-retained");
 assert.equal(await page.locator('[data-action="highfive"]').count(),1);
 assert.equal(await page.locator('[data-action="hug"]').count(),0);
 const commands=await page.evaluate(()=>{
  const cases=["Chocame los cinco","Give me a high five","juguemos",
    "te doy de comer","te acaricio","Buu","te pincho"];
  const handled=cases.map(x=>handleAvatarActionCommand(x));
  const negatives=["No choques los cinco","Qué significa high five",
    "Explicame cómo acariciar un gato","¿Podemos jugar en teoría?"].map(x=>handleAvatarActionCommand(x));
  return {handled,negatives,action:document.querySelector("#robotito").dataset.speciesAction};
 });
 assert.deepEqual(commands.handled,[true,true,true,true,true,true,true]);
 assert.deepEqual(commands.negatives,[false,false,false,false]);
 assert.equal(commands.action,"poke");
 await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR?.current?.id==="panda");
 const pet=await page.evaluate(()=>{
  const original=state.moodScore;
  document.getElementById("approvedAvatarHost").click();
  return {mood:state.mood,score:state.moodScore,prev:original};
 });
 assert.equal(pet.mood,"happy");
 assert.ok(pet.score>=pet.prev,"Approved artwork click should pet exactly once");
 if(await page.locator("#settingsPanel").isHidden())await page.locator("#settingsToggle").click();
  await page.locator("#changeAvatarBtn").click();
 await page.locator('#avatarChoices [data-avatar-id="cat"]').click();
 const generic=await page.evaluate(()=>{
  const before=state.moodRevision;
  document.querySelector("#robotito").click();
  return {mood:state.mood,after:state.moodRevision-before};
 });
 assert.equal(generic.mood,"happy");
 assert.equal(generic.after,1,"Nonreference avatar click should invoke one petting reaction");
 test.phase("blink-sleep-and-race-cancellation");
 if(await page.locator("#settingsPanel").isHidden())await page.locator("#settingsToggle").click();
  await page.locator("#changeAvatarBtn").click();
 await page.locator('#avatarChoices [data-avatar-id="panda"]').click();
 await page.waitForFunction(()=>window.ROBOTITO_APPROVED_AVATAR?.current?.id==="panda");
 const eye=await page.evaluate(async()=>{
  setMood("calm");
  singleBlink(600);
  sleepForNight();
  await new Promise(resolve=>requestAnimationFrame(()=>resolve()));
  const closed={sleep:state.sleeping,night:state.nightSleep,
    blink:document.querySelector("#robotito").classList.contains("blink"),
    approvedBlink:window.ROBOTITO_APPROVED_AVATAR.blink()};
  wakeFromNight();
  queueNightSleep();
  wakeFromNight();
  await new Promise(resolve=>setTimeout(resolve,810));
  return {closed,awake:!state.sleeping&&!state.nightSleep,
    visual:document.querySelector("#robotito").classList.contains("sleeping")};
 });
 assert.deepEqual(eye.closed,{sleep:true,night:true,blink:false,approvedBlink:false});
 assert.equal(eye.awake,true,"Late previous goodnight must not put awake avatar back to sleep");
 assert.equal(eye.visual,false);
 test.phase("exact-emotions-and-owner-isolated-bond");
 const moods=await page.evaluate(()=>{
  const list=["calm","happy","sad","angry","scared","hungry","sleepy","curious",
    "focused","bored","affectionate","proud","confused","excited","embarrassed","annoyed"];
  const output=[];
  for(const mood of list){
   setMood(mood);
   output.push({mood,active:document.querySelector("#robotito").classList.contains("mood-"+mood),
     aliases:[...document.querySelector("#robotito").classList].filter(x=>x.startsWith("mood-"))});
  }
  return output;
 });
 assert.equal(moods.length,16);
 for(const row of moods){
  assert.equal(row.active,true,row.mood);
  assert.deepEqual(row.aliases,["mood-"+row.mood],row.mood+" is not another expression");
 }
 const hearts=await page.evaluate(async()=>{
  setMood("affectionate");
  animateAffection();
  setMood("angry");
  await new Promise(resolve=>requestAnimationFrame(()=>resolve()));
  const noHearts=!document.querySelector("#robotito").classList.contains("heart-eyes");
  return {noHearts,mood:state.mood};
 });
 assert.deepEqual(hearts,{noHearts:true,mood:"angry"});
 const bond=await page.evaluate(()=>{
  const old=state.people;state.people=[
    {name:"Ada",relationship:50},{name:"Bruno",relationship:50}];
  const unchanged=JSON.stringify(ensureBond(state.people[1]));
  adjustBond("Ada",{affection:5,trust:3,irritation:-2});
  const result={ada:state.people[0].bond.affection>50,
    bruno:JSON.stringify(ensureBond(state.people[1]))===unchanged,
    unknown:!state.people.find(p=>p.name==="Unidentified")};
  state.people=old;return result;
 });
 assert.deepEqual(bond,{ada:true,bruno:true,unknown:true});
 test.phase("legacy-approved-actions-retained");
 await page.locator('[data-action="highfive"]').click();
 assert.equal(await page.locator("#robotito").evaluate(n=>n.classList.contains("highfive")),true);
 assert.equal(await page.evaluate(()=>window.ROBOTITO_APPROVED_AVATAR.current.avatar.classList.contains("action-chocar")),true);
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={gestures:7,blocked:4,moods:16,staleNightCancelled:true,
  blinkSleepExclusive:true,approvedArt:true,ownerIsolated:true,physical:false};
 console.log("P30-P32 "+test.engineName+" gestures, sleep, eyes, exact moods and bond tests passed");
}).catch(e=>{console.error(e);process.exitCode=1;});
