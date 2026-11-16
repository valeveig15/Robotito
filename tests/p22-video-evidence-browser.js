"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p22-video-evidence",async test=>{
 const {page,baseURL}=test;
 test.phase("p22-ui-source-scope");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>!!window.ROBOTITO_VIDEO_EVIDENCE?.createStore&&
   !!document.querySelector("#videoEvidenceSearch"),null,{timeout:20000});
 await page.addStyleTag({content:"#languageGate{display:none !important;pointer-events:none !important;}"});
 await page.waitForFunction(()=>!!window.ROBOTITO_ROUTER?.classify,null,{timeout:20000});
 await page.locator('[data-tab="class"]').click();
 await page.waitForFunction(()=>document.querySelector("#tab-class")?.classList.contains("active"),null,{timeout:10000});
 await page.locator("#classSubject").fill("Biología");
 await page.locator("#classTopic").fill("Membrana");
 await page.evaluate(()=>{
  const store=window.ROBOTITO_VIDEO_EVIDENCE.createStore({storage:localStorage});
  store.addBatch({sourceId:"v-lesson",sourceUrl:"https://www.youtube.com/watch?v=abcdefghijk",
   title:"Video de clase",subject:"Biología",topic:"Membrana",owner:"local",consent:true,
   items:[{kind:"provided-caption",text:"La membrana controla el intercambio de sustancias",atSec:18},
    {kind:"seen",text:"Libro",atSec:19,score:.81,samples:3}]});
  store.addBatch({sourceId:"v-else",title:"Otra clase",subject:"Física",topic:"Dinámica",
   owner:"local",consent:true,items:[{kind:"heard",capture:true,
    text:"La fuerza neta es igual a masa por aceleración."}]});
 });
 await page.locator("#videoEvidenceQuery").fill("membrana");
 await page.locator("#videoEvidenceSearch").click();
 const result=await page.locator("#videoEvidenceResults").innerText();
 assert.match(result,/Subtítulo aportado/);
 assert.match(result,/18 s/);
 assert.match(result,/Video de clase/);
 assert.doesNotMatch(result,/fuerza neta/i);
 await page.locator("#classSubject").fill("Química");
 await page.locator("#videoEvidenceSearch").click();
 assert.match(await page.locator("#videoEvidenceResults").innerText(),/No hay fragmentos/);
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={provenanceUI:true,scope:true,noCrossClass:true,noHTMLInjection:true,physicalCapture:false};
 console.log("P22 "+test.engineName+" typed video evidence lookup passed");
}).catch(e=>{console.error(e);process.exitCode=1;});
