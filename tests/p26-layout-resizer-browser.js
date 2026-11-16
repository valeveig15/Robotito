"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p26-panel-resizer",async test=>{
 const {page,baseURL}=test;
 test.phase("p26-browser-desktop-panel");
 await page.setViewportSize({width:1280,height:900});
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.documentElement.dataset.robotitoUiReady==="true" &&
   !!window.ROBOTITO_LAYOUT_RESIZER?.reset,null,{timeout:20000});
 await page.addStyleTag({content:"#languageGate{display:none!important;pointer-events:none!important;}"});
 const divider=page.locator("#layoutResizer");
 await divider.focus();
 await page.keyboard.press("Home");
 const small=await page.evaluate(()=>({left:document.querySelector(".world").getBoundingClientRect().width,
   right:document.querySelector(".panel").getBoundingClientRect().width,
   min:Number(document.querySelector("#layoutResizer").getAttribute("aria-valuemin"))}));
 assert.equal(small.min,260);
 assert.ok(small.left>=259&&small.left<=264,JSON.stringify(small));
 await page.keyboard.press("End");
 const wide=await page.evaluate(()=>({left:document.querySelector(".world").getBoundingClientRect().width,
   right:document.querySelector(".panel").getBoundingClientRect().width}));
 assert.ok(wide.right>=244&&wide.right<=249,JSON.stringify(wide));
 assert.ok(wide.left>small.left+350);
 const sticky=await page.evaluate(()=>{
   const panel=document.querySelector(".panel"),tabs=panel.querySelector(".tabs");
   panel.scrollTop=360;
   return {scroll:panel.scrollTop,top:panel.getBoundingClientRect().top,tabTop:tabs.getBoundingClientRect().top,
     inner:panel.scrollHeight>panel.clientHeight};
 });
 assert.ok(sticky.inner,"right panel should have independently scrollable content");
 assert.ok(sticky.scroll>100,"right panel can be scrolled");
 assert.ok(sticky.tabTop>=sticky.top-1&&sticky.tabTop<=sticky.top+30,"tabs remain reachable");
 await page.keyboard.press("Home");
 await page.keyboard.press("ArrowRight");
 const afterArrow=await page.evaluate(()=>document.querySelector(".world").getBoundingClientRect().width);
 assert.ok(afterArrow>small.left+17&&afterArrow<small.left+32,"arrow changes divider by 24 px");
 const handle=await divider.boundingBox();
 await page.mouse.move(handle.x+handle.width/2,handle.y+Math.min(55,handle.height/2));
 await page.mouse.down();
 await page.mouse.move(handle.x+handle.width/2+180,handle.y+Math.min(55,handle.height/2),{steps:8});
 await page.mouse.up();
 const saved=await page.evaluate(()=>localStorage.getItem("robotito.layoutSplit.v1"));
 assert.ok(Number(saved)>0&&Number(saved)<1,"drag persisted a valid ratio");
 await page.reload({waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>!!document.querySelector("#layoutResizer")?.getAttribute("aria-valuenow"),
   null,{timeout:20000});
 const rest=await page.evaluate(()=>({ratio:window.ROBOTITO_LAYOUT_RESIZER.ratio,
   stored:Number(localStorage.getItem("robotito.layoutSplit.v1"))}));
 assert.ok(Math.abs(rest.ratio-rest.stored)<.01,"ratio restored after reload");
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>getComputedStyle(document.querySelector("#layoutResizer")).display==="none" &&
   document.querySelector(".layout").style.gridTemplateColumns==="",null,{timeout:8000});
 const mobile=await page.evaluate(()=>({hidden:getComputedStyle(document.querySelector("#layoutResizer")).display==="none",
   overridden:document.querySelector(".layout").style.gridTemplateColumns}));
 assert.equal(mobile.hidden,true);
 assert.equal(mobile.overridden,"");
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={minWidths:true,keys:true,drag:true,persist:true,sticky:true,mobile:true,hardware:false};
 console.log("P26 "+test.engineName+" desktop panel drag, scroll, keyboard and mobile passed");
}).catch(e=>{console.error(e);process.exitCode=1;});
