"use strict";
const assert=require("node:assert/strict");
const {runBrowserTest}=require("./browser-test-harness.js");
runBrowserTest("p15-cumulative-summary",async test=>{
 const {page,baseURL}=test;
 test.phase("p15-ui");
 await page.goto(baseURL,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>Boolean(window.ROBOTITO_CLASS_AGGREGATE?.build)&&
  document.getElementById("cumulativeSummaryGenerate"),null,{timeout:20000});
 await page.addStyleTag({content:"#languageGate{display:none !important;pointer-events:none !important;}"});
 await page.locator('[data-tab="class"]').click();
 await page.locator("#classSubject").fill("Química");
 await page.locator("#classTopic").fill("Enlaces");
 await page.evaluate(()=>{
  state.classLines=[
   {id:"a",sessionId:"c1",subject:"Química",topic:"Enlaces",
    text:"Los enlaces covalentes comparten electrones entre átomos."},
   {id:"b",sessionId:"c2",subject:"Química",topic:"Enlaces",
    text:"Los enlaces covalentes pueden tener diferentes polaridades."},
   {id:"c",sessionId:"c3",subject:"Historia",topic:"Revolución",
    text:"Esta clase no corresponde a la materia elegida."}
  ];
  state.academicMaterials=[
   {id:"m",name:"Notas.md",subject:"Química",topic:"Enlaces",
    chunks:["Los electrones son compartidos en un enlace covalente."],
    exercises:[{text:"Diferenciá enlace iónico y covalente."}]}
  ];
 });
 await page.locator("#cumulativeSummaryGenerate").click();
 const txt=await page.locator("#cumulativeSummaryOutput").innerText();
 assert.match(txt,/covalentes/);
 assert.match(txt,/Notas\.md/);
 assert.match(txt,/Ejercicios/);
 assert.doesNotMatch(txt,/Historia|Revolución|Esta clase no corresponde/);
 test.phase("p15-refresh");
 await page.evaluate(()=>{
  state.academicMaterials[0].chunks.push("Los átomos forman moléculas mediante enlaces.");
 });
 await page.locator("#cumulativeSummaryLength").selectOption("long");
 await page.locator("#cumulativeSummaryGenerate").click();
 assert.match(await page.locator("#cumulativeSummaryOutput").innerText(),/forman moléculas/);
 test.phase("p15-absent");
 await page.locator("#classSubject").fill("Sin coincidencias");
 await page.locator("#cumulativeSummaryGenerate").click();
 assert.match(await page.locator("#cumulativeSummaryOutput").innerText(),/No encontré/);
 assert.deepEqual(test.report.pageErrors,[]);
 test.report.result={summaryUI:true,scope:true,refresh:true,missing:true,hardware:false};
 console.log("P15 "+test.engineName+" cumulative class summary browser regression passed");
}).catch(error=>{console.error(error);process.exitCode=1;});
