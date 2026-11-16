"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p25-mobile-chat",async test=>{
 const {page,baseURL}=test;
 test.phase("p25-mobile-real-engine");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true" &&
   !!window.ROBOTITO_TYPED_CHAT?.onTurn && !!window.ROBOTITO_CHAT?.send,
   null,{timeout:20000});
 await page.addStyleTag({content:"#languageGate{display:none!important;pointer-events:none!important;}"});
 await page.evaluate(()=>{const v=document.querySelector("#voiceEnabled");if(v){v.checked=false;v.dispatchEvent(new Event("change"));}});
 for(const [width,height] of [[320,720],[360,800],[390,844],[430,932],[844,390]]){
   await page.setViewportSize({width,height});
   const boxes=await page.evaluate(()=>{
     const rect=id=>{const r=document.querySelector(id).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width};};
     return {scene:rect(".world-scene"),controls:rect(".world-controls"),
       actions:rect(".quick-actions"),log:rect("#typedChatHistory"),
       form:rect("#robotitoTextForm"),input:rect("#robotitoTextInput"),
       horizontal:document.documentElement.scrollWidth-window.innerWidth};
   });
   assert.ok(boxes.controls.top>=boxes.scene.bottom-2,"controls must not overlay scene: "+width);
   assert.ok(boxes.log.top>=boxes.actions.bottom-2,"chat history below actions: "+width);
   assert.ok(boxes.form.top>=boxes.log.bottom-2,"composer below chat: "+width);
   assert.ok(boxes.horizontal<=3,"no horizontal overflow: "+width+" "+JSON.stringify(boxes));
   assert.ok(boxes.input.width>=100,"composer input still usable: "+width);
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator("#robotitoTextInput").fill("Hola");
 await page.locator("#robotitoTextSend").click();
 await page.waitForFunction(()=>document.querySelector("#typedChatHistory .typed-chat-user")?.textContent.includes("Hola"),null,{timeout:7000});
 await page.waitForFunction(()=>document.querySelector("#typedChatHistory .typed-chat-assistant")?.textContent?.trim().length>0,null,{timeout:12000});
 const privacy=await page.evaluate(()=>{
   const chat=window.ROBOTITO_TYPED_CHAT;
   chat.onOwnerChange("A");chat.onTurn("único del dueño A","A");
   chat.onOwnerChange("B");
   const leaked=document.querySelector("#typedChatHistory").textContent.includes("único del dueño A");
   chat.onTurn("sólo B","B");
   chat.onOwnerChange("A");
   const returned=document.querySelector("#typedChatHistory").textContent.includes("único del dueño A");
   chat.onOwnerChange("local");
   return {leaked,returned};
 });
 assert.equal(privacy.leaked,false);
 assert.equal(privacy.returned,true);
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={mobileWidths:5,typedInput:true,reply:true,ownerIsolation:true,physicalDevices:false};
 console.log("P25 "+test.engineName+" responsive chat and owner isolation passed");
}).catch(e=>{console.error(e);process.exitCode=1;});
