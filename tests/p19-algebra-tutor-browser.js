"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p19-algebra-tutor",async test=>{
 const {page,baseURL}=test;test.phase("p19-equations");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_ALGEBRA_TUTOR?.solve)&&
  document.querySelector("#algebraTutorSolve"),null,{timeout:20000});
 await page.addStyleTag({content:"#languageGate{display:none !important;pointer-events:none !important;}"});
 await page.locator('[data-tab="class"]').click();
 await page.locator("#algebraTutorInput").fill("2x + 3 = 11");
 await page.locator("#algebraTutorSolve").click();
 assert.match(await page.locator("#algebraTutorResult").innerText(),/x = 8 \/ 2 = 4/);
 assert.match(await page.locator("#algebraTutorResult").innerText(),/Comprobación/);
 await page.locator("#algebraTutorInput").fill("x/(x+1)=4");
 await page.locator("#algebraTutorSolve").click();
 assert.match(await page.locator("#algebraTutorResult").innerText(),/división/);
 const systems=await page.evaluate(()=>window.ROBOTITO_ALGEBRA_TUTOR.solve("x+y=5;2x-y=1"));
 assert.deepEqual({x:systems.x,y:systems.y,verified:systems.verified},{x:2,y:3,verified:true});
 const other=await page.evaluate(()=>window.ROBOTITO_ALGEBRA_TUTOR.solve("3x4=12"));
 assert.equal(other.handled,false,"Multiplication-like x is ambiguous");
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={algebraUI:true,linear:true,negative:true,system:true,hardware:false};
 console.log("P19 "+test.engineName+" algebra tutor UI passed");
}).catch(error=>{console.error(error);process.exitCode=1;});
